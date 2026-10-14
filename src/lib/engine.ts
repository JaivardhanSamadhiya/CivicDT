import {
  analysisInputSchema,
  type AnalysisInput,
  type AnalysisResult,
  type Assumptions,
  type ProjectType,
  type Scenario,
} from "./schema";

/** Version of the cost arithmetic, not a claim of engineering validation. */
export const MODEL_VERSION = "civicdt-cost-v1.0.0";

export const projectLabels: Record<ProjectType, string> = {
  "bike-lane": "Protected bike lane",
  "bus-priority": "Bus-priority corridor",
  pedestrian: "Pedestrian crossing improvement",
};

/**
 * Newly authored demonstration assumptions in USD. These are illustrative,
 * uncalibrated inputs, not quoted project costs or observed city statistics.
 * They may only be analyzed after explicit illustrative acceptance.
 */
export const DEFAULT_ASSUMPTIONS: Record<ProjectType, Assumptions> = {
  "bike-lane": {
    capitalPerUnit: 650_000,
    alternativeCapitalPerUnit: 180_000,
    annualMaintenancePerUnit: 14_000,
    alternativeAnnualMaintenancePerUnit: 7_000,
    designPercent: 15,
    contingencyPercent: 20,
    sensitivityPercent: 30,
    horizonYears: 10,
  },
  "bus-priority": {
    capitalPerUnit: 900_000,
    alternativeCapitalPerUnit: 250_000,
    annualMaintenancePerUnit: 20_000,
    alternativeAnnualMaintenancePerUnit: 9_000,
    designPercent: 15,
    contingencyPercent: 20,
    sensitivityPercent: 30,
    horizonYears: 10,
  },
  pedestrian: {
    capitalPerUnit: 120_000,
    alternativeCapitalPerUnit: 35_000,
    annualMaintenancePerUnit: 3_000,
    alternativeAnnualMaintenancePerUnit: 1_000,
    designPercent: 15,
    contingencyPercent: 20,
    sensitivityPercent: 30,
    horizonYears: 10,
  },
};

interface InterventionDescription {
  proposed: {
    name: string;
    description: string;
    tradeoffs: Scenario["tradeoffs"];
  };
  alternative: {
    name: string;
    description: string;
    tradeoffs: Scenario["tradeoffs"];
  };
  followUp: string[];
}

