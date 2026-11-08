import json
import subprocess
from pathlib import Path

from fastapi.testclient import TestClient
from netflix_api.main import create_app

base = Path(__file__).resolve().parents[1]
project = json.loads((base / "project.json").read_text(encoding="utf-8"))
with TestClient(create_app()) as client:
    health = client.get("/api/v1/health").json()
    assert health["artifact_ready"], health
    dataset = client.get("/api/v1/dataset")
    assert dataset.status_code == 200, dataset.text
    assert dataset.json()["run_id"] == health["run_id"]
    assert len(client.get("/api/v1/tasks").json()) == 1
assert (base / "apps/web/dist/index.html").is_file(), "Build the frontend first"
subprocess.run(["git", "rev-parse", "--show-toplevel"], cwd=base, check=True)
print(f"{project['title']} verified; active run {health['run_id']}")
