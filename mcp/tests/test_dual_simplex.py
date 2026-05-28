import pytest
import json
import copy

from mcp.models.simplex import SimplexProblem, SimplexConstraint
from mcp.core.dual_simplex import (
    parse_dual_simplex_problem,
    solve_dual_simplex_iteration,
    solve_dual_simplex,
    _compute_cj_zj,
    _check_status,
    _select_pivot_row,
    _select_pivot_column,
    InfeasibleProblemError,
)
from mcp.models.dual_simplex import DualSimplexTableau


# ---------------------------------------------------------------------------
# Test 1: Standard dual simplex success (problem4.json)
# ---------------------------------------------------------------------------

def test_dual_simplex_success_problem4():
    """
    min 2x1 + 3x2
    s.t.
      x1 + x2 >= 4
      x1 + 2x2 >= 6

    After conversion:
      max -2x1 - 3x2
      -x1 - x2 <= -4
      -x1 - 2x2 <= -6

    Expected optimal: x1 = 2, x2 = 2
    Converted max Z = -10  =>  Original min = 10
    """
    problem = SimplexProblem(
        objective="min",
        objective_coefficients=[2.0, 3.0],
        constraints=[
            SimplexConstraint(coefficients=[1.0, 1.0], operator=">=", rhs=4.0),
            SimplexConstraint(coefficients=[1.0, 2.0], operator=">=", rhs=6.0),
        ],
    )

    iterations = solve_dual_simplex(problem)

    # Should have 2 solving iterations + 1 terminal optimal iteration = 3 total
    assert len(iterations) == 3

    # First iteration: status "continue", entering = x2, leaving = s2
    it1 = iterations[0]
    assert it1.status == "continue"
    assert it1.entering_variable == "x2"
    assert it1.leaving_variable == "s2"
    assert it1.pivot_row == 1
    assert it1.pivot_column == 1

    # Second iteration: status "continue", entering = x1, leaving = s1
    it2 = iterations[1]
    assert it2.status == "continue"
    assert it2.entering_variable == "x1"
    assert it2.leaving_variable == "s1"
    assert it2.pivot_row == 0
    assert it2.pivot_column == 0

    # Third iteration: status "optimal"
    it3 = iterations[2]
    assert it3.status == "optimal"
    assert it3.entering_variable is None
    assert it3.leaving_variable is None
    assert it3.pivot_row is None
    assert it3.pivot_column is None

    # Verify final basis and solution values
    final_tableau = it3.tableau
    assert "x1" in final_tableau.basis
    assert "x2" in final_tableau.basis

    x1_row = final_tableau.basis.index("x1")
    x2_row = final_tableau.basis.index("x2")

    assert final_tableau.matrix[x1_row + 1][-1] == 2.0
    assert final_tableau.matrix[x2_row + 1][-1] == 2.0

    # For the converted max problem, Z = -10
    assert final_tableau.matrix[0][-1] == 10.0  # stored as -Z


# ---------------------------------------------------------------------------
# Test 2: Immutability of input tableau
# ---------------------------------------------------------------------------

def test_dual_simplex_immutability():
    """Verify that solve_dual_simplex_iteration does not mutate the input tableau."""
    problem = SimplexProblem(
        objective="min",
        objective_coefficients=[2.0, 3.0],
        constraints=[
            SimplexConstraint(coefficients=[1.0, 1.0], operator=">=", rhs=4.0),
            SimplexConstraint(coefficients=[1.0, 2.0], operator=">=", rhs=6.0),
        ],
    )

    tableau = parse_dual_simplex_problem(problem)
    initial_matrix = copy.deepcopy(tableau.matrix)
    initial_basis = list(tableau.basis)
    initial_iteration = tableau.iteration

    # Run one iteration
    iteration = solve_dual_simplex_iteration(tableau)

    # Input tableau must be unchanged
    assert tableau.matrix == initial_matrix
    assert tableau.basis == initial_basis
    assert tableau.iteration == initial_iteration

    # The returned tableau should be a different object
    assert iteration.tableau is not tableau


# ---------------------------------------------------------------------------
# Test 3: Infeasible problem detection
# ---------------------------------------------------------------------------

