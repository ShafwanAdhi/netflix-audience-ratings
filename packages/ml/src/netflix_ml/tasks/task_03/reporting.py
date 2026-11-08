"""Render readable, reproducible tables from a frozen evaluated bundle."""

from netflix_ml.shared.io import read_json, root


def render_report(run_id: str) -> None:
    bundle = root() / "artifacts/task-03" / run_id
    result = read_json(bundle / "evaluation.json")
    selection = read_json(bundle / "selection.json")
    text = f"# Detailed results\n\nRun `{run_id}`. Primary model: **{result['model_id']}**.\n\n"
    text += "## Frozen candidate comparison\n\n| Model | CV macro-F1 | Test accuracy | Test macro-F1 | Test weighted-F1 |\n| --- | ---: | ---: | ---: | ---: |\n"
    for row in result["comparison"]:
        text += f"| {row['model']} | {row['cv_macro_f1']:.4f} | {row['accuracy']:.4f} | {row['macro_f1']:.4f} | {row['weighted_f1']:.4f} |\n"
    text += "\nLogistic Regression has higher test accuracy in this run, while Random Forest remains the CV-selected model. The winner was not switched after reading test results. The majority baseline illustrates why accuracy alone is insufficient.\n\n"
    text += "## Default, tuned and ablation CV\n\n| Model | Stage | Director | Macro-F1 mean ± std | Accuracy mean |\n| --- | --- | --- | ---: | ---: |\n"
    for row in selection["experiments"]:
        text += f"| {row['model']} | {row['stage']} | {row['director']} | {row['cv_macro_f1_mean']:.4f} ± {row['cv_macro_f1_std']:.4f} | {row['cv_accuracy_mean']:.4f} |\n"
    text += "\nThe standard deviations describe variation across repeated folds; they are not independent confidence intervals. Director is retained only because the pre-test CV ablation improved macro-F1.\n\n"
    text += "## All-label test performance\n\n| Rating | Precision | Recall | F1 | Support | Predicted count |\n| --- | ---: | ---: | ---: | ---: | ---: |\n"
    for row in result["per_class"]:
        text += f"| {row['label']} | {row['precision']:.3f} | {row['recall']:.3f} | {row['f1-score']:.3f} | {int(row['support'])} | {row['predicted_count']} |\n"
    text += "\nZero precision/F1 is reported as zero when the model does not predict a class. Support-one results for NC-17, UR and TV-Y7-FV cannot establish reliability.\n\n"
    text += "## Content-type analysis\n\n| Type | Test rows | Accuracy | Macro-F1 (all 14 labels) | Weighted-F1 |\n| --- | ---: | ---: | ---: | ---: |\n"
    for row in result["by_type"]:
        text += f"| {row['type']} | {row['support']} | {row['accuracy']:.4f} | {row['macro_f1']:.4f} | {row['weighted_f1']:.4f} |\n"
    text += "\nSubset macro-F1 deliberately retains all 14 labels, including absent labels. It should not be compared with a subset-only-label score.\n\n## Frequent mistakes\n\n| Actual | Predicted | Count |\n| --- | --- | ---: |\n"
    for row in result["frequent_errors"]:
        text += f"| {row['actual']} | {row['predicted']} | {row['count']} |\n"
    text += "\n## Qualitative examples\n\nFirst correct/incorrect examples in source order, without cherry-picking.\n\n| Outcome | Source ID | Title | Actual | Predicted |\n| --- | --- | --- | --- | --- |\n"
    for outcome, records in result["examples"].items():
        for row in records:
            title = row["title"].replace("|", "/")
            text += f"| {outcome} | {row['show_id']} | {title} | {row['rating']} | {row['prediction']} |\n"
    text += "\nFeature summaries in the bundle describe associations, not causal effects. No post-test model changes were made. Historical snapshot, incomplete metadata and label-system inconsistencies limit interpretation. Probabilities remain uncalibrated.\n"
    (root() / "reports/task-03/detailed_results.md").write_text(text, encoding="utf-8")
