"""
OpsMCP Server

Public MCP server exposing optimization solvers.
Also exposes POST /solve as a REST bridge for the Express platform layer, and
POST /health for container healthchecks.

Tools:
  - solve_lp           → Smart router: picks the right solver automatically
  - simplex_solve      → Primal simplex method (<= constraints only)
  - dual_simplex_solve → Dual simplex method (dual-feasible problems)
  - big_m_solve        → Big-M simplex method (general LP: <=, >=, =)

Auth: when OPSMCP_REQUIRE_AUTH is set, every tool call is validated and metered
against the Express platform (see auth.py). Unset for local dev.

Transport: SSE (Server-Sent Events) over HTTP
Port: 3001
"""

import json
from typing import Any, Sequence

from mcp.server import Server
from mcp.server.sse import SseServerTransport
from mcp.types import Tool, TextContent

from opsmcp.tools import get_tools, execute_tool
from opsmcp.auth import extract_api_key, set_api_key, reset_api_key, validate_and_track, AuthError


# ---------------------------------------------------------------------------
# Create the MCP server
# ---------------------------------------------------------------------------

server = Server("opsmcp")


# ---------------------------------------------------------------------------
# Tool: list_tools
# ---------------------------------------------------------------------------

@server.list_tools()
async def list_tools() -> Sequence[Tool]:
    """
    Tell the AI client what tools we have.
    Each tool has a name, description, and JSON schema for its input.
    """
    return get_tools()


# ---------------------------------------------------------------------------
# Tool: call_tool
# ---------------------------------------------------------------------------

@server.call_tool()
async def call_tool(name: str, arguments: Any) -> Sequence[TextContent]:
    """
    Execute the requested tool.
    The AI client passes the tool name and the input JSON (arguments).
    """
    try:
        await validate_and_track(name)
    except AuthError as exc:
        return [TextContent(type="text", text=json.dumps({"error": str(exc), "code": exc.code}))]

    try:
        result = execute_tool(name, arguments)
    except ValueError as exc:
        return [TextContent(type="text", text=json.dumps({"error": str(exc)}))]

    return [TextContent(type="text", text=json.dumps(result, indent=2))]


# ---------------------------------------------------------------------------
# Run the server
# ---------------------------------------------------------------------------

def main():
    """Start the SSE MCP server on port 3001."""
    from starlette.applications import Starlette
    from starlette.requests import Request
    from starlette.routing import Route, Mount
    from starlette.responses import Response, JSONResponse
    import uvicorn

    sse = SseServerTransport("/messages/")

    async def handle_sse(request: Request):
        """Handle SSE connection requests. Carries the caller's API key (if any)
        for the lifetime of this connection via a ContextVar — see auth.py."""
        api_key = extract_api_key(dict(request.headers), dict(request.query_params))
        token = set_api_key(api_key)
        try:
            async with sse.connect_sse(request.scope, request.receive, request._send) as streams:
                await server.run(
                    streams[0], streams[1], server.create_initialization_options()
                )
        finally:
            reset_api_key(token)
        return Response()

    async def handle_solve(request: Request):
        """REST bridge used by the Express platform's POST /v1/solve.

        Body: { "tool": "solve_lp", "input": { ... SimplexProblem ... } }
        The API key is expected on Authorization/X-Api-Key headers, matching the
        MCP path, since Express already validated it before forwarding here — this
        is a private, service-to-service call, not a second independent auth path.
        """
        try:
            body = await request.json()
        except Exception:
            return JSONResponse({"error": "Invalid JSON body"}, status_code=400)

        tool_name = body.get("tool")
        tool_input = body.get("input")
        if not tool_name or tool_input is None:
            return JSONResponse({"error": "Body must include 'tool' and 'input'"}, status_code=400)

        try:
            result = execute_tool(tool_name, tool_input)
        except ValueError as exc:
            return JSONResponse({"error": str(exc)}, status_code=400)
        except Exception as exc:
            return JSONResponse({"error": f"Solver error: {exc}"}, status_code=500)

        return JSONResponse(result)

    async def handle_health(request: Request):
        return JSONResponse({"status": "ok"})

    app = Starlette(
        routes=[
            Route("/sse", endpoint=handle_sse),
            Mount("/messages/", app=sse.handle_post_message),
            Route("/solve", endpoint=handle_solve, methods=["POST"]),
            Route("/health", endpoint=handle_health, methods=["GET"]),
        ]
    )

    uvicorn.run(app, host="0.0.0.0", port=3001)


if __name__ == "__main__":
    main()
