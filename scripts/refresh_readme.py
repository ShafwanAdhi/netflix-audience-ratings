"""Refresh only the marked README results from a validated active bundle."""
import argparse
import hashlib
import json
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
START = "<!-- RESULTS:START -->"
END = "<!-- RESULTS:END -->"


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def render(base=BASE):
    project = read(base / "project.json")
    task = project["task_id"]
    area = base / f"artifacts/task_{task:02d}".replace("_", "-")
    run = read(area / "active.json")["run_id"]
    if Path(run).name != run or run in (".", ".."):
        raise ValueError("Invalid active run")
    bundle = area / run
    checksums = read(bundle / "checksums.json")
    for name, expected in checksums.items():
        item = (bundle / name).resolve()
        if not item.is_relative_to(bundle.resolve()) or hashlib.sha256(item.read_bytes()).hexdigest() != expected:
            raise ValueError(f"Artifact checksum mismatch: {name}")
    metadata = read(bundle / "metadata.json")
    data = read(bundle / ("evaluation.json" if task == 3 else "results.json"))
    profile = read(base / "reports/dataset-profile.json")
    provenance = read(base / "data/provenance.json")
    if any(item["run_id"] != run for item in (metadata, data, profile)):
        raise ValueError("Result, metadata and dataset profile must use the active run")
    if any(item["source_sha256"] != metadata["source_sha256"] for item in (provenance, profile)):
        raise ValueError("Source provenance hash mismatch")
    if profile["provenance"] != provenance:
        raise ValueError("Refresh dataset profile after updating provenance")
    if task == 3:
        baseline = next(row for row in data["comparison"] if row["model"] == "dummy")
        selected = next(row for row in data["comparison"] if row["model"] == data["model_id"])
        body = f"""Selected by training-only CV macro-F1: **{data['model_id']}** (CV {selected['cv_macro_f1']:.3f}).

| Frozen test evidence | Selected model | Dummy baseline |
| --- | ---: | ---: |
| Macro-F1 | {data['metrics']['macro_f1']:.3f} | {baseline['macro_f1']:.3f} |
| Accuracy | {data['metrics']['accuracy']:.1%} | {baseline['accuracy']:.1%} |

Training: {data['train_rows']:,}; test: {data['test_rows']:,}; labels: {len(data['labels'])}. Metadata does not establish official suitability. Rare classes have very limited support; the test does not reselect the winner."""
    elif task == 4:
        s = data["selected"]
        body = f"""**{data['algorithm']} / k={data['k']}**, {data['catalog_rows']:,} entities. Mean silhouette **{s['silhouette_mean']:.3f}**; same-catalog seed ARI **{s['stability_ari']:.3f}**.

Selected among the recorded algorithm/count candidates using shared features and eligibility constraints. These are in-sample internal diagnostics, not held-out classification accuracy. PCA explains {data['projection_variance']:.1%} of variance; no viewer personas or recommendation outcomes are verified."""
    elif task == 5:
        lines = ["Annual generalization failed; monthly results depend on the baseline. Model selection remains frozen.", "", "| Target / scope | CV-selected model | Test MAE | Last value MAE | Seasonal naive MAE |", "| --- | --- | ---: | ---: | ---: |"]
        for series in data["series"]:
            scores = {row["model"]: row["test_metrics"]["mae"] for row in series["comparison"]}
            seasonal = f"{scores['seasonal_naive']:.2f}" if "seasonal_naive" in scores else "Not evaluated"
            lines.append(f"| {series['target']} / {series['group']} | {series['model']} | {series['test_metrics']['mae']:.2f} | {scores['last_value']:.2f} | {seasonal} |")
        lines.extend(["", "MAE is titles per period. Other predeclared candidates remain in Evaluation. This single snapshot is not point-in-time history; projections are historical as-of estimates and error bands are not calibrated confidence intervals."])
        body = "\n".join(lines)
    else:
        b = next(row for row in data["comparison"] if row["model"] == "median_global")["test_metrics"]
        tail = next(row for row in data["errors"] if row["field"] == "target_band" and row["name"] == ">5")
        m = data["metrics"]
        body = f"""CV-selected **{data['model_id']}**; chronological test n={data['audit']['test_rows']:,}.

| Frozen test evidence | Selected model | Global median baseline |
| --- | ---: | ---: |
| MAE (calendar years) | {m['mae']:.2f} | {b['mae']:.2f} |
| Median absolute error (years) | {m['median_absolute_error']:.2f} | {b['median_absolute_error']:.2f} |

Test R-squared: {m['r2']:.3f}. The >5-year target band has MAE {tail['mae']:.2f} years (n={tail['support']:,}). Lower mean error does not imply uniformly better estimates. The target is a calendar-year difference, not exact elapsed duration, commercial success or a prospective acquisition date."""
    return f"Evidence run: `{run}`. Generated from the active artifact; not a business-impact claim.\n\n{body}\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Fail if the marked results are stale")
    args = parser.parse_args()
    path = BASE / "README.md"
    text = path.read_text(encoding="utf-8")
    if text.count(START) != 1 or text.count(END) != 1:
        raise ValueError("README must contain one results marker pair")
    before, rest = text.split(START)
    _, after = rest.split(END)
    updated = before + START + "\n" + render() + END + after
    if args.check:
        if text != updated:
            raise SystemExit("README results are stale; run scripts/refresh_readme.py")
    else:
        path.write_text(updated, encoding="utf-8", newline="\n")
    print("README result evidence is current")


if __name__ == "__main__":
    main()
