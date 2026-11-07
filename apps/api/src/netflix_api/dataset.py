"""Typed, run-bound dataset documentation and actual preparation evidence."""

import json

from fastapi import APIRouter, HTTPException, Request
from netflix_ml.shared.io import root
from pydantic import BaseModel


class Variable(BaseModel):
    name: str
    role: str
    reason: str
    treatment: str


class Decision(BaseModel):
    action: str
    reason: str
    evidence: str
    limitation: str


class Stage(BaseModel):
    name: str
    input_rows: int
    output_rows: int
    reason: str


class Segment(BaseModel):
    name: str
    rows: int


class Partition(BaseModel):
    name: str
    rows: int
    purpose: str
    segments: list[Segment]
    metrics: dict[str, float | None]


class DatasetInfo(BaseModel):
    task_id: int
    title: str
    run_id: str
    source_file: str
    source_sha256: str
    snapshot_date: str
    raw_rows: int
    variables: list[Variable]
    decisions: list[Decision]
    stages: list[Stage]
    partitions: list[Partition]
    split_strategy: str
    limitations: list[str]


router = APIRouter(tags=["Dataset"])


@router.get("/api/v1/dataset", response_model=DatasetInfo)
def dataset(request: Request):
    try:
        profile = json.loads((root() / "reports/dataset-profile.json").read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise HTTPException(503, detail="Dataset evidence is unavailable") from exc
    service = getattr(request.app.state, "active_service", None)
    if service is None or profile["run_id"] != service.metadata["run_id"]:
        raise HTTPException(
            503,
            detail="Dataset evidence does not match the active artifact run. Rebuild the dataset profile.",
        )
    return profile
