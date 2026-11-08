# Project verification

Model run `20261106T111736917654Z`. The recorded application revision is `8a82247744dcb824829dc39c663db6ba8964d543`. [Evidence index](../verification/README.md) retains actual browser records, screenshots and deployment identity; documentation-only changes do not create new model results.

## Recorded results

- Production frontend build passed.
- Frontend tests: 2 passed; backend tests: 8 passed.
- Python lint checks passed.
- Browser regression: 51 checks passed.
- Data visualization: 22 checks passed.
- Mobile/touch behavior: 167 checks passed.
- Public identity and delayed-font navigation: 135 checks passed.
- Container healthy; API and dataset profile use the same model run.

- [Container verification](https://github.com/ShafwanAdhi/netflix-audience-ratings/actions/runs/42465026538): success.
- [Application verification](https://github.com/ShafwanAdhi/netflix-audience-ratings/actions/runs/42465026669): success.

Browser verification covers direct URLs, interactive API results, loading/error/unavailable states, keyboard focus, semantic chart colors, mobile layout and reduced motion. Touch emulation uses 320x740, 360x800, 390x844, 430x932, 844x390 and 768x1024 at DPR 2. Identity checks include 1440px desktop and deliberately delayed web fonts. These are Chromium checks, not physical-device or WebKit tests.

## Replay

Run the development checks documented in [local development](DEVELOPMENT.md). To test the production frontend locally, build it and start `uv run uvicorn netflix_api.main:app --host 127.0.0.1 --port 8765`. Mobile and branding browser scripts target that port. The regression and color scripts target port 8000; use a matching preview port for those scripts.

```powershell
npx --yes --package @playwright/cli playwright-cli open about:blank
npx --yes --package @playwright/cli playwright-cli run-code --filename=scripts/browser-check-mobile.js
npx --yes --package @playwright/cli playwright-cli run-code --filename=scripts/browser-check-branding.js
npx --yes --package @playwright/cli playwright-cli close
```

Save new output under `output/playwright`, record the source revision and model run, and inspect the actual screenshots before publishing new verification records. Recorded results are not inferred from file presence.
