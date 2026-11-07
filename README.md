# Audience Rating Classification

Standalone Task 3 internship application. This repository contains only this task's React frontend, FastAPI backend, ML package and selected immutable artifact bundle. Other tasks are independent repositories.

## Status

- Implemented: task workspace, About Dataset, audited variable rationale, actual preparation/split/segment outcomes, model evaluation and interactive results.
- Interface: responsive RawBlock layout with self-hosted fonts and semantic chart colors and labelled legends; see [verification and screenshots](docs/VERIFICATION.md).
- Repository: independent application, model artifacts and verification workflow.
- Active model run: `20261106T111736917654Z`. See `artifacts/task-03/active.json` for the current run.

- Motion: staged page/scroll reveals, chart and result transitions, hover/press feedback, and live reduced-motion support.

## Live application

[Open Task 3](https://netflix-audience-ratings.shafwan.digital) ? deployed with Docker, Nginx and HTTPS. [Production verification](submissions/deployment/production/verification.json).

## Quickstart

Install Node 24, Python 3.11, Git and uv. In this repository's root:

```powershell
corepack enable
corepack pnpm install --frozen-lockfile
uv sync --frozen --all-packages
corepack pnpm dev
```

Open http://127.0.0.1:5173. API docs: http://127.0.0.1:8000/docs. Stop both services with Ctrl+C. Run one repository at a time with these default ports.
The included validated bundle supports inference without the raw CSV. Training needs your own supplied `data/raw/Dataset.csv`, excluded from Git.

## Reproduce and verify

```powershell
uv run python scripts/prepare_data.py
uv run python scripts/build_eda.py
uv run python scripts/train.py
uv run python scripts/evaluate.py
uv run python scripts/refresh_dataset.py
corepack pnpm types
uv run ruff check .
uv run pytest
corepack pnpm test
corepack pnpm build
corepack pnpm verify
```

Training creates a new immutable run; regenerate the dataset profile whenever activating another run. The API refuses a stale profile. No performance values are invented by the frontend.

## Structure and documentation

- `apps/web`: single-task frontend; `/overview`, `/dataset`, task action, `/evaluation`, `/methodology`.
- `apps/api`: HTTP validation, artifact serving and `/api/v1/dataset`.
- `packages/ml`: shared utilities plus Task 3 only; serialized class paths retained for artifact compatibility.
- `artifacts/task-03`: one selected run, checksums and active pointer.
- `reports/dataset-profile.json`: run-bound source, variables, decisions and intermediate outcomes.
- [Standalone verification](docs/VERIFICATION.md)
- [Docker / VPS deployment](docs/DEPLOYMENT.md)
- [Architecture and deployment](docs/ARCHITECTURE.md)
- [Task evidence and provenance](docs/tasks/task-03/)

Independent educational project; not affiliated with Netflix. This is a historical 2021 catalog snapshot, not a current data service. Models describe metadata associations, not causation. Raw-data redistribution rights are not assumed.

Data visualization: [semantic colors and accessibility](docs/architecture/data-visualization.md).
