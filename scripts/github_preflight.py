"""Check GitHub upload boundaries without staging files or making network calls."""

import subprocess
from pathlib import Path

base = Path(__file__).resolve().parents[1]
result = subprocess.run(
    ["git", "ls-files", "--cached", "--others", "--exclude-standard"],
    cwd=base,
    check=True,
    capture_output=True,
    text=True,
)
paths = sorted(set(result.stdout.splitlines()))
forbidden = {"node_modules", ".venv", ".cache", "__pycache__"}
for name in paths:
    path = base / name
    assert not forbidden.intersection(path.parts), f"Dependency/cache tracked: {name}"
    assert name != ".env" and not name.startswith(("data/raw/", "data/processed/")), (
        f"Private data/env tracked: {name}"
    )
    assert path.stat().st_size < 90 * 1024 * 1024, f"Use Git LFS or a release asset for {name}"
print(
    f"Checked {len(paths)} candidate files. No private raw data, env files, caches or oversized files found."
)
print("Visibility and publishing rights still need the repository owner's review. Nothing was uploaded.")