def test_dual_simplex_infeasible():
    """
    Construct a problem where the most-negative-RHS row has no negative coefficients.

    After conversion and adding slacks, if the pivot row has all non-negative
    entries, the dual simplex should detect infeasibility.

    Example:
      min x1 + x2
      s.t. x1 + x2 >= 5
           x1 + x2 >= 3   (this will be flipped to <=)

    Let's craft one more directly:
      min x1
      s.t. -x1 >= -2   -> x1 <= 2 (after flip)
           x1 >= 3     -> -x1 <= -3 (after flip)

    Initial tableau after conversion:
      max -x1
      -x1 <= -2   (but wait, >= flipped: -(-x1) <= -(-2) -> x1 <= 2)
      -x1 <= -3

    Actually let's make it simpler. We need a row with negative RHS but all
    non-negative coefficients.

    Consider:
      min x1 + x2
      s.t. x1 >= 5       -> -x1 <= -5
           x1 <= 3       -> x1 <= 3

    Initial tableau:
      Cj: -1, 0, 0 | 0
      s1: -1, 0, 1 | -5
      s2:  1, 0, 0 |  3

    Wait, we only have x1 in the objective. Let me be more careful.
    
    Actually, a simpler test: after one dual simplex iteration, we might hit
    a state where the next pivot row has no negative entries. Let's create
    a problem that triggers this directly.
    """
    # This problem is crafted so that after initial setup,
    # the most negative RHS row has no negative coefficients.
    # 
    # min x1 + x2
    # s.t. -x1 - x2 >= -1   (after flip: x1 + x2 <= 1)
    #      -x1 >= -5        (after flip: x1 <= 5)
    #
    # Hmm, this doesn't give negative RHS. Let me think differently.
    #
    # We need a constraint that after being converted to <= has negative RHS
    # but all positive coefficients in that row.
    #
    # min x1
    # s.t. x1 >= 10   -> -x1 <= -10
    #      x1 >= 5    -> -x1 <= -5
    #
    # Initial tableau:
    # Cj: -1, 0, 0 | 0
    # s1: -1, 1, 0 | -10
    # s2: -1, 0, 1 | -5
    #
    # Most negative RHS = -10 (row 0, s1)
    # Negative entries in row 0: -1 (x1)
    # Ratio: (-1) / (-1) = 1
    # Pivot on row 0, col 0
    #
    # After pivot:
    # x1: 1, -1, 0 | 10
    # s2: 0, -1, 1 | 5
    #
    # Now most negative RHS = none are negative! Optimal.
    # This doesn't test infeasibility.
    #
    # Let's try:
    # min x1 + x2
    # s.t. x1 + x2 >= 5   -> -x1 - x2 <= -5
    #      x1 + 2x2 >= 8  -> -x1 - 2x2 <= -8
    #
    # Initial:
    # Cj: -1, -1, 0, 0 | 0
    # s1: -1, -1, 1, 0 | -5
    # s2: -1, -2, 0, 1 | -8
    #
    # Most negative RHS = -8 (s2)
    # Negatives in s2 row: -1, -2
    # Ratios: (-1)/(-1) = 1, (-1)/(-2) = 0.5
    # Min = 0.5 -> x2 enters, s2 leaves
    #
    # After pivot (divide s2 row by -2):
    # x2: 0.5, 1, 0, -0.5 | 4
    # s1: -0.5, 0, 1, -0.5 | -1
    #
    # Most negative RHS = -1 (s1)
    # Negatives in s1 row: -0.5, -0.5
    # Ratios: (-1)/(-0.5) = 2, 0/(-0.5) = 0
    # Min = 0 -> s2 enters? Wait, s2 has Cj-Zj = 0.
    #
    # Hmm let me recalculate Cj-Zj after first pivot.
    # Basis = [s1, x2], Cb = [0, -1]
    # Zj for x1: 0*(-0.5) + (-1)*0.5 = -0.5, Cj-Zj = -1 - (-0.5) = -0.5
    # Zj for x2: 0*0 + (-1)*1 = -1, Cj-Zj = -1 - (-1) = 0
    # Zj for s1: 0*1 + (-1)*0 = 0, Cj-Zj = 0 - 0 = 0
    # Zj for s2: 0*(-0.5) + (-1)*(-0.5) = 0.5, Cj-Zj = 0 - 0.5 = -0.5
    #
    # Ratios for s1 row (-0.5, 0, -0.5):
    # x1: (-0.5) / (-0.5) = 1
    # s2: (-0.5) / (-0.5) = 1
    # Tie -> first occurrence wins -> x1 enters
    #
    # After second pivot:
    # x1: 1, 0, -2, 1 | 2
    # x2: 0, 1, 1, -1 | 3
    #
    # Optimal. Still not infeasible.
    #
    # For infeasibility, we need a row with negative RHS but all
    # non-negative coefficients. Let's construct one directly:
    #
    # min x1 + x2
    # s.t. -x1 - x2 >= -3   -> x1 + x2 <= 3
    #       x1 + x2 >= 5    -> -x1 - x2 <= -5
    #
    # Initial:
    # Cj: -1, -1, 0, 0 | 0
    # s1:  1,  1, 1, 0 | 3
    # s2: -1, -1, 0, 1 | -5
    #
    # Most negative RHS = -5 (s2)
    # Negatives in s2: -1, -1
    # Ratios: (-1)/(-1) = 1, (-1)/(-1) = 1
    # Tie -> x1 enters (first)
    # After pivot:
    # x1: 1, 1, 0, -1 | 5
    # s1: 0, 0, 1, 1  | -2
    #
    # Most negative RHS = -2 (s1)
    # s1 row: 0, 0, 1, 1 | -2
    # No negative entries! -> Infeasible!
    #
    # Perfect, this triggers the infeasibility condition.
    
    problem = SimplexProblem(
        objective="min",
        objective_coefficients=[1.0, 1.0],
        constraints=[
            SimplexConstraint(coefficients=[-1.0, -1.0], operator=">=", rhs=-3.0),
            SimplexConstraint(coefficients=[1.0, 1.0], operator=">=", rhs=5.0),
        ],
    )

    iterations = solve_dual_simplex(problem)

    # First iteration: continue (x1 enters, s2 leaves)
    assert iterations[0].status == "continue"

    # Second iteration: infeasible
    assert iterations[1].status == "infeasible"
    assert iterations[1].entering_variable is None
    assert iterations[1].leaving_variable is None


