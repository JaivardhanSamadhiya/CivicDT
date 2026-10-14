# CivicDT — Civic Digital Twin

An evidence-aware infrastructure planning workbench. CivicDT turns a proposal into an editable, source-linked project record, compares three scenarios with transparent cost arithmetic, and exports a neutral decision brief. The default demonstration needs no API key.

**This is an illustrative decision-support prototype, not a calibrated city digital twin or an engineering estimate.** The application does not forecast travel time, ridership, crashes, health, crime, or causal policy effects. All built-in cost assumptions are explicitly illustrative USD values.

## Run locally

Use Node.js 22 LTS and npm. From the repository root:

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:3000>. To run a production build locally:

```sh
npm run build
npm start
```

The application uses Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui-style accessible primitives, Recharts, Leaflet, Zod, and a server-side provider abstraction. No database, account, subscription, or payment service is required.

## Demonstrate the core workflow

1. Open **New analysis** and load the clearly labeled protected bike lane example, or enter your own proposal.
2. Extract the project record. Without provider credentials, deterministic demo extraction runs and is labeled as demo mode.
3. Review the quoted source evidence and edit the extracted fields. Missing values remain `null`; required location, project type, and project quantity must be supplied before calculation.
4. Review the unit costs, design percentage, contingency, annual maintenance, sensitivity range, and time horizon. Accept the illustrative assumptions or supply your own values.
5. Execute the analysis. Compare the baseline, proposed protected bike lane, and quick-build alternative. Change an assumption to recalculate.
6. Review the illustrative map and export the decision brief as a PDF.

The authored examples cover a hypothetical **1.5-mile protected bike lane**, a **2-mile bus-priority corridor**, and **4 pedestrian crossings** in Demo City. They are examples, not real city projects. The bike lane is the primary demonstration; the other two use the same cost-only arithmetic with intervention-specific qualitative tradeoffs.

## What the model calculates

The model estimates incremental construction, design, contingency, annual maintenance, and an undiscounted horizon total. Its baseline represents **no new intervention spending**; baseline zeroes do not imply that existing city assets or maintenance cost nothing.

For quantity `Q`, construction unit cost `U`, design fraction `d`, contingency fraction `c`, annual maintenance unit cost `M`, and horizon `H`:

```text
construction = Q × U
design       = construction × d
contingency  = (construction + design) × c
capital      = construction + design + contingency
maintenance  = Q × M per year
horizon total = capital + H × maintenance
```

Low and high sensitivity cases vary capital and maintenance unit costs by the accepted percentage, while holding quantity and design/contingency percentages fixed. They are scenario bounds, not statistical confidence intervals.

The 1.5-mile bike-lane example produces $1,345,500 proposed capital and $21,000 annual incremental maintenance; its alternative produces $372,600 capital and $10,500 annual maintenance. These are consequences of authored demonstration assumptions, not contractor quotes or observed outcomes. See [methodology](docs/METHODOLOGY.md) for every default, formula, scope exclusion, and worked example.

## Configuration and data handling

Copy `.env.example` to `.env.local` to configure the optional AI provider. Keep `.env.local` outside Git. `AI_PROVIDER=demo` is the default. Optional extraction uses `AI_PROVIDER=openai`, server-only `OPENAI_API_KEY`, and `OPENAI_MODEL` (default `gpt-4o-mini`). Without a key, the local deterministic pipeline remains available and does not claim that an AI model ran. The brief itself is generated deterministically from engine results.

Scenarios persist in the current browser's local storage; there is no multi-user synchronization or database. Clearing site storage removes those saved scenarios. Proposal extraction, text-based PDF parsing, and report export use application server endpoints. Configuring an external AI provider sends proposal text to that provider; review its data handling before submitting sensitive material.

UTF-8 TXT and text-based PDF inputs are supported up to 2 MiB and 30,000 extracted characters. Scanned PDFs require OCR outside this MVP. Invalid, oversized, empty, or unreadable uploads return visible errors. Source references are included only when actually provided; illustrative cost assumptions have no external evidence citations.

The map uses Leaflet with attributed OpenStreetMap tiles. Map edits are a visual planning aid. A displayed line is illustrative and does not calculate, certify, or replace the supplied corridor distance.

## Verify

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The Playwright configuration starts the application for browser tests. CI installs Chromium and its system dependencies, then runs the same checks. Unit and integration tests cover extraction/validation, missing data, cost math, comparisons, sensitivity, reports, invalid uploads, and provider fallback. Browser tests exercise the main demo flow. Check the execution summary or CI run for measured results; this README does not substitute planned coverage for a passing run.

## Deploy

Deploy to a Node-capable Next.js host, such as a managed Next.js service or a Node server. Install with `npm ci` and build with `npm run build`. A managed Next.js host can use its standard detected configuration. For a container or server that requires an external bind, run `npx next start --hostname 0.0.0.0` and set the host's `PORT` environment variable; `npm start` binds to loopback for local use. Configure the normal HTTPS/reverse proxy for a self-hosted deployment. This MVP requires server routes and is not a static export. Optional provider credentials must be configured as server environment variables. No secrets are needed for demonstration mode. PDF parsing/report generation require the Node runtime.

## Project documentation

- [Architecture](docs/ARCHITECTURE.md): modules, validation boundaries, pipeline, persistence, and deployment.
- [Methodology](docs/METHODOLOGY.md): deterministic calculations, defaults, sensitivity, and limitations.
- [Provenance](docs/PROVENANCE.md): new work, prior conceptual reference, and pre-existing dependencies/assets.
- [90-second demo script](docs/DEMO_SCRIPT.md): a factual, reproducible presentation.
- [Initial state](docs/INITIAL_STATE.md): repository inspection and implementation plan.

## EvoHacks provenance

This repository was initialized as a new implementation on October 11, 2026, America/Los_Angeles. The old LosAltosHacks2026 repository was inspected as a conceptual reference only; no old application components, code, assets, or Git history were imported. New work and third-party dependencies are recorded separately in [PROVENANCE.md](docs/PROVENANCE.md). The October 10–11 eligibility window is supplied by the project brief; the record does not independently certify organizer rules or permission to use third-party materials.

## Limits and follow-up

The arithmetic is transparent and reproducible, but is not validated against local project estimates. Costs omit inflation, discounting, financing, land acquisition, unspecified utilities/operations, renewals, and residual value. Alternatives differ in physical scope and do not imply equivalent benefits. Procurement estimates, site surveys, accessibility review, traffic/safety evidence, and community consultation are needed before a real planning decision. The decision brief explains these limits and proposes follow-up investigations without declaring a political preference objectively correct.
