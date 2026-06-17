"""
MCP tool handler for the primal simplex method.
"""

from mcp.types import Tool

from opsmcp.models.simplex import SimplexProblem
from opsmcp.core.tableau import solve_simplex
from opsmcp.tools._common import EXECUTIVE_PROMPT, _build_result


TOOL_NAME = "simplex_solve"


def get_tool() -> Tool:
    """Return the MCP Tool metadata for simplex_solve."""
    return Tool(
        name=TOOL_NAME,
        description=f"Solve a linear programming problem using the primal simplex method. {EXECUTIVE_PROMPT}",
        inputSchema=SimplexProblem.model_json_schema(),
    )


def execute(arguments: dict) -> dict:
    """Execute the primal simplex solver and return a structured result."""
    problem = SimplexProblem(**arguments)
    iterations = solve_simplex(problem)
    return _build_result(iterations, problem, TOOL_NAME)
