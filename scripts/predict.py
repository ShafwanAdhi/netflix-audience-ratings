import argparse
import json
from pathlib import Path

from netflix_api.schemas import PredictionRequest
from netflix_ml.tasks.task_03.predict import load_active

parser = argparse.ArgumentParser()
parser.add_argument("--input", type=Path, required=True)
args = parser.parse_args()
request = PredictionRequest.model_validate_json(args.input.read_text(encoding="utf-8"))
print(json.dumps(load_active().predict(request.model_dump()), indent=2))
