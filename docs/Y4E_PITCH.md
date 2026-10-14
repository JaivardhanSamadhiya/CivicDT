# Youth for Earth working pitch and pilot plan

**AI-assisted, human-editable working outline — not a finished student submission.** Replace bracketed prompts with the team's actual experience and findings. Write the final presentation in the students' own voice, disclose assistance, and clarify permitted AI use with organizers. The [official Y4E page](https://www.svyouthclimateaction.org/youth-for-earth-y4e-hackathon) raises concerns about generative AI and approves spelling/grammar tools; eligibility of this AI-assisted prototype is not established.

## Problem

**Working question:** How can a youth team turn a climate-friendly street idea into a credible proposal a local planner can investigate?

Students may have an idea for cycling, transit, or a crossing, but still need a defined location/scope, costs, evidence, alternatives, and a way to discuss tradeoffs. This is a **problem hypothesis**, not a completed user-research result.

Human-team prompts:

- [Describe a real trip or place your team knows. Why is it difficult to choose lower-emission travel?]
- [Name the specific community and intended users. Avoid claiming a city or school partnership before confirmation.]
- [Summarize actual interviews or observations only after conducting them, with date, method, and consent as appropriate.]

## Solution

CivicDT is an evidence-aware climate infrastructure workbench. A user supplies proposal text or a document, reviews source-linked extracted facts, accepts or replaces explicit assumptions, compares baseline/proposed/alternative costs, and exports a brief with limitations and follow-up questions.

The product's distinctive behavior is traceability: missing inputs stay empty, the calculator owns the numbers, and the report makes uncertainty visible. A hypothetical protected bike lane is the primary prototype example. Bus priority and crossing improvements extend the same cost framework.

Human-team prompt: [Explain what you chose to build and why it helps your named user take a concrete next step.]

## Research and evidence

The research starting point supports a **possible climate pathway**, not a local effect estimate. The [IPCC AR6 Working Group III Summary for Policymakers, section C.8.2](https://www.ipcc.ch/report/ar6/wg3/chapter/summary-for-policymakers/) discusses active/public transportation infrastructure supporting shifts to less greenhouse-gas-intensive travel. It does not demonstrate that this hypothetical corridor will induce a specified mode shift.

The [EPA passenger-vehicle emissions reference](https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle) describes an approximate average of 400 grams of tailpipe CO₂ per vehicle mile. That factor is not a local fleet measurement or a lifecycle estimate. Using any factor requires an explicit boundary and independently supported travel changes; a new lane alone is not evidence of avoided vehicle miles.

Needed local evidence: user needs, current trip modes and distances, accessible route connections, counts, corridor geometry, curb/loading uses, local contractor estimates, public transit data where relevant, and potential spillover or substitution effects. Record the reference, date, geography, units, collection method, and limitations for each input.

Human-team prompt: [What have you actually learned? Show your source or notes. Separate completed findings from research still planned.]

## Prototype demonstration

Use the [90-second technical demo](DEMO_SCRIPT.md) as a starting point. Show a source-linked field, a missing budget, explicit assumption acceptance, the three scenarios, a live cost edit, and a real PDF export. Explain that the demonstration is hypothetical and API-free, with rule-based extraction visibly labeled.

At the authored 1.5-mile bike-lane inputs, proposed capital is $1,345,500 and annual incremental maintenance is $21,000; the quick-build alternative is $372,600 and $10,500. These numbers come from illustrative arithmetic, not researched local estimates. Baseline zero means no new intervention spending, not zero existing city spending.

Human-team prompt: [Describe only the features you ran successfully. Include the actual verification summary and any failures.]

## Impact: hypothesis and measurement

The near-term intended impact is better-prepared, evidence-aware climate proposals. The physical climate pathway would require a suitable project, adoption of lower-emission travel, and a defensible change in motor-vehicle activity. CivicDT itself does not build a lane, change travel behavior, or establish avoided emissions.

Do not claim tonnes saved from this prototype without a defined model, supported behavioral inputs, system boundary, and comparison period. Any conditional emissions calculation must distinguish scenario arithmetic from observed reductions and account for alternatives, rebound, construction, operations, and local vehicle/transit characteristics as relevant.

Pilot success measures can include: required inputs completed; users able to explain cost assumptions and limits; source-supported fields checked; reports used in a real planning discussion; and missing-evidence requests identified. Those are process measures. Climate outcomes need separate observation and evaluation after a real intervention.

Human-team prompt: [Set a modest, measurable pilot goal. Label the target as a target until the pilot runs.]

## Feasibility and proposed pilot

This is a proposed pilot, not an announced partnership or a completed study.

| Phase | Proposed work | Evidence produced |
| --- | --- | --- |
| 1. Define a local question | Choose one corridor with the community; speak with a small, consented group of youth/commuters and an appropriate planning contact. | Dated problem notes, user needs, feasibility constraints, permissions. |
| 2. Replace demo inputs | Gather scope, accessible connections, local estimates, relevant travel/operator data, and source metadata. | Reviewed inputs; unresolved fields stay missing. |
| 3. Test the workbench | Ask pilot users to enter a proposal, review extraction, edit assumptions, and explain a comparison. | Task notes, confusion/errors, usability changes. |
| 4. Review with practitioners | Discuss the brief with a planner/engineer and accessibility representatives if available. | Corrections, follow-up work, decisions about further study. |
| 5. Evaluate a real intervention | Only if authorized and delivered, define a before/after/comparison design and record observed travel changes. | Separately verified outcomes with attribution and limitations. |

The prototype requires no database or paid model call in demo mode. A real study needs staff time, site/data access, engineering review, and local cost evidence. The team has not secured those resources unless it records actual commitments. No enterprise billing, speculative 3D model, or automatic policy ranking is required for the initial pilot.

## Suggested presentation structure

1. **Problem:** one authentic local story and a clearly named user.
2. **Solution:** the task the workbench helps that user complete.
3. **Research:** completed findings with sources, followed by unknowns.
4. **Prototype:** a short live trace from text to editable facts to computed comparison and PDF.
5. **Impact:** a credible climate pathway, clear measurement plan, and no invented savings.
6. **Feasibility:** first pilot, needed collaborators, scope limits, and a concrete request for feedback or support.

Replace this scaffold with the team's own final wording. Do not present suggested research/pilot work as already done or AI-assisted text as unaided student work.
