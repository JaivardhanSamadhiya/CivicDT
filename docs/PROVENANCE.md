# Provenance record

## Event and repository state

Dates use **America/Los_Angeles**. The original project brief identifies **October 10–11, 2026** as the EvoHacks creation window. Implementation started October 11, resumed October 13 for a Youth for Earth (Y4E) continuation, and continued October 14. The continuation must not be described as entirely event-window work. This record does not independently certify organizer rules, submission eligibility, or authorization for third-party software/assets.

| Period / record | What the record supports | Competition boundary |
| --- | --- | --- |
| October 11 initial inspection | Workspace and target repository were empty; a new implementation was initialized. | No old application source or assets were imported. |
| `5e2fde2`, October 11 at 11:39 | Committed typed foundation and initial provenance. | Event-window committed record. |
| `369358a`, October 11 at 16:05 | Committed three-scenario cost engine and sensitivity tests. | Event-window committed record. |
| October 11 workspace drafts | UI, backend, documentation, and browser-test drafts remained uncommitted at interruption. | Session evidence, not equivalent to a pushed event-window snapshot. |
| October 13 `y4e-climate` continuation | Climate-oriented completion, changes, tests, generated QA artifacts, and revised documentation. | Outside the original EvoHacks window; excluded from October 10–11 creation claims. |
| October 14 verification and fixes | Resumed end-to-end verification, application/test fixes, and documentation updates on the continuation branch. | Outside the original EvoHacks window; no event-window creation claim. |

The two October 11 commits were pushed before the interruption. A later commit containing an earlier draft does not establish that every line was created inside the event window. Preserve the committed snapshot, history, and this disclosure when preparing any submission.

Before implementation, `D:/CivicDT` was empty and was not a Git repository. `git ls-remote` for the new target repository, <https://github.com/JaivardhanSamadhiya/CivicDT>, returned no refs. A fresh `main` branch was initialized. See [INITIAL_STATE.md](INITIAL_STATE.md) for the recorded inspection and plan.

The prior repository, <https://github.com/JaivardhanSamadhiya/LosAltosHacks2026>, was inspected only for conceptual context through its public README and top-level file listing. Its recorded remote HEAD was `0ac82d61df167d17ff6bef6613019955f959eddc`. No prior application source, component, asset, model, dataset, or Git history was copied into this deliverable. Prior work is not represented as newly created competition work.

## Newly authored application work

The new implementation comprises the application architecture and UI, proposal contracts and validation, deterministic extraction and optional provider interface, uploads and PDF brief generation, cost analysis engine, authored demonstration proposals and assumptions, scenario comparisons, map interaction, browser storage, automated tests, configuration, and project documentation. Authorship uses **Codex/AI assistance** across the creation periods above. The climate continuation and working pitch outline also use AI assistance and are not claimed as unaided student writing. Commit history records implementation milestones; it does not erase the interruption or creation-date boundary.

The application-specific demonstration content was written for this repository. The hypothetical street names, Demo City, 1.5/2-mile distances, four crossings, and unit-cost assumptions are examples, not actual surveyed geography or empirical city data. They have no claimed external scientific provenance. No photo, prior mascot, prior logo, or old competition visual asset was imported.

This document records the work performed in this session. A date or commit timestamp alone is not a certification of independent organizer eligibility; organizers should evaluate any disclosure and dependency requirements.

The human team must supply its own experiences, research findings, and presentation voice. Proposed pilot interviews, partnerships, user tests, deployments, and outcomes remain plans until actually performed and documented. PDF/PNG verification artifacts generated October 13 are outside the EvoHacks window.

## Y4E AI-policy limitation

On October 13 the [official Y4E page](https://www.svyouthclimateaction.org/youth-for-earth-y4e-hackathon) was reviewed. Its footer expresses concerns about generative AI's environmental impacts and AI-generated writing, while expressly approving spelling/grammar tools. It does not establish authorization for this AI-assisted codebase or pitch outline.

**Organizer clarification is required before claiming this work is eligible.** The team should disclose AI coding and document-drafting assistance, ask which uses are permitted, and write its final presentation in its own voice. This is a submission-policy limitation; it does not block ordinary software implementation/testing. No organizer approval is claimed here.

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
| Published climate references | Research context / any explicitly cited emissions factor | Existing evidence belongs to its source; it does not validate a local project or an authored behavioral assumption. |

Package authors retain their respective licenses. Review the installed packages' license files and the organizers' reuse rules. The presence of third-party dependencies in this repository does not imply that organizers have explicitly approved them. OpenStreetMap attribution appears in the map, with data credited to its contributors.

## Evidence and integrity commitments

- No reused prior application code/assets are labeled as event-created.
- Committed October 11 work, uncommitted drafts, and October 13–14 continuation work remain distinguished.
- AI assistance, prior conceptual inspiration, and third-party materials remain disclosed.
- No fabricated measured dataset, scientific accuracy, AI run, citation, city statistic, or observed result is claimed.
- Default numerical inputs are labeled illustrative. Calculated results trace to the accepted inputs and deterministic model version.
- External provider credentials stay in server environment variables outside Git.
- Published verification claims must come from actual test/build runs, not from planned test names or intended behavior.
- A separate continuation of the previous project, if pursued later, should remain on its own development branch and be disclosed independently of this new competition implementation.
