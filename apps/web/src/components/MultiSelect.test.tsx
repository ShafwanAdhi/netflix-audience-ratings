import { useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MultiSelect } from "./MultiSelect";
function Example() {
  const [value, setValue] = useState<string[]>([]);
  return (
    <MultiSelect
      label="Countries"
      options={["United States", "Indonesia"]}
      value={value}
      onChange={setValue}
      unknown
    />
  );
}
describe("searchable metadata selections", () => {
  it("preserves selections while filtering, clears to unknown and restores trigger focus", async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Countries Unknown" });
    await user.click(trigger);
    const search = screen.getByRole("searchbox", { name: "Search countries" });
    expect(search).toHaveFocus();
    await user.type(search, "INDO");
    await user.click(
      screen.getByRole("checkbox", { name: "Indonesia" }),
    );
    await user.clear(search);
    await user.type(search, "United");
    await user.click(
      screen.getByRole("checkbox", { name: "United States" }),
    );
    expect(
      screen.getByRole("button", { name: "Remove Indonesia from countries" }),
    ).toBeInTheDocument();
    await user.clear(search);
    await user.type(search, "missing-category");
    expect(screen.getByText("No matching options.")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Clear countries" }));
    expect(
      screen.getByRole("checkbox", { name: "Unknown" }),
    ).toBeChecked();
    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("button", { name: "Remove Indonesia from countries" }),
    ).not.toBeInTheDocument();
  });
});
