"""Deterministic source validation, deduplication and frozen split preparation."""

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedGroupKFold

from netflix_ml.shared.io import digest, read_json, root, write_json

LABELS = [
    "G",
    "NC-17",
    "NR",
    "PG",
    "PG-13",
    "R",
    "TV-14",
    "TV-G",
    "TV-MA",
    "TV-PG",
    "TV-Y",
    "TV-Y7",
    "TV-Y7-FV",
    "UR",
]
COLUMNS = [
    "show_id",
    "type",
    "title",
    "director",
    "country",
    "date_added",
    "release_year",
    "rating",
    "duration",
    "listed_in",
]
MEANINGS = {
    "G": "General audiences",
    "NC-17": "Adults only (17 and under not admitted)",
    "NR": "Not rated",
    "PG": "Parental guidance suggested",
    "PG-13": "Parents strongly cautioned",
    "R": "Restricted",
    "TV-14": "Parents strongly cautioned",
    "TV-G": "General audience",
    "TV-MA": "Mature audience",
    "TV-PG": "Parental guidance suggested",
    "TV-Y": "All children",
    "TV-Y7": "Children age 7 and older",
    "TV-Y7-FV": "Children 7 and older; fantasy violence",
    "UR": "Unrated",
}


def validate(frame: pd.DataFrame) -> None:
    if set(frame.columns) != set(COLUMNS):
        raise ValueError("Dataset does not match the ten-column contract")
    if frame.isna().any().any() or frame.show_id.duplicated().any():
        raise ValueError("Null cells or duplicate source IDs require review")
    if set(frame.rating) != set(LABELS) or not frame.type.isin(["Movie", "TV Show"]).all():
        raise ValueError("Unexpected target labels or content type")
    parts = frame.duration.str.extract(r"^(\d+) (min|Seasons?)$")
    if parts.isna().any().any() or (parts[0].astype(int) <= 0).any():
        raise ValueError("Invalid duration")
    if not ((frame.type == "Movie") == (parts[1] == "min")).all():
        raise ValueError("Duration unit does not match content type")
    pd.to_datetime(frame.date_added.str.strip(), errors="raise")


def prepare(source: Path) -> dict:
    base = root()
    config = read_json(base / "configs/task-03/experiment.json")
    if digest(source) != config["source_sha256"]:
        raise ValueError("Source hash changed; review the source and experiment configuration first")
    raw = base / "data/raw/Dataset.csv"
    raw.parent.mkdir(parents=True, exist_ok=True)
    if raw.exists() and digest(raw) != digest(source):
        raise ValueError("Refusing to overwrite a different immutable raw snapshot")
    if source.resolve() != raw.resolve():
        raw.write_bytes(source.read_bytes())
    frame = pd.read_csv(raw)
    validate(frame)
    original = len(frame)
    attrs = [c for c in COLUMNS if c != "show_id"]
    canonical = {}
    removed = []
    for row in frame.itertuples(index=False):
        key = tuple(getattr(row, c) for c in attrs)
        if key in canonical:
            removed.append({"removed_id": row.show_id, "retained_id": canonical[key]})
        else:
            canonical[key] = row.show_id
    frame = frame.drop_duplicates(attrs).copy()
    for column in ["type", "country", "director", "listed_in"]:
        frame[column] = frame[column].str.strip()
    # Review residual entity ambiguity rather than allowing accidental cross-split leakage.
    entity = frame.title.str.casefold().str.strip() + "|" + frame.type + "|" + frame.release_year.astype(str)
    frame["entity_key"] = entity
    repeated_entities = frame.loc[entity.duplicated(keep=False), ["show_id", "title", "rating", "entity_key"]]
    rng = np.random.default_rng(config["seed"])
    frame["split"] = "train"
    for label in LABELS:
        indices = frame.index[frame.rating == label].to_numpy()
        n = len(indices)
        if n < 3:
            raise ValueError(f"Insufficient support for {label}")
        count = min(max(round(config["test_fraction"] * n), 1), n - 2)
        # Reviewed repeated entities (including one conflicting label) stay in training.
        # Holdout class quotas are filled from singleton entities only.
        singletons = np.array([i for i in indices if not entity.duplicated(keep=False).loc[i]])
        frame.loc[rng.choice(singletons, count, replace=False), "split"] = "test"
    manifest = frame[["show_id", "entity_key", "rating", "split"]].copy()
    split_path = base / "data/splits/task-03/manifest.csv"
    split_path.parent.mkdir(parents=True, exist_ok=True)
    if split_path.exists():
        previous = pd.read_csv(split_path)
        if not previous.equals(manifest.reset_index(drop=True)):
            raise ValueError("Frozen manifest differs; use an explicitly versioned experiment")
    manifest.to_csv(split_path, index=False)
    train = frame.loc[frame.split == "train"].reset_index(drop=True)
    folds = []
    accepted_seeds = []
    candidate_seed = config["seed"]
    while len(accepted_seeds) < config["cv_repeats"]:
        cv = StratifiedGroupKFold(n_splits=2, shuffle=True, random_state=candidate_seed)
        candidate = list(cv.split(train, train.rating, groups=train.entity_key))
        # A candidate must contain every label on both sides; this checks support only,
        # never a model score. Persist accepted seeds and all fold memberships.
        if all(
            set(train.iloc[a].rating) == set(LABELS) and set(train.iloc[b].rating) == set(LABELS)
            for a, b in candidate
        ):
            repeat = len(accepted_seeds)
            accepted_seeds.append(candidate_seed)
            for part, (fit_idx, val_idx) in enumerate(candidate):
                for role, indices in [("fit", fit_idx), ("validation", val_idx)]:
                    folds.extend(
                        {"fold": repeat * 2 + part, "role": role, "show_id": train.iloc[i].show_id}
                        for i in indices
                    )
        candidate_seed += 1
        if candidate_seed > config["seed"] + 1000:
            raise ValueError("Unable to form group-disjoint folds with full class coverage")
    pd.DataFrame(folds).to_csv(split_path.with_name("cv_manifest.csv"), index=False)
    processed = base / "data/processed/task-03/cleaned.csv"
    processed.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(processed, index=False)
    dates = pd.to_datetime(frame.date_added.str.strip())
    log = {
        "source_sha256": digest(raw),
        "raw_rows": original,
        "cleaned_rows": len(frame),
        "duplicate_mapping": removed,
        "train_rows": len(train),
        "test_rows": int((frame.split == "test").sum()),
        "split_sha256": digest(split_path),
        "cv_sha256": digest(split_path.with_name("cv_manifest.csv")),
        "date_anomalies": frame.loc[dates.dt.year < frame.release_year, "show_id"].tolist(),
        "entity_review": "Four reviewed repeated entities remain training-only; conflicting ratings preserved",
        "reviewed_entities": repeated_entities.to_dict("records"),
        "cv_seeds": accepted_seeds,
        "cv_protocol": "Three repeated stratified group-disjoint 2-fold partitions; full-label support checked",
        "label_support": pd.crosstab(frame.rating, frame.split).to_dict(),
    }
    write_json(base / "reports/task-03/cleaning_log.json", log)
    return log
