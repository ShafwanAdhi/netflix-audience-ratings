import type { ReactNode } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import type { components } from "../lib/schema";
import { request } from "../lib/api";

export function useRunEvidence(run?: string) {
  const query = useQuery({
    queryKey: ["dataset"],
    queryFn: () => request<components["schemas"]["DatasetInfo"]>("/dataset"),
  });
  const mismatch = query.data && run && query.data.run_id !== run;
  return {
    pending: query.isPending,
    error:
      query.error ||
      (mismatch
        ? new Error(
            "Evaluation and dataset evidence refer to different runs. Refresh the workspace to retry.",
          )
        : null),
  };
}

export function CaseStudy({
  question,
  finding,
  decision,
  limitation,
  coverage,
  action,
  href,
  run,
  children,
}: {
  question: string;
  finding: ReactNode;
  decision: ReactNode;
  limitation: ReactNode;
  coverage: string;
  action: string;
  href: string;
  run: string;
  children?: ReactNode;
}) {
  return (
    <section className="case-study" aria-labelledby="case-question">
      <p className="eyebrow">PROJECT QUESTION</p>
      <h2 id="case-question">{question}</h2>
      <div className="case-finding">
        <h3>Key finding</h3>
        <p>{finding}</p>
      </div>
      {children}
      <dl className="case-record">
        <div>
          <dt>Key decision</dt>
          <dd>{decision}</dd>
        </div>
        <div>
          <dt>Interpretation boundary</dt>
          <dd>{limitation}</dd>
        </div>
        <div>
          <dt>Implementation coverage</dt>
          <dd>{coverage}</dd>
        </div>
      </dl>
      <div className="case-actions">
        <Link className="button" to={href}>
          {action}
        </Link>
        <Link className="text-button" to="/evaluation">
          Inspect evaluation →
        </Link>
      </div>
      <p className="case-run">
        Evidence run <span>{run}</span>
      </p>
    </section>
  );
}
