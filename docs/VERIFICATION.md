# RawBlock verification — 2026-11-07

Task 3; active run `20261106T111736917654Z`. Models and immutable evaluation bundles were preserved.

| Current UI verification | Observed result |
| --- | --- |
| TypeScript and production build | Passed |
| Frontend unit tests | 2 passed |
| Playwright | 51 checks passed; no uncaught browser exceptions |
| Ruff | Passed |
| Project verifier | Own artifact ready; dataset and model run identities match; one task registered |
| GitHub upload preflight | Passed; no private raw data, environment files, caches or oversized candidate files |
| Documentation links | All relative Markdown links resolve |
| Responsive checks | 1440, 768, 390 and 320 px; no global horizontal overflow |

Browser checks cover own-task navigation and direct section URLs, About Dataset evidence, real interactive model results, loading of all three self-hosted fonts, square corners, absence of shadows and ornamental icons, keyboard skip/focus, reduced motion, unavailable evidence and not-found states. Other tasks' API routes are absent. Tables scroll locally. Border assertions allow one device pixel of rounding: DPR 1.25 may render 3px as 2.4px and 5px as 4.8px.

[Screenshots and run-bound browser result](../submissions/rawblock/README.md).

Replay against this repository's production preview at port 8000:

```powershell
npx --yes --package @playwright/cli playwright-cli open http://127.0.0.1:8000
npx --yes --package @playwright/cli playwright-cli run-code --filename=scripts/browser-check-rawblock.js
```

Earlier standalone backend verification recorded 7 Python model/API/integrity tests passing with private source data. Those tests were not rerun for this visual change. Separate frozen dependency environments and model run identities remain unchanged. On clones without private data, explicitly source-dependent tests skip.

CI is configured but has not run on GitHub. Docker configuration is supplied but was not built in this session. No remote publication, hosting or portal submission was performed.
