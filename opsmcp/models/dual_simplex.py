from pydantic import BaseModel, StringConstraints
from typing import Literal, Annotated


VariableName = Annotated[str, StringConstraints(pattern=r"^[xsa][1-9][0-9]*$")]


class DualSimplexConstraint(BaseModel):
    coefficients: list[float]
    operator: Literal["<=", ">=", "="]
    rhs: float


class DualSimplexProblem(BaseModel):
    objective: Literal["max", "min"]
    objective_coefficients: list[float]
    constraints: list[DualSimplexConstraint]


class DualSimplexTableau(BaseModel):
    """
    Separate tableau model for the dual simplex algorithm.
    Same structure as SimplexTableau but completely independent.
    """
    iteration: int
    matrix: list[list[float]]
    basis: list[VariableName]
    column_variables: list[VariableName]


class DualSimplexIteration(BaseModel):
    """
    Represents one iteration of the dual simplex algorithm.
    Pivot fields are None when the iteration represents a terminal status
    (optimal, infeasible, or dual_simplex_failed).
    """
    entering_variable: VariableName | None = None
    leaving_variable: VariableName | None = None
    pivot_row: int | None = None          # 0-based index into constraint rows
    pivot_column: int | None = None       # 0-based index into column_variables
    tableau: DualSimplexTableau
    status: Literal["optimal", "infeasible", "dual_simplex_failed", "continue"]
