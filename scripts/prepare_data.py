"""Prepare the immutable source snapshot and frozen split manifests."""

import argparse
from pathlib import Path

from netflix_ml.tasks.task_03.data import prepare

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--input", type=Path, default=Path("data/raw/Dataset.csv"))
args = parser.parse_args()
print(prepare(args.input))
