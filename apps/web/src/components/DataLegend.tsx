import type { CSSProperties } from "react";

type LegendItem = {
  label: string;
  color: string;
  variant?: "solid" | "dashed" | "band";
};

export function DataLegend({
  items,
  label = "Chart legend",
}: {
  items: readonly LegendItem[];
  label?: string;
}) {
  return (
    <ul className="data-legend" aria-label={label}>
      {items.map((item) => (
        <li key={item.label}>
          <span
            aria-hidden="true"
            className={`data-key data-key--${item.variant ?? "solid"}`}
            style={{ "--data-color": item.color } as CSSProperties}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
