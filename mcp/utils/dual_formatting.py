# THIS FILE IS AI GENERATED

from mcp.models.dual_simplex import DualSimplexTableau

def format_dual_tableau(tableau: DualSimplexTableau) -> str:
    """
    Constructs a beautiful Unicode console table representing a Dual Simplex Tableau.
    
    Columns: Basis | column_variables | RHS
    Rows: Z (Objective row), followed by basis rows (Constraints), Zj row, and Cj-Zj row
    """
    # 1. Compute basis coefficients (following core/dual_simplex.py)
    basis_coefficients = []
    for basis_var in tableau.basis:
        column_index = tableau.column_variables.index(basis_var)
        basis_coefficient = tableau.matrix[0][column_index]
        basis_coefficients.append(basis_coefficient)

    # 2. Compute Zj row
    row_Zj = []
    for every_column in range(len(tableau.column_variables)):
        Zj = 0.0
        for i, basis_var in enumerate(tableau.basis):
            coefficient = tableau.matrix[i + 1][every_column]
            Zj += basis_coefficients[i] * coefficient
        row_Zj.append(Zj)

    # 3. Compute Cj - Zj row
    row_Cj = tableau.matrix[0][:-1]
    row_Cj_minus_Zj = [cj - zj for cj, zj in zip(row_Cj, row_Zj)]
    
    # Check for dual simplex optimality: all Cj-Zj <= 0 AND all RHS >= 0
    rhs_values = [tableau.matrix[i][-1] for i in range(1, len(tableau.matrix))]
    optimal = all(c <= 0 for c in row_Cj_minus_Zj) and all(r >= 0 for r in rhs_values)

    # Column headers
    headers = ["Bv"] + tableau.column_variables + ["RHS"]
    
    # Format rows to strings
    rows = []
    
    # Objective row (Z)
    obj_row = ["Cj"] + [f"{val:g}" if isinstance(val, (int, float)) else str(val) for val in tableau.matrix[0]]
    rows.append(obj_row)
    
    # Constraint rows
    for i, basis_var in enumerate(tableau.basis):
        matrix_row = tableau.matrix[i + 1]
        constraint_row = [basis_var] + [f"{val:g}" if isinstance(val, (int, float)) else str(val) for val in matrix_row]
        rows.append(constraint_row)

    # Zj row
    obj_val = -tableau.matrix[0][-1]
    zj_row = ["Zj"] + [f"{val:g}" for val in row_Zj] + [f"{obj_val:g}"]
    rows.append(zj_row)

    # Cj-Zj row
    cj_zj_row = ["Cj-Zj"] + [f"{val:g}" for val in row_Cj_minus_Zj] + [""]
    rows.append(cj_zj_row)
        
    # Determine the width of each column for proper padding and alignment
    col_widths = []
    for col_idx in range(len(headers)):
        max_len = len(headers[col_idx])
        for row in rows:
            max_len = max(max_len, len(row[col_idx]))
        col_widths.append(max_len + 4)  # 4 spaces of padding
        
    # Helper to generate borders
    def make_border(left, middle, right, joint):
        parts = [middle * width for width in col_widths]
        return left + joint.join(parts) + right

    # Helper to format a single row
    def make_row(row_data):
        parts = []
        for col_idx, (val, width) in enumerate(zip(row_data, col_widths)):
            # Center string fields (like headers, Basis, Z, s1, x1, Zj, Cj-Zj)
            # Right-align numerical coefficients
            is_header_or_basis = (
                val in ["Basis", "RHS", "Z", "Zj", "Cj-Zj"] or 
                val in tableau.basis or 
                val in tableau.column_variables or
                col_idx == 0
            )
            if is_header_or_basis:
                parts.append(val.center(width))
            else:
                parts.append(val.rjust(width - 2) + "  ")
        return "│" + "│".join(parts) + "│"

    # Build the table with Unicode box-drawing characters
    top_border = make_border("┌", "─", "┐", "┬")
    header_row = make_row(headers)
    sep_border = make_border("├", "─", "┤", "┼")
    bottom_border = make_border("└", "─", "┘", "┴")
    
    table_lines = [
        f"Iteration: {tableau.iteration}",
        top_border,
        make_row(rows[0]),  # Objective Row (Z)
        sep_border,
        header_row,         # Coefficient Row / Column Headers
        sep_border
    ]
    
    # Constraint Rows (rows[1] to rows[1 + len(tableau.basis)])
    for row in rows[1:-2]:
        table_lines.append(make_row(row))
        
    table_lines.append(sep_border)

    # Zj Row
    table_lines.append(make_row(rows[-2]))
    table_lines.append(sep_border)

    # Cj-Zj Row
    table_lines.append(make_row(rows[-1]))
    table_lines.append(bottom_border)

    if optimal:
        table_lines.append("\nOptimal Solution Reached:")
        for i, var in enumerate(tableau.basis):
            val = tableau.matrix[i + 1][-1]
            table_lines.append(f"  {var} = {val:g}")
        table_lines.append(f"Optimal Objective Value (Z): {obj_val:g}")
    
    return "\n".join(table_lines)
