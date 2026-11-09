"""Refresh run-bound dataset evidence after training."""
import json
from pathlib import Path

import pandas as pd

BASE=Path(__file__).resolve().parents[1]
PROJECTS={3:(None,'Audience Rating Classification')}
def read(path):
    return json.loads(path.read_text(encoding="utf-8"))

def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")

def json_file(path, value):
    write(path, json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n")

def profile(task, bundle):
    metadata = read(bundle / "metadata.json")
    result = read(bundle / ("evaluation.json" if task == 3 else "results.json"))
    variables = []

    def variable(name, role, reason, treatment):
        variables.append({"name": name, "role": role, "reason": reason, "treatment": treatment})

    for name, why, treatment in [
        (
            "type",
            "Movie and TV metadata have different advisory patterns, genres and duration units.",
            "Encode Movie/TV Show; retain separate duration units.",
        ),
        (
            "country",
            "Production origin describes catalog context, with missing origin made explicit.",
            "Tokenize multiple countries; fit vocabulary on the fitting data only.",
        ),
        (
            "listed_in",
            "Genres summarize content similarities and advisory context.",
            "Tokenize multiple genres; unknown categories do not extend the fitted vocabulary.",
        ),
        (
            "duration",
            "Film length and number of TV seasons describe different content formats.",
            "Parse positive minutes for Movies and integer seasons for TV Shows; never treat them as interchangeable.",
        ),
    ]:
        if task == 4:
            why = {
                "type": "Separate Movie/TV formats so genre and duration similarities remain interpretable.",
                "country": "Production origin adds geographic catalog context to the similarity geometry.",
                "listed_in": "Genre overlap is the principal semantic basis for content similarity.",
                "duration": "Separate film length and season counts distinguish formats without mixing units.",
            }[name]
        elif task == 6:
            why = {
                "type": "Movie and TV catalog-entry lags differ; estimate those metadata associations explicitly.",
                "country": "Production origins can be associated with historical catalog-entry patterns.",
                "listed_in": "Genres may explain variation in observed catalog-entry lags without using target ingredients.",
                "duration": "Film length and season count provide format context independent of release/addition dates.",
            }[name]
        variable(
            name,
            "Feature" if task != 5 else "Grouping only" if name == "type" else "Excluded",
            why if task != 5 else "Forecasts use aggregate time series, not per-title content metadata.",
            treatment
            if task != 5
            else "Only content type defines All/Movie/TV scope; other metadata does not enter the model.",
        )
    variable(
        "release_year",
        "Target time axis" if task == 5 else "Target construction only" if task == 6 else "Feature",
        "Measures original release cohort; it is distinct from date added."
        if task != 6
        else "Part of the target formula; using it as a predictor would reveal the target.",
        "Annual cohorts; incomplete 2021 is excluded."
        if task == 5
        else "Excluded from prediction; used only to calculate the calendar-year difference."
        if task == 6
        else "Numeric year; transformation fits within the relevant fitting data.",
    )
    variable(
        "date_added",
        "Target time axis" if task == 5 else "Target construction / split only" if task == 6 else "Excluded",
        "Measures catalog entry, not original release."
        if task >= 5
        else "Catalog-entry timing is outside the intended metadata similarity/advisory task.",
        "Aggregate completed months; exclude September 2021."
        if task == 5
        else "Build target and chronological partitions; excluded from model inputs."
        if task == 6
        else "Retain for audit only.",
    )
    variable(
        "rating",
        "Target" if task == 3 else "Excluded",
        "The classifier predicts the original 14 advisory classes."
        if task == 3
        else "Advisory ratings are not viewer scores, commercial success or clustering ground truth.",
        "Keep all 14 labels, including NR/UR/TV-Y7-FV; never use as an input."
        if task == 3
        else "Never used as a model feature or performance label.",
    )
    variable(
        "director",
        ("Feature (training-only ablation selected)" if metadata.get("uses_director") else "Excluded after training-only ablation") if task == 3 else "Feature" if task == 6 else "Excluded",
        "Test incremental metadata value without consulting the holdout."
        if task == 3
        else "Director credits and missingness describe content metadata associations."
        if task == 6
        else "High cardinality is outside the chosen geometry/time-series feature set.",
        f"Active model uses director: {metadata.get('uses_director', False)}."
        if task == 3
        else "Fitted vocabulary and count/missing indicators; unknown credits handled explicitly."
        if task == 6
        else "Retain only as source context.",
    )
    variable(
        "show_id / title",
        "Identity / display only",
        "Trace records and remove repeated entities; unique identifiers do not describe generalizable content.",
        "Exclude from features; title/type/year supports entity review.",
    )
    if task == 5:
        variable(
            "lags / trailing means / trend / seasonality",
            "Derived features",
            "Past counts, local averages and calendar cycles describe persistence, trend and seasonal changes.",
            "Only observations before the predicted period enter each feature; recursively use predictions for unknown future lags.",
        )
    if task == 6:
        variable(
            "lag_years",
            "Target",
            "Observed calendar-year difference between catalog addition and release, because actual commercial success is unavailable.",
            "year(date_added) - release_year; remove 14 negative values; retain the long tail.",
        )
    stages = [
        {
            "name": "Source validation",
            "input_rows": 8790,
            "output_rows": 8790,
            "reason": "Verify the supplied SHA-256, schema, types and duration units.",
        }
    ]
    partitions, decisions = [], []

    def part(name, rows, purpose, segments=(), metrics=None):
        partitions.append(
            {"name": name, "rows": int(rows), "purpose": purpose, "segments": list(segments), "metrics": metrics or {}}
        )

    if task == 3:
        stages.append(
            {
                "name": "Exact-content deduplication",
                "input_rows": 8790,
                "output_rows": 8787,
                "reason": "Remove 3 identical content records. Reviewed residual entity variants remain training-only and are grouped within CV.",
            }
        )
        manifest = pd.read_csv(BASE / "data/processed/task-03/cleaned.csv")
        for split in ["train", "test"]:
            rows = manifest[manifest.split == split]
            segments = [
                {"name": str(k), "rows": int(v)} for k, v in rows.rating.value_counts().sort_index().items()
            ]
            part(
                "Training" if split == "train" else "Held-out test",
                len(rows),
                "Seed-42 per-class allocation; grouped CV runs only inside training."
                if split == "train"
                else "Used once after selection; no preprocessing or tuning is fitted here.",
                segments,
                result["metrics"] if split == "test" else None,
            )
        for row in result["by_type"]:
            part(
                f"Test segment: {row['type']}",
                row["support"],
                row["label_scope"],
                metrics={k: row[k] for k in ["accuracy", "macro_f1", "weighted_f1"]},
            )
        strategy = "Supervised classification: 7,029 training / 1,758 test rows. Every original label remains present; repeated entities never cross fitting/validation boundaries."
        decisions = [
            {
                "action": "Keep the original labels",
                "reason": "The classifier predicts advisory categories; collapsing rare classes changes that task.",
                "evidence": "Fourteen classes remain in the split manifests and per-class report.",
                "limitation": "A class with one held-out example cannot support a reliable generalization claim.",
            },
            {
                "action": "Fit preprocessing inside training folds",
                "reason": "Validation data must not influence vocabularies, scaling or model selection.",
                "evidence": "Pipelines share fixed grouped folds; mean CV macro-F1 selects the model before final test evaluation.",
                "limitation": "The holdout represents this snapshot, not future releases.",
            },
        ]
    elif task == 4:
        stages.append(
            {
                "name": "Entity deduplication",
                "input_rows": 8790,
                "output_rows": result["catalog_rows"],
                "reason": "Retain the first normalized title/type/year record; log all 7 removed-to-retained mappings.",
            }
        )
        part(
            "Fitted catalog",
            result["catalog_rows"],
            "Full-catalog descriptive clustering; no supervised train/test split is applicable.",
            [{"name": f"Cluster {p['id']}: {p['name']}", "rows": p["size"]} for p in result["profiles"]],
            {
                "silhouette_mean": result["selected"]["silhouette_mean"],
                "seed_stability_ari": result["selected"]["stability_ari"],
            },
        )
        strategy = "Unsupervised transductive segmentation: all 8,783 entities enter fitting. A fixed 1,500-row sample scores geometric separation; 2D PCA is visualization only, not a test set."
        decisions = [
            {
                "action": "Weight mixed metadata blocks",
                "reason": "Normalize categorical blocks so a large vocabulary cannot dominate merely by dimension; emphasize genre by design.",
                "evidence": f"Recorded weights: {result['feature_weights']}; {result['feature_count']} fitted dimensions.",
                "limitation": "Weights define similarity and are not learned causal importance.",
            },
            {
                "action": "Compare algorithms and group counts",
                "reason": "A single clustering run cannot establish meaningful structure or stable boundaries.",
                "evidence": "27 candidates, three seeds each; choose highest eligible mean silhouette in k=2–10.",
                "limitation": "The k=10 winner is at the upper boundary; this does not establish a globally optimal k.",
            },
        ]
    elif task == 5:
        stages.append(
            {
                "name": "Entity deduplication",
                "input_rows": 8790,
                "output_rows": result["audit"]["entity_rows"],
                "reason": "Remove 7 repeated entities; preserve both independent time concepts.",
            }
        )
        for row in result["series"]:
            annual = row["target"] == "releases"
            n = len(row["test"])
            part(
                f"{row['target']} / {row['group']} — development",
                len(row["history"]) - n,
                f"Fitting history ends {row['development_end']}; chronological CV remains strictly earlier than test.",
            )
            part(
                f"{row['target']} / {row['group']} — test",
                n,
                f"Frozen observed {'years' if annual else 'months'}: {row['test_start']} through {row['test_end']}. Selected model: {row['model']}.",
                metrics=row["test_metrics"],
            )
        strategy = "Annual: 17 development years / 4 test years for each content scope. Monthly: 74 development months / 6 test months. These are period counts, not randomly split title rows. No row-level train/test ratio is fabricated."
        decisions = [
            {
                "action": "Separate release-year and catalog-entry forecasts",
                "reason": "date_added is not an original release date; combining them would change the target without disclosure.",
                "evidence": "Six separately recorded series; annual 2000–2020 and monthly 2015-01–2021-08.",
                "limitation": "One retrospective catalog snapshot has survivorship/backfill bias and is not a point-in-time archive.",
            },
            {
                "action": "Exclude incomplete final cohorts",
                "reason": "A partial year/month would artificially lower recent counts.",
                "evidence": f"Exclude {result['audit']['annual_excluded_2021']} 2021 release-cohort titles and {result['audit']['monthly_excluded_september_2021']} September additions from modeling.",
                "limitation": "Exclusion does not establish that older cohorts are complete.",
            },
            {
                "action": "Freeze selection before the chronological test",
                "reason": "Test results must reveal failure rather than retrospectively select a better model.",
                "evidence": "Annual CV winner has test MAE 2395.37 versus last-value 137.75; the failure remains visible.",
                "limitation": "Exploratory CV error bands are not calibrated confidence intervals or reliable current forecasts.",
            },
        ]
    else:
        audit = result["audit"]
        stages += [
            {
                "name": "Entity deduplication",
                "input_rows": 8790,
                "output_rows": audit["entity_rows"],
                "reason": "Remove 7 repeated entities with a recorded mapping.",
            },
            {
                "name": "Target eligibility",
                "input_rows": audit["entity_rows"],
                "output_rows": audit["eligible_rows"],
                "reason": "Audit and exclude 14 negative calendar-year differences; do not invent corrections or trim the positive tail.",
            },
        ]
        manifest = pd.read_csv(bundle / "manifest.csv")
        for split in ["train", "test"]:
            rows = manifest[manifest.split == split]
            segments = (
                [{"name": str(k), "rows": int(v)} for k, v in rows.type.value_counts().items()]
                if "type" in rows
                else []
            )
            part(
                "Training through 2019" if split == "train" else "Test: 2020–2021",
                len(rows),
                "Chronological training; rolling-year validation fits only earlier observations."
                if split == "train"
                else "Untouched later-year test; the serving model remains trained on training rows only.",
                segments,
                result["metrics"] if split == "test" else None,
            )
        for row in result["summary"]:
            if row.get("group") != "all":
                part(
                    f"Eligible catalog segment: {row['group']}",
                    row["support"],
                    "Descriptive target statistics across the eligible catalog, not held-out prediction errors.",
                    metrics={
                        k: v
                        for k, v in row.items()
                        if k not in ["group", "support"] and isinstance(v, (int, float))
                    },
                )
        predictions = pd.read_csv(bundle / "test_predictions.csv")
        for kind, rows in predictions.groupby("type"):
            part(
                f"Held-out test segment: {kind}",
                len(rows),
                "Computed from frozen test_predictions.csv; errors measured in calendar years.",
                metrics={
                    "mae": float(rows.absolute_error.mean()),
                    "median_absolute_error": float(rows.absolute_error.median()),
                },
            )
        strategy = "Chronological regression: 5,395 training through 2019 / 3,374 test in 2020–2021, from 8,769 eligible entities. Group-wise errors remain visible."
        decisions = [
            {
                "action": "Use an observable metadata target",
                "reason": "The dataset has no views, engagement, revenue or viewer score; commercial success cannot be measured.",
                "evidence": "The target is year(date_added) minus release_year, with explicit input exclusions.",
                "limitation": "Calendar-year difference is not exact elapsed time, prospective waiting time or success.",
            },
            {
                "action": "Exclude target ingredients from predictors",
                "reason": "release_year and date_added construct the label; including them would leak its value.",
                "evidence": "Feature allowlist excludes release/addition years, dates, identifiers and target.",
                "limitation": "Snapshot survivorship and metadata associations prevent causal or current-acquisition claims.",
            },
        ]
    provenance = read(BASE / "data/provenance.json")
    if provenance["source_sha256"] != metadata["source_sha256"]:
        raise ValueError("Provenance does not match active source hash")
    return {
        "provenance": provenance,
        "task_id": task,
        "title": PROJECTS[task][1],
        "run_id": metadata["run_id"],
        "source_file": "User-supplied Dataset.csv (10 source variables)",
        "source_sha256": metadata["source_sha256"],
        "snapshot_date": "2021-09-25",
        "raw_rows": 8790,
        "variables": variables,
        "decisions": decisions,
        "stages": stages,
        "partitions": partitions,
        "split_strategy": strategy,
        "limitations": [
            "This is the supplied historical catalog snapshot, not a current Netflix data feed.",
            "Decisions are concise, evidence-backed summaries; model outputs do not establish causation.",
        ],
    }

if __name__=="__main__":
    pointer=read(BASE/"artifacts/task-03/active.json")
    json_file(BASE/"reports/dataset-profile.json",profile(3,BASE/"artifacts/task-03"/pointer["run_id"]))
