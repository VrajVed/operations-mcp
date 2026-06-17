"""
MCP tool handler for the Big-M simplex method.

The Big-M method handles general linear programs with <=, >=, and =
constraints, as well as both maximization and minimization objectives.
"""

from mcp.types import Tool

from opsmcp.models.simplex import SimplexProblem
from opsmcp.core.big_m import solve_big_m
from opsmcp.tools._common import EXECUTIVE_PROMPT, _build_result


TOOL_NAME = "big_m_solve"


def get_tool() -> Tool:
    """Return the MCP Tool metadata for big_m_solve."""
    return Tool(
        name=TOOL_NAME,
        description=f"Solve a linear programming problem using the Big-M simplex method. {EXECUTIVE_PROMPT}",
        inputSchema=SimplexProblem.model_json_schema(),
    )


def execute(arguments: dict) -> dict:
    """Execute the Big-M simplex solver and return a structured result."""
    problem = SimplexProblem(**arguments)
    iterations = solve_big_m(problem)
    return _build_result(iterations, problem, TOOL_NAME)
