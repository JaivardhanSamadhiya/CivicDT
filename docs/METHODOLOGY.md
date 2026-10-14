# Methodology and assumptions

## Scope

CivicDT model `civicdt-cost-v1.0.0` is a deterministic **incremental cost comparison**. It is an authored prototype, not a validated engineering, transportation, safety, public health, or crime model. The application uses an LLM only for text extraction and explanation when a provider is available. The TypeScript engine owns numerical results.

Every proposal is compared across three scenarios:

| Scenario | Modeled scope |
| --- | --- |
| Baseline | No new intervention spending. Existing asset costs and operations are outside the model. |
| Proposed | User-defined quantity multiplied by the proposed construction and maintenance unit costs, plus design and contingency. |
| Lower-cost alternative | The same quantity with a different physical treatment and lower accepted construction unit cost. Benefits are not assumed equivalent. |

Protected bike lanes and bus-priority corridors use **corridor miles**. Pedestrian improvements use **number of crossings**. A corridor mile is the supplied scope unit; it is not a lane-mile, map-measured distance, or guarantee of a particular width or treatment on both sides. Engineering scope must define what each unit actually purchases.

## Missing values and source evidence

Proposal values such as type, location, distance, crossing count, and budget are nullable. Extraction does not turn an absent value into a numeric default. Relevant extracted fields retain supporting quotations and character offsets into the original text. The user reviews and edits the record before calculation.

The engine requires a project type, non-empty location, and the quantity appropriate to that type. Budget remains optional and does not change the cost arithmetic. Illustrative assumptions require explicit acceptance. Loading a labeled demonstration example is a separate action that supplies and accepts its illustrative inputs; ordinary extraction does not load an example behind the scenes.

Zod validates the shape and permitted ranges. Positive quantity and construction unit costs are required. Maintenance can be zero. Design and contingency range from 0% to 100%, sensitivity from 0% to 90%, and the integer horizon from 1 to 50 years. Crossing quantity is an integer. The alternative construction unit cost cannot exceed the proposed construction unit cost. Schema acceptance is input validation, not external factual verification.

## Authored illustrative defaults

All values below are in **USD**, newly authored for demonstration, uncalibrated, and unsourced. They are not observed city statistics, local contractor quotes, or researched typical costs. They remain editable.

| Assumption | Protected bike lane | Bus-priority corridor | Pedestrian crossings |
| --- | ---: | ---: | ---: |
| Proposed construction / unit | $650,000 / corridor mile | $900,000 / corridor mile | $120,000 / crossing |
| Alternative construction / unit | $180,000 / corridor mile | $250,000 / corridor mile | $35,000 / crossing |
| Proposed annual maintenance / unit | $14,000 / corridor mile | $20,000 / corridor mile | $3,000 / crossing |
| Alternative annual maintenance / unit | $7,000 / corridor mile | $9,000 / corridor mile | $1,000 / crossing |
| Design percentage | 15% | 15% | 15% |
| Contingency percentage | 20% | 20% | 20% |
| Unit-cost sensitivity | ±30% | ±30% | ±30% |
| Undiscounted horizon | 10 years | 10 years | 10 years |

User-supplied values are labeled separately, but the application has not independently verified them. Accepting illustrative values does not make them evidence-backed.

## Capital and maintenance arithmetic

Let `Q` be the quantity, `U` construction cost per unit, `M` annual maintenance per unit, `d` design percentage divided by 100, `c` contingency percentage divided by 100, and `H` the number of years.

```text
Construction = Q × U
Design       = Construction × d
Contingency  = (Construction + Design) × c
Capital      = Q × U × (1 + d) × (1 + c)
Annual incremental maintenance = Q × M
Undiscounted horizon total = Capital + H × Annual incremental maintenance
```

Contingency is applied to construction **and design**, not solely construction. Maintenance does not receive the capital design or contingency multipliers. The time-horizon total is a simple sum, not a present value or a full life-cycle estimate. UI currency rounding does not change the underlying model arithmetic.

### Worked bike-lane example

The hypothetical Elm Avenue example uses 1.5 corridor miles and the default assumptions above.