const descriptions: Record<ProjectType, InterventionDescription> = {
  "bike-lane": {
    proposed: {
      name: "Protected bike lane",
      description:
        "Illustrative separation treatment along the supplied corridor length; an engineering design is required to define the physical scope.",
      tradeoffs: {
        access:
          "Dedicated cycling space may broaden route choices; continuity and accessible loading require assessment.",
        safety:
          "Separation changes conflict patterns. Intersection design, turning movements, and local evidence require review; no safety outcome is quantified.",
        operations:
          "Repurposed curb or lane space may affect parking, deliveries, emergency access, and drainage.",
        delivery:
          "Physical separation entails site design, utility checks, procurement, and a maintenance plan.",
      },
    },
    alternative: {
      name: "Quick-build bike lane",
      description:
        "Illustrative lower-cost markings and flexible delineators on the same corridor; durability and protection differ from the proposed treatment.",
      tradeoffs: {
        access:
          "A staged corridor treatment can be evaluated before a permanent design; network gaps still require review.",
        safety:
          "Flexible delineation offers a different protection level. No relative crash effect is modeled.",
        operations:
          "Delineators may require replacement and can complicate sweeping, loading, or snow clearance.",
        delivery:
          "Assumed lower construction cost; actual schedule and permitting remain unestimated.",
      },
    },
    followUp: [
      "Survey right-of-way, curb uses, utilities, drainage, and intersection geometry.",
      "Collect turning movements, existing traffic and bicycle counts, and accessibility needs.",
      "Obtain local contractor estimates and define the physical separation and maintenance scope.",
      "Consult corridor users, disability access representatives, businesses, and emergency services.",
    ],
  },
  "bus-priority": {
    proposed: {
      name: "Bus-priority corridor",
      description:
        "Illustrative corridor treatment with dedicated priority space; signal, station, and fleet upgrades need a separately defined scope.",
      tradeoffs: {
        access:
          "Transit access depends on stop placement, pedestrian connections, operating hours, and service frequency.",
        safety:
          "Stop and crossing design requires assessment; no crash or injury change is estimated.",
        operations:
          "Priority space changes lane and curb allocation; enforcement and signal operations need an operating plan.",
        delivery:
          "Requires coordination with the transit operator, traffic engineering, and accessibility review.",
      },
    },
    alternative: {
      name: "Targeted bus-priority treatments",
      description:
        "Illustrative markings and targeted corridor improvements, assumed at a lower cost per corridor mile; this is not a forecast of equivalent benefits.",
      tradeoffs: {
        access:
          "Targeted improvements may leave portions of the corridor without priority treatment.",
        safety:
          "Stop-area and crossing conflicts remain site-specific and unquantified.",
        operations:
          "Limited treatments require identifying bottlenecks and coordinating enforcement.",
        delivery:
          "Assumed lower capital intensity; treatment locations and signal costs need validation.",
      },
    },
    followUp: [
      "Obtain route, service frequency, ridership, dwell-time, and travel-time data from the transit operator.",
      "Measure corridor bottlenecks and define priority treatments, stop upgrades, and signal scope.",
      "Review lane allocation, curb access, accessible boarding, enforcement, and emergency operations.",
      "Obtain local construction and operating estimates before estimating transportation benefits.",
    ],
  },
  pedestrian: {
    proposed: {
      name: "Enhanced pedestrian crossings",
      description:
        "Illustrative crossing improvements at the supplied number of locations; refuge islands, curb changes, and signals require a defined site design.",
      tradeoffs: {
        access:
          "Crossing layout must address step-free access, tactile surfaces, sightlines, and pedestrian desire lines.",
        safety:
          "Treatments address conflict points, but no crash reduction or deaths prevented are calculated.",
        operations:
          "Curb changes may affect drainage, turning paths, loading, and emergency access.",
        delivery:
          "Site surveys and accessibility review are needed for each crossing.",
      },
    },
    alternative: {
      name: "Crossing markings and visibility",
      description:
        "Illustrative lower-cost markings and visibility improvements at the same number of crossings; suitability depends on speeds, volumes, and geometry.",
      tradeoffs: {
        access:
          "Markings alone may not resolve missing ramps, long crossing distances, or inaccessible connections.",
        safety:
          "Suitability requires site review; benefits relative to the proposed treatment are not quantified.",
        operations:
          "Markings need renewal, and visibility improvements may change curb parking.",
        delivery:
          "Assumed lower capital cost; each site still needs a treatment selection assessment.",
      },
    },
    followUp: [
      "Survey each crossing's geometry, visibility, ramps, drainage, and accessible connections.",
      "Collect pedestrian counts, vehicle speeds, turning volumes, and relevant local safety records.",
      "Select appropriate treatments through traffic engineering and disability access review.",
      "Obtain site-specific construction costs and a markings, signals, and landscape maintenance plan.",
    ],
  },
};

function capitalCosts(
  quantity: number,
  unitCost: number,
  assumptions: Assumptions,
) {
  const constructionCost = quantity * unitCost;
  const designCost = (constructionCost * assumptions.designPercent) / 100;
  const contingencyCost =
    ((constructionCost + designCost) * assumptions.contingencyPercent) / 100;
  return {
    constructionCost,
    designCost,
    contingencyCost,
    capitalCost: constructionCost + designCost + contingencyCost,
  };
}

