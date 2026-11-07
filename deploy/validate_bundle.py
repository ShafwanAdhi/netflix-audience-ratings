"""Fail the image build if the selected bundle or dataset evidence is invalid."""

import asyncio
import json
import os
from pathlib import Path

from netflix_api.main import create_app


async def validate():
    app = create_app()
    async with app.router.lifespan_context(app):
        service = app.state.active_service
        assert service is not None, "Selected model bundle is unavailable"
        base = Path(os.environ["NETFLIX_LAB_ROOT"])
        profile = json.loads((base / "reports/dataset-profile.json").read_text())
        assert profile["run_id"] == service.metadata["run_id"], "Dataset run mismatch"
        assert profile["task_id"] == int(os.environ["NETFLIX_TASK_ID"]), "Wrong task bundle"
        assert (base / "apps/web/dist/index.html").is_file(), "Built frontend is absent"
        print(f"Validated task {profile['task_id']}, run {profile['run_id']}")


asyncio.run(validate())
