"""Meaningful data, CV and fitted-transformer invariants."""

import joblib
import numpy as np
import pandas as pd
import pytest
from netflix_ml.shared.io import root
from netflix_ml.tasks.task_03.data import LABELS, validate
from netflix_ml.tasks.task_03.features import CORE, MetadataEncoder


@pytest.fixture(scope="module")
def data():
    return pd.read_csv(root() / "data/processed/task-03/cleaned.csv")


def test_split_and_cv_are_disjoint(data):
    assert len(data) == 8787
    train, test = data[data.split == "train"], data[data.split == "test"]
    assert (len(train), len(test)) == (7029, 1758)
    assert not set(train.entity_key) & set(test.entity_key)
    assert set(train.rating) == set(test.rating) == set(LABELS)
    manifest = pd.read_csv(root() / "data/splits/task-03/cv_manifest.csv")
    lookup = data.set_index("show_id")
    for _, fold in manifest.groupby("fold"):
        fit = lookup.loc[fold.loc[fold.role == "fit", "show_id"]]
        validation = lookup.loc[fold.loc[fold.role == "validation", "show_id"]]
        assert not set(fit.entity_key) & set(validation.entity_key)
        assert set(fit.rating) == set(validation.rating) == set(LABELS)
        assert set(fit.index) | set(validation.index) == set(train.show_id)


def test_unknown_categories_do_not_change_vocabulary(data, tmp_path):
    sample = data[data.split == "train"].head(20)[CORE + ["director"]].copy()
    encoder = MetadataEncoder().fit(sample)
    names = encoder.get_feature_names_out().copy()
    sample.loc[sample.index[0], "country"] = "Unseen Country"
    encoded = encoder.transform(sample)
    assert encoded.shape[1] == len(names)
    assert np.array_equal(names, encoder.get_feature_names_out())
    assert not any("rating" in name or "show_id" in name for name in names)
    joblib.dump(encoder, tmp_path / "encoder.joblib")
    assert np.allclose(
        encoded.toarray(), joblib.load(tmp_path / "encoder.joblib").transform(sample).toarray()
    )


def test_bad_duration_contract_rejected():
    raw = pd.read_csv(root() / "data/raw/Dataset.csv")
    raw.loc[0, "duration"] = "3 Seasons"
    with pytest.raises(ValueError, match="unit"):
        validate(raw)
