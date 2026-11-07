# Data visualization color contract

The RawBlock frame uses neutral surfaces, typography and structural borders. Data marks use color when it identifies a category, series or magnitude. This implements the owner's clarification of the original design reference; its black-and-white restriction does not apply to data visualization.

## Encoding rules

| Data | Encoding | Additional cue |
| --- | --- | --- |
| Audience rating | Six audience-family colors; the original 14 labels stay separate | Rating label on axis, probability label and numeric value |
| Confusion matrix | Sequential light-to-dark blue using the displayed counts or row-normalized values | Printed cell values, row/column labels, explicit scale; luminance-based text contrast |
| Cluster ID | Ten unique, stable colors, indexed by actual cluster ID | Cluster ID, labelled legend and distinct point symbols |
| Clustering algorithm | Distinct line colors | Algorithm name, different dash patterns and visible points |
| Observed / forecast | Blue solid observations, orange dashed model predictions | Explicit series names and a separate orange empirical-error band |
| Catalog distribution | Teal single-measure bars | Axis values, tooltips and the distribution data table |
| Content type | Blue Movie, amber TV Show | M/TV labels and textual legend |
| Prediction residual | Blue underestimates, orange overestimates, green exact matches | Triangle/circle/cross points, labelled legend and perfect-prediction diagonal |

Only the applicable rows are used by each standalone task. The palette lives in `apps/web/src/lib/dataColors.ts`; presentation-only CSS lives in `data-visualization.css`. Colors do not alter input data, splits, model selection, predictions or saved artifacts.

## Page audit

- Overview: color carries rating family, cluster ID, observed series or a single distribution measure.
- About Dataset: source variables, row accounting and split evidence remain text/tables. No arbitrary categorical color is added to plain numbers.
- Task interaction: prediction bars match Overview families; cluster chips/directory/filtered maps retain ID colors; forecasts separate observations/projections; insight bars distinguish content type.
- Evaluation: heatmap, algorithm curves, held-out forecast comparisons and residual scatter retain visible values/labels. Tables do not depend on colored cells alone.
- Methodology: explanatory steps remain neutral. Warnings retain explicit text and their existing semantic border.

## Accessibility and interpretation

Color is never the only carrier of identity. Categories retain text labels; cluster/scatter marks also have shapes; line series have dash patterns. Confusion-cell text is chosen using actual relative luminance for at least 4.5:1 contrast. Its scale is fixed at 0-1 in normalized mode and 0-maximum in count mode. Switching modes changes units explicitly.

Ten clusters cannot be guaranteed perceptually distinct for every form of color-vision deficiency. Use cluster IDs, symbols, filters and the title table as complementary evidence. Projection overlap remains an approximation; color does not imply separation in the full feature space.

Family coloring does not merge targets or establish a universal age ordering. Forecast bands remain empirical CV-error bands, not calibrated confidence. Residual colors describe direction, not success. Existing reduced-motion, keyboard navigation, error states and responsive layout remain applicable.

## Verification

Build and frontend tests, the existing full browser regression, and `scripts/browser-check-data-colors.js` check the rendered encoding and interactions. The latter inspects real SVG marks, cluster-color consistency after filtering, forecast line/band distinction, matrix text contrast and both count modes, content-type bars and residual point coverage. See `submissions/data-visualization/` for the recorded local checks and captures. Production checks are separately recorded by the deployment session; historical evidence folders describe earlier snapshots.
