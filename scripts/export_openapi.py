from netflix_api.main import create_app
from netflix_ml.shared.io import root, write_json

write_json(root() / "docs/architecture/openapi.json", create_app(load_model=False).openapi())
print("OpenAPI schema exported; run pnpm --filter @lab/web generate:types")
