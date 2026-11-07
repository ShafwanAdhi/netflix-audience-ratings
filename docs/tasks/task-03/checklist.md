# Task 3 completion checklist

## Implemented

- [x] Requirement matrix covers the five workflow steps, skills and slide 12 submission/evaluation items.
- [x] Original audit preserved; raw source hash, placeholder counts and exact duplicate mapping recorded.
- [x] Additional repeated entities and conflicting labels reviewed and kept group-disjoint.
- [x] Fixed holdout and six CV fold memberships saved with all-label support.
- [x] Fold-fitted pipeline excludes target, title and ID; units remain distinct.
- [x] Dummy, LR, DT and RF defaults/tuning compared; director ablation recorded.
- [x] CV selection frozen before test; actual final predictions and all-14-label metrics saved.
- [x] Shared saved pipeline powers the API and CLI; startup validates artifact identity/integrity.
- [x] React workspace includes real task navigation, prediction, evaluation, methodology and honest planned pages.
- [x] English setup, architecture, API, dataset, model and submission documentation provided.

## Verification

Machine-readable checks and browser evidence are recorded in `submissions/task-03/verification.json` and `browser-verification.json`. Run `pnpm verify` to check package consistency. File presence is not equivalent to a passed browser check.

- Data/CV invariants, unknown categories, serialization and API parity: pytest.
- Form validation and duration reset: Vitest/Testing Library.
- Frontend type safety and production bundle: pnpm build.
- Python quality: Ruff.
- Browser task links, real predictions, viewports, focus, reduced motion and states: browser verification report.
- Submission screenshots: screenshot index and manifest.

## External or optional steps

- [ ] Public GitHub repository: not created; conditional under slide 12.
- [ ] Demonstration video: not recorded; optional; demo script provided.
- [ ] Portal/form: official destination not supplied; do not invent it.
- [ ] Actual portal submission and receipt: not performed.
- [ ] Public deployment: outside first release.

No benchmark score threshold is imposed by the supplied PDF. Weak minority-class performance is reported honestly rather than hidden by relabeling or test-driven optimization.
