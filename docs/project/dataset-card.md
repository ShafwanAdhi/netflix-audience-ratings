# Audience Ratings: dataset card

## Source

User-provided `Dataset.csv`, 8,790 rows and 10 columns. The original audit is preserved byte-for-byte under `reports/task-03/dataset-audit.json`, including its original local source path. That historical path is provenance, not a runtime dependency. Upstream identity and redistribution rights are unverified.

## Data dictionary

| Column | Meaning | Modeling use |
| --- | --- | --- |
| show_id | Source row identity | Manifest only |
| type | Movie or TV Show | Indicator |
| title | Content title | Display/entity review only |
| director | Director metadata | CV-tested ablation; unknown supported |
| country | Country metadata | Multi-label indicators |
| date_added | Catalog addition date | Audit only |
| release_year | Original release year | Numeric |
| rating | Original content classification | Target only, 14 labels |
| duration | Minutes or season count | Separate numeric fields |
| listed_in | Genre/category labels | Multi-label indicators |

## Quality and coverage

- 6,126 Movies and 2,664 TV Shows; release years 1925–2021.
- Catalog additions end September 25, 2021; the snapshot does not capture all titles ever carried or removed titles.
- No null parser cells, but 2,588 `Not Given` directors and 287 `Not Given` countries.
- Three exact-content duplicates removed; 8,787 rows remain.
- Four additional repeated entities found through case/space-normalized title/type/year review. They are kept training-only and grouped during CV. One entity has conflicting NR/TV-MA labels; both observations are preserved and the inconsistency is disclosed.
- Fourteen records have an addition year preceding release year; they are logged, not silently corrected or removed. Date added is not a model feature.
- Some date-like titles may reflect source transformation; no unsupported corrections were made.
- No plot synopsis, scenes, cast, viewing counts, revenue or user scores are supplied.

The target retains TV and film rating systems as separate original classes. NR/UR mean unrated status and are not mapped to age thresholds. Label meanings follow standard US film/TV terminology (Motion Picture Association film ratings and TV Parental Guidelines); the dataset does not establish a country-specific certification jurisdiction for every title.

Reference systems: https://www.filmratings.com/ and https://www.tvguidelines.org/. These provide terminology, not verification of individual title labels.
