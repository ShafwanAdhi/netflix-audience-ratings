# Detailed results

Run `20261106T111736917654Z`. Primary model: **random_forest**.

## Frozen candidate comparison

| Model | CV macro-F1 | Test accuracy | Test macro-F1 | Test weighted-F1 |
| --- | ---: | ---: | ---: | ---: |
| dummy | 0.0382 | 0.3646 | 0.0382 | 0.1948 |
| logistic_regression | 0.3068 | 0.5603 | 0.3313 | 0.5341 |
| decision_tree | 0.3035 | 0.5108 | 0.2949 | 0.4948 |
| random_forest | 0.3458 | 0.5341 | 0.3342 | 0.5286 |

Logistic Regression has higher test accuracy in this run, while Random Forest remains the CV-selected model. The winner was not switched after reading test results. The majority baseline illustrates why accuracy alone is insufficient.

## Default, tuned and ablation CV

| Model | Stage | Director | Macro-F1 mean ± std | Accuracy mean |
| --- | --- | --- | ---: | ---: |
| dummy | default | False | 0.0382 ± 0.0000 | 0.3648 |
| logistic_regression | default | False | 0.2957 ± 0.0067 | 0.5442 |
| logistic_regression | tuned | False | 0.3068 ± 0.0072 | 0.5415 |
| decision_tree | default | False | 0.2952 ± 0.0088 | 0.4647 |
| decision_tree | tuned | False | 0.3035 ± 0.0038 | 0.4949 |
| random_forest | default | False | 0.3269 ± 0.0099 | 0.5282 |
| random_forest | tuned | False | 0.3394 ± 0.0108 | 0.5270 |
| random_forest | director_ablation | True | 0.3458 ± 0.0133 | 0.5303 |

The standard deviations describe variation across repeated folds; they are not independent confidence intervals. Director is retained only because the pre-test CV ablation improved macro-F1.

## All-label test performance

| Rating | Precision | Recall | F1 | Support | Predicted count |
| --- | ---: | ---: | ---: | ---: | ---: |
| G | 0.500 | 0.250 | 0.333 | 8 | 4 |
| NC-17 | 0.000 | 0.000 | 0.000 | 1 | 0 |
| NR | 0.045 | 0.062 | 0.053 | 16 | 22 |
| PG | 0.548 | 0.596 | 0.571 | 57 | 62 |
| PG-13 | 0.509 | 0.561 | 0.534 | 98 | 108 |
| R | 0.457 | 0.594 | 0.516 | 160 | 208 |
| TV-14 | 0.529 | 0.483 | 0.505 | 431 | 393 |
| TV-G | 0.083 | 0.045 | 0.059 | 44 | 24 |
| TV-MA | 0.640 | 0.655 | 0.648 | 641 | 656 |
| TV-PG | 0.305 | 0.250 | 0.275 | 172 | 141 |
| TV-Y | 0.619 | 0.639 | 0.629 | 61 | 63 |
| TV-Y7 | 0.519 | 0.597 | 0.556 | 67 | 77 |
| TV-Y7-FV | 0.000 | 0.000 | 0.000 | 1 | 0 |
| UR | 0.000 | 0.000 | 0.000 | 1 | 0 |

Zero precision/F1 is reported as zero when the model does not predict a class. Support-one results for NC-17, UR and TV-Y7-FV cannot establish reliability.

## Content-type analysis

| Type | Test rows | Accuracy | Macro-F1 (all 14 labels) | Weighted-F1 |
| --- | ---: | ---: | ---: | ---: |
| Movie | 1231 | 0.5248 | 0.3331 | 0.5166 |
| TV Show | 527 | 0.5560 | 0.1946 | 0.5544 |

Subset macro-F1 deliberately retains all 14 labels, including absent labels. It should not be compared with a subset-only-label score.

## Frequent mistakes

| Actual | Predicted | Count |
| --- | --- | ---: |
| TV-14 | TV-MA | 145 |
| TV-MA | TV-14 | 118 |
| TV-MA | R | 58 |
| TV-PG | TV-14 | 49 |
| TV-14 | TV-PG | 43 |
| TV-PG | TV-MA | 39 |
| R | PG-13 | 32 |
| TV-MA | TV-PG | 31 |

## Qualitative examples

First correct/incorrect examples in source order, without cherry-picking.

| Outcome | Source ID | Title | Actual | Predicted |
| --- | --- | --- | --- | --- |
| correct | s13 | Je Suis Karl | TV-MA | TV-MA |
| correct | s941 | Motu Patlu: Deep Sea Adventure | TV-Y7 | TV-Y7 |
| correct | s730 | Bling Empire - The Afterparty | TV-MA | TV-MA |
| correct | s4 | Jailbirds New Orleans | TV-MA | TV-MA |
| correct | s12 | Bangkok Breaking | TV-MA | TV-MA |
| incorrect | s187 | Hometown Cha-Cha-Cha | TV-14 | TV-MA |
| incorrect | s188 | The Ingenuity of the Househusband | TV-G | TV-MA |
| incorrect | s31 | Ankahi Kahaniya | TV-14 | TV-MA |
| incorrect | s498 | Cat People | TV-14 | TV-PG |
| incorrect | s380 | Tattoo Redo | TV-MA | TV-PG |

Feature summaries in the bundle describe associations, not causal effects. No post-test model changes were made. Historical snapshot, incomplete metadata and label-system inconsistencies limit interpretation. Probabilities remain uncalibrated.
