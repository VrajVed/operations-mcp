from pydantic import BaseModel, StringConstraints
from typing import Literal, Annotated


VariableName = Annotated[str, StringConstraints(pattern=r"^[xsa][1-9][0-9]*$")]


class SimplexConstraint(BaseModel):
    coefficients: list[float]
    operator: Literal["<=", ">=", "="]
    rhs: float


class SimplexProblem(BaseModel):
    objective: Literal["max", "min"]
    objective_coefficients: list[float]
    constraints: list[SimplexConstraint]


class SimplexTableau(BaseModel):
    iteration: int
    matrix: list[list[float]]
    basis: list[VariableName]
    column_variables: list[VariableName]


class SimplexIteration(BaseModel):
    """
    Represents one iteration of the primal simplex algorithm.

    Pivot fields are None when the iteration represents a terminal status
    (optimal or unbounded).
    """
    entering_variable: VariableName | None = None
    leaving_variable: VariableName | None = None
    pivot_row: int | None = None
    pivot_column: int | None = None
    tableau: SimplexTableau
    status: Literal["optimal", "unbounded", "continue"]

