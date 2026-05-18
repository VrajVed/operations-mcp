import json

from core.parser import parse_simplex
from models.simplex import SimplexProblem
from utils.formatting import format_tableau

with open("./tests/problem1.json", "r") as f:
    problem_data = json.load(f)

problem = SimplexProblem(**problem_data)

tableau = parse_simplex(problem)

print(format_tableau(tableau))