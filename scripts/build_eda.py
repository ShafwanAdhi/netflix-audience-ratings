"""Execute a training-only EDA notebook and export its actual outputs."""

import base64
import contextlib
import io

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import nbformat
from netflix_ml.shared.io import root

base = root()
folder = base / "reports/task-03/eda"
folder.mkdir(parents=True, exist_ok=True)
cells = [
    nbformat.v4.new_markdown_cell("""# Training-only exploratory analysis

This executed notebook describes the frozen training partition. The held-out set is not used for feature discovery. Source quality is documented by the unchanged original audit and cleaning log. Core feature choices and the bounded experiment protocol were specified before the final evaluation; this notebook adds descriptive evidence, not post-test model revisions.

Questions: how imbalanced are the labels, which metadata associations are visible, and what information is missing? Figures are descriptive associations, not causal explanations.
"""),
    nbformat.v4.new_code_cell("""import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from netflix_ml.shared.io import root
from netflix_ml.tasks.task_03.data import LABELS
from netflix_ml.tasks.task_03.features import tokens
all_rows = pd.read_csv(root() / 'data/processed/task-03/cleaned.csv')
train = all_rows.loc[all_rows['split'] == 'train'].copy()
print('Training rows:', len(train))
print('Target distribution:')
print(train['rating'].value_counts().reindex(LABELS).to_string())
"""),
    nbformat.v4.new_markdown_cell(
        "The majority label is TV-MA. Accuracy alone is insufficient; macro-F1 gives every original label equal weight. NC-17 and UR have only two training examples, constraining CV to two folds."
    ),
    nbformat.v4.new_code_cell("""fig, ax = plt.subplots(figsize=(11,4))
train['rating'].value_counts().reindex(LABELS).plot.bar(ax=ax, color='#ac3035')
ax.set(title='Training rating support', xlabel='Rating', ylabel='Titles')
fig.tight_layout()
"""),
    nbformat.v4.new_code_cell("""print('Type by rating:')
print(pd.crosstab(train['rating'], train['type']).to_string())
fig, ax = plt.subplots(figsize=(10,5))
sns.heatmap(pd.crosstab(train['rating'],train['type'],normalize='index'),cmap='Reds',ax=ax,vmin=0,vmax=1)
ax.set_title('Training type composition per rating')
fig.tight_layout()
"""),
    nbformat.v4.new_markdown_cell(
        "Type distinguishes film/TV rating conventions, but metadata alone does not provide content-review evidence. Keep original labels separate and evaluate within each type with explicit label scope."
    ),
    nbformat.v4.new_code_cell("""genres = train.assign(genre=train['listed_in'].map(tokens)).explode('genre')
top = genres['genre'].value_counts().head(12).index
fig, ax = plt.subplots(figsize=(11,5))
sns.heatmap(pd.crosstab(genres['genre'],genres['rating'],normalize='index').reindex(top), cmap='Reds',ax=ax)
ax.set_title('Training genre / rating associations (top 12 genres)')
fig.tight_layout()
print('Distinct observed genre tokens:', genres['genre'].nunique())
"""),
    nbformat.v4.new_code_cell("""countries = train.assign(country_token=train['country'].map(tokens)).explode('country_token')
top_countries = countries['country_token'].value_counts().head(10).index
fig, ax = plt.subplots(figsize=(11,5))
sns.heatmap(pd.crosstab(countries['country_token'],countries['rating'],normalize='index').reindex(top_countries),cmap='Reds',ax=ax)
ax.set_title('Training country / rating associations (top 10 countries)')
fig.tight_layout()
print('Semantic missing values in training:')
for col in ['country','director']:
    print(col, int(train[col].eq('Not Given').sum()))
"""),
    nbformat.v4.new_markdown_cell(
        "Genre and country indicators describe catalog associations and may reflect rating-system or sampling differences. Missing director metadata motivates an explicit ablation rather than assuming it improves the model. Dictionaries are fitted inside each CV training fold, never from the holdout."
    ),
    nbformat.v4.new_code_cell("""train['duration_value'] = train['duration'].str.extract(r'^(\\d+)')[0].astype(int)
fig, axes = plt.subplots(1,3,figsize=(13,4))
sns.histplot(train['release_year'],ax=axes[0],color='#ac3035',bins=30)
axes[0].set_title('Training release years')
sns.histplot(train.loc[train['type']=='Movie','duration_value'],ax=axes[1],color='#ac3035',bins=30)
axes[1].set(title='Movie duration',xlabel='Minutes')
sns.histplot(train.loc[train['type']=='TV Show','duration_value'],ax=axes[2],color='#ac3035',discrete=True)
axes[2].set(title='TV Show duration',xlabel='Seasons')
fig.tight_layout()
"""),
    nbformat.v4.new_markdown_cell(
        "Duration cannot be treated as a shared physical quantity: minutes and season counts are encoded separately with content type. Historical year coverage limits extrapolation. Date-added anomalies and four repeated entities are reviewed in the cleaning log; entity grouping prevents fit/validation overlap. No label merging, source-title guessing or test-driven revisions are performed."
    ),
]
namespace = {}
count = 0
for cell in cells:
    if cell.cell_type != "code":
        continue
    count += 1
    output = io.StringIO()
    with contextlib.redirect_stdout(output):
        # Only the literal, project-owned cells above are executed; no uploaded code.
        exec(compile(cell.source, "<training-only-eda>", "exec"), namespace)  # noqa: S102
    cell.execution_count = count
    cell.outputs = []
    if output.getvalue():
        cell.outputs.append(nbformat.v4.new_output("stream", name="stdout", text=output.getvalue()))
    for index in plt.get_fignums():
        figure = plt.figure(index)
        image = io.BytesIO()
        figure.savefig(image, format="png", dpi=120, bbox_inches="tight")
        (folder / f"training_eda_{count}.png").write_bytes(image.getvalue())
        cell.outputs.append(
            nbformat.v4.new_output(
                "display_data", data={"image/png": base64.b64encode(image.getvalue()).decode()}
            )
        )
        plt.close(figure)
notebook = nbformat.v4.new_notebook(
    cells=cells,
    metadata={
        "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
        "language_info": {"name": "python", "version": "3.11"},
    },
)
destination = base / "notebooks/task-03/01_eda.ipynb"
destination.parent.mkdir(parents=True, exist_ok=True)
nbformat.write(notebook, destination)
print(f"Executed {count} training-only EDA cells: {destination}")
