import { useQuery } from "@tanstack/react-query";
import type { components } from "../lib/schema";
import { request } from "../lib/api";
import { Note, PageHeading, RunStamp, State } from "./Shared";

type DatasetInfo = components["schemas"]["DatasetInfo"];
export function DatasetPage() {
  const { data, error, isPending } = useQuery({
    queryKey: ["dataset"],
    queryFn: () => request<DatasetInfo>("/dataset"),
  });
  if (!data) return <State error={error} loading={isPending} />;
  return (
    <>
      <PageHeading
        eyebrow="DATASET / SOURCE & DECISIONS"
        title="About the dataset."
      >
        The source, model variables, preparation outcomes and evidence behind
        each decision.
      </PageHeading>
      <section className="report-section" aria-labelledby="source-heading">
        <p className="eyebrow">01 / SOURCE RECORD</p>
        <h2 id="source-heading">One historical snapshot.</h2>
        <dl className="dataset-facts">
          <div>
            <dt>Source</dt>
            <dd>{data.source_file}</dd>
          </div>
          <div>
            <dt>Raw records</dt>
            <dd>{data.raw_rows.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Snapshot through</dt>
            <dd>{data.snapshot_date}</dd>
          </div>
          <div>
            <dt>Source SHA-256</dt>
            <dd className="dataset-hash">{data.source_sha256}</dd>
          </div>
        </dl>
        <p className="section-description">{data.split_strategy}</p>
      </section>
      <section className="report-section" aria-labelledby="variables-heading">
        <p className="eyebrow">02 / VARIABLE REGISTER</p>
        <h2 id="variables-heading">What enters the model.</h2>
        <p className="section-description">
          Every variable has a defined role. Exclusions are recorded alongside
          the inputs.
        </p>
        <div className="variable-register">
          {data.variables.map((v) => (
            <article key={v.name} className="variable-row">
              <header>
                <h3>{v.name}</h3>
                <span
                  className={`variable-role ${/^(Feature|Target|Derived)/.test(v.role) ? "is-feature" : ""}`}
                >
                  {v.role}
                </span>
              </header>
              <dl>
                <div>
                  <dt>Why this role</dt>
                  <dd>{v.reason}</dd>
                </div>
                <div>
                  <dt>How it is handled</dt>
                  <dd>{v.treatment}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
      <section className="report-section" aria-labelledby="preparation-heading">
        <p className="eyebrow">03 / PREPARATION OUTCOMES</p>
        <h2 id="preparation-heading">Account for every row.</h2>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Data preparation results; scroll horizontally for all columns"
        >
          <table className="preparation-table">
            <caption className="sr-only">
              Rows before and after each preparation stage
            </caption>
            <thead>
              <tr>
                <th scope="col">Stage</th>
                <th scope="col">Input</th>
                <th scope="col">Output</th>
                <th scope="col">Excluded</th>
                <th scope="col">Reason</th>
              </tr>
            </thead>
            <tbody>
              {data.stages.map((s) => (
                <tr key={s.name}>
                  <td>{s.name}</td>
                  <td>{s.input_rows.toLocaleString()}</td>
                  <td>{s.output_rows.toLocaleString()}</td>
                  <td>{(s.input_rows - s.output_rows).toLocaleString()}</td>
                  <td>{s.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="table-note">
          Input, retained and excluded counts come from the recorded preparation
          evidence.
        </p>
      </section>
      <section className="report-section" aria-labelledby="partitions-heading">
        <p className="eyebrow">04 / SPLITS & SEGMENTS</p>
        <h2 id="partitions-heading">Data allocation & results.</h2>
        {data.partitions.map((p) => (
          <section key={p.name} className="dataset-partition">
            <h3>
              {p.name}
              <span>
                {p.rows.toLocaleString()}{" "}
                {data.task_id === 5 ? "periods" : "rows"}
              </span>
            </h3>
            <p>{p.purpose}</p>
            {p.segments.length > 0 && (
              <div className="dataset-segment-list">
                {p.segments.map((s) => (
                  <span key={s.name}>
                    {s.name}: <strong>{s.rows.toLocaleString()}</strong>
                  </span>
                ))}
              </div>
            )}
            {Object.keys(p.metrics).length > 0 && (
              <dl className="dataset-metrics">
                {Object.entries(p.metrics).map(([name, value]) => (
                  <div key={name}>
                    <dt>{name.replaceAll("_", " ")}</dt>
                    <dd>
                      {value === null
                        ? "Undefined"
                        : value.toLocaleString("en-US", {
                            maximumFractionDigits: 4,
                          })}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        ))}
      </section>
      <section className="report-section" aria-labelledby="decisions-heading">
        <p className="eyebrow">05 / DECISION RECORD</p>
        <h2 id="decisions-heading">The choice. The evidence.</h2>
        <ol className="workflow">
          {data.decisions.map((d, i) => (
            <li key={d.action}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3>{d.action}</h3>
                <p>{d.reason}</p>
                <p>
                  <strong>Evidence:</strong> {d.evidence}
                </p>
                <p>
                  <strong>Limit:</strong> {d.limitation}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <Note>{data.limitations.join(" ")}</Note>
      <RunStamp run={data.run_id} />
    </>
  );
}
