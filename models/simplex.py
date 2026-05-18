from pydantic import BaseModel, ConfigDict
from typing import Literal

class SimplexConstraints(BaseModel):
    coefficients: list[float]
    operator: Literal["<=", ">=", "="]
    rhs: float



class SimplexProblem(BaseModel):
    objective: Literal["max", "min"]
    objective_coefficients: list[float]
    constraints: list[SimplexConstraints]


class SimplexIteration(BaseModel):
    iteration: int
    basis: list[str]
    entering_variable: str
    leaving_variable: str
    pivot_row: int
    pivot_column: int


# problem = SimplexProblem(
#     objective="max",
#     objective_coefficients=[3, 2],
#     constraints=[
#         SimplexConstraints(
#             coefficients=[1, 1],
#             operator="<=",
#             rhs=4
#         ),
#         SimplexConstraints(
#             coefficients=[2, 1],
#             operator="<=",
#             rhs=6
#         )
#     ]
# )

# iteration = SimplexIteration(
#     iteration=1,
#     basis=[1, 2],
#     entering_variable="x1",
#     leaving_variable="x2",
#     pivot_element=[0, 0]
# )

print(problem.model_dump_json(indent=2))
print(iteration.model_dump_json(indent=2))
