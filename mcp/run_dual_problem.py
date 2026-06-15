"""
Example runner for the Dual Simplex algorithm.

Usage:
    /path/to/venv/bin/python mcp/run_dual_problem.py

This demonstrates the full dual simplex solve trace for problem4.json:
    min 2x1 + 3x2
    s.t. x1 + x2 >= 4
         x1 + 2x2 >= 6
"""

import json

from mcp.models.simplex import SimplexProblem
from mcp.core.dual_simplex import solve_dual_simplex
from mcp.utils.dual_formatting import format_dual_tableau


def main():
    # Load and parse the problem
    with open("./mcp/tests/problem6.json", "r") as f:
        problem_data = json.load(f)

    problem = SimplexProblem(**problem_data)
    iterations = solve_dual_simplex(problem)

    print("=" * 60)
    print("DUAL SIMPLEX SOLVER EXAMPLE")
    print("=" * 60)
    print(f"Problem: {problem.objective} Z = ", end="")
    terms = []
    for i, c in enumerate(problem.objective_coefficients):
        terms.append(f"{c}x{i + 1}")
    print(" + ".join(terms))
    print("Constraints:")
    for i, constraint in enumerate(problem.constraints):
        lhs_terms = []
        for j, coeff in enumerate(constraint.coefficients):
            lhs_terms.append(f"{coeff}x{j + 1}")
        print(f"  {' + '.join(lhs_terms)} {constraint.operator} {constraint.rhs}")
    print()

    for i, iteration in enumerate(iterations):
        print(f"\n{'=' * 60}")
        print(f"ITERATION RESULT #{i}  |  Status: {iteration.status.upper()}")
        print(f"{'=' * 60}")
        print(format_dual_tableau(iteration.tableau))

        if iteration.entering_variable:
            print(f"\nPivot: row={iteration.pivot_row}, col={iteration.pivot_column}")
            print(f"Entering variable: {iteration.entering_variable}")
            print(f"Leaving variable:  {iteration.leaving_variable}")

    # Summary
    final = iterations[-1]
    print(f"\n{'=' * 60}")
    print("FINAL RESULT")
    print(f"{'=' * 60}")
    print(f"Status: {final.status.upper()}")

    if final.status == "optimal":
        print("\nOptimal Solution:")
        for j, var in enumerate(final.tableau.basis):
            val = final.tableau.matrix[j + 1][-1]
            print(f"  {var} = {val:g}")

        # matrix[0][-1] stores -Z for the converted max problem
        converted_z = -final.tableau.matrix[0][-1]
        print(f"\nConverted Max Z = {converted_z:g}")

        # For the original min problem, flip the sign back
        if problem.objective == "min":
            original_z = -converted_z
            print(f"Original Min Z = {original_z:g}")


if __name__ == "__main__":
    main()
