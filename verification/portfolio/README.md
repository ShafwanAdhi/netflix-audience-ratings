# Local portfolio verification

Recorded on 2026-11-09. This is an uncommitted local portfolio revision, not a production deployment. The live-demo link in the project README refers to the existing public deployment and does not establish that this revision is online.

## Identity and integrity

- Active evidence run: `20261106T111736917654Z`.
- [Working-tree source identity](source-manifest.json) records the baseline commit and SHA-256 values of relevant source files. Generated verification evidence is excluded to avoid self-reference.
- All artifact and split file paths and SHA-256 values were compared against the clean baseline. No added, removed or modified immutable files were found.
- Source dataset remains excluded from Git; no model training or reselection was performed.

## Browser results

[90 passing Chromium checks](browser-results.json), with no uncaught JavaScript errors. Checks cover the five routes at 390, 768 and 1440 px, active-run consistency, unavailable/loading/mismatch states, initial and navigated metadata, and project-specific interactions. Ratings and Analytics include example inputs, prediction, stale-result clearing and keyboard selection. Analytics also checks estimator deep-link focus.

Screenshots use reduced motion and a local production frontend served by FastAPI. They were visually reviewed. These are desktop-browser viewport checks, not physical-device, WebKit or Firefox verification. Previous production verification remains separately recorded in [the project verification document](../../docs/VERIFICATION.md).

## Screenshots

| Image | Caption | Evidence run |
| --- | --- | --- |
| [overview-desktop.png](overview-desktop.png) | Overview at 1440 px: question, measured finding, decision and interpretation boundary before dataset counts. | `20261106T111736917654Z` |
| [overview-tablet.png](overview-tablet.png) | Overview at 768 px: responsive editorial content and data visualization. | `20261106T111736917654Z` |
| [overview-mobile.png](overview-mobile.png) | Overview at 390 px: readable project narrative, action links and locally scrolling tables where necessary. | `20261106T111736917654Z` |
| [mobile-selector.png](mobile-selector.png) | Searchable genre selector at 390 px: focused search, native checkboxes and viewport-contained popover. | `20261106T111736917654Z` |

## Replay

From this repository root, install dependencies and build as documented in the README. In a separate terminal, run:

```powershell
uv run uvicorn netflix_api.main:app --host 127.0.0.1 --port 8765
```

Then run:

```powershell
New-Item -ItemType Directory -Force output/playwright/portfolio
npx --yes --package @playwright/cli playwright-cli open about:blank
npx --yes --package @playwright/cli playwright-cli run-code --filename=scripts/browser-check-portfolio.js
npx --yes --package @playwright/cli playwright-cli close
```

The replay uses port 8765; this captured run used isolated ports 8103?8106 with the otherwise identical checked-in script. Review newly captured images before replacing these records.

## Command verification and remaining limitation

[Command outcomes](command-results.json) and adjacent text logs record backend tests, lint, README consistency, application readiness, working-tree whitespace and the image's bundle-validation script executed locally. Frontend tests and production builds were also run successfully; see [the check summary](checks.json).

An attempted simultaneous backend test rerun exhausted the Windows paging file. Verification servers were stopped and backend checks were rerun sequentially; those sequential results are the recorded outcomes.

**Docker build and container smoke test remain unverified for this revision.** Docker Desktop returned HTTP 500 from its engine API, including `docker info`. Existing unrelated containers and Docker Desktop were not restarted. Local FastAPI serving and the bundle preflight passed, but they do not replace container verification. Once Docker is healthy, run the Docker build and smoke checks in the deployment guide before release.

No Git push or VPS deployment was performed.
