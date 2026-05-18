

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

    # Determine entering variable (most positive Cj - Zj)

    pivot_column = max(row_Cj_minus_Zj)