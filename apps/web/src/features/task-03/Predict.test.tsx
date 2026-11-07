import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import * as Tooltip from "@radix-ui/react-tooltip";
import { PredictPage, formSchema } from "./Predict";
vi.mock("../../lib/api", async (original) => ({
  ...(await original<typeof import("../../lib/api")>()),
  useMetadata: () => ({
    data: {
      model_id: "random_forest",
      run_id: "test-run",
      countries: ["United States"],
      genres: ["Dramas"],
      uses_director: false,
      examples: [
        {
          title: "Example series",
          split: "train",
          content_type: "TV Show",
          release_year: 2020,
          countries: [],
          genres: ["Dramas"],
          duration: { value: 2, unit: "seasons" },
        },
      ],
    },
  }),
}));
describe("prediction contract", () => {
  it("requires genres and positive whole duration", () => {
    expect(
      formSchema.safeParse({
        content_type: "Movie",
        release_year: 2020,
        countries: [],
        genres: [],
        duration: 0,
        director: "",
      }).success,
    ).toBe(false);
  });
  it("clears incompatible duration when content type changes", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <Tooltip.Provider>
          <MemoryRouter>
            <PredictPage />
          </MemoryRouter>
        </Tooltip.Provider>
      </QueryClientProvider>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Duration (minutes)"), "95");
    await user.click(screen.getByRole("radio", { name: "TV Show" }));
    expect(screen.getByLabelText("Number of seasons")).toHaveValue(null);
  });
});
