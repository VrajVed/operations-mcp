"""
Big-M Simplex Solver

Handles general linear programs with:
  - Maximization or minimization objectives
  - <=, >=, and = constraints
  - Non-negative decision variables

For each constraint:
  - <= : add a slack variable
  - >= : subtract a surplus variable and add an artificial variable
  - =  : add an artificial variable

Artificial variables are penalized by a large constant M in the objective,
forcing them out of the basis. If any artificial variable remains in the
basis with a non-zero value at optimality, the problem is infeasible.
"""

from typing import List

from opsmcp.models.simplex import SimplexIteration, SimplexProblem, SimplexTableau
from opsmcp.core.tableau import solve_simplex_iteration


def _compute_m(objective_coefficients: List[float]) -> float:
    """Choose a sufficiently large M based on the objective coefficients."""
    if not objective_coefficients:
        return 1e6
    max_coeff = max(abs(c) for c in objective_coefficients)
    return 1e6 * max(1.0, max_coeff)


def solve_big_m(problem: SimplexProblem) -> List[SimplexIteration]:
    """
    Solve a linear programming problem using the Big-M simplex method.

    Returns a list of SimplexIteration objects representing the full solve trace.
    The last element has a terminal status: "optimal", "unbounded", or "infeasible".
    """
    number_of_constraints = len(problem.constraints)
    number_of_variables = len(problem.objective_coefficients)

    # Step 1: Convert minimization into maximization if necessary.
    if problem.objective == "min":
        objective_coefficients = [-c for c in problem.objective_coefficients]
    else:
        objective_coefficients = list(problem.objective_coefficients)

    M = _compute_m(objective_coefficients)

    # Step 2: Decide which auxiliary variables each constraint needs.
    # For every constraint we add a slack/surplus variable s_i.
    # For >= and = constraints we also add an artificial variable a_i.
    artificial_indices: List[int] = []
    constraint_types: List[str] = []
    for i, constraint in enumerate(problem.constraints):
        constraint_types.append(constraint.operator)
        if constraint.operator in (">=", "="):
            artificial_indices.append(i)

    number_of_aux = number_of_constraints + len(artificial_indices)

    # Build ordered list of column variable names.
    column_variables: List[str] = []
    column_variables.extend(f"x{j + 1}" for j in range(number_of_variables))
    column_variables.extend(f"s{i + 1}" for i in range(number_of_constraints))
    column_variables.extend(f"a{idx + 1}" for idx in range(len(artificial_indices)))

    # Step 3: Build objective row.
    # Decision variables: converted coefficients.
    # Slack/surplus variables: 0.
    # Artificial variables: -M.
    objective_row = list(objective_coefficients)
    objective_row.extend([0.0] * number_of_constraints)  # slack/surplus
    objective_row.extend([-M] * len(artificial_indices))  # artificial
    objective_row.append(0.0)  # RHS

    # Step 4: Build constraint rows and basis.
    matrix: List[List[float]] = [objective_row]
    basis: List[str] = []
    artificial_col_offset = number_of_variables + number_of_constraints

    for i, constraint in enumerate(problem.constraints):
        row = [0.0] * len(column_variables)

        # Decision variable coefficients.
        for j, coeff in enumerate(constraint.coefficients):
            row[j] = coeff

        # Slack/surplus variable for this constraint.
        slack_col = number_of_variables + i
        if constraint.operator == "<=":
            row[slack_col] = 1.0
            basis.append(f"s{i + 1}")
        elif constraint.operator == ">=":
            row[slack_col] = -1.0
            # Artificial variable for this constraint.
            art_idx = artificial_indices.index(i)
            row[artificial_col_offset + art_idx] = 1.0
            basis.append(f"a{art_idx + 1}")
        else:  # "="
            art_idx = artificial_indices.index(i)
            row[artificial_col_offset + art_idx] = 1.0
            basis.append(f"a{art_idx + 1}")

        row.append(constraint.rhs)  # RHS
        matrix.append(row)

    tableau = SimplexTableau(
        iteration=0,
        matrix=matrix,
        basis=basis,
        column_variables=column_variables,
    )

    # Step 5: Run simplex iterations.
    iterations: List[SimplexIteration] = []
    while True:
        iteration = solve_simplex_iteration(tableau)
        iterations.append(iteration)

        if iteration.status != "continue":
            break

        tableau = iteration.tableau

    # Step 6: Check for infeasibility (artificial variables still in basis).
    final = iterations[-1]
    if final.status == "optimal":
        tolerance = 1e-9
        for basis_var in final.tableau.basis:
            if basis_var.startswith("a"):
                row = final.tableau.basis.index(basis_var)
                value = final.tableau.matrix[row + 1][-1]
                if abs(value) > tolerance:
                    # Replace terminal iteration with an infeasible status.
                    infeasible_iteration = final.model_copy()
                    infeasible_iteration.status = "infeasible"
                    iterations[-1] = infeasible_iteration
                    break

    return iterations
