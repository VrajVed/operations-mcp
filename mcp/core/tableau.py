

from mcp.models.simplex import SimplexIteration, SimplexTableau
from mcp.core.pivot import apply_pivot_operation


def solve_simplex_tableau(tableau: SimplexTableau) -> SimplexIteration:
    

    basis_coefficients = []

    # finding the coeffients of the basic variable

    for basis_var in tableau.basis:
        
        
        column_index = tableau.column_variables.index(basis_var)

        basis_coefficient = tableau.matrix[0][column_index] # first row ka wrt whichever column
        basis_coefficients.append(basis_coefficient)



    row_Cj = tableau.matrix[0][:-1]  # Exclude RHS

    # Calculating Zj for each column

    row_Zj = []
    for every_column in range(len(tableau.column_variables)):

        #initialy
        Zj = 0.0
        
        for i, basis_var in enumerate(tableau.basis):

            coefficient = tableau.matrix[i + 1][every_column]  # +1 to skip objective row
            Zj += basis_coefficients[i] * coefficient
        row_Zj.append(Zj)

# compute Cj - Zj for each column

    row_Cj_minus_Zj = []

    for cj, zj in zip(row_Cj, row_Zj):

        row_Cj_minus_Zj.append(cj - zj)

    # Determining the entering variable (most positive Cj - Zj) pivot column index

    pivot_column_index = row_Cj_minus_Zj.index(max(row_Cj_minus_Zj))

    entering_variable = tableau.column_variables[pivot_column_index]

    # Determine the leaving variable using ratio

    ratios = []

    for i in range(1, len(tableau.matrix)):  # Skip objective row

        if tableau.matrix[i][pivot_column_index] > 0: # this is not != because if negative or zero we dont use it so ignore negative :(
            ratio = tableau.matrix[i][-1] / tableau.matrix[i][pivot_column_index]

        else:

            ratio = float('inf')
        ratios.append(ratio)

    # Determine the leaving variable (minimum ratio) pivot row index 

    min_ratio = min(ratios)
    if min_ratio == float('inf'):
        raise ValueError("The problem is unbounded (no positive pivot elements found in the pivot column).")

    pivot_row_index = ratios.index(min_ratio)
    leaving_variable = tableau.basis[pivot_row_index]

    # Prepare next iteration tableau using shared pivot operation
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
        tableau=new_tableau
    )   