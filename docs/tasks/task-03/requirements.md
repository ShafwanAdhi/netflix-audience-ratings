# Requirements-to-evidence matrix

Source: supplied *MACHINE LEARNING TASK LIST (1).pdf*, slides 4, 5, 8 and 12. Slide 12 lists possible evaluation parameters, not numerical weights or a required accuracy threshold. The saved slide image is a requirement reference, not a completion screenshot.

| ID | Document requirement | Implementation / evidence |
| --- | --- | --- |
| T3-01 | Analyze rating categories | Training-only executed EDA, overview distribution, dataset/model cards |
| T3-02 | Prepare training datasets | `data.py`, cleaning log, source hash, frozen split/CV manifests, integrity tests |
| T3-03 | Train classification models | Dummy, LR, DT, RF; run candidate models and CV table |
| T3-04 | Optimize model performance | Bounded search CSVs, best params, recorded director ablation |
| T3-05 | Evaluate prediction accuracy | Frozen evaluation JSON, test predictions, accuracy/F1/report/matrices |
| T3-06 | Model comparison; Decision Trees, Random Forest, metrics, tuning | Default/tuned experiments, final model table, selection record |
| SUB-01 | Project Source Code | Workspace code, generated API types, lockfiles, config, tests and quickstart |
| SUB-02 | Screenshots of Completed Tasks | Submission screenshot index with real browser captures and run ID |
| SUB-03 | GitHub link, if available | Not published in this local release; optional/conditional status documented |
| SUB-04 | Demonstration video, optional | Demo script supplied; recording not required and not claimed |
| SUB-05 | Separate submission form/portal | Package/manifest prepared; official URL and fields remain unavailable |
| EVA-01 | Task Completion | End-to-end Task 3, evidence matrix, completion checklist |
| EVA-02 | Code Quality | Module boundaries, schema-generated types, Ruff/pytest/Vitest/build checks |
| EVA-03 | Website Responsiveness | Desktop/tablet/mobile browser verification and screenshot evidence |
| EVA-04 | User Interface Design | Consistent research workspace, responsive task navigation, accessible labels/states |
| EVA-05 | Creativity & Implementation | Top probabilities, support context, inspectable evaluation/error analysis |
| EVA-06 | Professional Presentation | English documentation, report/model card, indexed screenshots, demo script |
| EVA-07 | Project Functionality | Real pipeline via API, CLI/API parity, valid/invalid inference checks |
| PRO-01 | Original work and organized folders | Explicit implementation decisions, library/source attribution, task-owned modules |

Any checked completion claim must have actual verification evidence. Tasks 3 and 4 are independently implemented with separate evidence matrices. Task 5 has independent implemented evidence. Task 6 is independently implemented; see its requirements matrix and current evidence.
