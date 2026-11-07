"""CV-only selection, bounded tuning and a frozen director ablation."""

import platform
import time
import warnings
from datetime import UTC, datetime

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score, make_scorer
from sklearn.model_selection import RandomizedSearchCV, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.tree import DecisionTreeClassifier

from netflix_ml.shared.io import digest, read_json, root, write_json
from netflix_ml.tasks.task_03.data import LABELS
from netflix_ml.tasks.task_03.features import CORE, MetadataEncoder, tokens


def scoring():
    return {
        "macro_f1": make_scorer(f1_score, average="macro", labels=LABELS, zero_division=0, pos_label=None),
        "weighted_f1": make_scorer(
            f1_score, average="weighted", labels=LABELS, zero_division=0, pos_label=None
        ),
        "accuracy": "accuracy",
    }


def folds_for(frame):
    manifest = pd.read_csv(root() / "data/splits/task-03/cv_manifest.csv")
    positions = {value: i for i, value in enumerate(frame.show_id)}
    return [
        (
            np.array([positions[v] for v in group.loc[group.role == "fit", "show_id"]]),
            np.array([positions[v] for v in group.loc[group.role == "validation", "show_id"]]),
        )
        for _, group in manifest.groupby("fold", sort=True)
    ]


def summary(result, name, stage, params, elapsed, director=False):
    return {
        "model": name,
        "stage": stage,
        "director": director,
        "params": params,
        "seconds": round(elapsed, 3),
        **{
            f"cv_{metric}_{stat}": float(getattr(np, stat)(result[f"test_{metric}"]))
            for metric in scoring()
            for stat in ["mean", "std"]
        },
    }


