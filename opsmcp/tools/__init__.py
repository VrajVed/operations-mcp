"""
OpsMCP tools.

This package exposes the MCP tools registered by the OpsMCP server.
"""

from typing import Sequence

from mcp.types import Tool

from opsmcp.tools import simplex, dual_simplex, big_m, router


_TOOL_MODULES = {
    simplex.TOOL_NAME: simplex,
    dual_simplex.TOOL_NAME: dual_simplex,
    big_m.TOOL_NAME: big_m,
    router.TOOL_NAME: router,
}


def get_tools() -> Sequence[Tool]:
    """Return the list of Tool metadata for all registered MCP tools."""
    return [module.get_tool() for module in _TOOL_MODULES.values()]


def execute_tool(name: str, arguments: dict) -> dict:
    """
    Execute the requested MCP tool by name.

    Args:
        name: The tool name (e.g. "simplex_solve").
        arguments: The parsed input arguments for the tool.

    Returns:
        A structured result dict.

    Raises:
        ValueError: If the tool name is not recognized.
    """
    module = _TOOL_MODULES.get(name)
    if module is None:
        raise ValueError(f"Unknown tool: {name}")
    return module.execute(arguments)
