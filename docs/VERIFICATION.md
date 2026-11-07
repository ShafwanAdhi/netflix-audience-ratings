# RawBlock verification — 2026-11-07

Task 3; active run `20261106T111736917654Z`. Models and immutable evaluation bundles were preserved.

| Current UI verification | Observed result |
| --- | --- |
| TypeScript and production build | Passed |
| Frontend unit tests | 2 passed |
| Playwright | 51 checks passed; no uncaught browser exceptions |
| Ruff | Passed |
| Project verifier | Own artifact ready; dataset and model run identities match; one task registered |
| GitHub upload preflight | Passed; no private raw data, environment files, caches or oversized candidate files |
| Documentation links | All relative Markdown links resolve |
| Responsive checks | 1440, 768, 390 and 320 px; no global horizontal overflow |

Browser checks cover own-task navigation and direct section URLs, About Dataset evidence, real interactive model results, loading of all three self-hosted fonts, square corners, absence of shadows and ornamental icons, keyboard skip/focus, reduced motion, unavailable evidence and not-found states. Other tasks' API routes are absent. Tables scroll locally. Border assertions allow one device pixel of rounding: DPR 1.25 may render 3px as 2.4px and 5px as 4.8px.

[Screenshots and run-bound browser result](../submissions/rawblock/README.md).

Replay against this repository's production preview at port 8000:

```powershell
npx --yes --package @playwright/cli playwright-cli open http://127.0.0.1:8000
npx --yes --package @playwright/cli playwright-cli run-code --filename=scripts/browser-check-rawblock.js
```

Earlier standalone backend verification recorded 7 Python model/API/integrity tests passing with private source data. Those tests were not rerun for this visual change. Separate frozen dependency environments and model run identities remain unchanged. On clones without private data, explicitly source-dependent tests skip.

At the time of the initial UI verification, GitHub CI and Docker builds had not yet run. The subsequent successful Linux application and container checks are recorded in the deployment section below. The baseline verification did not include remote publication, hosting or portal submission.

## Motion enhancement — 2026-11-07

Implemented: direction-aware masked heading entrances, staggered section and register reveals, chart-series reveals, live-result transitions, probability-bar sequencing where applicable, hover elevation and inversion, pointer/keyboard press feedback, and loading/error feedback. Web Animations API owns transient presentation; source values and model outputs are never interpolated. Unsupported browsers keep fully visible content. Route cleanup disconnects observers and cancels owned animations; a live reduced-motion preference change cancels active effects. No new runtime dependency.

Current production build and 2 frontend tests passed. Playwright: 51 regression checks and 27 motion checks passed, with no uncaught browser exceptions. Checks include all five pages, directional navigation, scroll reveals, real task interactions, hover and keyboard activation, runtime reduced motion, and 1440/768/390/320px widths. Independent previews reuse a test origin; the runner clears browser HTTP cache between them. Ruff and GitHub upload preflight passed. ML/backend code and artifacts were not modified, and Python model tests were not rerun for this frontend-only change.

[Motion browser result](../submissions/motion/motion-result.json) · [Regression result](../submissions/motion/regression-result.json) · [Desktop capture](../submissions/motion/desktop-overview.png) · [Mobile capture](../submissions/motion/390px-dataset.png).

To replay after building, start `uv run uvicorn netflix_api.main:app --host 127.0.0.1 --port 8765`, then use a second terminal:

```powershell
npx --yes --package @playwright/cli playwright-cli open http://127.0.0.1:8765
npx --yes --package @playwright/cli playwright-cli run-code --filename=scripts/browser-check-motion.js
```

## Docker deployment preparation ? 2026-11-07

Implemented: independent multi-stage image, frozen non-editable Python installation, bundled React SPA and selected artifacts, non-root/read-only runtime, resource limits, rotating logs, localhost-only Compose binding, run-bound health check, Nginx subdomain site, and commit/timestamp-tagged deploy helper with previous-image rollback. No private source dataset is copied. The container verification workflow builds the image, tests Nginx syntax and waits for container readiness; its successful run is linked below.