function costScenario(
  id: "proposed" | "alternative",
  quantity: number,
  assumptions: Assumptions,
  description: InterventionDescription["proposed"],
): Scenario {
  const unitCost =
    id === "proposed"
      ? assumptions.capitalPerUnit
      : assumptions.alternativeCapitalPerUnit;
  const maintenancePerUnit =
    id === "proposed"
      ? assumptions.annualMaintenancePerUnit
      : assumptions.alternativeAnnualMaintenancePerUnit;
  const costs = capitalCosts(quantity, unitCost, assumptions);
  const annualMaintenance = quantity * maintenancePerUnit;
  const sensitivity = assumptions.sensitivityPercent / 100;
  return {
    id,
    ...description,
    ...costs,
    annualMaintenance,
    lifecycleCost:
      costs.capitalCost + annualMaintenance * assumptions.horizonYears,
    // Sensitivity changes unit costs; design and contingency percentages stay fixed.
    capitalLow: capitalCosts(
      quantity,
      unitCost * (1 - sensitivity),
      assumptions,
    ).capitalCost,
    capitalHigh: capitalCosts(
      quantity,
      unitCost * (1 + sensitivity),
      assumptions,
    ).capitalCost,
    maintenanceLow: quantity * maintenancePerUnit * (1 - sensitivity),
    maintenanceHigh: quantity * maintenancePerUnit * (1 + sensitivity),
  };
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Deterministic, incremental cost comparison. The LLM never supplies results.
 * No missing proposal value is replaced with an implicit default.
 */
export function analyze(input: AnalysisInput): AnalysisResult {
  const parsed = analysisInputSchema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Review the analysis inputs: ${message}`);
  }
  const validated = parsed.data;
  const { proposal, assumptions } = validated;
  if (
    validated.assumptionBasis === "illustrative" &&
    !validated.illustrativeAccepted
  ) {
    throw new Error(
      "Accept the clearly labeled illustrative cost assumptions or supply your own assumptions before calculating.",
    );
  }
  if (proposal.type === null)
    throw new Error(
      "Select an infrastructure project type before calculating.",
    );
  if (proposal.location === null || proposal.location.trim() === "")
    throw new Error("Supply a project location before calculating.");
  const quantity =
    proposal.type === "pedestrian"
      ? proposal.crossingCount
      : proposal.distanceMiles;
  if (quantity === null) {
    throw new Error(
      proposal.type === "pedestrian"
        ? "Supply the number of crossings before calculating."
        : "Supply the corridor distance in miles before calculating.",
    );
  }
  const description = descriptions[proposal.type];
  const baseline: Scenario = {
    id: "baseline",
    name: "No new intervention",
    description:
      "Reference case with no new project spending. Existing city spending and maintenance are excluded, not assumed to be zero.",
    capitalCost: 0,
    annualMaintenance: 0,
    lifecycleCost: 0,
    capitalLow: 0,
    capitalHigh: 0,
    maintenanceLow: 0,
    maintenanceHigh: 0,
    constructionCost: 0,
    designCost: 0,
    contingencyCost: 0,
    tradeoffs: {
      access:
        "Retains the current configuration; current accessibility conditions have not been measured.",
      safety:
        "Retains the current configuration; baseline safety conditions have not been assessed.",
      operations:
        "No new intervention-related operating scope. Existing operations continue outside this model.",
      delivery:
        "No project construction. Existing asset renewal and liabilities are excluded.",
    },
  };
  const proposed = costScenario(
    "proposed",
    quantity,
    assumptions,
    description.proposed,
  );
  const alternative = costScenario(
    "alternative",
    quantity,
    assumptions,
    description.alternative,
  );
  const unit = proposal.type === "pedestrian" ? "crossing" : "corridor mile";
  const limitations = [
    validated.assumptionBasis === "illustrative"
      ? "All unit costs and model parameters are accepted illustrative demonstration assumptions, not observed city data or an engineering estimate."
      : "User-supplied unit costs and model parameters have not been independently verified or calibrated to this location.",
    "Costs are incremental to no new intervention. The baseline's zero values do not represent total city capital or maintenance spending.",
    "Capital = quantity × construction unit cost, plus design as a percentage of construction, plus contingency as a percentage of construction and design.",
    "The horizon total is capital plus annual incremental maintenance × years, undiscounted. Inflation, financing, renewals, residual value, land acquisition, and unspecified utility or operating costs are excluded.",
    `Sensitivity varies capital and maintenance unit costs by ±${assumptions.sensitivityPercent}% while holding quantity, design percentage, and contingency percentage fixed. These are scenario bounds, not confidence intervals or probabilities.`,
    "No observed outcome dataset or validated transportation, safety, health, or crime model is included. Travel time, ridership, emissions, crashes, and other causal effects are not quantified.",
    "The supplied corridor distance or crossing count is user-entered or explicitly demonstrated; the map does not establish a surveyed GIS measurement.",
    "Cost-only alternatives have different physical scope and may not provide equivalent service or outcomes. This model does not rank political choices or establish a benefit-cost ratio.",
  ];
  if (proposal.budget !== null) {
    limitations.push(
      "The stated budget is a comparison constraint, not an observed cost or proof of funding. Budget coverage excludes all unmodeled costs.",
    );
  }
  return {
    modelVersion: MODEL_VERSION,
    generatedAt: new Date().toISOString(),
    input: validated,
    quantity,
    unit,
    scenarios: [baseline, proposed, alternative],
    limitations,
    followUp: description.followUp,
    summary: `${projectLabels[proposal.type]} at ${proposal.location}: ${quantity} ${unit}${quantity === 1 ? "" : "s"}. Using ${validated.assumptionBasis === "illustrative" ? "accepted illustrative" : "user-supplied"} assumptions, proposed incremental capital is ${formatMoney(proposed.capitalCost)} with ${formatMoney(proposed.annualMaintenance)} in annual incremental maintenance; the alternative is ${formatMoney(alternative.capitalCost)} and ${formatMoney(alternative.annualMaintenance)} respectively. The ${assumptions.horizonYears}-year undiscounted proposed total is ${formatMoney(proposed.lifecycleCost)}. These costs inform a comparison; benefits and causal outcomes remain unquantified.`,
    // No external evidence is attached to these authored demonstration assumptions.
    sources: [],
  };
}
