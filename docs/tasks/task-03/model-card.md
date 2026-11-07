# Model card

## Intended use

Educational multi-class classification of historical Netflix metadata. The active pipeline is the training-only model chosen before final test evaluation. It supports an internship demonstration and inspection of metadata associations, not official certification, safety screening or commercial-success estimation.

## Model and training

DummyClassifier, Logistic Regression, Decision Tree and Random Forest were compared on fixed group-disjoint folds. Bounded randomized tuning and one director ablation used training only. The active Random Forest was selected by mean CV macro-F1. `metadata.json` and `selection.json` in the active bundle record exact parameters, package versions, feature columns, class order, hashes and the ablation decision.

The historical source hash, cleaned split manifests and accepted CV seeds establish the run identity. The encoder and estimator are saved together; API and CLI share inference code. No post-evaluation full-data refit is performed.

## Evaluation

Held-out accuracy: **0.5341**. Macro-F1 over all 14 labels: **0.3342**. Weighted-F1: **0.5286**. See the generated report and bundle for the baseline and candidate comparisons, support, matrices, type-level metrics and error analysis. These are actual test outputs, not targets or promises.

## Limitations

- Metadata lacks actual scenes, language, dialogue and violence information used in content review.
- Labels combine different rating systems and may be inconsistent or region-dependent.
- NC-17 and UR have only two training observations each; TV-Y7-FV has five. Each has one held-out example, preventing reliable class-level conclusions.
- Class imbalance makes accuracy an incomplete summary; macro-F1 reveals weaker minority-label performance.
- Country/director missingness and category availability can encode source and selection biases. No fairness guarantees are claimed.
- Historical random holdout is not chronological or external validation. Repeated entities remain training-only, limiting test coverage to singletons.
- Unknown indicators are ignored. Predictions outside historical coverage carry warnings. Model probabilities have not been calibrated.
- Feature importances and mean coefficient magnitudes describe fitted associations, not causal explanations.

## Operational boundary

Use only trusted project artifacts with the locked dependencies. Missing, corrupt, or version-incompatible bundles produce explicit unavailability. The app accepts metadata, not uploaded executable model files. Public deployment has not been performed.
