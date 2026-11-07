# Mobile layout and verification

The neutral RawBlock frame and semantic chart colors are preserved. Mobile rules live in `apps/web/src/mobile.css`.

- Button-like controls and disclosures have minimum 44px targets on compact or coarse-pointer devices.
- Text fields and selects use at least 16px text to avoid the common iPhone focus-zoom trigger. Radio and checkbox sizing follows their enclosing labelled targets.
- The active section is revealed horizontally on direct URLs, history navigation and resize; the hook does not scroll the page vertically.
- Workflow steps wrap on tablet/landscape and stack on narrow phones.
- The 14-rating distribution and long-label insight charts retain a readable internal canvas with local scrolling, focusable regions and visible swipe/keyboard guidance. Tables also scroll inside their own regions. No page-wide overflow hiding is used as a layout fix.
- Existing model values, semantic colors, reduced-motion behavior and task boundaries remain intact.

## Replay

Build the project, start its API on port 8765, then run:

```powershell
npx --yes --package @playwright/cli playwright-cli open about:blank
npx --yes --package @playwright/cli playwright-cli run-code --filename=scripts/browser-check-mobile.js
npx --yes --package @playwright/cli playwright-cli close
```

The script uses real touch taps for navigation and actions, actual API calls and mobile form validation. It checks all five routes at 320x740, 360x800, 390x844, 430x932, 844x390 and 768x1024, plus wide-table access. This is Chromium device emulation, not a claim of physical-device or WebKit testing.

[Recorded local evidence](../../submissions/mobile/README.md). Source hashes refer to the recorded local files. Production replay is recorded separately by the deployment session.
