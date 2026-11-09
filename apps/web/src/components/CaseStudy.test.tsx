import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRunEvidence } from "./CaseStudy";
function Probe() {
  const state = useRunEvidence("evaluation-run");
  return (
    <p>
      {state.error?.message ||
        (state.pending ? "Waiting for evidence" : "Matched")}
    </p>
  );
}
afterEach(() => vi.unstubAllGlobals());
describe("overview evidence gate", () => {
  it.each([200, 503])(
    "does not accept incompatible or unavailable evidence (%i)",
    async (status) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(
          async () =>
            new Response(
              JSON.stringify(
                status === 200
                  ? { run_id: "different-run" }
                  : { detail: "Evidence unavailable" },
              ),
              { status },
            ),
        ),
      );
      render(
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <Probe />
        </QueryClientProvider>,
      );
      expect(
        await screen.findByText(
          status === 200 ? /different runs/ : "Evidence unavailable",
        ),
      ).toBeInTheDocument();
      expect(screen.queryByText("Matched")).not.toBeInTheDocument();
    },
  );
});
