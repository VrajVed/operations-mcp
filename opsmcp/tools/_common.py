"""
Shared helpers for OpsMCP tool handlers.

This module contains the result builder and prompt text used by both the
primal simplex and dual simplex MCP tools.
"""

from opsmcp.models.simplex import SimplexProblem


EXECUTIVE_PROMPT = (
    "Present the result as a concise, executive-friendly recommendation. "
    "Include: (1) the optimal production plan or decision, "
    "(2) the expected objective value, "
    "(3) a constraint utilization analysis showing which resources are fully used vs have slack, "
    "and (4) a one-line opportunity insight about which binding constraint is the most valuable to relax."
)


def _build_result(iterations, problem: SimplexProblem, tool_name: str) -> dict:
    """Build a rich, structured result from solver iterations."""
    final = iterations[-1]

    result = {
        "tool": tool_name,
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
        if constraint.operator == "<=":
            slack = constraint.rhs - lhs
        elif constraint.operator == ">=":
            slack = lhs - constraint.rhs
        else:  # "="
            slack = 0.0
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
            constraint_num = analysis["constraint_number"]
            if analysis["operator"] == "<=":
                aux_var = f"s{constraint_num}"
                price_sign = -1
            elif analysis["operator"] == ">=":
                aux_var = f"s{constraint_num}"
                price_sign = 1
            else:  # "="
                aux_var = f"a{constraint_num}"
                price_sign = -1

            if aux_var in final.tableau.column_variables:
                col_idx = final.tableau.column_variables.index(aux_var)
                price = price_sign * cj_zj[col_idx]
                opportunities.append({
                    "constraint_number": constraint_num,
                    "shadow_price": price,
                })

    if opportunities:
        opportunities.sort(key=lambda x: abs(x["shadow_price"]), reverse=True)
        result["opportunity"] = opportunities[0]

    return result
