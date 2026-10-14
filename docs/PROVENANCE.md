# Provenance record

## Event and repository state

Recorded creation date: **October 11, 2026, America/Los_Angeles**. The project brief identifies October 10–11, 2026 as the EvoHacks creation window. This record follows that supplied constraint; it does not independently certify organizer rules, submission eligibility, or authorization for third-party software/assets.

Before implementation, `D:/CivicDT` was empty and was not a Git repository. `git ls-remote` for the new target repository, <https://github.com/JaivardhanSamadhiya/CivicDT>, returned no refs. A fresh `main` branch was initialized. See [INITIAL_STATE.md](INITIAL_STATE.md) for the recorded inspection and plan.

The prior repository, <https://github.com/JaivardhanSamadhiya/LosAltosHacks2026>, was inspected only for conceptual context through its public README and top-level file listing. Its recorded remote HEAD was `0ac82d61df167d17ff6bef6613019955f959eddc`. No prior application source, component, asset, model, dataset, or Git history was copied into this deliverable. Prior work is not represented as newly created competition work.

## Newly authored application work

The new implementation comprises the application architecture and UI, proposal contracts and validation, deterministic extraction and optional provider interface, uploads and PDF brief generation, cost analysis engine, authored demonstration proposals and assumptions, scenario comparisons, map interaction, browser storage, automated tests, configuration, and project documentation. Authorship was assisted by Codex agents during this session. Commit history records incremental implementation milestones.

The application-specific demonstration content was written for this repository. The hypothetical street names, Demo City, 1.5/2-mile distances, four crossings, and unit-cost assumptions are examples, not actual surveyed geography or empirical city data. They have no claimed external scientific provenance. No photo, prior mascot, prior logo, or old competition visual asset was imported.

This document records the work performed in this session. A date or commit timestamp alone is not a certification of independent organizer eligibility; organizers should evaluate any disclosure and dependency requirements.

## Pre-existing third-party materials

| Material | Use | Provenance boundary |
| --- | --- | --- |
| Next.js, React, TypeScript, Tailwind CSS | Application framework, language, styling | Published third-party packages predating this authored implementation; exact installed versions are in `package-lock.json`. |
| Zod | Runtime validation | Third-party package; application contracts are newly authored. |
| Recharts | Comparison charts | Third-party charting library; comparison data and UI composition are newly authored. |
| Leaflet | Map rendering and interactions | Third-party mapping library. |
| OpenStreetMap data and tiles | Contextual base map | Pre-existing geographic content; attribution is displayed. No map tile or base-map dataset is claimed as newly created. |
| Lucide | Interface icon glyphs | Pre-existing icon assets from a third-party package. |
| Radix Slot, class-variance-authority, clsx, tailwind-merge; shadcn/ui design patterns | Accessible UI composition and styling | Third-party libraries/patterns; application-specific components are authored during this implementation. |
| pdf-lib and pdf-parse | PDF generation and extraction | Pre-existing document-processing libraries. |
| Vitest and Playwright | Automated testing | Third-party tooling; project tests are newly authored. |
| Optional external AI model | Proposal extraction when configured | Provider technology is not newly created here. Provider use and execution mode are disclosed; deterministic demo mode does not claim AI execution. |

Package authors retain their respective licenses. Review the installed packages' license files and the organizers' reuse rules. The presence of third-party dependencies in this repository does not imply that organizers have explicitly approved them. OpenStreetMap attribution appears in the map, with data credited to its contributors.

## Evidence and integrity commitments

- No reused prior application code/assets are labeled as event-created.
- No fabricated measured dataset, scientific accuracy, AI run, citation, city statistic, or observed result is claimed.
- Default numerical inputs are labeled illustrative. Calculated results trace to the accepted inputs and deterministic model version.
- External provider credentials stay in server environment variables outside Git.
- Published verification claims must come from actual test/build runs, not from planned test names or intended behavior.
- A separate continuation of the previous project, if pursued later, should remain on its own development branch and be disclosed independently of this new competition implementation.
