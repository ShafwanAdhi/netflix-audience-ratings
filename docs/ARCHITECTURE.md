# Application architecture

```mermaid
flowchart LR
    UI[React workspace] --> API[FastAPI]
    API --> D[Run-bound dataset profile]
    API --> B[Validated model bundle]
    CLI[Offline experiment CLI] --> B
```

`apps/web` owns navigation, forms and charts. `apps/api` validates HTTP requests and serves the built frontend and saved results under one origin. `packages/ml` owns preparation, offline experiments and inference. The API and command-line tools import the same implementation.

## HTTP contract

Health is exposed at `/api/v1/health`; dataset documentation is served at `/api/v1/dataset`. The established model endpoint prefix is `/api/v1/tasks/3`. The registry `/api/v1/tasks` contains the current project. These are literal API paths; generated TypeScript types come from [OpenAPI](architecture/openapi.json).

The frontend routes are `/overview`, `/dataset`, `/predict`, `/evaluation` and `/methodology`. Unknown pages show a not-found view; unknown API paths return HTTP 404. Invalid model inputs return HTTP 422; unavailable artifacts return HTTP 503.

## Artifact lifecycle

Offline commands create a new immutable run under `artifacts/task-03/`. An active pointer selects a checksummed bundle. Startup validates identity, dependencies and integrity before loading trusted joblib files. The dataset profile must match the active model run. HTTP requests never train models or modify reports.

Serialized Python module paths and storage keys remain stable so existing saved models can be loaded. Figures, notebooks and reports record the run used for their results; changing documentation does not create a new experiment.

## Operation

See [development](DEVELOPMENT.md) for setup and troubleshooting, [deployment](DEPLOYMENT.md) for Docker/HTTPS and rollback, and [verification](VERIFICATION.md) for recorded checks. No database, authentication service, public upload or runtime training service is required.
