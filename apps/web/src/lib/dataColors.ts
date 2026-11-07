/** Color encodes data meaning; interface chrome remains neutral. */
export const DATA_COLORS = {
  observed: "#2563eb",
  projected: "#c2410c",
  band: "#fed7aa",
  distribution: "#0f766e",
  movie: "#2563eb",
  tv: "#b45309",
  under: "#2563eb",
  over: "#c2410c",
  exact: "#047857",
} as const;

// One stable color per cluster ID across map, filters, directory and sizes.
export const CLUSTER_COLORS = [
  "#2563eb",
  "#c2410c",
  "#047857",
  "#a21caf",
  "#0e7490",
  "#b45309",
  "#6d28d9",
  "#be123c",
  "#4d7c0f",
  "#475569",
] as const;
export const clusterColor = (id: number) =>
  CLUSTER_COLORS[id % CLUSTER_COLORS.length];

export const RATING_FAMILIES = [
  {
    label: "Children",
    color: "#0e7490",
    ratings: ["TV-Y", "TV-Y7", "TV-Y7-FV"],
  },
  { label: "General audiences", color: "#047857", ratings: ["G", "TV-G"] },
  { label: "Parental guidance", color: "#a16207", ratings: ["PG", "TV-PG"] },
  { label: "Teens", color: "#2563eb", ratings: ["PG-13", "TV-14"] },
  {
    label: "Mature audiences",
    color: "#a21caf",
    ratings: ["R", "NC-17", "TV-MA"],
  },
  { label: "Unrated", color: "#475569", ratings: ["NR", "UR"] },
];
export const ratingFamily = (label: string) =>
  RATING_FAMILIES.find((family) => family.ratings.includes(label)) ??
  RATING_FAMILIES[RATING_FAMILIES.length - 1];

/** A sequential scale, with WCAG AA text chosen from actual cell luminance. */
export function heatmapStyle(value: number, maximum: number) {
  const fraction = Math.max(0, Math.min(1, maximum > 0 ? value / maximum : 0));
  const rgb = [239, 246, 255].map((start, i) =>
    Math.round(start + ([30, 64, 175][i] - start) * fraction),
  );
  const linear = rgb.map((v) => {
    const channel = v / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance =
    linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  return {
    backgroundColor: `rgb(${rgb.join(", ")})`,
    color: (luminance + 0.05) / 0.05 >= 4.5 ? "#000000" : "#ffffff",
  };
}
