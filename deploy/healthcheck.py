"""Container readiness requires matching task, artifact and dataset run IDs."""

import json
import os
from urllib.request import urlopen

with urlopen("http://127.0.0.1:8000/api/v1/health", timeout=4) as response:
    health = json.load(response)
assert health["artifact_ready"] and health["task_id"] == int(os.environ["NETFLIX_TASK_ID"])
with urlopen("http://127.0.0.1:8000/api/v1/dataset", timeout=4) as response:
    dataset = json.load(response)
assert dataset["task_id"] == health["task_id"] and dataset["run_id"] == health["run_id"]

with urlopen("http://127.0.0.1:8000/api/v1/tasks/3/overview", timeout=4) as response:
    overview = json.load(response)
assert overview["rows"] > 0 and overview["cleaned_rows"] > 0
