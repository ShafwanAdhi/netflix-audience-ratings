# Build from this repository root; no source dataset is required.
FROM node:24-bookworm-slim AS web
WORKDIR /lab
RUN npm install --global pnpm@10.30.3
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile
COPY apps/web apps/web
RUN pnpm build

FROM python:3.11-slim-bookworm AS python-build
COPY --from=ghcr.io/astral-sh/uv:0.12.15 /uv /usr/local/bin/uv
WORKDIR /lab
ENV UV_LINK_MODE=copy
COPY pyproject.toml uv.lock ./
COPY packages packages
COPY apps/api apps/api
RUN uv sync --frozen --all-packages --no-dev --no-editable

FROM python:3.11-slim-bookworm AS runtime
WORKDIR /lab
ENV NETFLIX_LAB_ROOT=/lab NETFLIX_TASK_ID=3 PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 MPLCONFIGDIR=/tmp/matplotlib XDG_CACHE_HOME=/tmp/.cache
RUN groupadd --gid 10001 lab && useradd --uid 10001 --gid lab --no-create-home lab
COPY --from=python-build /lab/.venv /lab/.venv
COPY --from=web /lab/apps/web/dist apps/web/dist
COPY artifacts/task-03 artifacts/task-03
COPY reports/dataset-profile.json reports/dataset-profile.json
COPY reports/task-03/dataset-audit.json reports/task-03/dataset-audit.json
COPY deploy/healthcheck.py deploy/validate_bundle.py deploy/
USER 10001:10001
RUN /lab/.venv/bin/python deploy/validate_bundle.py
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD ["/lab/.venv/bin/python", "/lab/deploy/healthcheck.py"]
CMD ["/lab/.venv/bin/python", "-m", "uvicorn", "netflix_api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--proxy-headers", "--forwarded-allow-ips", "*"]
