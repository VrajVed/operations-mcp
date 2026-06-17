import pytest

from opsmcp.models.simplex import SimplexProblem, SimplexConstraint
from opsmcp.core.big_m import solve_big_m


def test_big_m_manufacturing_problem():
    """
    Machine A / Machine B manufacturing problem with mixed <= and >= constraints.

    Max 80000A + 50000B
    s.t.
      10A + 5B <= 600   (assembly)
      4A + 5B <= 300    (testing)
      6A + 3B <= 360    (steel)
      A >= 20           (minimum A)
      B <= 2A           (B-to-A policy)
    """
    problem = SimplexProblem(
        objective="max",
        objective_coefficients=[80000.0, 50000.0],
        constraints=[
            SimplexConstraint(coefficients=[10.0, 5.0], operator="<=", rhs=600.0),
            SimplexConstraint(coefficients=[4.0, 5.0], operator="<=", rhs=300.0),
            SimplexConstraint(coefficients=[6.0, 3.0], operator="<=", rhs=360.0),
            SimplexConstraint(coefficients=[1.0, 0.0], operator=">=", rhs=20.0),
            SimplexConstraint(coefficients=[-2.0, 1.0], operator="<=", rhs=0.0),
        ],
    )

    iterations = solve_big_m(problem)
    final = iterations[-1]

    assert final.status == "optimal"

    x1_row = final.tableau.basis.index("x1")
    x2_row = final.tableau.basis.index("x2")

    A = final.tableau.matrix[x1_row + 1][-1]
    B = final.tableau.matrix[x2_row + 1][-1]

    assert A == pytest.approx(50.0)
    assert B == pytest.approx(20.0)

    # Objective value: 80000*50 + 50000*20 = 5,000,000
    converted_z = -final.tableau.matrix[0][-1]
    assert converted_z == pytest.approx(5000000.0)


def test_big_m_standard_max_problem():
    """Big-M should still solve a standard all-<= maximization problem."""
    problem = SimplexProblem(
        objective="max",
        objective_coefficients=[3.0, 2.0],
        constraints=[
            SimplexConstraint(coefficients=[1.0, 1.0], operator="<=", rhs=4.0),
            SimplexConstraint(coefficients=[1.0, -1.0], operator="<=", rhs=2.0),
        ],
    )

    iterations = solve_big_m(problem)
    final = iterations[-1]

    assert final.status == "optimal"

    x1_row = final.tableau.basis.index("x1")
    x2_row = final.tableau.basis.index("x2")

    x1 = final.tableau.matrix[x1_row + 1][-1]
    x2 = final.tableau.matrix[x2_row + 1][-1]

    assert x1 == pytest.approx(3.0)
    assert x2 == pytest.approx(1.0)


def test_big_m_minimization_with_gte_constraints():
    """
    Classic dual-simplex-style minimization problem.

    min 2x1 + 3x2
    s.t.
      x1 + x2 >= 4
      x1 + 2x2 >= 6

    Expected optimal: x1 = 2, x2 = 2, min = 10.
    """
    problem = SimplexProblem(
        objective="min",
        objective_coefficients=[2.0, 3.0],
        constraints=[
            SimplexConstraint(coefficients=[1.0, 1.0], operator=">=", rhs=4.0),
            SimplexConstraint(coefficients=[1.0, 2.0], operator=">=", rhs=6.0),
        ],
    )

    iterations = solve_big_m(problem)
    final = iterations[-1]

    assert final.status == "optimal"

    x1_row = final.tableau.basis.index("x1")
    x2_row = final.tableau.basis.index("x2")

    x1 = final.tableau.matrix[x1_row + 1][-1]
    x2 = final.tableau.matrix[x2_row + 1][-1]

    assert x1 == pytest.approx(2.0)
    assert x2 == pytest.approx(2.0)

    # For minimization, stored objective is -Z.
    assert final.tableau.matrix[0][-1] == pytest.approx(10.0)


def test_big_m_equality_constraint():
    """Big-M should handle equality constraints using artificial variables."""
    problem = SimplexProblem(
        objective="max",
        objective_coefficients=[1.0, 1.0],
        constraints=[
            SimplexConstraint(coefficients=[1.0, 1.0], operator="=", rhs=10.0),
            SimplexConstraint(coefficients=[1.0, 0.0], operator="<=", rhs=6.0),
        ],
    )

    iterations = solve_big_m(problem)
    final = iterations[-1]

    assert final.status == "optimal"

    x1_row = final.tableau.basis.index("x1")
    x1 = final.tableau.matrix[x1_row + 1][-1]
    assert x1 == pytest.approx(6.0)


def test_big_m_infeasible():
    """Big-M should detect infeasibility when artificial variables cannot be driven out."""
    problem = SimplexProblem(
        objective="max",
        objective_coefficients=[1.0],
        constraints=[
            SimplexConstraint(coefficients=[1.0], operator="<=", rhs=5.0),
            SimplexConstraint(coefficients=[1.0], operator=">=", rhs=10.0),
        ],
    )

    iterations = solve_big_m(problem)
    final = iterations[-1]

    assert final.status == "infeasible"
