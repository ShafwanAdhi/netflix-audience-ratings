"""Immutable bundle validation and shared inference service."""

import os
from pathlib import Path

import joblib
import sklearn

from netflix_ml.shared.io import digest, read_json, root
from netflix_ml.tasks.task_03.data import MEANINGS
from netflix_ml.tasks.task_03.features import input_frame


class Predictor:
    def __init__(self, bundle: Path):
        checksums = read_json(bundle / "checksums.json")
        for name, expected in checksums.items():
            if Path(name).name != name or digest(bundle / name) != expected:
                raise ValueError("Artifact integrity check failed")
        self.metadata = read_json(bundle / "metadata.json")
        self.evaluation = read_json(bundle / "evaluation.json")
        self.selection = read_json(bundle / "selection.json")
        if self.metadata["run_id"] != self.evaluation["run_id"]:
            raise ValueError("Evaluation and model have different run identities")
        if self.metadata["sklearn"] != sklearn.__version__:
            raise ValueError("Model/scikit-learn versions differ; install locked dependencies")
        self.pipeline = joblib.load(bundle / "pipeline.joblib")
        if self.pipeline.classes_.tolist() != self.metadata["labels"]:
            raise ValueError("Class/probability order mismatch")

    def predict(self, request: dict) -> dict:
        probabilities = self.pipeline.predict_proba(input_frame(request))[0]
        ranked = sorted(zip(self.pipeline.classes_, probabilities), key=lambda item: -item[1])
        label = str(ranked[0][0])
        notes = []
        for field, vocabulary in [("countries", "countries"), ("genres", "genres")]:
            unknown = [v for v in request[field] if v not in self.metadata[vocabulary]]
            if unknown:
                notes.append(f"Unseen {field}: {', '.join(unknown)}. These tokens have no learned indicator.")
        low, high = self.metadata["training_year_range"]
        if not low <= request["release_year"] <= high:
            notes.append(f"Release year is outside the historical training range ({low}–{high}).")
        support = int(self.metadata["training_support"].get(label, 0))
        if support < 20:
            notes.append("Very limited training support for this label; interpret with particular care.")
        if (
            self.metadata["uses_director"]
            and (request.get("director") or "Not Given") not in self.metadata["directors"]
        ):
            notes.append("Director was not observed in training; its indicator is ignored.")
        return {
            "label": label,
            "meaning": MEANINGS[label],
            "probabilities": [{"label": str(a), "probability": float(p)} for a, p in ranked[:3]],
            "training_support": support,
            "warnings": notes,
            "model_id": self.metadata["model_id"],
            "run_id": self.metadata["run_id"],
        }


def load_active() -> Predictor:
    base = root()
    override = os.getenv("NETFLIX_LAB_BUNDLE")
    if override:
        bundle = Path(override)
        if not bundle.is_absolute():
            bundle = base / bundle
    else:
        pointer = read_json(base / "artifacts/task-03/active.json")
        if Path(pointer["run_id"]).name != pointer["run_id"]:
            raise ValueError("Invalid active run ID")
        bundle = base / "artifacts/task-03" / pointer["run_id"]
        if digest(bundle / "checksums.json") != pointer["checksums_sha256"]:
            raise ValueError("Active bundle manifest does not match")
    return Predictor(bundle)
