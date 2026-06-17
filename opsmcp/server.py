"""
OpsMCP Server

Public MCP server exposing optimization solvers.
No authentication in Phase 1.

Tools:
  - solve_lp           → Smart router: picks the right solver automatically
  - simplex_solve      → Primal simplex method (<= constraints only)
  - dual_simplex_solve → Dual simplex method (dual-feasible problems)
  - big_m_solve        → Big-M simplex method (general LP: <=, >=, =)

Transport: SSE (Server-Sent Events) over HTTP
Port: 3001
"""

import json
from typing import Any, Sequence

from mcp.server import Server
from mcp.server.sse import SseServerTransport
from mcp.types import Tool, TextContent

from opsmcp.tools import get_tools, execute_tool


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
    from starlette.routing import Route, Mount
    from starlette.responses import Response
    import uvicorn

    sse = SseServerTransport("/messages/")

    async def handle_sse(request):
        """Handle SSE connection requests."""
        async with sse.connect_sse(request.scope, request.receive, request._send) as streams:
            await server.run(
                streams[0], streams[1], server.create_initialization_options()
            )
        return Response()

    app = Starlette(
        routes=[
            Route("/sse", endpoint=handle_sse),
            Mount("/messages/", app=sse.handle_post_message),
        ]
    )

    uvicorn.run(app, host="0.0.0.0", port=3001)


if __name__ == "__main__":
    main()
