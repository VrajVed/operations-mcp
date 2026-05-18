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
    entering_variable: VariableName
    leaving_variable: VariableName
    pivot_row: int
    pivot_column: int
    tableau: SimplexTableau

