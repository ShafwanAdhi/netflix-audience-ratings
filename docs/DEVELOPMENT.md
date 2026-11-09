# Local development

Use Node 24, Python 3.11, Git, uv and the pnpm version pinned in `package.json`.

```powershell
corepack enable
corepack pnpm install --frozen-lockfile
uv sync --frozen --all-packages
corepack pnpm dev
```

Open http://127.0.0.1:5173. Vite proxies `/api` to FastAPI at port 8000. API documentation is at http://127.0.0.1:8000/docs. Ctrl+C stops both development processes. Default ports must be available.

## Reproduce and validate

The included saved bundle supports local inference without the raw CSV. To prepare or train, provide `data/raw/Dataset.csv` matching the hash documented in the dataset card. The raw source is excluded from version control.

```powershell
uv run python scripts/prepare_data.py
uv run python scripts/build_eda.py
uv run python scripts/train.py
uv run python scripts/evaluate.py
uv run python scripts/refresh_dataset.py
corepack pnpm types
uv run ruff check .
corepack pnpm test
corepack pnpm build
uv run pytest
corepack pnpm verify
```

Training is offline and creates a new run. Refresh the dataset profile after activating a new bundle, then restart the API. Never choose a model by repeatedly consulting final test results. Review [methodology](project/methodology.md) before changing experiment configuration.

## Configuration and troubleshooting

- Use `.env.example` for documented local options and `deploy/production.env.example` for deployment settings. Keep private environment files out of Git.
- Unavailable model: check the active pointer, bundle checksums, locked dependencies and startup logs.
- Unavailable dataset profile: run `uv run python scripts/refresh_dataset.py` and restart the API.
- Occupied port: stop the process using the frontend/API port before starting development.
- Missing `pnpm`: use `corepack pnpm` or install the pinned pnpm version with npm.
- API request during startup: wait for `/api/v1/health` readiness, then retry the page.

For browser replay see [verification](VERIFICATION.md). For the production container see [deployment](DEPLOYMENT.md).

## Portfolio evidence and sharing metadata

`data/provenance.json` is the source investigation record; it is not a license grant. After updating it, run `uv run python scripts/refresh_dataset.py`. The generator rejects a source hash that differs from the active artifact. Never infer the acquisition date from `date_added`.

Update only the marked README results with `corepack pnpm readme:results`; validate without writing with `corepack pnpm readme:check`. These commands verify bundle checksums, source provenance and active run identity. Narrative and screenshots remain reviewable editorial material.

The frontend's `project-meta.json` defines production origin and five route summaries. `corepack pnpm build` generates initial route HTML, so link preview metadata is available without JavaScript. React updates the same metadata during client navigation. Query strings and fragments do not enter canonical URLs. The committed `social-preview.png` is a 1200 × 630 project illustration, not a performance chart.

Build before running pytest: static-delivery tests inspect real route HTML and image responses. Local browser evidence for the portfolio revision is indexed in [verification](VERIFICATION.md). Source CSS preserves semantic chart colors and reduced-motion behavior.
