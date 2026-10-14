# 90-second CivicDT demo

Before presenting, start the application, confirm the protected bike lane example loads, complete one extraction and calculation, and verify that PDF export opens correctly. Demonstrate without provider credentials to make the no-secrets path reproducible. If an AI provider is configured, describe only the mode that actually ran.

| Time | Action | Suggested narration |
| --- | --- | --- |
| 0–10s | Open the dashboard. | “CivicDT is an infrastructure planning workbench. It compares explicit cost assumptions and makes missing evidence visible. This demonstration is hypothetical, not a validated city forecast.” |
| 10–25s | Open New analysis and load the labeled Elm Avenue bike-lane example. | “We are reviewing a protected bike lane along a hypothetical 1.5-mile corridor. The proposal is newly authored demo content. No API key is needed; this run uses clearly labeled deterministic extraction.” |
| 25–40s | Extract, then show the editable confirmation and evidence quotation. | “Fields point back to supporting text. An absent budget stays empty. We confirm location and length, then explicitly accept the illustrative cost assumptions.” |
| 40–57s | Calculate and open Scenario Comparison. | “The engine, rather than an LLM, calculates the costs. At these inputs the proposal costs $1,345,500 in capital and $21,000 each year in incremental maintenance. The quick-build alternative costs $372,600 and $10,500. Baseline zero means no new intervention spending.” |
| 57–68s | Change a unit cost or sensitivity input and recalculate. | “Changing assumptions recalculates the comparison. The low/high cases vary unit costs; they are sensitivity scenarios, not confidence intervals. We do not invent a crash reduction or travel-time benefit.” |
| 68–78s | Open the map and move a marker or inspect the illustrative line. | “This attributed map supports location discussion. The corridor is illustrative; it does not establish a surveyed distance.” |
| 78–90s | Open the report and export PDF. | “The downloadable brief records assumptions, scenarios, limitations, follow-up work, model version, and timestamp. It helps a planner ask better questions without declaring a political decision objectively correct.” |

If short on time, omit the map interaction and spend the extra seconds on the editable confirmation and assumptions. If live PDF export or provider extraction fails, show the actual error and explain it; do not describe unexecuted behavior as successful. The main demonstration is the validated, deterministic bike-lane comparison.
