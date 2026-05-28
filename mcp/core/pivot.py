"""
Shared pivot operation helper used by both primal and dual simplex solvers.

This module extracts the common Gaussian elimination logic:
  1. Normalize the pivot row (make pivot element = 1)
  2. Eliminate all other entries in the pivot column (constraint rows only)
  3. Recompute the objective value in matrix[0][-1]

The Cj row (matrix[0][:-1]) remains immutable throughout.
"""

from typing import List


def apply_pivot_operation(
    matrix: List[List[float]],
    basis: List[str],
    column_variables: List[str],
    pivot_row_index: int,
    pivot_col_index: int,
    entering_variable: str,
) -> tuple[List[List[float]], List[str]]:
    """
    Perform one pivot operation on a simplex tableau.

    Args:
        matrix: The tableau matrix where matrix[0] is the Cj row.
        basis: List of basic variable names (length = number of constraint rows).
        column_variables: List of all column variable names.
        pivot_row_index: 0-based index into the constraint rows (maps to matrix[pivot_row_index + 1]).
        pivot_col_index: 0-based index into column_variables.
        entering_variable: Name of the variable entering the basis.

    Returns:
        A tuple of (new_matrix, new_basis) with the pivot operation applied.
        The original matrix and basis are NOT mutated.
    """
    # Deep copy to prevent mutation of the original tableau
    new_matrix = [row.copy() for row in matrix]
    new_basis = list(basis)

    # Update basis: the entering variable replaces the leaving variable
    new_basis[pivot_row_index] = entering_variable

    # Row index in the matrix (constraint rows start at index 1)
    matrix_pivot_row = pivot_row_index + 1

    # Step 1: Normalize pivot row — make pivot element = 1
    pivot_element = new_matrix[matrix_pivot_row][pivot_col_index]
    for col in range(len(new_matrix[0])):
        new_matrix[matrix_pivot_row][col] /= pivot_element

    # Step 2: Eliminate all other entries in the pivot column
    # We skip row 0 (Cj row) to keep it immutable; only constraint rows change.
    for row in range(1, len(new_matrix)):
        if row != matrix_pivot_row:
            factor = new_matrix[row][pivot_col_index]
            for col in range(len(new_matrix[0])):
                new_matrix[row][col] -= factor * new_matrix[matrix_pivot_row][col]

    # Step 3: Recompute objective value Z = sum(Cb_i * RHS_i)
    # matrix[0][-1] stores -Z, so we compute Z and negate it.
    new_obj_val = 0.0
    for i, basis_var in enumerate(new_basis):
        col_idx = column_variables.index(basis_var)
        basis_coefficient = new_matrix[0][col_idx]
        rhs_value = new_matrix[i + 1][-1]
        new_obj_val += basis_coefficient * rhs_value
    new_matrix[0][-1] = -new_obj_val

    return new_matrix, new_basis
