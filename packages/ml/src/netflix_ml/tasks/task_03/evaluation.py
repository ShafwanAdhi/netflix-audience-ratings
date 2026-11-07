"""One final held-out evaluation, immutable reports, and validated activation."""

from datetime import UTC, datetime

import joblib
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score

from netflix_ml.shared.io import digest, read_json, root, write_json
from netflix_ml.tasks.task_03.data import LABELS
from netflix_ml.tasks.task_03.features import CORE


def metrics(y, prediction):
    return {
        "accuracy": float(accuracy_score(y, prediction)),
        "macro_f1": float(f1_score(y, prediction, labels=LABELS, average="macro", zero_division=0)),
        "weighted_f1": float(f1_score(y, prediction, labels=LABELS, average="weighted", zero_division=0)),
    }


def evaluate(run_id: str):
    base = root()
    bundle = base / "artifacts/task-03" / run_id
    if (bundle / "evaluation.json").exists():
        raise ValueError("This run was already evaluated; refusing to rewrite its frozen test results")
    selection = read_json(bundle / "selection.json")
    metadata = read_json(bundle / "metadata.json")
    frame = pd.read_csv(base / "data/processed/task-03/cleaned.csv")
    if digest(base / "data/splits/task-03/manifest.csv") != metadata["split_sha256"]:
        raise ValueError("Split identity changed since training")
    test = frame[frame.split == "test"]
    X, y = test[CORE + ["director"]], test.rating
    comparison = []
    selected_prediction = None
    for name in selection["candidates"]:
        model = joblib.load(bundle / f"{name}.joblib")
        prediction = model.predict(X)
        comparison.append(
            {
                "model": name,
                **metrics(y, prediction),
                "cv_macro_f1": selection["candidates"][name]["cv_macro_f1_mean"],
            }
        )
        if name == selection["selected"]:
            selected_prediction = prediction
    report = classification_report(y, selected_prediction, labels=LABELS, output_dict=True, zero_division=0)
    matrix = confusion_matrix(y, selected_prediction, labels=LABELS)
    normalized = np.divide(
        matrix,
        matrix.sum(axis=1, keepdims=True),
        out=np.zeros_like(matrix, dtype=float),
        where=matrix.sum(axis=1, keepdims=True) != 0,
    )
    predictions = test[["show_id", "title", "type", "rating"]].copy()
    predictions["prediction"] = selected_prediction
    predictions["correct"] = predictions.rating == predictions.prediction
    predictions.to_csv(bundle / "test_predictions.csv", index=False)
    per_class = [
        {"label": label, **report[label], "predicted_count": int(np.sum(selected_prediction == label))}
        for label in LABELS
    ]
    groups = []
    for content_type in ["Movie", "TV Show"]:
        mask = test.type == content_type
        groups.append(
            {
                "type": content_type,
                "support": int(mask.sum()),
                "label_scope": "All 14 labels, including absent labels as zero F1",
                **metrics(y[mask], selected_prediction[mask.to_numpy()]),
            }
        )
    errors = predictions[~predictions.correct]
    pairs = errors.groupby(["rating", "prediction"]).size().sort_values(ascending=False).head(8)
    output = {
        "run_id": run_id,
        "model_id": selection["selected"],
        "evaluated_at": datetime.now(UTC).isoformat(),
        "test_rows": len(test),
        "train_rows": metadata["training_rows"],
        "labels": LABELS,
        "metrics": metrics(y, selected_prediction),
        "comparison": comparison,
        "experiments": selection["experiments"],
        "per_class": per_class,
        "confusion_matrix": matrix.tolist(),
        "normalized_confusion_matrix": normalized.tolist(),
        "by_type": groups,
        "frequent_errors": [{"actual": a, "predicted": p, "count": int(n)} for (a, p), n in pairs.items()],
        "examples": {
            "correct": predictions[predictions.correct].head(5).to_dict("records"),
            "incorrect": errors.head(5).to_dict("records"),
        },
    }
    reports = base / "reports/task-03"
    figures = reports / "figures" / run_id
    figures.mkdir(parents=True, exist_ok=True)
    for values, suffix, label in [
        (matrix, "counts", "Number of titles"),
        (normalized, "normalized", "Fraction of actual label"),
    ]:
        fig, ax = plt.subplots(figsize=(12, 10))
        plot = ax.imshow(values, cmap="Reds", vmin=0, vmax=1 if suffix == "normalized" else None)
        ax.set(
            xticks=range(len(LABELS)),
            yticks=range(len(LABELS)),
            xticklabels=LABELS,
            yticklabels=LABELS,
            xlabel="Predicted rating",
            ylabel="Actual rating",
            title=f"Held-out test confusion matrix • {suffix}\n{run_id}",
        )
        plt.setp(ax.get_xticklabels(), rotation=55, ha="right")
        fig.colorbar(plot, ax=ax, label=label)
        fig.tight_layout()
        fig.savefig(figures / f"confusion_{suffix}.png", dpi=150)
        plt.close(fig)
    train = frame[frame.split == "train"]
    counts = train.rating.value_counts().reindex(LABELS)
    fig, ax = plt.subplots(figsize=(12, 5))
    counts.plot.bar(ax=ax, color="#ad292e")
    ax.set(title="Training-only label distribution", ylabel="Titles", xlabel="Audience rating")
    fig.tight_layout()
    fig.savefig(figures / "training_labels.png", dpi=150)
    plt.close(fig)
    selected_model = joblib.load(bundle / "pipeline.joblib")
    estimator = selected_model.named_steps["model"]
    names = selected_model.named_steps["features"].get_feature_names_out()
    if hasattr(estimator, "feature_importances_"):
        importance = estimator.feature_importances_
    elif hasattr(estimator, "coef_"):
        importance = np.abs(estimator.coef_).mean(axis=0)
    else:
        importance = np.zeros(len(names))
    feature_summary = pd.DataFrame({"feature": names, "importance": importance}).sort_values(
        "importance", ascending=False
    )
    feature_summary.to_csv(bundle / "feature_summary.csv", index=False)
    pd.DataFrame(per_class).to_csv(bundle / "classification_report.csv", index=False)
    pd.DataFrame(comparison).to_csv(bundle / "model_comparison.csv", index=False)
    write_json(bundle / "evaluation.json", output)
    write_json(bundle / "checksums.json", {p.name: digest(p) for p in bundle.iterdir() if p.is_file()})
    write_json(
        base / "artifacts/task-03/active.json",
        {"run_id": run_id, "checksums_sha256": digest(bundle / "checksums.json")},
    )
    headline = output["metrics"]
    text = f"""# Task 3 — Verified results

Run: `{run_id}`. Selected model: **{selection["selected"]}**. Selected using training-only repeated 2-fold CV, three repetitions. Selection was frozen before test evaluation. This model remains trained on the training partition only.

| Held-out test metric | Value |
| --- | ---: |
| Accuracy | {headline["accuracy"]:.4f} |
| Macro-F1 (14 labels) | {headline["macro_f1"]:.4f} |
| Weighted-F1 | {headline["weighted_f1"]:.4f} |
| Training / test rows | {metadata["training_rows"]} / {len(test)} |

## Interpretation

Accuracy and weighted-F1 emphasize common labels; macro-F1 gives every label equal weight. These metrics estimate generalization within this historical catalogue snapshot. They do not establish future-release performance or official age-certification accuracy.

NC-17, UR and TV-Y7-FV each have only one test example. Their class-level scores are extremely unstable. Repeated CV does not create independent rare-class observations. All 14 labels are retained; no labels were merged to increase a score.

## Evidence

The immutable bundle contains CV experiments, search results, frozen selection, predictions, per-class metrics, raw and normalized confusion matrices, per-type results, and feature summaries. Error examples are the first five in source order rather than hand-selected successes. Feature summaries describe model association, not causation.

See `artifacts/task-03/{run_id}/evaluation.json` for all results and `reports/task-03/figures/{run_id}/` for report figures. Probabilities are not calibrated.
"""
    (reports / "final_report.md").write_text(text, encoding="utf-8")
    from netflix_ml.tasks.task_03.reporting import render_report

    render_report(run_id)
    print({"run_id": run_id, **headline}, flush=True)
    return output
