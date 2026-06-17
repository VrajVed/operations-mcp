"""
OpsMCP Server — stdio transport for Claude Desktop

Claude Desktop spawns this script as a subprocess.
Communication happens over stdin/stdout using the MCP protocol.

Tools:
  - solve_lp           → Smart router: picks the right solver automatically
  - simplex_solve      → Primal simplex method (<= constraints only)
  - dual_simplex_solve → Dual simplex method (dual-feasible problems)
  - big_m_solve        → Big-M simplex method (general LP: <=, >=, =)
"""

import json
import asyncio
from typing import Any, Sequence

from mcp.server import Server
from mcp.server.stdio import stdio_server
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
    """Tell the AI client what tools we have."""
    return get_tools()


# ---------------------------------------------------------------------------
# Tool: call_tool
# ---------------------------------------------------------------------------

@server.call_tool()
async def call_tool(name: str, arguments: Any) -> Sequence[TextContent]:
    """Execute the requested tool."""
    try:
        result = execute_tool(name, arguments)
    except ValueError as exc:
        return [TextContent(type="text", text=json.dumps({"error": str(exc)}))]

    return [TextContent(type="text", text=json.dumps(result, indent=2))]


# ---------------------------------------------------------------------------
# Run the server
# ---------------------------------------------------------------------------

async def main():
    async with stdio_server() as (read, write):
        await server.run(
            read, write, server.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
