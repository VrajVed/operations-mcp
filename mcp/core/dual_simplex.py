"""
Dual Simplex Solver

Implements the dual simplex algorithm EXACTLY as specified in the
professor's notes (Steps 1-7).

Architecture:
  - Separate from primal simplex (core/tableau.py)
  - Uses separate schemas (models/dual_simplex.py)
  - Shares only the pivot operation helper (core/pivot.py)
  - Each major function maps to a specific step in the professor's algorithm

Algorithm Overview:
  Step 1: Convert minimization into maximization if necessary.
  Step 2: Convert >= constraints into <= constraints by multiplying by -1.
  Step 3: Add slack variables and create the initial dual simplex tableau.
  Step 4: Compute Cj - Zj. Three cases:
          A: all Cj-Zj <= 0 AND all RHS >= 0  -> optimal
          B: all Cj-Zj <= 0 BUT some RHS < 0  -> continue
          C: some Cj-Zj > 0                    -> dual simplex fails
  Step 5: Select pivot row with MOST NEGATIVE RHS (leaving variable).
  Step 6: Select pivot column using minimum ratio on NEGATIVE entries only.
  Step 7: Perform normal simplex row operations (pivot = 1, column = 0).
"""

from typing import List, Literal

from mcp.models.simplex import SimplexProblem
from mcp.models.dual_simplex import (
    DualSimplexTableau,
    DualSimplexIteration,
    VariableName,
)
from mcp.core.pivot import apply_pivot_operation


# ---------------------------------------------------------------------------
# Step 1-3: Parse and build the initial dual simplex tableau
# ---------------------------------------------------------------------------

def parse_dual_simplex_problem(problem: SimplexProblem) -> DualSimplexTableau:
    """
    Step 1: Convert minimization into maximization if necessary.
    Step 2: Convert >= constraints into <= constraints by multiplying by -1.
    Step 3: Add slack variables and create the initial dual simplex tableau.

    Returns a DualSimplexTableau ready for the dual simplex algorithm.
    """
    # Step 1: If minimization, multiply objective coefficients by -1
    if problem.objective == "min":
        objective_coefficients = [-c for c in problem.objective_coefficients]
    else:
        objective_coefficients = list(problem.objective_coefficients)

    # Step 2: Convert ALL >= constraints to <= by multiplying by -1
    # Make copies so we don't mutate the input problem
    processed_constraints = []
    for constraint in problem.constraints:
        coeffs = list(constraint.coefficients)
        rhs = constraint.rhs
        operator = constraint.operator

        if operator == ">=":
            coeffs = [-c for c in coeffs]
            rhs = -rhs
            operator = "<="
        # For <= and =, keep as-is
        processed_constraints.append((coeffs, operator, rhs))

    number_of_constraints = len(processed_constraints)
    number_of_variables = len(objective_coefficients)

    # Step 3: Add slack variables to objective function (coefficient = 0)
    for _ in range(number_of_constraints):
        objective_coefficients.append(0.0)

    matrix: List[List[float]] = []
    # Cj row: objective coefficients + RHS (initially 0)
    matrix.append(objective_coefficients + [0.0])

    # Constraint rows: coefficients + slack variables + RHS
    for i, (coeffs, _operator, rhs) in enumerate(processed_constraints):
        slack_vector = [0.0] * number_of_constraints
        slack_vector[i] = 1.0
        row = coeffs + slack_vector + [rhs]
        matrix.append(row)

    basis = [f"s{i + 1}" for i in range(number_of_constraints)]
    column_variables = [f"x{j + 1}" for j in range(number_of_variables)] + [
        f"s{i + 1}" for i in range(number_of_constraints)
    ]

    return DualSimplexTableau(
        iteration=0,
        matrix=matrix,
        basis=basis,
        column_variables=column_variables,
    )


# ---------------------------------------------------------------------------
# Helper: Compute Cj - Zj row
# ---------------------------------------------------------------------------

