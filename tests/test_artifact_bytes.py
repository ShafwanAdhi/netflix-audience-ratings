"""Verify the bytes Git actually exports, independently of Windows checkout conversion."""

import hashlib
import json
import subprocess

from netflix_ml.shared.io import root


def test_git_index_preserves_immutable_bundle_bytes():
    base = root()
    project = json.loads((base / "project.json").read_text())
    prefix = f"artifacts/task-{project['task_id']:02d}"

    def blob(name):
        return subprocess.check_output(["git", "show", f":{name}"], cwd=base)

    pointer = json.loads(blob(f"{prefix}/active.json"))
    bundle = f"{prefix}/{pointer['run_id']}"
    manifest = blob(f"{bundle}/checksums.json")
    assert hashlib.sha256(manifest).hexdigest() == pointer["checksums_sha256"]
    for name, expected in json.loads(manifest).items():
        assert hashlib.sha256(blob(f"{bundle}/{name}")).hexdigest() == expected, name
