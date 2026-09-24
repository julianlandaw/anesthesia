# Clinical content review log

This checklist is for maintaining the anesthesia toolkit’s clinical content. It does not certify the tools for patient care; every calculation and recommendation still requires clinician verification and alignment with local policy.

## Review cadence

- Review clinical sources every three months and after any major guideline or drug-label update.
- Next scheduled review: **December 24, 2026**.
- Record the reviewer, date, source version, material changes, tests run, and unresolved questions below.
- Increment the service-worker cache name whenever deployed clinical content or shared assets change.

## Current review — September 24, 2026

| Area | Primary source set | Review status |
|---|---|---|
| Drug doses | Linked U.S. prescribing information, obesity dosing reviews, AHA ALS guidance, Surviving Sepsis Campaign, and cited esmolol studies | Reviewed; each displayed row has a direct source |
| PONV | 2026 Fifth Consensus Guidelines for Management of Postoperative Nausea and Vomiting | Reviewed |
| Cardiac risk | 2024 AHA/ACC perioperative cardiovascular management guideline; original DASI validation | Reviewed |
| Ventilation | ATS/ESICM/SCCM mechanical ventilation guideline for adult ARDS | Reviewed |
| ABG | Peer-reviewed acid–base compensation and anion-gap reviews | Reviewed |
| Pre-op guidance | ASA fasting guidance, multi-society GLP-1 guidance, FDA/ADA diabetes guidance, AHA/ACC, CHEST, and ASRA | Reviewed |

## Quarterly checklist

- [ ] Confirm every external source link still resolves and points to the intended version.
- [ ] Compare all displayed doses, units, routes, maxima, age adjustments, and weight scalars with their sources.
- [ ] Check for newly superseded guidelines, safety communications, or product labeling.
- [ ] Review off-label wording and distinguish evidence from labeled indications.
- [ ] Run calculation golden tests, static site checks, JavaScript syntax checks, and a local HTTP smoke test.
- [ ] Test keyboard-only use, visible focus, screen-reader labels, mobile layout, print/export, offline behavior, and update notification.
- [ ] Confirm no tool asks for patient names, MRNs, dates of birth, or other identifiers.
- [ ] Update the global source-review date, this log, and the service-worker cache version.

## Change log

| Date | Reviewer | Summary | Verification |
|---|---|---|---|
| 2026-09-24 | Repository maintainer / Codex-assisted review | Added medication citations and favorites; updated weight formulas and age-aware rows; aligned PONV/cardiac/ventilation guidance; corrected ABG compensation logic; added shared calculations and review metadata | Static, syntax, calculation, and local HTTP checks |