def _compute_cj_zj(tableau: DualSimplexTableau) -> List[float]:
    """
    Compute the Cj - Zj values for every column (excluding RHS).

    This is the same mathematical operation used in primal simplex,
    extracted here for reuse within the dual simplex solver.
    """
    # Basis coefficients = Cj values of the current basic variables
    basis_coefficients = []
    for basis_var in tableau.basis:
        col_idx = tableau.column_variables.index(basis_var)
        basis_coefficients.append(tableau.matrix[0][col_idx])

    row_Cj = tableau.matrix[0][:-1]  # Exclude RHS

    # Compute Zj for each column
    row_Zj: List[float] = []
    for col in range(len(tableau.column_variables)):
        zj = 0.0
        for i, basis_var in enumerate(tableau.basis):
            coefficient = tableau.matrix[i + 1][col]
            zj += basis_coefficients[i] * coefficient
        row_Zj.append(zj)

    # Cj - Zj
    return [cj - zj for cj, zj in zip(row_Cj, row_Zj)]


# ---------------------------------------------------------------------------
# Step 4: Check stopping condition based on Cj-Zj and RHS values
# ---------------------------------------------------------------------------

def _check_status(
    tableau: DualSimplexTableau, cj_zj: List[float]
) -> Literal["optimal", "infeasible", "dual_simplex_failed", "continue"]:
    """
    Step 4: Compute Cj - Zj and determine the solver status.

    Cases:
      A: all Cj-Zj <= 0 AND all RHS >= 0  -> "optimal"
      B: all Cj-Zj <= 0 BUT some RHS < 0  -> "continue"
      C: some Cj-Zj > 0                    -> "dual_simplex_failed"
    """
    # Extract RHS values from constraint rows
    rhs_values = [tableau.matrix[i][-1] for i in range(1, len(tableau.matrix))]

    all_cj_zj_nonpos = all(c <= 0 for c in cj_zj)
    all_rhs_nonneg = all(r >= 0 for r in rhs_values)

    if all_cj_zj_nonpos and all_rhs_nonneg:
        # Case A: Optimal feasible solution found
        return "optimal"

    if all_cj_zj_nonpos and not all_rhs_nonneg:
        # Case B: Dual feasible but primal infeasible — continue iterations
        return "continue"

    # Case C: Some Cj-Zj > 0 — dual simplex method fails
    return "dual_simplex_failed"


# ---------------------------------------------------------------------------
# Step 5: Select pivot row (most negative RHS)
# ---------------------------------------------------------------------------

def _select_pivot_row(tableau: DualSimplexTableau) -> int:
    """
    Step 5: Select the row with the MOST NEGATIVE RHS value.

    Returns the 0-based index into the constraint rows
    (i.e., maps to tableau.matrix[pivot_row_index + 1]).

    The corresponding basic variable is the LEAVING variable.
    """
    rhs_values = [tableau.matrix[i][-1] for i in range(1, len(tableau.matrix))]

    # Find the most negative RHS
    min_rhs = min(rhs_values)
    pivot_row_index = rhs_values.index(min_rhs)

    return pivot_row_index


# ---------------------------------------------------------------------------
# Step 6: Select pivot column (minimum ratio on negative entries)
# ---------------------------------------------------------------------------

class InfeasibleProblemError(Exception):
    """Raised when the dual simplex detects an infeasible problem."""
    pass


def _select_pivot_column(
    tableau: DualSimplexTableau,
    pivot_row_index: int,
    cj_zj: List[float],
) -> int:
    """
    Step 6: For the selected pivot row, consider ONLY negative entries.
    Compute ratios (Cj - Zj) / pivot_row_entry and choose the MINIMUM ratio.

    Returns the 0-based column index.

    Raises:
        InfeasibleProblemError: If no negative entries exist in the pivot row,
                                meaning the problem has no feasible solution.
    """
    matrix_pivot_row = pivot_row_index + 1  # constraint rows start at index 1
    pivot_row_entries = tableau.matrix[matrix_pivot_row][:-1]  # Exclude RHS

    ratios: List[tuple[int, float]] = []

    for col, entry in enumerate(pivot_row_entries):
        if entry < 0:  # Only consider negative entries
            ratio = cj_zj[col] / entry
            ratios.append((col, ratio))

    if not ratios:
        # If all elements in the pivot row are non-negative,
        # the problem does not have a feasible solution.
        raise InfeasibleProblemError(
            "No negative entries in the pivot row. Problem is infeasible."
        )

    # Choose the column with the minimum ratio
    pivot_column_index = min(ratios, key=lambda x: x[1])[0]

    return pivot_column_index


