import { useState } from "react";
import { heatmapStyle } from "../../lib/dataColors";
import { useEvaluation, modelName, percent } from "../../lib/api";
import {
  Help,
  Note,
  PageHeading,
  RunStamp,
  State,
} from "../../components/Shared";
export function EvaluationPage() {
  const { data, error, isPending } = useEvaluation();
  const [normalized, setNormalized] = useState(true);
  if (!data) return <State error={error} loading={isPending} />;
  const matrix = normalized
    ? data.normalized_confusion_matrix
    : data.confusion_matrix;
  const max = normalized ? 1 : Math.max(...matrix.flat());
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `task-03-${data.run_id}-evaluation.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <PageHeading
        eyebrow="TASK 03 / HELD-OUT EVALUATION"
        title="Performance, with the context intact."
        action={
          <button className="button secondary" onClick={download}>
            Export results
          </button>
        }
      >
        The selected model was frozen using training-only cross-validation.
        These final test results were not used to select the winner.
      </PageHeading>
      <div className="selected-model">
        <span className="tag">CV-SELECTED MODEL</span>
        <strong>{modelName(data.model_id)}</strong>
        <span>
          {data.train_rows.toLocaleString()} training /{" "}
          {data.test_rows.toLocaleString()} test titles
        </span>
      </div>
      <div className="summary-strip metrics-strip">
        <div>
          <span>TEST ACCURACY</span>
          <strong>{percent(data.metrics.accuracy)}</strong>
          <small>Correct predictions across all titles</small>
        </div>
        <div>
          <span>
            TEST MACRO-F1{" "}
            <Help text="Each of the original 14 labels receives equal weight, regardless of support." />
          </span>
          <strong>{data.metrics.macro_f1.toFixed(3)}</strong>
          <small>Equal weight across 14 labels</small>
        </div>
        <div>
          <span>TEST WEIGHTED-F1</span>
          <strong>{data.metrics.weighted_f1.toFixed(3)}</strong>
          <small>Weighted by label support</small>
        </div>
      </div>
      <section className="report-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">01 / MODEL COMPARISON</p>
            <h2>Same data. Different decision boundaries.</h2>
          </div>
          <span className="subtle-label">CV AND TEST SHOWN SEPARATELY</span>
        </div>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Scrollable results table"
        >
          <table>
            <caption className="sr-only">
              Frozen candidate model comparison
            </caption>
            <thead>
              <tr>
                <th>Model</th>
                <th>CV macro-F1</th>
                <th>Test accuracy</th>
                <th>Test macro-F1</th>
                <th>Test weighted-F1</th>
              </tr>
            </thead>
            <tbody>
              {data.comparison.map((row) => (
                <tr
                  key={row.model}
                  className={row.model === data.model_id ? "selected-row" : ""}
                >
                  <td>
                    {modelName(row.model)}{" "}
                    {row.model === data.model_id && (
                      <span className="table-badge">SELECTED</span>
                    )}
                  </td>
                  <td>{row.cv_macro_f1.toFixed(3)}</td>
                  <td>{percent(row.accuracy)}</td>
                  <td>{row.macro_f1.toFixed(3)}</td>
                  <td>{row.weighted_f1.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="table-note">
          CV: three repeated, group-disjoint 2-fold partitions. Test: one frozen
          holdout. The winner remains the CV-selected model.
        </p>
      </section>
      <section className="report-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">02 / CONFUSION MATRIX</p>
            <h2>Where classifications agree — and diverge.</h2>
          </div>
          <div className="segmented">
            <button
              className={normalized ? "active" : ""}
              onClick={() => setNormalized(true)}
            >
              Normalized
            </button>
            <button
              className={!normalized ? "active" : ""}
              onClick={() => setNormalized(false)}
            >
              Counts
            </button>
          </div>
        </div>
        <p className="section-description">
          Rows are actual labels. Columns are predictions.{" "}
          {normalized
            ? "Each row is normalized by its test support."
            : "Each cell counts test examples."}
        </p>
        <div
          className="table-scroll matrix-scroll"
          tabIndex={0}
          role="region"
          aria-label="Scrollable results table"
        >
          <table className="matrix" data-motion-revision={String(normalized)}>
            <caption className="sr-only">
              Actual by predicted rating confusion matrix
            </caption>
            <thead>
              <tr>
                <th>ACTUAL ↓ / PREDICTED →</th>
                {data.labels.map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={data.labels[i]}>
                  <th>{data.labels[i]}</th>
                  {row.map((value, j) => (
                    <td
                      key={j}
                      title={`Actual ${data.labels[i]}, predicted ${data.labels[j]}: ${normalized ? percent(value) : value}`}
                      style={heatmapStyle(value, max)}
                    >
                      {normalized
                        ? value > 0
                          ? value.toFixed(2)
                          : "·"
                        : value || "·"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          className="heatmap-scale"
          aria-label={`Confusion matrix scale: zero to ${normalized ? "one per actual-label row" : max + " titles"}`}
        >
          <span>0</span>
          <span className="heatmap-scale-strip" aria-hidden="true" />
          <span>{normalized ? "1.00 / row" : `${max} titles`}</span>
        </div>
        <p className="table-note">
          All 14 labels remain visible, including classes never predicted.
          Darker blue cells represent larger values; exact values are printed in
          each cell.
        </p>
      </section>
      <Note>
        NC-17, UR, and TV-Y7-FV each have only one held-out example. Their
        class-level scores are extremely unstable; a perfect score for a single
        title does not establish reliability.
      </Note>
      <section className="report-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">03 / PER-CLASS PERFORMANCE</p>
            <h2>Look beyond the average.</h2>
          </div>
          <span className="subtle-label">FINAL TEST SET</span>
        </div>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Scrollable results table"
        >
          <table>
            <thead>
              <tr>
                <th>Rating</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1</th>
                <th>Test support</th>
                <th>Predictions</th>
              </tr>
            </thead>
            <tbody>
              {data.per_class.map((row) => (
                <tr key={row.label}>
                  <td>
                    <strong>{row.label}</strong>
                    {row.support < 10 && (
                      <span className="rare-label">LOW SUPPORT</span>
                    )}
                  </td>
                  <td>{row.precision.toFixed(3)}</td>
                  <td>{row.recall.toFixed(3)}</td>
                  <td>{row["f1-score"].toFixed(3)}</td>
                  <td>{row.support}</td>
                  <td>{row.predicted_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="report-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">04 / ERROR ANALYSIS</p>
            <h2>Common confusions</h2>
          </div>
        </div>
        <div className="error-pairs">
          {data.frequent_errors.slice(0, 5).map((item, i) => (
            <div key={i}>
              <span>
                {String(item.actual)} <span className="muted">→</span>{" "}
                {String(item.predicted)}
              </span>
              <strong>{String(item.count)} titles</strong>
            </div>
          ))}
        </div>
      </section>
      <RunStamp run={data.run_id} />
    </>
  );
}
