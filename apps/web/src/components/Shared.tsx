import type { ReactNode } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
export function PageHeading({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lede">{children}</p>
      </div>
      {action}
    </header>
  );
}
export function State({
  error,
  loading,
}: {
  error?: Error | null;
  loading?: boolean;
}) {
  return (
    <div className="state" role={error ? "alert" : "status"}>
      <div>
        <h2>
          {loading
            ? "Loading verified artifacts"
            : "This workspace is temporarily unavailable"}
        </h2>
        <p>
          {error?.message || "Fetching the current dataset and model results."}
        </p>
        {error && (
          <button
            className="text-button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
export function Note({ children }: { children: ReactNode }) {
  return (
    <aside className="note">
      <p>{children}</p>
    </aside>
  );
}
export function Help({ text }: { text: string }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger type="button" className="help" aria-label={text}>
        ?
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="tooltip" sideOffset={4}>
          {text}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
export function RunStamp({ run }: { run: string }) {
  return (
    <p className="run-stamp">
      Verified artifact <span>{run}</span>
    </p>
  );
}
