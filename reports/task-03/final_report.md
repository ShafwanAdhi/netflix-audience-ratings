# Verified results

Run: `20261106T111736917654Z`. Selected model: **random_forest**. Selected using training-only repeated 2-fold CV, three repetitions. Selection was frozen before test evaluation. This model remains trained on the training partition only.

| Held-out test metric | Value |
| --- | ---: |
| Accuracy | 0.5341 |
| Macro-F1 (14 labels) | 0.3342 |
| Weighted-F1 | 0.5286 |
| Training / test rows | 7029 / 1758 |

## Interpretation

Accuracy and weighted-F1 emphasize common labels; macro-F1 gives every label equal weight. These metrics estimate generalization within this historical catalogue snapshot. They do not establish future-release performance or official age-certification accuracy.

NC-17, UR and TV-Y7-FV each have only one test example. Their class-level scores are extremely unstable. Repeated CV does not create independent rare-class observations. All 14 labels are retained; no labels were merged to increase a score.

## Evidence

The immutable bundle contains CV experiments, search results, frozen selection, predictions, per-class metrics, raw and normalized confusion matrices, per-type results, and feature summaries. Error examples are the first five in source order rather than hand-selected successes. Feature summaries describe model association, not causation.

See `artifacts/task-03/20261106T111736917654Z/evaluation.json` for all results and `reports/task-03/figures/20261106T111736917654Z/` for report figures. Probabilities are not calibrated.
