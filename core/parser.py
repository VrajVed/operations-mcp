from models.simplex import SimplexProblem, SimplexTableau





def parse_simplex(problem: SimplexProblem) -> SimplexTableau:
    
    # if the objective is minimization multiply by -1 to make maximization

    matrix = []

    if problem.objective == "min":
        objective_coefficients = [-c for c in problem.objective_coefficients]

        # convert the constraints to <= by multiplaying by -1 

        for constraint in problem.constraints:
            if constraint.operator == ">=":

                # lhs
                constraint.coefficients = [-c for c in constraint.coefficients]
                # rhs (solution)
                constraint.rhs = -constraint.rhs

    else:
        objective_coefficients = problem.objective_coefficients

    number_of_constraints = len(problem.constraints)
    number_of_variables = len(objective_coefficients)


    # Add respective number of slack variables to objective function
    for i in range(number_of_constraints):

        objective_coefficients.append(0.0)

    matrix.append(objective_coefficients + [0.0])  # objective function row


    # Add respective number of slack variables to constraints
    for i, constraint in enumerate(problem.constraints):

        # create slack matrix
        slack_vector = [0.0] * number_of_constraints
        slack_vector[i] = 1.0

        constraint.coefficients += slack_vector

        matrix_row = constraint.coefficients + [constraint.rhs]
        matrix.append(matrix_row)

    # create tableau
    tableau = SimplexTableau(
        iteration=0,
        matrix=matrix,
        basis=[f"s{i+1}" for i in range(number_of_constraints)],
        column_variables=[f"x{j+1}" for j in range(number_of_variables)] + [f"s{i+1}" for i in range(number_of_constraints)],
    )

    return tableau