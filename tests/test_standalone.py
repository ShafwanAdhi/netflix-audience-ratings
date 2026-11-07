import json

from fastapi.testclient import TestClient
from netflix_api.main import create_app
from netflix_ml.shared.io import root


def test_single_task_and_dataset_evidence():
    project = json.loads((root() / "project.json").read_text(encoding="utf-8"))
    task = project["task_id"]
    assert {p.name for p in (root() / "packages/ml/src/netflix_ml/tasks").glob("task_*")} == {
        f"task_{task:02d}"
    }
    with TestClient(create_app()) as client:
        health = client.get("/api/v1/health").json()
        assert health["artifact_ready"]
        assert [t["id"] for t in client.get("/api/v1/tasks").json()] == [task]
        response = client.get("/api/v1/dataset")
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["run_id"] == health["run_id"]
        for partition in data["partitions"]:
            if partition["segments"]:
                assert sum(s["rows"] for s in partition["segments"]) == partition["rows"]
        for other in {3, 4, 5, 6} - {task}:
            assert client.get(f"/api/v1/tasks/{other}/results").status_code == 404
        client.app.state.active_service.metadata = {
            **client.app.state.active_service.metadata,
            "run_id": "stale",
        }
        assert client.get("/api/v1/dataset").status_code == 503


def test_dataset_unavailable_without_artifact():
    with TestClient(create_app(load_model=False)) as client:
        assert not client.get("/api/v1/health").json()["artifact_ready"]
        assert client.get("/api/v1/dataset").status_code == 503
