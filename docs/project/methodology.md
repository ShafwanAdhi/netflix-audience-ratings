# Classification methodology

## Experiment protocol


1. Validate source hash and schema. Preserve raw bytes. Remove three exact-content duplicate rows excluding ID.
2. Review title/type/year identities after case/space normalization. Four remaining repeated entities are kept in training, including one inconsistent-rating pair. No rating is guessed or overwritten.
3. Allocate approximately 20% of each label to a singleton-only test set with seed 42, at least one test and two training rows per class: 7,029 training / 1,758 test.
4. Use three stratified group-disjoint 2-fold partitions with seeds 42, 43, 44. Check every label exists in both sides of every fold. Never split repeated content across fit/validation.
5. Encode content type, countries and genres through a fold-fitted dictionary vocabulary. Scale year, film minutes and season count using fold-training statistics. Preserve distinct units with type indicators and structural zeros. Ignore unseen categorical indicators, with inference warnings.
6. Compare Dummy, Logistic Regression, Decision Tree and Random Forest defaults. Run 8, 12 and 12 search candidates respectively using the same six folds. Compare default/tuned results; refit the stronger CV configuration per family.
7. Select using CV macro-F1 across all 14 labels, then accuracy, then the fixed family order Logistic Regression, Decision Tree, Random Forest, Dummy. Run one director ablation on the provisional non-Dummy winner; adopt director only if CV macro-F1 strictly improves.
8. Record selection before held-out evaluation. Evaluate frozen candidates once; the main model remains the CV-selected winner regardless of the test ranking.

The original no-group CV sketch was refined because deeper entity review found residual case/space variants. Group separation is required to prevent leakage, while the planned support counts and tuning budgets remain unchanged. The reviewed repeats are excluded from holdout, which limits the benchmark to singleton entities.

## Metrics and limitations

Report accuracy, macro-F1, weighted-F1, per-class precision/recall/F1/support, raw and row-normalized confusion matrices, per-type results with all-14-label scope, and error examples in source order. CV standard deviation describes partition variability, not an independent confidence interval. With only 3 original NC-17/UR examples, each has 2 training and 1 test example; repeated CV cannot make these estimates reliable.

All modeling decisions use training/CV. The EDA notebook reports training-only descriptive relationships and does not introduce post-test model changes. No external features, rating-derived features, title memorization or ID predictors are added. `date_added` is audit context, not a main model input.
