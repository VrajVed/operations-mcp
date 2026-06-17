"""
Smart LP router tool.

This tool inspects the problem structure and routes it to the most
appropriate solver:

  - simplex_solve      for standard maximization with all <= constraints
  - dual_simplex_solve for minimization with all >= constraints
  - big_m_solve        for everything else (>=, =, mixed operators, etc.)

The client can simply call solve_lp for any linear program.
"""

from mcp.types import Tool

from opsmcp.models.simplex import SimplexProblem
from opsmcp.tools import simplex, dual_simplex, big_m
from opsmcp.tools._common import EXECUTIVE_PROMPT


TOOL_NAME = "solve_lp"


def _select_solver(problem: SimplexProblem):
    """Pick the best solver for the given problem structure."""
    operators = {c.operator for c in problem.constraints}
    all_rhs_nonnegative = all(c.rhs >= 0 for c in problem.constraints)
    all_obj_nonnegative = all(c >= 0 for c in problem.objective_coefficients)

    # Standard primal simplex: max, all <=, non-negative RHS.
    if (
        problem.objective == "max"
        and operators == {"<="}
        and all_rhs_nonnegative
    ):
        return simplex

    # Dual simplex: min, all >=, non-negative objective coefficients.
    if (
        problem.objective == "min"
        and operators == {">="}
        and all_obj_nonnegative
    ):
        return dual_simplex

    # Fallback to Big-M for general LPs.
    return big_m


def get_tool() -> Tool:
    """Return the MCP Tool metadata for solve_lp."""
    return Tool(
        name=TOOL_NAME,
        description=(
            "DEFAULT: Use this tool for ANY linear programming problem. "
            "It automatically inspects the problem and routes to the correct solver "
            "(primal simplex, dual simplex, or Big-M). "
            "Only call the specialized solvers directly if you have a specific reason. "
            f"{EXECUTIVE_PROMPT}"
        ),
        inputSchema=SimplexProblem.model_json_schema(),
    )


def execute(arguments: dict) -> dict:
    """Route the LP to the appropriate solver and return the result."""
    problem = SimplexProblem(**arguments)
    solver = _select_solver(problem)
    result = solver.execute(arguments)
    # Report that the router delegated to a specific solver.
    result["tool"] = TOOL_NAME
    result["solver"] = solver.TOOL_NAME
    return result