# ---------------------------------------------------------------------------
# Test 4: Dual simplex method fails (some Cj-Zj > 0)
# ---------------------------------------------------------------------------

def test_dual_simplex_method_fails():
    """
    Construct a problem where after preprocessing, some Cj-Zj > 0.
    This causes the dual simplex method to fail immediately.

    Example:
      max 2x1 + 3x2   (already max, no conversion needed)
      s.t. x1 + x2 <= 5
           x1 + 2x2 <= 8

    After adding slacks:
      Cj: 2, 3, 0, 0 | 0
      s1: 1, 1, 1, 0 | 5
      s2: 1, 2, 0, 1 | 8

    Cj-Zj = [2, 3, 0, 0] -> some are > 0
    -> dual_simplex_failed
    """
    problem = SimplexProblem(
        objective="max",
        objective_coefficients=[2.0, 3.0],
        constraints=[
            SimplexConstraint(coefficients=[1.0, 1.0], operator="<=", rhs=5.0),
            SimplexConstraint(coefficients=[1.0, 2.0], operator="<=", rhs=8.0),
        ],
    )

    iterations = solve_dual_simplex(problem)

    # Should fail immediately
    assert len(iterations) == 1
    assert iterations[0].status == "dual_simplex_failed"
    assert iterations[0].entering_variable is None
    assert iterations[0].leaving_variable is None


# ---------------------------------------------------------------------------
# Test 5: Unit tests for helper functions
# ---------------------------------------------------------------------------

def test_compute_cj_zj():
    """Test the Cj-Zj computation helper."""
    tableau = DualSimplexTableau(
        iteration=0,
        matrix=[
            [-2.0, -3.0, 0.0, 0.0, 0.0],
            [-1.0, -1.0, 1.0, 0.0, -4.0],
            [-1.0, -2.0, 0.0, 1.0, -6.0],
        ],
        basis=["s1", "s2"],
        column_variables=["x1", "x2", "s1", "s2"],
    )

    cj_zj = _compute_cj_zj(tableau)
    # With basis [s1, s2], Cb = [0, 0], so Zj = 0 for all columns
    assert cj_zj == [-2.0, -3.0, 0.0, 0.0]


def test_check_status_optimal():
    """Test status check for optimal solution."""
    tableau = DualSimplexTableau(
        iteration=0,
        matrix=[
            [-2.0, -3.0, 0.0, 0.0, 10.0],
            [1.0, 0.0, -2.0, 1.0, 2.0],
            [0.0, 1.0, 1.0, -1.0, 2.0],
        ],
        basis=["x1", "x2"],
        column_variables=["x1", "x2", "s1", "s2"],
    )

    cj_zj = _compute_cj_zj(tableau)
    status = _check_status(tableau, cj_zj)
    assert status == "optimal"


