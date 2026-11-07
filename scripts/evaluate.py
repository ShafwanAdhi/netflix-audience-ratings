import argparse

from netflix_ml.shared.io import read_json, root
from netflix_ml.tasks.task_03.evaluation import evaluate

parser = argparse.ArgumentParser()
parser.add_argument("--run-id")
args = parser.parse_args()
evaluate(args.run_id or read_json(root() / "artifacts/task-03/latest_training.json")["run_id"])
