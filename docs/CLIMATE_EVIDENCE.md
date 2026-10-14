# Climate evidence and local measurement plan

Authored October 13, 2026 for the Youth for Earth continuation. This module and document were created after the October 10–11 EvoHacks event window and must not be represented as code or assets authored during that window. External evidence retains its own dates and authorship.

## What the calculator supports

The optional climate worksheet starts with both annual avoided vehicle miles and an emissions factor set to `null`. The planner supplies the activity estimate and explicitly selects a sourced factor. No vehicle-mile reduction is inferred from the length of a bike lane, number of crossings, cost, or project type. A labeled load action can supply a hypothetical thought experiment; it is not local data, predicted adoption, or a city commitment.

The dimensional conversion is:

`gross avoided tailpipe CO₂, metric tonnes/year = annual avoided vehicle miles × grams tailpipe CO₂/vehicle mile ÷ 1,000,000`

For the explicitly loaded thought experiment, **if** 10,000 gasoline passenger-vehicle miles were avoided in a year and the approximate EPA 400 g/mile benchmark applied, the arithmetic yields about 4 metric tonnes of gross avoided tailpipe CO₂ per year. The avoided miles are an authored hypothetical input. They are not implied by the 1.5-mile bike-lane example. The calculation accepts a supplied zero rather than treating missing activity as zero.

This is not net lifecycle greenhouse-gas savings, CO₂-equivalent, a carbon-credit calculation, or a causal impact evaluation. Embodied construction and materials, maintenance, upstream fuel and electricity emissions, replacement-mode emissions, manufacturing, diversion, and rebound are excluded. A measured input records the user's described evidence and remains unverified by CivicDT. A custom factor must include a provenance note, and a changed value cannot retain the EPA benchmark label.

## Verified primary evidence

| Source | Verified scope | CivicDT use |
| --- | --- | --- |
| [US EPA: Greenhouse Gas Emissions from a Typical Passenger Vehicle](https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle) | Page last updated June 3, 2026; checked October 13, 2026. EPA gives approximately 400 g of tailpipe CO₂ per passenger-vehicle mile in a gasoline-vehicle context. Actual vehicle fuel economy and operating conditions matter. | An explicitly selected, approximate benchmark; no automatic default and no assertion that it describes the local fleet. |
| [FHWA PlanWorks: Greenhouse Gas Emissions](https://fhwaapps.fhwa.dot.gov/planworks/Applications/Show/greenhouse-gas-emissions) | Checked October 13, 2026. The planning process asks agencies to define study scope, travel and emissions data, modes, years, metrics, and methods before comparing options. | Supports an evidence-first worksheet and follow-up questions. It does not validate CivicDT's simple arithmetic as a project forecast. |
| [FHWA Traffic Monitoring Guide (2022): Traffic Data Methodologies](https://www.fhwa.dot.gov/policyinformation/tmguide/tmg_2022/traffic-data-methodologies.cfm) | Checked October 13, 2026. The guide describes temporal variation, continuous monitoring, and short-duration counts for traffic including nonmotorized modes. | Informs collecting and documenting representative local counts; counts alone do not identify which motor-vehicle journeys were displaced. |

EPA also distinguishes electric-vehicle tailpipe emissions from upstream electricity emissions. The 400 g/mile gasoline benchmark must not be treated as an electric-vehicle or local mixed-fleet factor. Only tailpipe CO₂ is converted here; other greenhouse gases and lifecycle effects require additional methods and data. These caveats follow the [EPA source](https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle).

## Proposed local pilot measurement plan

This is a newly authored proposed plan, not a completed study or a claim of validated outcomes. An agency or qualified transport researcher should review its methods before claiming a project effect.

1. **Agree on the question and boundaries.** Identify the corridor, neighboring streets, vehicle modes, comparison period, and whether the objective is observed activity change or attribution to the intervention. Record other projects and service changes that could affect travel.
2. **Measure the baseline and repeat comparable observations.** Obtain representative motor-vehicle, cycling, and pedestrian counts across matched weekdays and weekends. Record weather, school and holiday schedules, construction, events, and monitoring coverage. Include nearby streets to identify diversion. Use continuous data where available; document any annualization method and uncertainty rather than extrapolating a single favorable day. FHWA's monitoring guide informs the need to account for temporal variation, but the pilot protocol and extrapolation must be locally justified.
3. **Distinguish added active trips from displaced vehicle trips.** Use voluntary, privacy-preserving trip diaries or surveys to record trip purpose, prior travel mode, distance, vehicle occupancy, and whether a motor-vehicle journey actually ceased. A cyclist count is not itself evidence of avoided vehicle miles. Do not multiply every bike trip by the corridor length or count a shifted passenger as an eliminated vehicle journey without evidence.
4. **Document the counterfactual.** Consider a comparable untreated corridor or matched monitoring periods and explicitly record confounders. A before/after difference alone cannot establish causal attribution. Retain ranges or alternative interpretations outside this point calculator when the evidence does not support a single activity value.
5. **Select an appropriate emissions factor.** Record affected vehicle types, fuels, distances, speeds, and the factor source and year. Use the EPA benchmark only as an approximate thought-experiment factor when its scope is suitable; obtain a locally justified fleet model for an actual assessment. Audit replacement-mode, construction, upstream, and rebound effects separately before making a net-emissions claim.
6. **Publish an auditable, neutral brief.** Show measurement dates, sampling limits, consent and privacy protections, annualization assumptions, the emissions boundary, missing inputs, alternative interpretations, and source links. Separate user-described measured activity from independently evaluated causal findings and keep affordability, accessibility, and other tradeoffs visible alongside climate considerations.

The module intentionally has no forecast uptake coefficient, automatic modal-shift rate, quantified health or safety outcome, or policy ranking. Its calculation and validation tests demonstrate internal arithmetic and missing-data behavior; they do not establish scientific predictive accuracy.
