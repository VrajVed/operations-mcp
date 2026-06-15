"""
Primal Simplex Solver

Implements the primal simplex algorithm with the same modular structure as the
dual simplex solver. Each major step is split into focused helpers, and the
input tableau is never mutated.
"""

from typing import List, Literal

from mcp.models.simplex import SimplexIteration, SimplexProblem, SimplexTableau
from mcp.core.parser import parse_simplex
from mcp.core.pivot import apply_pivot_operation


# ---------------------------------------------------------------------------
# Helper: Compute Cj - Zj row
# ---------------------------------------------------------------------------

def _compute_cj_zj(tableau: SimplexTableau) -> List[float]:
    """
    Compute the Cj - Zj values for every column (excluding RHS).

    This is the same mathematical operation used in the dual simplex solver,
    extracted here for reuse within the primal simplex solver.
    """
    basis_coefficients = []
    for basis_var in tableau.basis:
        column_index = tableau.column_variables.index(basis_var)
        basis_coefficients.append(tableau.matrix[0][column_index])

    row_Cj = tableau.matrix[0][:-1]  # Exclude RHS

    row_Zj: List[float] = []
    for col in range(len(tableau.column_variables)):
        zj = 0.0
        for i, basis_var in enumerate(tableau.basis):
            coefficient = tableau.matrix[i + 1][col]
            zj += basis_coefficients[i] * coefficient
        row_Zj.append(zj)

    return [cj - zj for cj, zj in zip(row_Cj, row_Zj)]


# ---------------------------------------------------------------------------
# Step 1: Check stopping condition based on Cj-Zj values
# ---------------------------------------------------------------------------

def _check_status(
    tableau: SimplexTableau, cj_zj: List[float]
) -> Literal["optimal", "continue"]:
    """
    Determine whether the primal simplex has reached an optimal solution.

    For a maximization problem (the only form the primal tableau accepts),
    optimality is reached when all Cj - Zj values are non-positive.
    """
    if all(c <= 0 for c in cj_zj):
        return "optimal"
    return "continue"


# ---------------------------------------------------------------------------
# Step 2: Select pivot column (entering variable)
# ---------------------------------------------------------------------------

def _select_pivot_column(cj_zj: List[float]) -> int:
    """
    Select the pivot column as the column with the most positive Cj - Zj value.

    The corresponding variable is the ENTERING variable.
    """
    return cj_zj.index(max(cj_zj))


# ---------------------------------------------------------------------------
# Step 3: Select pivot row (leaving variable)
# ---------------------------------------------------------------------------

def _select_pivot_row(tableau: SimplexTableau, pivot_column_index: int) -> int:
    """
    Select the pivot row using the minimum ratio test on positive entries.

    Ratio = RHS / pivot_column_entry, considering only positive entries.
    The corresponding basic variable is the LEAVING variable.

    Raises:
        ValueError: If no positive pivot elements exist in the pivot column,
                    meaning the problem is unbounded.
    """
    ratios = []

    for i in range(1, len(tableau.matrix)):  # Skip objective row
        pivot_entry = tableau.matrix[i][pivot_column_index]
        if pivot_entry > 0:
            ratio = tableau.matrix[i][-1] / pivot_entry
        else:
            ratio = float("inf")
        ratios.append(ratio)

    min_ratio = min(ratios)
    if min_ratio == float("inf"):
        raise ValueError(
            "The problem is unbounded (no positive pivot elements found in the pivot column)."
        )

    return ratios.index(min_ratio)


# ---------------------------------------------------------------------------
# Single iteration driver
# ---------------------------------------------------------------------------

def solve_simplex_iteration(tableau: SimplexTableau) -> SimplexIteration:
    """
    Perform ONE iteration of the primal simplex algorithm.

    Returns a SimplexIteration containing:
      - entering_variable / leaving_variable / pivot_row / pivot_column
      - updated tableau
      - status

    If the status is "optimal" or "unbounded", the pivot information will be
    None and the returned tableau is unchanged.
    """
    # Step 1: Compute Cj - Zj
    cj_zj = _compute_cj_zj(tableau)

    # Step 2: Check stopping condition
    status = _check_status(tableau, cj_zj)
    if status == "optimal":
        return SimplexIteration(
            entering_variable=None,
            leaving_variable=None,
            pivot_row=None,
            pivot_column=None,
            tableau=tableau,
            status="optimal",
        )

    # status == "continue": proceed with Steps 3-5

    # Step 3: Select pivot column (entering variable)
    pivot_column_index = _select_pivot_column(cj_zj)
    entering_variable = tableau.column_variables[pivot_column_index]

    # Step 4: Select pivot row (leaving variable)
    try:
        pivot_row_index = _select_pivot_row(tableau, pivot_column_index)
    except ValueError:
        return SimplexIteration(
            entering_variable=None,
            leaving_variable=None,
            pivot_row=None,
            pivot_column=None,
            tableau=tableau,
            status="unbounded",
        )

    leaving_variable = tableau.basis[pivot_row_index]

    # Step 5: Perform normal simplex row operations via shared pivot helper
    new_matrix, new_basis = apply_pivot_operation(
        matrix=tableau.matrix,
        basis=tableau.basis,
        column_variables=tableau.column_variables,
        pivot_row_index=pivot_row_index,
        pivot_col_index=pivot_column_index,
        entering_variable=entering_variable,
    )

    new_tableau = tableau.model_copy()
    new_tableau.iteration += 1
    new_tableau.matrix = new_matrix
    new_tableau.basis = new_basis
    new_tableau.column_variables = list(tableau.column_variables)

    return SimplexIteration(
        entering_variable=entering_variable,
        leaving_variable=leaving_variable,
        pivot_row=pivot_row_index,
        pivot_column=pivot_column_index,
        tableau=new_tableau,
        status="continue",
    )


# ---------------------------------------------------------------------------
# Backward-compatible wrapper
# ---------------------------------------------------------------------------

def solve_simplex_tableau(tableau: SimplexTableau) -> SimplexIteration:
    """
    Perform one primal simplex iteration.

    This is a backward-compatible wrapper around solve_simplex_iteration that
    preserves the original behavior of raising ValueError when the problem is
    unbounded.
    """
    iteration = solve_simplex_iteration(tableau)

    if iteration.status == "unbounded":
        raise ValueError(
            "The problem is unbounded (no positive pivot elements found in the pivot column)."
        )

    return iteration


# ---------------------------------------------------------------------------
# Full solver (API-friendly)
# ---------------------------------------------------------------------------

def solve_simplex(problem: SimplexProblem) -> List[SimplexIteration]:
    """
    Solve a linear programming problem using the primal simplex method.

    Steps:
      1. Parse the problem into an initial primal simplex tableau.
      2. Repeatedly apply primal simplex iterations until termination.
      3. Collect all iterations (including the terminal one) in a list.

    Returns:
        A list of SimplexIteration objects representing the full solve trace.
        The last element always has a terminal status: "optimal" or "unbounded".
    """
    tableau = parse_simplex(problem)
    iterations: List[SimplexIteration] = []

    while True:
        iteration = solve_simplex_iteration(tableau)
        iterations.append(iteration)

        if iteration.status != "continue":
            break

        tableau = iteration.tableau

    return iterations