Verified locally: all four Compose configurations parse and use distinct localhost ports; Bash syntax checks pass; the build-time bundle validator passes against the existing local Python environment and built SPA. Three mocked orchestration scenarios pass per task: build-before-replace, recovery after failed readiness, and manual previous-image rollback. Ruff and upload preflight pass. These are configuration and orchestration checks, not real container execution.

VPS read-only inspection confirmed Docker Compose, host Nginx, public HTTP/HTTPS listeners and unused ports 8303?8306. No remote files, containers, Nginx sites, DNS or certificates were modified. Docker Desktop's Linux engine was unavailable locally; actual Linux Docker build and runtime verification were completed in GitHub Actions instead. See [deployment guide](DEPLOYMENT.md).

The first Linux CI build exposed historical Git line-ending normalization of checksum-protected JSON/CSV artifacts. `.gitattributes` now preserves original artifact bytes, and a Git-index byte-integrity regression test validates the exported manifest and every listed file. Local artifact contents, checksum values and model run IDs were preserved; Git blobs were restored to those original bytes. Container and standard CI both passed after this correction.

Verified Linux execution: image build including non-root bundle validation passed; Nginx site syntax passed; the read-only/resource-limited Compose container reached healthy state; direct SPA `/dataset` and API health smoke requests passed. Standard application CI also passed. This verifies the container on the GitHub runner, not its deployment to the VPS or production load capacity.

[Successful container workflow](https://github.com/ShafwanAdhi/netflix-audience-ratings/actions/runs/42369436274) ? [Successful application CI](https://github.com/ShafwanAdhi/netflix-audience-ratings/actions/runs/42369436261) ? [Machine-readable evidence](../submissions/deployment/verification.json).

## VPS production deployment ? 2026-11-07

Live: [https://netflix-audience-ratings.shafwan.digital](https://netflix-audience-ratings.shafwan.digital). One Docker container serves frontend/API behind host Nginx; only localhost port 8303 is bound. Public HTTP redirects to HTTPS. TLS certificate validation, task/model identity and dataset/model run consistency passed. Certbot renewal timer is active.

Playwright against the public HTTPS origin: **51 checks passed**, no uncaught browser exceptions; all five sections, real task interactions, keyboard/reduced-motion behavior and 1440/768/390/320px layout checks. Controlled dataset-503 fixtures are browser-only. Other VPS applications remained running. No load, failover or certificate-renewal dry-run test is claimed.

[Run/container/browser evidence](../submissions/deployment/production/verification.json) ? [Desktop capture](../submissions/deployment/production/desktop-overview.png) ? [Mobile capture](../submissions/deployment/production/390px-dataset.png).

Production verification exposed a missing Overview audit in the image. The image now includes `reports/task-03/dataset-audit.json`, and both the build validator and health check verify it. A CI request also checks the Overview endpoint. The production memory limit was raised to 768 MiB based on observed use. The incomplete first image is excluded from the saved rollback target; the corrected release is the first good production baseline.

## Semantic data visualization audit - 2026-11-08

The neutral RawBlock frame now permits semantic data colors. Every task page was reviewed; legends, values and point/line styles complement color. See the [color contract](architecture/data-visualization.md) and [current local evidence](../submissions/data-visualization/README.md). This task passed its build, 2 frontend tests, 51 full UI regression checks and 22 visualization checks. Saved model/checksum identities are unchanged. Earlier sections above describe historical releases.

## Mobile usability audit - 2026-11-08

This release adds touch-target, form-text, active-tab and dense-chart improvements. Build and frontend tests pass; 167 dedicated mobile checks passed across six viewport sizes with real API interactions. See [mobile behavior](architecture/mobile.md) and [recorded evidence](../submissions/mobile/README.md). Prior source hashes and screenshots describe historical snapshots. No model artifacts were changed.
