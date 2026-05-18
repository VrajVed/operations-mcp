

from models.simplex import SimplexIteration, SimplexTableau


def solve_simplex_tableau( tableau: SimplexTableau) -> SimplexIteration:
    

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

    pivot_row_index = ratios.index(min(ratios))
    leaving_variable = tableau.row_variables[pivot_row_index]