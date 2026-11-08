# Data visualization

The interface uses neutral surfaces, typography and structural borders. Color identifies data categories, series and magnitude. Text, symbols and values complement color throughout the workspace.

| Data | Encoding | Additional cue |
| --- | --- | --- |
| Rating family | Six family colors with all 14 target labels kept separate | Label and numeric value on axes, legends and predictions |
| Confusion matrix | Sequential light-to-dark blue | Printed values, row/column labels and explicit count or normalized scale |

The palette is defined in `apps/web/src/lib/dataColors.ts`; presentation rules live in `apps/web/src/data-visualization.css`. About Dataset uses text and tables for variables and row accounting. Methodology uses neutral workflow steps. Charts retain labelled axes, legends or tooltips; data tables scroll within their own region.

## Interpretation and accessibility

Family colors do not merge labels or establish a universal age ordering. Matrix scales are 0-1 in normalized mode and 0-maximum in count mode. Cell text uses relative luminance to maintain at least 4.5:1 contrast.

Reduced motion, keyboard navigation, focus indicators, error states and responsive layout remain part of the chart interactions. Color styling does not modify input data, model selection, predictions or saved results.

## Verification

`scripts/browser-check-data-colors.js` inspects the rendered charts and relevant interactions. Run it against a built application preview on port 8000 using Playwright CLI. [Recorded production checks](../../verification/production/data-color-result.json) and [verification guidance](../VERIFICATION.md) identify the checked run and source revision.
