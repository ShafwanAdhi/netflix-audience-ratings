# Audience Ratings identity verification

Local Chromium verification, model run `20261106T111736917654Z`. Browser timestamps and assertions are in the JSON records. The model and dataset are unchanged.

- Branding: 135 checks across five routes at 320, 390, 768 and 1440 px. Public copy, accessible home label, title, logo, favicons and horizontal overflow verified.
- Mobile: 167 checks across six touch-emulated viewports and real interactive API flows.
- Build passed; 2 frontend and 8 backend tests passed.
- [Mobile methodology screenshot](320px.png), [desktop methodology screenshot](1440px.png).
- [Source hashes and validation](validation.json). Original assignment evidence retains its historical numbering.

Replay `scripts/browser-check-branding.js` using Playwright CLI against the local production preview at port 8765. Full device details are in `mobile-result.json`.
