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

CI is configured but has not run on GitHub. Docker configuration is supplied but was not built in this session. The baseline verification did not include remote publication, hosting or portal submission.

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

Implemented: independent multi-stage image, frozen non-editable Python installation, bundled React SPA and selected artifacts, non-root/read-only runtime, resource limits, rotating logs, localhost-only Compose binding, run-bound health check, Nginx subdomain site, and commit/timestamp-tagged deploy helper with previous-image rollback. No private source dataset is copied. The container verification workflow builds the image, tests Nginx syntax and waits for container readiness; it has not been run for this change.

Verified locally: all four Compose configurations parse and use distinct localhost ports; Bash syntax checks pass; the build-time bundle validator passes against the existing local Python environment and built SPA. Three mocked orchestration scenarios pass per task: build-before-replace, recovery after failed readiness, and manual previous-image rollback. Ruff and upload preflight pass. These are configuration and orchestration checks, not real container execution.

VPS read-only inspection confirmed Docker Compose, host Nginx, public HTTP/HTTPS listeners and unused ports 8303?8306. No remote files, containers, Nginx sites, DNS or certificates were modified. Docker Desktop's Linux engine was unavailable locally, so image build, runtime limits and real container health remain unverified until the documented workflow or operator build runs. See [deployment guide](DEPLOYMENT.md).

The first Linux CI build exposed historical Git line-ending normalization of checksum-protected JSON/CSV artifacts. `.gitattributes` now preserves original artifact bytes, and a Git-index byte-integrity regression test validates the exported manifest and every listed file. Local artifact contents, checksum values and model run IDs were preserved; Git blobs were restored to those original bytes. Container and standard CI are being rerun after this correction.
