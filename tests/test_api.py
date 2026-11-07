"""API validation, startup readiness and pipeline parity."""

import numpy as np
from fastapi.testclient import TestClient
from netflix_api.main import create_app
from netflix_ml.tasks.task_03.predict import load_active


def test_missing_artifacts_are_explicit():
    with TestClient(create_app(load_model=False)) as client:
        assert client.get("/api/v1/health").json()["artifact_ready"] is False
        assert client.get("/api/v1/tasks/3/metadata").status_code == 503
        assert client.get("/api/v1/tasks").json()[0]["status"] == "not_ready"


def test_api_prediction_parity_and_validation():
    predictor = load_active()
    with TestClient(create_app()) as client:
        metadata = client.get("/api/v1/tasks/3/metadata").json()
        evaluation = client.get("/api/v1/tasks/3/evaluation").json()
        assert metadata["run_id"] == evaluation["run_id"]
        assert sum(map(sum, evaluation["confusion_matrix"])) == evaluation["test_rows"]
        assert len(evaluation["per_class"]) == 14
        for example in metadata["examples"]:
            body = {k: v for k, v in example.items() if k not in ["title", "split"]}
            response = client.post("/api/v1/tasks/3/predict", json=body)
            assert response.status_code == 200, response.text
            assert response.json() == predictor.predict(body)
            probs = response.json()["probabilities"]
            assert np.all(np.diff([p["probability"] for p in probs]) <= 0)
            body["duration"]["unit"] = "seasons" if body["content_type"] == "Movie" else "minutes"
            invalid = client.post("/api/v1/tasks/3/predict", json=body)
            assert invalid.status_code == 422
            assert invalid.json()["field_errors"]
        body = {
            "content_type": "Movie",
            "release_year": 2026,
            "countries": ["Neverland"],
            "genres": ["Unseen genre"],
            "duration": {"value": 95, "unit": "minutes"},
        }
        response = client.post("/api/v1/tasks/3/predict", json=body)
        assert response.status_code == 200
        assert len(response.json()["warnings"]) >= 3
        body["duration"]["value"] = 0
        assert client.post("/api/v1/tasks/3/predict", json=body).status_code == 422
