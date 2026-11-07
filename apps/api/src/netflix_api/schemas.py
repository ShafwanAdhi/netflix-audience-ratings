"""Public HTTP contract, exported to TypeScript through OpenAPI."""

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class Duration(BaseModel):
    model_config = ConfigDict(extra="forbid")
    value: int = Field(gt=0, strict=True)
    unit: Literal["minutes", "seasons"]


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    content_type: Literal["Movie", "TV Show"]
    release_year: int = Field(ge=1, le=9999, strict=True)
    countries: list[str] = Field(max_length=30)
    genres: list[str] = Field(min_length=1, max_length=50)
    duration: Duration
    director: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def consistent_units(self):
        if (self.content_type == "Movie") != (self.duration.unit == "minutes"):
            raise ValueError("Use minutes for Movies and seasons for TV Shows")
        for value in self.countries + self.genres:
            if not value.strip() or len(value) > 200 or "," in value:
                raise ValueError("Use non-empty individual category tokens of at most 200 characters")
        self.countries = list(dict.fromkeys(v.strip() for v in self.countries))
        self.genres = list(dict.fromkeys(v.strip() for v in self.genres))
        return self


class Probability(BaseModel):
    label: str
    probability: float


class PredictionResponse(BaseModel):
    label: str
    meaning: str
    probabilities: list[Probability]
    training_support: int
    warnings: list[str]
    model_id: str
    run_id: str


class Example(PredictionRequest):
    title: str
    split: str


class Metadata(BaseModel):
    run_id: str
    model_id: str
    uses_director: bool
    labels: list[str]
    countries: list[str]
    genres: list[str]
    training_year_range: list[int]
    training_support: dict[str, int]
    examples: list[Example]
    meanings: dict[str, str]


class Task(BaseModel):
    id: int
    title: str
    status: Literal["ready", "not_ready", "planned"]


class Metrics(BaseModel):
    accuracy: float
    macro_f1: float
    weighted_f1: float


class ModelResult(Metrics):
    model: str
    cv_macro_f1: float


class ClassResult(BaseModel):
    label: str
    precision: float
    recall: float
    f1_score: float = Field(alias="f1-score")
    support: float
    predicted_count: int


class Evaluation(BaseModel):
    run_id: str
    model_id: str
    evaluated_at: str
    train_rows: int
    test_rows: int
    labels: list[str]
    metrics: Metrics
    comparison: list[ModelResult]
    experiments: list[dict[str, Any]]
    per_class: list[ClassResult]
    confusion_matrix: list[list[int]]
    normalized_confusion_matrix: list[list[float]]
    by_type: list[dict[str, Any]]
    frequent_errors: list[dict[str, Any]]
    examples: dict[str, list[dict[str, Any]]]


class Overview(BaseModel):
    rows: int
    cleaned_rows: int
    columns: list[str]
    rating_counts: dict[str, int]
    type_counts: dict[str, int]
    source_sha256: str
    semantic_missing_values: dict[str, dict[str, Any]]
    date_added_max: str
    release_year_min: int
    release_year_max: int
    duplicate_rows_removed: int
    repeated_entities: int
