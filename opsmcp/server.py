"""
OpsMCP Server

Public MCP server exposing optimization solvers.
No authentication in Phase 1.

Tools:
  - simplex.solve      → Primal simplex method
  - dual_simplex.solve  → Dual simplex method

Transport: SSE (Server-Sent Events) over HTTP
Port: 3001
"""

import json
import asyncio
from typing import Any, Sequence

from mcp.server import Server
from mcp.server.sse import SseServerTransport
from mcp.types import Tool, TextContent

from opsmcp.models.simplex import SimplexProblem
from opsmcp.core.tableau import solve_simplex
from opsmcp.core.dual_simplex import solve_dual_simplex


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
    executive_prompt = (
        "Present the result as a concise, executive-friendly recommendation. "
        "Include: (1) the optimal production plan or decision, "
        "(2) the expected objective value, "
        "(3) a constraint utilization analysis showing which resources are fully used vs have slack, "
        "and (4) a one-line opportunity insight about which binding constraint is the most valuable to relax."
    )

    return [
        Tool(
            name="simplex.solve",
            description=f"Solve a linear programming problem using the primal simplex method. {executive_prompt}",
            inputSchema=SimplexProblem.model_json_schema(),
        ),
        Tool(
            name="dual_simplex.solve",
            description=f"Solve a linear programming problem using the dual simplex method. {executive_prompt}",
            inputSchema=SimplexProblem.model_json_schema(),
        ),
    ]


# ---------------------------------------------------------------------------
# Result builder
# ---------------------------------------------------------------------------

def _build_result(iterations, problem: SimplexProblem) -> dict:
    """Build a rich, structured result from solver iterations."""
    final = iterations[-1]

    result = {
        "tool": "simplex.solve" if problem.objective == "max" else "dual_simplex.solve",
        "status": final.status,
        "iterations": len(iterations),
        "solution": {},
        "objective_value": None,
        "constraints_analysis": [],
        "opportunity": None,
    }

    if final.status != "optimal":
        return result

    # Extract decision variable values
    for var in final.tableau.column_variables:
        if var.startswith("x"):
            if var in final.tableau.basis:
                row = final.tableau.basis.index(var)
                result["solution"][var] = final.tableau.matrix[row + 1][-1]
            else:
                result["solution"][var] = 0.0

    # Objective value
    converted_z = -final.tableau.matrix[0][-1]
    result["objective_value"] = -converted_z if problem.objective == "min" else converted_z

    # Constraint analysis
    for i, constraint in enumerate(problem.constraints):
        lhs = sum(
            coeff * result["solution"][f"x{j+1}"]
            for j, coeff in enumerate(constraint.coefficients)
        )
        slack = constraint.rhs - lhs
        result["constraints_analysis"].append({
            "constraint_number": i + 1,
            "operator": constraint.operator,
            "rhs": constraint.rhs,
            "lhs_value": lhs,
            "slack": slack,
            "binding": abs(slack) < 1e-9,
        })

    # Opportunity: shadow prices for binding constraints
    basis_coefficients = []
    for basis_var in final.tableau.basis:
        col_idx = final.tableau.column_variables.index(basis_var)
        basis_coefficients.append(final.tableau.matrix[0][col_idx])

    row_Cj = final.tableau.matrix[0][:-1]
    row_Zj = []
    for col in range(len(final.tableau.column_variables)):
        zj = sum(
            basis_coefficients[i] * final.tableau.matrix[i + 1][col]
            for i in range(len(final.tableau.basis))
        )
        row_Zj.append(zj)
    cj_zj = [cj - zj for cj, zj in zip(row_Cj, row_Zj)]

    opportunities = []
    for analysis in result["constraints_analysis"]:
        if analysis["binding"]:
            slack_var = f"s{analysis['constraint_number']}"
            if slack_var in final.tableau.column_variables:
                col_idx = final.tableau.column_variables.index(slack_var)
                price = -cj_zj[col_idx]
                opportunities.append({
                    "constraint_number": analysis["constraint_number"],
                    "shadow_price": price,
                })

    if opportunities:
        opportunities.sort(key=lambda x: abs(x["shadow_price"]), reverse=True)
        result["opportunity"] = opportunities[0]

    return result


# ---------------------------------------------------------------------------
# Tool: call_tool
# ---------------------------------------------------------------------------

@server.call_tool()
async def call_tool(name: str, arguments: Any) -> Sequence[TextContent]:
    """
    Execute the requested tool.
    The AI client passes the tool name and the input JSON (arguments).
    """
    # Parse the input JSON into a SimplexProblem
    problem = SimplexProblem(**arguments)

    if name == "simplex.solve":
        iterations = solve_simplex(problem)
    elif name == "dual_simplex.solve":
        iterations = solve_dual_simplex(problem)
    else:
        return [TextContent(type="text", text=json.dumps({"error": f"Unknown tool: {name}"}))]

    result = _build_result(iterations, problem)
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
