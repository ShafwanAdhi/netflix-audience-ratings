# Architecture and operation

```mermaid
flowchart LR
    UI[React single-task workspace] --> API[FastAPI]
    API --> D[Run-bound dataset profile]
    API --> B[Validated Task 3 bundle]
    CLI[Offline training CLI] --> B
```

The API imports only Task 3. `/api/v1/tasks` contains one entry; other task APIs return 404. Browser links are real URLs without task switching. API versioned task paths remain stable for compatibility; generated TypeScript schemas come from this repository's OpenAPI document.

The ML package retains task-specific module paths required by joblib. Shared source validation is independent of other tasks. Fitting never runs in an HTTP request. Only trusted local bundles are loaded; no upload endpoint is provided. Checksums validate each immutable run and the dataset profile must match the active run ID.

## Deployment preparation

See [Docker / VPS deployment](DEPLOYMENT.md) for the production image, isolated Compose service, localhost port 8303, existing host Nginx, subdomain/HTTPS setup, updates and rollback. No raw data or training is required to serve the included validated bundle. The API serves the built SPA and `/api` under one origin; unknown API paths remain 404. Container build/runtime verification is recorded separately from configuration preparation.

## Troubleshooting

- Artifact unavailable: inspect active pointer, bundle checksums and startup logs; do not retrain through the API.
- Dataset unavailable after training: run `uv run python scripts/refresh_dataset.py` and restart the API.
- Port occupied: stop the other task's development server before `pnpm dev`.
- Raw data missing: put the original supplied CSV at `data/raw/Dataset.csv`; verify the source hash in About Dataset.
- No `pnpm` command: use `corepack pnpm` or install the pinned pnpm version with npm.

## Evidence provenance

Copied task reports/notebooks preserve the original experiments and run identities. Historical references to the former combined application describe that original delivery, not new screenshots. New browser evidence belongs in `output/playwright` and must be identified as the standalone baseline or subsequent redesign. No old screenshot is relabeled as new evidence.
