import json

from core.parser import parse_simplex
from models.simplex import SimplexProblem
from core.tableau import solve_simplex_tableau
from utils.formatting import format_tableau

def main():
    # Load and parse the problem
    with open("./tests/problem4.json", "r") as f:
        problem_data = json.load(f)

    problem = SimplexProblem(**problem_data)
    tableau = parse_simplex(problem)

    current_tableau = tableau

    while True:
        # Print the current iteration's tableau
        print("\n" + "=" * 60)
        print(format_tableau(current_tableau))
        
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

        # If all Cj - Zj <= 0, we have reached the optimal solution
        if max(row_Cj_minus_Zj) <= 0:
            break

        # Solve for the next iteration
        iteration = solve_simplex_tableau(current_tableau)
        current_tableau = iteration.tableau

if __name__ == "__main__":
    main()