| Calculation | Proposed protected bike lane | Quick-build alternative |
| --- | ---: | ---: |
| Construction | 1.5 × $650,000 = $975,000 | 1.5 × $180,000 = $270,000 |
| Design at 15% | $146,250 | $40,500 |
| Contingency at 20% of construction + design | $224,250 | $62,100 |
| Incremental capital | **$1,345,500** | **$372,600** |
| Annual incremental maintenance | **$21,000** | **$10,500** |
| 10-year undiscounted total | **$1,555,500** | **$477,600** |

The zero-dollar baseline indicates no new project expenditure within this comparison. It is not a claim about Demo City's existing budget, deferred maintenance, asset condition, or cost of retaining the current street configuration.

For the other authored examples, the 2-mile bus proposal yields $2,484,000 capital and $40,000 annual maintenance; the alternative yields $690,000 and $18,000. Four proposed crossings yield $662,400 capital and $12,000 annual maintenance; the alternative yields $193,200 and $4,000. These are illustrative calculations with the same scope exclusions.

## Sensitivity analysis

For accepted sensitivity fraction `s`, the engine runs cost cases with `U_low = U × (1 − s)` and `U_high = U × (1 + s)`. It similarly varies maintenance unit cost `M`. Quantity and design/contingency percentages remain fixed. Baseline incremental spending remains zero.

The default bike-lane proposal has capital bounds **$941,850–$1,749,150** and annual maintenance bounds **$14,700–$27,300**. Its alternative has capital bounds **$260,820–$484,380** and annual maintenance bounds **$7,350–$13,650**.

These bounds are **scenario-based sensitivity ranges**. They have no assigned probability, statistical confidence level, calibrated distribution, or claim of capturing all uncertainty. They do not vary project quantity, scope, timing, utilities, land acquisition, or every possible cost driver. Local estimating work is needed to define defensible ranges.

## Qualitative considerations

Access, safety, operations, and delivery are discussed in neutral, intervention-specific text. Protected bike lanes prompt questions about network continuity, intersections, loading, emergency access, and maintenance. Bus priority prompts service, stops, enforcement, signal coordination, and accessible boarding questions. Pedestrian crossings prompt geometry, visibility, ramps, drainage, and accessible connection questions.

These considerations do not establish measured benefits or causal effects. A lower modeled price does not prove that an alternative achieves the same protection, capacity, durability, accessibility, or public value. The application does not score political preferences, optimize an unmeasured social objective, or calculate a benefit-cost ratio.

## Geographic representation

Leaflet renders attributed OpenStreetMap base tiles. The proposal location is a user-supplied text description. A movable marker or editable line supports discussion of a possible location. Without a real route dataset or surveying workflow, corridors are labeled illustrative. The line does not supply or validate model quantity. Base-map content is contextual geography, not an observed transportation or safety dataset.

## Sources and AI boundaries

The built-in model results carry an empty external-source list because the defaults are authored examples. CivicDT must not synthesize citations to make them look researched. If an optional provider extracts or summarizes a proposal, returned content is validated and displayed with its execution mode; absent or unavailable AI falls back to deterministic demo behavior with a visible explanation.

The decision brief uses the validated model result as its numerical authority. Its statements distinguish accepted illustrative assumptions, unverified user inputs, computed arithmetic, and qualitative uncertainties. No AI-generated number becomes an independent modeled outcome.

## Exclusions and follow-up

The model omits inflation, discounting, financing, residual value, asset renewals, land acquisition, unspecified utility relocation, project-specific operating costs, permitting detail, scheduling, and actual baseline expenditure. It does not quantify travel time, traffic redistribution, ridership, emissions, crashes, deaths prevented, health outcomes, crime reduction, or causal policy effects.

A real study should collect site geometry and right-of-way, local unit estimates, utility and drainage scope, traffic and pedestrian/cycle counts, operator data where relevant, accessibility requirements, safety evidence, and stakeholder concerns. A project engineer and appropriate local professionals must define scope and assess suitability. The prototype makes those missing investigations visible rather than replacing them.