def train() -> str:
    base = root()
    config = read_json(base / "configs/task-03/experiment.json")
    frame = pd.read_csv(base / "data/processed/task-03/cleaned.csv")
    frame = frame[frame.split == "train"].reset_index(drop=True)
    X, y = frame[CORE + ["director"]], frame.rating
    folds = folds_for(frame)
    run_id = datetime.now(UTC).strftime("%Y%m%dT%H%M%S%fZ")
    bundle = base / "artifacts/task-03" / run_id
    bundle.mkdir(parents=True, exist_ok=False)
    estimators = {
        "dummy": DummyClassifier(strategy="most_frequent"),
        "logistic_regression": LogisticRegression(max_iter=3000, random_state=config["seed"]),
        "decision_tree": DecisionTreeClassifier(random_state=config["seed"]),
        "random_forest": RandomForestClassifier(n_estimators=200, n_jobs=1, random_state=config["seed"]),
    }
    spaces = {
        "logistic_regression": {
            "model__C": [0.1, 0.3, 1.0, 3.0, 10.0],
            "model__class_weight": [None, "balanced"],
        },
        "decision_tree": {
            "model__max_depth": [None, 5, 10, 20, 30],
            "model__min_samples_split": [2, 5, 10],
            "model__min_samples_leaf": [1, 2, 5, 10],
            "model__class_weight": [None, "balanced"],
        },
        "random_forest": {
            "model__n_estimators": [200, 400],
            "model__max_depth": [None, 10, 20, 30],
            "model__min_samples_leaf": [1, 2, 4],
            "model__max_features": ["sqrt", 0.5],
            "model__class_weight": [None, "balanced"],
        },
    }
    results, candidates, candidate_rows = [], {}, {}
    captured = []
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        for name, estimator in estimators.items():
            print(f"Default CV: {name}", flush=True)
            pipe = Pipeline(
                [("features", MetadataEncoder()), ("model", estimator)], memory=str(base / ".cache/features")
            )
            start = time.monotonic()
            scores = cross_validate(
                pipe, X, y, cv=folds, scoring=scoring(), n_jobs=config["workers"], error_score="raise"
            )
            default_row = summary(scores, name, "default", {}, time.monotonic() - start)
            results.append(default_row)
            best, row = pipe, default_row
            if name != "dummy":
                print(
                    f"Tuning: {name} ({config['search_iterations'][name]} candidates x 6 folds)", flush=True
                )
                start = time.monotonic()
                search = RandomizedSearchCV(
                    pipe,
                    spaces[name],
                    n_iter=config["search_iterations"][name],
                    scoring=scoring(),
                    refit="macro_f1",
                    cv=folds,
                    random_state=config["seed"],
                    n_jobs=config["workers"],
                    error_score="raise",
                    return_train_score=False,
                )
                search.fit(X, y)
                pd.DataFrame(search.cv_results_).to_csv(bundle / f"{name}_search.csv", index=False)
                index = search.best_index_
                scores = {
                    f"test_{metric}": np.array(
                        [
                            search.cv_results_[f"split{fold}_test_{metric}"][index]
                            for fold in range(len(folds))
                        ]
                    )
                    for metric in scoring()
                }
                tuned = summary(scores, name, "tuned", search.best_params_, time.monotonic() - start)
                results.append(tuned)
                if tuned["cv_macro_f1_mean"] >= default_row["cv_macro_f1_mean"]:
                    best, row = search.best_estimator_, tuned
            best.fit(X, y)
            candidates[name], candidate_rows[name] = best, row
            write_json(bundle / "progress.json", {"completed": list(candidates), "results": results})
        order = {name: i for i, name in enumerate(config["tie_break"][1:])}
        selected = max(
            candidate_rows,
            key=lambda name: (
                candidate_rows[name]["cv_macro_f1_mean"],
                candidate_rows[name]["cv_accuracy_mean"],
                -order[name],
            ),
        )
        if config["director_ablation"] and selected != "dummy":
            print(f"Director ablation: {selected}", flush=True)
            from sklearn.base import clone

            alternate = clone(candidates[selected]).set_params(features__director=True)
            start = time.monotonic()
            scores = cross_validate(
                alternate, X, y, cv=folds, scoring=scoring(), n_jobs=config["workers"], error_score="raise"
            )
            ablation = summary(
                scores,
                selected,
                "director_ablation",
                candidate_rows[selected]["params"],
                time.monotonic() - start,
                True,
            )
            results.append(ablation)
            if ablation["cv_macro_f1_mean"] > candidate_rows[selected]["cv_macro_f1_mean"]:
                alternate.fit(X, y)
                candidates[selected], candidate_rows[selected] = alternate, ablation
        captured = sorted({str(w.message) for w in caught})
    for name, model in candidates.items():
        model.memory = None
        joblib.dump(model, bundle / f"{name}.joblib", compress=3)
    selected_model = candidates[selected]
    joblib.dump(selected_model, bundle / "pipeline.joblib", compress=3)
    vocabulary = selected_model.named_steps["features"].vectorizer_.feature_names_
    metadata = {
        "run_id": run_id,
        "model_id": selected,
        "labels": selected_model.classes_.tolist(),
        "feature_columns": CORE + (["director"] if selected_model.named_steps["features"].director else []),
        "uses_director": selected_model.named_steps["features"].director,
        "source_sha256": digest(base / "data/raw/Dataset.csv"),
        "split_sha256": digest(base / "data/splits/task-03/manifest.csv"),
        "cv_sha256": digest(base / "data/splits/task-03/cv_manifest.csv"),
        "config": config,
        "python": platform.python_version(),
        "sklearn": sklearn.__version__,
        "pandas": pd.__version__,
        "numpy": np.__version__,
        "training_rows": len(frame),
        "training_support": frame.rating.value_counts().to_dict(),
        "training_year_range": [int(frame.release_year.min()), int(frame.release_year.max())],
        "countries": sorted(v.removeprefix("country=") for v in vocabulary if v.startswith("country=")),
        "genres": sorted(v.removeprefix("genre=") for v in vocabulary if v.startswith("genre=")),
        "directors": sorted(v.removeprefix("director=") for v in vocabulary if v.startswith("director=")),
        "examples": [
            {
                "title": row.title,
                "split": "train",
                "content_type": row.type,
                "release_year": int(row.release_year),
                "countries": [] if row.country == "Not Given" else tokens(row.country),
                "genres": tokens(row.listed_in),
                "duration": {
                    "value": int(row.duration.split()[0]),
                    "unit": "minutes" if row.type == "Movie" else "seasons",
                },
                "director": row.director,
            }
            for _, row in pd.concat(
                [frame[frame.type == "Movie"].head(1), frame[frame.type == "TV Show"].head(1)]
            ).iterrows()
        ],
    }
    write_json(bundle / "metadata.json", metadata)
    write_json(
        bundle / "selection.json",
        {
            "selected": selected,
            "selected_at": datetime.now(UTC).isoformat(),
            "basis": "training CV macro-F1; no test metrics accessed",
            "candidates": candidate_rows,
            "experiments": results,
            "warnings": captured,
        },
    )
    pd.DataFrame(results).to_csv(bundle / "cv_comparison.csv", index=False)
    write_json(base / "artifacts/task-03/latest_training.json", {"run_id": run_id})
    print(f"Selected {selected}; frozen run {run_id}", flush=True)
    return run_id
