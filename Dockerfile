# Build with: docker build -t netflix-ml-lab .
FROM node:24-bookworm-slim AS web
WORKDIR /lab
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile
COPY apps/web apps/web
RUN pnpm build

FROM python:3.11-slim AS runtime
COPY --from=ghcr.io/astral-sh/uv:0.12.15 /uv /usr/local/bin/uv
WORKDIR /lab
COPY pyproject.toml uv.lock pnpm-workspace.yaml ./
COPY packages packages
COPY apps/api apps/api
RUN uv sync --frozen --all-packages --no-dev
COPY --from=web /lab/apps/web/dist apps/web/dist
COPY reports reports
COPY artifacts/task-03 artifacts/task-03
RUN useradd --create-home lab
USER lab
ENV NETFLIX_LAB_ROOT=/lab
EXPOSE 8000
HEALTHCHECK --interval=30s --start-period=40s CMD ["/lab/.venv/bin/python", "-c", "import urllib.request,json; h=json.load(urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health')); assert h['artifact_ready']"]
CMD ["/lab/.venv/bin/python", "-m", "uvicorn", "netflix_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
