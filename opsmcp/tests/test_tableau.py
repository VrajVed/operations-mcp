import pytest
from opsmcp.core.parser import parse_simplex
from opsmcp.models.simplex import SimplexProblem, SimplexConstraint
from opsmcp.core.tableau import solve_simplex_tableau

def test_solve_problem3():
    # problem3.json:
    # max 4x1 + 3x2 + 5x3
    # s.t.
    # 2x1 + x2 + x3 <= 10
    # x1 + 3x2 + 2x3 <= 15
    # 2x1 + 2x2 + 3x3 <= 18
    problem = SimplexProblem(
        objective="max",
        objective_coefficients=[4.0, 3.0, 5.0],
        constraints=[
            SimplexConstraint(coefficients=[2.0, 1.0, 1.0], operator="<=", rhs=10.0),
            SimplexConstraint(coefficients=[1.0, 3.0, 2.0], operator="<=", rhs=15.0),
            SimplexConstraint(coefficients=[2.0, 2.0, 3.0], operator="<=", rhs=18.0)
        ]
    )
    tableau = parse_simplex(problem)
    
    # Store initial state to check for mutations
    import copy
    initial_matrix = copy.deepcopy(tableau.matrix)
    initial_basis = list(tableau.basis)
    
    current_tableau = tableau
    iterations = []
    
    while True:
        # Calculate Cj - Zj to check for optimality
        basis_coefficients = []
        for basis_var in current_tableau.basis:
            column_index = current_tableau.column_variables.index(basis_var)
            basis_coefficient = current_tableau.matrix[0][column_index]
            basis_coefficients.append(basis_coefficient)

        row_Cj = current_tableau.matrix[0][:-1]
        row_Zj = []
        for every_column in range(len(current_tableau.column_variables)):
            Zj = 0.0
            for i, basis_var in enumerate(current_tableau.basis):
                coefficient = current_tableau.matrix[i + 1][every_column]
                Zj += basis_coefficients[i] * coefficient
            row_Zj.append(Zj)

        row_Cj_minus_Zj = [cj - zj for cj, zj in zip(row_Cj, row_Zj)]

        if max(row_Cj_minus_Zj) <= 0:
            break

        iteration = solve_simplex_tableau(current_tableau)
        iterations.append(iteration)
        current_tableau = iteration.tableau
        
    # Check that the original tableau was not mutated
    assert tableau.matrix == initial_matrix
    assert tableau.basis == initial_basis

    # Check the optimal solution
    # The optimal basis should be x1, s2, x3
    assert "x1" in current_tableau.basis
    assert "x3" in current_tableau.basis
    assert "s2" in current_tableau.basis
    
    # Check objective value
    # Optimal value should be 32.0 (stored as -32.0 in matrix[0][-1])
    assert current_tableau.matrix[0][-1] == -32.0


def test_unbounded_problem():
    # max 2x1 + x2
    # s.t.
    # x1 - x2 <= 4
    problem = SimplexProblem(
        objective="max",
        objective_coefficients=[2.0, 1.0],
        constraints=[
            SimplexConstraint(coefficients=[1.0, -1.0], operator="<=", rhs=4.0)
        ]
    )
    tableau = parse_simplex(problem)
    
    # Iteration 1:
    # Cj-Zj row: x1 has Cj-Zj = 2, x2 has 1
    # Pivot column index 0 (x1)
    # Ratio: 4 / 1 = 4. Pivot row index 0.
    # basis becomes ['x1']
    iteration1 = solve_simplex_tableau(tableau)
    tab1 = iteration1.tableau
    
    # In tab1:
    # basis: ['x1']
    # x1 row: x1 - x2 + s1 = 4 => x1 = 4 + x2 - s1
    # row 1 coefficients: [1.0, -1.0, 1.0] and RHS = 4.0
    # Let's check Cj - Zj for tab1:
    # basis_coefficients = [2.0]
    # Zj for x1: 2.0 * 1 = 2.0. Cj-Zj = 2.0 - 2.0 = 0
    # Zj for x2: 2.0 * -1 = -2.0. Cj-Zj = 1.0 - (-2.0) = 3.0
    # Zj for s1: 2.0 * 1 = 2.0. Cj-Zj = 0.0 - 2.0 = -2.0
    # Max Cj-Zj is 3.0 for x2 (pivot column index 1).
    # Pivot column coefficients in constraints: row 1 has -1.0.
    # Since the pivot column coefficient is -1.0 (<= 0), there are no positive elements.
    # Solving this iteration should raise a ValueError due to unboundedness.
    with pytest.raises(ValueError, match="unbounded"):
        solve_simplex_tableau(tab1)
