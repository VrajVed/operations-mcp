"""
Primal Simplex Parser

Builds the initial simplex tableau for the primal simplex algorithm.
"""

from mcp.models.simplex import SimplexProblem, SimplexTableau


def parse_simplex(problem: SimplexProblem) -> SimplexTableau:
    """
    Convert a linear programming problem into an initial primal simplex tableau.

    Steps:
      1. If the objective is minimization, multiply objective coefficients by -1
         to convert the problem into a maximization problem.
      2. For minimization problems only, convert any >= constraints into <=
         constraints by multiplying both sides by -1. This preserves the
         standard form expected by the primal simplex method.
      3. Add slack variables to convert <= inequalities into equalities and
         build the initial tableau.

    The input problem is never mutated; all modifications operate on copies.
    """
    number_of_constraints = len(problem.constraints)
    number_of_variables = len(problem.objective_coefficients)

    # Step 1: Convert minimization into maximization if necessary.
    if problem.objective == "min":
        objective_coefficients = [-c for c in problem.objective_coefficients]

        # Step 2: For minimization problems, convert >= constraints into <=
        # constraints by multiplying both sides by -1.
        processed_constraints = []
        for constraint in problem.constraints:
            coeffs = list(constraint.coefficients)
            rhs = constraint.rhs
            operator = constraint.operator

            if operator == ">=":
                coeffs = [-c for c in coeffs]
                rhs = -rhs
                operator = "<="

            processed_constraints.append((coeffs, operator, rhs))
    else:
        objective_coefficients = list(problem.objective_coefficients)
        processed_constraints = [
            (list(constraint.coefficients), constraint.operator, constraint.rhs)
            for constraint in problem.constraints
        ]

    # Step 3: Add slack variables to the objective function (coefficient = 0).
    for _ in range(number_of_constraints):
        objective_coefficients.append(0.0)

    matrix = []
    # Cj row: objective coefficients + RHS (initially 0).
    matrix.append(objective_coefficients + [0.0])

    # Constraint rows: decision variable coefficients + slack variables + RHS.
    for i, (coeffs, _operator, rhs) in enumerate(processed_constraints):
        slack_vector = [0.0] * number_of_constraints
        slack_vector[i] = 1.0
        row = coeffs + slack_vector + [rhs]
        matrix.append(row)

    basis = [f"s{i + 1}" for i in range(number_of_constraints)]
    column_variables = [f"x{j + 1}" for j in range(number_of_variables)] + [
        f"s{i + 1}" for i in range(number_of_constraints)
    ]

    return SimplexTableau(
        iteration=0,
        matrix=matrix,
        basis=basis,
        column_variables=column_variables,
    )