def test_check_status_continue():
    """Test status check for continue (dual feasible, primal infeasible)."""
    tableau = DualSimplexTableau(
        iteration=0,
        matrix=[
            [-2.0, -3.0, 0.0, 0.0, 0.0],
            [-1.0, -1.0, 1.0, 0.0, -4.0],
            [-1.0, -2.0, 0.0, 1.0, -6.0],
        ],
        basis=["s1", "s2"],
        column_variables=["x1", "x2", "s1", "s2"],
    )

    cj_zj = _compute_cj_zj(tableau)
    status = _check_status(tableau, cj_zj)
    assert status == "continue"


def test_check_status_failed():
    """Test status check for dual simplex method failure."""
    tableau = DualSimplexTableau(
        iteration=0,
        matrix=[
            [2.0, 3.0, 0.0, 0.0, 0.0],
            [1.0, 1.0, 1.0, 0.0, 5.0],
            [1.0, 2.0, 0.0, 1.0, 8.0],
        ],
        basis=["s1", "s2"],
        column_variables=["x1", "x2", "s1", "s2"],
    )

    cj_zj = _compute_cj_zj(tableau)
    status = _check_status(tableau, cj_zj)
    assert status == "dual_simplex_failed"


def test_select_pivot_row():
    """Test pivot row selection (most negative RHS)."""
    tableau = DualSimplexTableau(
        iteration=0,
        matrix=[
            [-2.0, -3.0, 0.0, 0.0, 0.0],
            [-1.0, -1.0, 1.0, 0.0, -4.0],
            [-1.0, -2.0, 0.0, 1.0, -6.0],
        ],
        basis=["s1", "s2"],
        column_variables=["x1", "x2", "s1", "s2"],
    )

    pivot_row = _select_pivot_row(tableau)
    assert pivot_row == 1  # s2 row has RHS = -6 (most negative)


def test_select_pivot_column():
    """Test pivot column selection (minimum ratio on negative entries)."""
    tableau = DualSimplexTableau(
        iteration=0,
        matrix=[
            [-2.0, -3.0, 0.0, 0.0, 0.0],
            [-1.0, -1.0, 1.0, 0.0, -4.0],
            [-1.0, -2.0, 0.0, 1.0, -6.0],
        ],
        basis=["s1", "s2"],
        column_variables=["x1", "x2", "s1", "s2"],
    )

    cj_zj = [-2.0, -3.0, 0.0, 0.0]
    pivot_col = _select_pivot_column(tableau, pivot_row_index=1, cj_zj=cj_zj)

    # s2 row (index 1): entries are [-1, -2, 0, 1 | -6]
    # Negative entries: x1 (-1) with ratio (-2)/(-1) = 2
    #                  x2 (-2) with ratio (-3)/(-2) = 1.5
    # Minimum ratio = 1.5 -> x2 (column 1)
    assert pivot_col == 1


def test_select_pivot_column_infeasible():
    """Test that _select_pivot_column raises InfeasibleProblemError when no negatives."""
    tableau = DualSimplexTableau(
        iteration=0,
        matrix=[
            [-1.0, -1.0, 0.0, 0.0, 0.0],
            [0.0, 0.0, 1.0, 1.0, -2.0],
            [1.0, 1.0, 0.0, -1.0, 5.0],
        ],
        basis=["s1", "x1"],
        column_variables=["x1", "x2", "s1", "s2"],
    )

    cj_zj = [-1.0, -1.0, 0.0, 0.0]

    with pytest.raises(InfeasibleProblemError):
        _select_pivot_column(tableau, pivot_row_index=0, cj_zj=cj_zj)


# ---------------------------------------------------------------------------
# Test 6: JSON fixture compatibility
# ---------------------------------------------------------------------------

def test_dual_simplex_from_json():
    """Load problem4.json and solve with dual simplex."""
    with open("mcp/tests/problem4.json", "r") as f:
        problem_data = json.load(f)

    problem = SimplexProblem(**problem_data)
    iterations = solve_dual_simplex(problem)

    # Should reach optimal
    assert iterations[-1].status == "optimal"

    # Optimal values should match the analytical solution
    final = iterations[-1].tableau
    x1_val = final.matrix[final.basis.index("x1") + 1][-1]
    x2_val = final.matrix[final.basis.index("x2") + 1][-1]

    assert x1_val == 2.0
    assert x2_val == 2.0
