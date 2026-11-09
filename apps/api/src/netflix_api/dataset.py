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


class ProvenanceEvidence(BaseModel):
    url: str
    finding: str


class Provenance(BaseModel):
    origin: str
    source_sha256: str
    raw_rows: int
    raw_columns: int
    release_year_min: int
    release_year_max: int
    date_added_min: str
    date_added_max: str
    acquired_at: str | None
    upstream_url: str | None
    upstream_version: str | None
    license: str | None
    verification_status: str
    redistribution_status: str
    reviewed_at: str
    evidence: list[ProvenanceEvidence]
    inference_reproduction: str
    training_reproduction: str
    limitations: list[str]


class DatasetInfo(BaseModel):
    provenance: Provenance
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
    provenance = profile.get("provenance", {})
    if provenance.get("source_sha256") != service.metadata["source_sha256"]:
        raise HTTPException(503, detail="Dataset provenance does not match the active source")
    return profile
