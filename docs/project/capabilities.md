# Project capabilities

Predict audience-rating labels from catalog metadata using a fold-fitted classification pipeline. Explore label imbalance, compare baseline and tuned models, and inspect held-out errors. Ratings are content-advisory categories rather than viewer scores.

| Capability | Implementation and evidence |
| --- | --- |
| Analyze rating categories | Training-only executed EDA, overview distribution, dataset/model cards |
| Prepare training datasets | `data.py`, cleaning log, source hash, frozen split/CV manifests, integrity tests |
| Train classification models | Dummy, LR, DT, RF; run candidate models and CV table |
| Optimize model performance | Bounded search CSVs, best params, recorded director ablation |
| Evaluate prediction accuracy | Frozen evaluation JSON, test predictions, accuracy/F1/report/matrices |
| Model comparison; Decision Trees, Random Forest, metrics, tuning | Default/tuned experiments, final model table, selection record |

The web application has five sections: `/overview`, `/dataset`, `/predict`, `/evaluation` and `/methodology`. All displayed model results come from a validated saved run. Inspect [methodology](methodology.md), [model card](model-card.md) and [verification](../VERIFICATION.md) for practical limits and recorded checks.
