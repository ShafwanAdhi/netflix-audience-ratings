import { Note, PageHeading } from "../../components/Shared";
export function MethodologyPage() {
  const stages = [
    [
      "Prepare",
      "Verify source hash, validate metadata, remove three exact-content duplicates, and review repeated entities.",
    ],
    [
      "Split",
      "Reserve 1,758 singleton titles for the final test. Keep repeated entities together in training and every CV partition.",
    ],
    [
      "Train",
      "Fit encoders inside each fold. Compare Dummy, Logistic Regression, Decision Tree, and Random Forest.",
    ],
    [
      "Optimize",
      "Search 8 linear, 12 tree, and 12 forest configurations using six validation folds. Run one director ablation.",
    ],
    [
      "Freeze & evaluate",
      "Record the CV-based selection before evaluating the fixed test set. Serve the saved pipeline without refitting.",
    ],
  ];
  return (
    <>
      <PageHeading
        eyebrow="EXPERIMENT DESIGN"
        title="A traceable path from data to decision."
      >
        A reproducible metadata experiment with explicit boundaries between
        preparation, model selection, and final evaluation.
      </PageHeading>
      <div className="pipeline-strip">
        {[
          "Raw CSV",
          "Clean + split",
          "Fold-fitted pipeline",
          "CV selection",
          "Final holdout",
        ].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <section className="method-grid">
        <div>
          <p className="eyebrow">THE WORKFLOW</p>
          <ol className="workflow">
            {stages.map(([title, text], i) => (
              <li key={title}>
                <span>0{i + 1}</span>
                <div>
                  <h2>{title}</h2>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <aside className="method-aside">
          <h2>Evaluation stays independent.</h2>
          <p>
            Model selection uses mean CV macro-F1. Accuracy breaks score ties,
            followed by a fixed complexity order. Test results do not change the
            winner.
          </p>
          <h3>Why only two folds?</h3>
          <p>
            NC-17 and UR have only two training examples each. Three repeated,
            stratified group-disjoint 2-fold partitions preserve label coverage
            without splitting repeated entities.
          </p>
          <h3>What is excluded?</h3>
          <p>
            Rating is the target. Show ID, title, and date added are not input
            features. There is no information about scenes, dialogue, viewing
            activity, or revenue.
          </p>
        </aside>
      </section>
      <section className="report-section">
        <p className="eyebrow">FEATURE CONTRACT</p>
        <h2>Metadata with meaningful units.</h2>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Scrollable results table"
        >
          <table>
            <thead>
              <tr>
                <th>Input</th>
                <th>Representation</th>
                <th>Safeguard</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Type, countries, genres</td>
                <td>Fold-fitted categorical / multi-label indicators</td>
                <td>Unknown tokens ignored with a warning</td>
              </tr>
              <tr>
                <td>Release year</td>
                <td>Training-fitted numeric scaling</td>
                <td>Historical-range warning at inference</td>
              </tr>
              <tr>
                <td>Duration</td>
                <td>Separate minutes and season count</td>
                <td>Unit must match content type</td>
              </tr>
              <tr>
                <td>Director</td>
                <td>Training-only ablation</td>
                <td>Only included if CV macro-F1 improves</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <Note>
        The dataset is a historical catalog snapshot, not a record of all
        Netflix releases or audience behavior. Source provenance and
        redistribution rights beyond the supplied file have not been verified.
        The model is not an official content-rating service.
      </Note>
    </>
  );
}
