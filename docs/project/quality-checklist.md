# Project quality checklist

Use this checklist when changing data preparation, models or the application. It describes release checks; recorded outcomes are linked in the verification guide.

- Validate source schema and hash; record cleaning decisions and entity mappings.
- Keep fitting and model selection separate from held-out evaluation where applicable.
- Record model configuration, dependencies, selection rule and evaluation scope.
- Save an immutable, checksummed bundle before activation.
- Match the dataset profile, API and evaluation run identities.
- Validate inputs, unknown categories, unavailable artifacts and saved-model parity.
- Run Ruff, pytest, frontend tests, the production build and project verification.
- Replay relevant browser checks, including mobile, keyboard and reduced motion.
- Record source revision, model run and actual screenshots for each reviewed release.
- Document limitations and failed experiments alongside successful results.

See [recorded verification](../VERIFICATION.md) and the root README for commands.
