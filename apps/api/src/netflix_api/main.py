"""Standalone Task 3 API. Only this task is imported and served."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from netflix_ml.shared.io import read_json, root
from netflix_ml.tasks.task_03.data import MEANINGS
from netflix_ml.tasks.task_03.predict import load_active

from netflix_api.dataset import router as dataset_router
from netflix_api.schemas import Evaluation, Metadata, Overview, PredictionRequest, PredictionResponse


def create_app(load_model=True):
    @asynccontextmanager
    async def lifespan(app):
        app.state.predictor = None
        app.state.active_service = None
        if load_model:
            try:
                value = load_active()
                app.state.predictor = value
                app.state.active_service = value
            except (OSError, ValueError, KeyError) as exc:
                logging.getLogger(__name__).warning("Artifact unavailable: %s", exc)
        yield

    app = FastAPI(title="Audience Rating Classification", version="2.0.0", lifespan=lifespan)
    app.include_router(dataset_router)

    @app.exception_handler(RequestValidationError)
    async def validation_error(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "code": "invalid_input",
                "message": "Check input fields",
                "field_errors": [
                    {"field": ".".join(map(str, e["loc"])), "message": e["msg"]} for e in exc.errors()
                ],
            },
        )

    @app.get("/api/v1/health")
    def health():
        value = app.state.active_service
        return {
            "status": "ok",
            "task_id": 3,
            "artifact_ready": value is not None,
            "task_3_ready": value is not None,
            "run_id": value.metadata["run_id"] if value else None,
        }

    @app.get("/api/v1/tasks")
    def tasks():
        return [
            {
                "id": 3,
                "title": "Audience Rating Classification",
                "status": "ready" if app.state.active_service else "not_ready",
            }
        ]

    def predictor():
        value = getattr(app.state, "predictor", None)
        if value is None:
            raise HTTPException(
                503, detail="Validated model bundle is unavailable. Prepare, train and evaluate first."
            )
        return value

    @app.get("/api/v1/tasks/3/overview", response_model=Overview)
    def overview():
        try:
            audit = read_json(root() / "reports/task-03/dataset-audit.json")
        except OSError as exc:
            raise HTTPException(503, detail="Dataset audit is unavailable") from exc
        return {
            **audit,
            "run_id": predictor().metadata["run_id"],
            "cleaned_rows": audit["rows_after_content_deduplication"],
            "duplicate_rows_removed": audit["duplicate_content_rows_excluding_id"],
            "repeated_entities": 4,
        }

    @app.get("/api/v1/tasks/3/metadata", response_model=Metadata)
    def metadata():
        return {**predictor().metadata, "meanings": MEANINGS}

    @app.get("/api/v1/tasks/3/evaluation", response_model=Evaluation)
    def evaluation():
        return predictor().evaluation

    @app.post("/api/v1/tasks/3/predict", response_model=PredictionResponse)
    def predict(body: PredictionRequest):
        return predictor().predict(body.model_dump())

    web = root() / "apps/web/dist"
    if (web / "assets").exists():
        app.mount("/assets", StaticFiles(directory=web / "assets"), name="assets")

        @app.get("/{path:path}", include_in_schema=False)
        def frontend(path: str):
            if path.startswith("api/"):
                raise HTTPException(404, detail="Unknown API endpoint")
            requested = (web / path).resolve()
            if requested.is_relative_to(web.resolve()) and requested.is_file():
                return FileResponse(requested)
            route_html = requested / "index.html"
            if route_html.is_relative_to(web.resolve()) and route_html.is_file():
                return FileResponse(route_html)
            return FileResponse(web / "index.html")

    return app


app = create_app()
