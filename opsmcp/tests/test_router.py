import pytest

from opsmcp.models.simplex import SimplexProblem, SimplexConstraint
from opsmcp.tools.router import _select_solver, execute
from opsmcp.tools import simplex, dual_simplex, big_m


def test_router_selects_simplex_for_standard_max():
    """Router should choose primal simplex for max with all <= constraints."""
    problem = SimplexProblem(
        objective="max",
        objective_coefficients=[3.0, 2.0],
        constraints=[
            SimplexConstraint(coefficients=[1.0, 1.0], operator="<=", rhs=4.0),
            SimplexConstraint(coefficients=[1.0, -1.0], operator="<=", rhs=2.0),
        ],
    )
    assert _select_solver(problem) is simplex


def test_router_selects_dual_simplex_for_standard_min():
    """Router should choose dual simplex for min with all >= constraints."""
    problem = SimplexProblem(
        objective="min",
        objective_coefficients=[2.0, 3.0],
        constraints=[
            SimplexConstraint(coefficients=[1.0, 1.0], operator=">=", rhs=4.0),
            SimplexConstraint(coefficients=[1.0, 2.0], operator=">=", rhs=6.0),
        ],
    )
    assert _select_solver(problem) is dual_simplex


def test_router_falls_back_to_big_m_for_mixed_constraints():
    """Router should choose Big-M for problems with mixed operators."""
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
    assert _select_solver(problem) is big_m


def test_router_falls_back_to_big_m_for_equality():
    """Router should choose Big-M for equality constraints."""
    problem = SimplexProblem(
        objective="max",
        objective_coefficients=[1.0, 1.0],
        constraints=[
            SimplexConstraint(coefficients=[1.0, 1.0], operator="=", rhs=10.0),
            SimplexConstraint(coefficients=[1.0, 0.0], operator="<=", rhs=6.0),
        ],
    )
    assert _select_solver(problem) is big_m


def test_router_falls_back_to_big_m_for_negative_rhs():
    """Primal simplex can't handle negative RHS, so router should use Big-M."""
    problem = SimplexProblem(
        objective="max",
        objective_coefficients=[1.0],
        constraints=[
            SimplexConstraint(coefficients=[1.0], operator="<=", rhs=-5.0),
        ],
    )
    assert _select_solver(problem) is big_m


def test_router_executes_manufacturing_problem():
    """solve_lp should return the correct result for the manufacturing problem."""
    arguments = {
        "objective": "max",
        "objective_coefficients": [80000.0, 50000.0],
        "constraints": [
            {"coefficients": [10.0, 5.0], "operator": "<=", "rhs": 600.0},
            {"coefficients": [4.0, 5.0], "operator": "<=", "rhs": 300.0},
            {"coefficients": [6.0, 3.0], "operator": "<=", "rhs": 360.0},
            {"coefficients": [1.0, 0.0], "operator": ">=", "rhs": 20.0},
            {"coefficients": [-2.0, 1.0], "operator": "<=", "rhs": 0.0},
        ],
    }

    result = execute(arguments)

    assert result["tool"] == "solve_lp"
    assert result["solver"] == "big_m_solve"
    assert result["status"] == "optimal"
    assert result["solution"]["x1"] == pytest.approx(50.0)
    assert result["solution"]["x2"] == pytest.approx(20.0)
    assert result["objective_value"] == pytest.approx(5000000.0)
