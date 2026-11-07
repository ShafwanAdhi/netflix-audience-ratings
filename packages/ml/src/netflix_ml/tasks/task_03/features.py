"""Fold-fitted metadata encoder; the API and experiments use this exact transformer."""

import numpy as np
import pandas as pd
from scipy import sparse
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_extraction import DictVectorizer
from sklearn.preprocessing import StandardScaler
from sklearn.utils.validation import check_is_fitted

CORE = ["type", "country", "release_year", "duration", "listed_in"]


def tokens(value: str) -> list[str]:
    return sorted({v.strip() for v in str(value).split(",") if v.strip()})


class MetadataEncoder(TransformerMixin, BaseEstimator):
    def __init__(self, director: bool = False):
        self.director = director

    def _rows(self, frame):
        rows, numeric = [], []
        for _, row in frame.iterrows():
            fields = {"type=" + row["type"]: 1.0}
            for field, column in [("country", "country"), ("genre", "listed_in")]:
                for token in tokens(row[column]):
                    fields[f"{field}={token}"] = 1.0
            if self.director:
                for token in tokens(row.get("director", "Not Given")):
                    fields[f"director={token}"] = 1.0
            value = int(str(row["duration"]).split()[0])
            movie = row["type"] == "Movie"
            numeric.append([float(row["release_year"]), value if movie else 0, 0 if movie else value])
            rows.append(fields)
        return rows, np.asarray(numeric)

    def fit(self, X, y=None):
        rows, numeric = self._rows(X)
        self.vectorizer_ = DictVectorizer(sparse=True).fit(rows)
        self.scaler_ = StandardScaler().fit(numeric)
        self.n_features_in_ = len(CORE) + int(self.director)
        return self

    def transform(self, X):
        check_is_fitted(self, ["vectorizer_", "scaler_"])
        rows, numeric = self._rows(X)
        return sparse.hstack(
            [self.vectorizer_.transform(rows), sparse.csr_matrix(self.scaler_.transform(numeric))],
            format="csr",
        )

    def get_feature_names_out(self, input_features=None):
        return np.append(
            self.vectorizer_.get_feature_names_out(), ["release_year", "duration_minutes", "season_count"]
        )


def input_frame(request: dict) -> pd.DataFrame:
    duration = request["duration"]
    unit = "min" if duration["unit"] == "minutes" else "Seasons"
    return pd.DataFrame(
        [
            {
                "type": request["content_type"],
                "release_year": request["release_year"],
                "country": ", ".join(request["countries"]) or "Not Given",
                "listed_in": ", ".join(request["genres"]),
                "duration": f"{duration['value']} {unit}",
                "director": request.get("director") or "Not Given",
            }
        ]
    )
