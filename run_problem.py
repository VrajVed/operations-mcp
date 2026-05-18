# AI GENERATED TEST FILE


from models.simplex import SimplexProblem, SimplexConstraint
from core.parser import parse_simplex
from utils.formatting import format_tableau

def show_tableau():
    # 1. Define the constraints for the problem:
    # -x1 + 2x2 + x3 <= 4
    # 2x2 - 1.5x3 <= 1
    # x1 - 3x2 + 2x3 <= 3
    c1 = SimplexConstraint(coefficients=[-1.0, 2.0, 1.0], operator="<=", rhs=4.0)
    c2 = SimplexConstraint(coefficients=[0.0, 2.0, -1.5], operator="<=", rhs=1.0)
    c3 = SimplexConstraint(coefficients=[1.0, -3.0, 2.0], operator="<=", rhs=3.0)

    # 2. Define the maximization problem:
    # Maximize Z = 3x1 + x2 + 3x3
    problem = SimplexProblem(
        objective="max",
        objective_coefficients=[3.0, 1.0, 3.0],
        constraints=[c1, c2, c3]
    )

    # 3. Parse into SimplexTableau
    tableau = parse_simplex(problem)

    # 4. Print the raw parsed Pydantic tableau model
    print("=== RAW PARSED TABLEAU OBJECT ===")
    print(tableau)
    print()

    # 5. Print the formatted tableau table
    print("=== VISUAL TABLEAU REPRESENTATION ===")
    print(format_tableau(tableau))

if __name__ == "__main__":
    show_tableau()
