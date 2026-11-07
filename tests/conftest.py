import pytest
from netflix_ml.shared.io import root


def pytest_collection_modifyitems(items):
    # Raw/processed data are private and intentionally absent on a clean GitHub clone.
    for item in items:
        if (("prepared" in item.fixturenames or item.name == "test_bad_duration_contract_rejected") and not (root() / "data/raw/Dataset.csv").exists()) or (
            "data" in item.fixturenames and not (root() / "data/processed/task-03/cleaned.csv").exists()
        ):
            item.add_marker(pytest.mark.skip(reason="Requires locally supplied private source/prepared data"))
