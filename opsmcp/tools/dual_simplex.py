"""
MCP tool handler for the dual simplex method.
"""

from mcp.types import Tool

from opsmcp.models.simplex import SimplexProblem
from opsmcp.core.dual_simplex import solve_dual_simplex
from opsmcp.tools._common import EXECUTIVE_PROMPT, _build_result


TOOL_NAME = "dual_simplex_solve"


def get_tool() -> Tool:
    """Return the MCP Tool metadata for dual_simplex_solve."""
    return Tool(
        name=TOOL_NAME,
        description=(
            "SPECIALIZED: Dual simplex method. Only use directly if the problem is a "
            "minimization with all '>=' constraints. "
            "For general LPs (<=, =, mixed constraints), use solve_lp instead. "
            f"{EXECUTIVE_PROMPT}"
        ),
        inputSchema=SimplexProblem.model_json_schema(),
    )


def execute(arguments: dict) -> dict:
    """Execute the dual simplex solver and return a structured result."""
    problem = SimplexProblem(**arguments)
    iterations = solve_dual_simplex(problem)
    return _build_result(iterations, problem, TOOL_NAME)