# ---------------------------------------------------------------------------
# Single iteration driver
# ---------------------------------------------------------------------------

def solve_dual_simplex_iteration(tableau: DualSimplexTableau) -> DualSimplexIteration:
    """
    Perform ONE iteration of the dual simplex algorithm.

    Returns a DualSimplexIteration containing:
      - entering_variable / leaving_variable / pivot_row / pivot_column
      - updated tableau
      - status

    If the status is "optimal", "infeasible", or "dual_simplex_failed",
    the pivot information will be None and the returned tableau is unchanged.
    """
    # Step 4a: Compute Cj - Zj
    cj_zj = _compute_cj_zj(tableau)

    # Step 4b: Check stopping condition
    status = _check_status(tableau, cj_zj)

    if status == "optimal":
        return DualSimplexIteration(
            entering_variable=None,
            leaving_variable=None,
            pivot_row=None,
            pivot_column=None,
            tableau=tableau,
            status="optimal",
        )

    if status == "dual_simplex_failed":
        return DualSimplexIteration(
            entering_variable=None,
            leaving_variable=None,
            pivot_row=None,
            pivot_column=None,
            tableau=tableau,
            status="dual_simplex_failed",
        )

    # status == "continue": proceed with Steps 5-7

    # Step 5: Select pivot row (most negative RHS)
    pivot_row_index = _select_pivot_row(tableau)
    leaving_variable = tableau.basis[pivot_row_index]

    # Step 6: Select pivot column (minimum ratio on negative entries)
    try:
        pivot_column_index = _select_pivot_column(tableau, pivot_row_index, cj_zj)
    except InfeasibleProblemError:
        return DualSimplexIteration(
            entering_variable=None,
            leaving_variable=None,
            pivot_row=None,
            pivot_column=None,
            tableau=tableau,
            status="infeasible",
        )

    entering_variable = tableau.column_variables[pivot_column_index]

    # Step 7: Perform normal simplex row operations via shared pivot helper
    new_matrix, new_basis = apply_pivot_operation(
        matrix=tableau.matrix,
        basis=tableau.basis,
        column_variables=tableau.column_variables,
        pivot_row_index=pivot_row_index,
        pivot_col_index=pivot_column_index,
        entering_variable=entering_variable,
    )

    new_tableau = DualSimplexTableau(
        iteration=tableau.iteration + 1,
        matrix=new_matrix,
        basis=new_basis,
        column_variables=list(tableau.column_variables),
    )

    return DualSimplexIteration(
        entering_variable=entering_variable,
        leaving_variable=leaving_variable,
        pivot_row=pivot_row_index,
        pivot_column=pivot_column_index,
        tableau=new_tableau,
        status="continue",
    )


# ---------------------------------------------------------------------------
# Full solver (API-friendly)
# ---------------------------------------------------------------------------

def solve_dual_simplex(problem: SimplexProblem) -> List[DualSimplexIteration]:
    """
    Solve a linear programming problem using the dual simplex method.

    Steps:
      1. Parse the problem into an initial dual simplex tableau.
      2. Repeatedly apply dual simplex iterations until termination.
      3. Collect all iterations (including the terminal one) in a list.

    Returns:
        A list of DualSimplexIteration objects representing the full solve trace.
        The last element always has a terminal status:
        "optimal", "infeasible", or "dual_simplex_failed".
    """
    tableau = parse_dual_simplex_problem(problem)
    iterations: List[DualSimplexIteration] = []

    while True:
        iteration = solve_dual_simplex_iteration(tableau)
        iterations.append(iteration)

        if iteration.status != "continue":
            break

        tableau = iteration.tableau

    return iterations
