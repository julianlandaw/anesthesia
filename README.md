# Anesthesia Toolkit

A static collection of adult anesthesia calculators, perioperative guidance, and bedside references. The site is published from [`docs/`](docs/) with GitHub Pages and can also be installed for offline use.

## Run locally

No build step is required. Start a local web server from the repository root:

```sh
python3 -m http.server 8000 --directory docs
```

Then open <http://localhost:8000>. A web server is recommended because service workers do not run from `file://` URLs.

## Project structure

- `docs/index.html` is the toolkit homepage.
- `docs/*.html` contains the individual calculators and guidance pages.
- `docs/theme.css` and `docs/theme.js` provide the shared light, dark, and system theme.
- `docs/calculations.js` contains pure calculation helpers shared by the tools and tests.
- `docs/CLINICAL_REVIEW.md` records the quarterly source-review checklist and review log.
- `docs/sw.js` and `docs/manifest.webmanifest` provide installation and offline support.
- `tests/` contains calculation and static-site checks.

When adding a page, link it from `docs/index.html`, include the shared theme/PWA assets, and add it to `APP_SHELL` in `docs/sw.js`. The service worker uses the network first and falls back to its cache offline, so deployed clinical logic is refreshed whenever the network is available. Increment `CACHE_NAME` when changing the app-shell membership or when a forced cache reset is needed.

## Validate changes

Run both checks before publishing:

```sh
node --test tests/calculations.test.js
python3 tests/site_checks.py
```

GitHub Actions runs the same checks for pushes and pull requests. The static audit verifies local links, required metadata and shared assets, unique IDs, one main heading per page, form-control labels, and offline cache coverage.

## Clinical-content maintenance

This project is decision support, not an order set or a substitute for clinical judgment. Clinical formulas, dose ranges, recommendations, contraindications, and source material should be independently reviewed before deployment and whenever guidance changes. Keep clinical-content review separate from layout or refactoring changes so reviewers can clearly identify changes that affect patient-facing output.

## Deploy

Configure GitHub Pages to deploy from the `main` branch and `/docs` folder. After merging changes, GitHub Pages will publish the static files without a build process. Existing installations fetch current assets while online, retain the app shell for offline use, and display a reload notice when a new service worker takes control.
