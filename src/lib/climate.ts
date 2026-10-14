import { z } from "zod";

/** Authored on October 13, 2026 as a continuation outside the EvoHacks window. */
export const CLIMATE_MODEL_VERSION = "civicdt-tailpipe-v1.0.0";

/** This benchmark is available for explicit selection, never applied by default. */
export const EPA_GASOLINE_BENCHMARK = {
  id: "epa-gasoline-benchmark" as const,
  label: "EPA approximate gasoline passenger-vehicle benchmark",
  gramsPerMile: 400,
  url: "https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle",
  title: "US EPA: Greenhouse Gas Emissions from a Typical Passenger Vehicle",
  lastUpdated: "2026-06-03",
  verifiedOn: "2026-10-13",
  scope:
    "About 400 grams of tailpipe CO₂ per vehicle mile; an approximate average passenger gasoline vehicle benchmark, not a local fleet measurement.",
} as const;

export const climateInputSchema = z
  .object({
    avoidedMiles: z
      .number()
      .finite()
      .nonnegative()
      .max(Number.MAX_SAFE_INTEGER)
      .nullable(),
    gramsPerMile: z
      .number()
      .finite()
      .nonnegative()
      .max(Number.MAX_SAFE_INTEGER)
      .nullable(),
    basis: z.enum(["hypothetical", "measured"]),
    evidenceNote: z.string().trim().max(2000),
    factorSource: z.enum(["epa-gasoline-benchmark", "user"]).nullable(),
  })
  .strict()
  .superRefine((input, context) => {
    if (
      input.factorSource === "epa-gasoline-benchmark" &&
      input.gramsPerMile !== null &&
      input.gramsPerMile !== EPA_GASOLINE_BENCHMARK.gramsPerMile
    ) {
      context.addIssue({
        code: "custom",
        path: ["gramsPerMile"],
        message:
          "The selected EPA benchmark is 400 g CO₂/mile. Select a user-supplied factor for another value.",
      });
    }
    if (
      input.basis === "measured" &&
      input.avoidedMiles !== null &&
      input.evidenceNote === ""
    ) {
      context.addIssue({
        code: "custom",
        path: ["evidenceNote"],
        message:
          "Describe the measurement source, period, and method before labeling avoided vehicle miles as measured.",
      });
    }
    if (
      input.factorSource === "user" &&
      input.gramsPerMile !== null &&
      input.evidenceNote === ""
    ) {
      context.addIssue({
        code: "custom",
        path: ["evidenceNote"],
        message:
          "Describe the source and scope of the user-supplied emissions factor.",
      });
    }
  });

export type ClimateInput = z.infer<typeof climateInputSchema>;

interface ClimateResultCommon {
  modelVersion: string;
  input: ClimateInput;
  summary: string;
  limitations: string[];
  sources: { title: string; url: string }[];
}

export type ClimateResult = ClimateResultCommon &
  (
    | {
        status: "missing-inputs";
        grossAvoidedTailpipeTonnes: null;
        missing: string[];
      }
    | { status: "calculated"; grossAvoidedTailpipeTonnes: number; missing: [] }
  );

const limitations = [
  "This is a conditional conversion of supplied annual avoided vehicle miles, not a forecast of uptake or project impact. No avoided miles are inferred from corridor length, crossing count, cost, or infrastructure type.",
  "The result is gross avoided tailpipe CO₂ in metric tonnes per year, not net lifecycle greenhouse-gas savings or CO₂-equivalent. It excludes embodied construction, materials, maintenance, fuel and electricity production, and vehicle manufacturing.",
  "Emissions from replacement travel modes, traffic diversion, occupancy differences, induced travel, and rebound are not modeled. Do not interpret this result as a complete comparison of transport alternatives.",
  "A measured label records the user's stated evidence basis; CivicDT does not verify the data or establish that the intervention caused the measured change.",
  "Inputs and any selected benchmark have uncertainty. This calculator provides arithmetic, without a statistical confidence interval, a calibrated local emissions model, or a carbon-credit claim.",
];

/** A new climate worksheet starts without activity or emissions-factor values. */
export function emptyClimateInput(): ClimateInput {
  return {
    avoidedMiles: null,
    gramsPerMile: null,
    basis: "hypothetical",
    evidenceNote: "",
    factorSource: null,
  };
}

/** Call only from an explicitly labeled load-thought-experiment action. */
export function climateThoughtExperiment(): ClimateInput {
  return {
    avoidedMiles: 10_000,
    gramsPerMile: EPA_GASOLINE_BENCHMARK.gramsPerMile,
    basis: "hypothetical",
    evidenceNote:
      "Hypothetical thought experiment only: suppose 10,000 gasoline passenger-vehicle miles were avoided in one year. No trip shift, local measurement, or project forecast is asserted. The EPA approximate benchmark is explicitly selected.",
    factorSource: EPA_GASOLINE_BENCHMARK.id,
  };
}

/**
 * Gross avoided tailpipe tonnes/year = annual avoided vehicle miles × g CO₂/mile
 * ÷ 1,000,000 g/metric tonne. The caller supplies both quantities independently.
 */
export function calculateClimate(input: ClimateInput): ClimateResult {
  const parsed = climateInputSchema.safeParse(input);
  if (!parsed.success) {
    const messages = parsed.error.issues.map(
      (issue) => `${issue.path.join(".") || "input"}: ${issue.message}`,
    );
    throw new Error(`Review the climate inputs: ${messages.join("; ")}`);
  }
  const validated = parsed.data;
  const sources =
    validated.factorSource === EPA_GASOLINE_BENCHMARK.id
      ? [
          {
            title: EPA_GASOLINE_BENCHMARK.title,
            url: EPA_GASOLINE_BENCHMARK.url,
          },
        ]
      : [];
  const resultLimitations = [...limitations];
  if (validated.factorSource === EPA_GASOLINE_BENCHMARK.id) {
    resultLimitations.push(EPA_GASOLINE_BENCHMARK.scope);
    resultLimitations.push(
      "The gasoline benchmark is not appropriate as a local mixed-fleet factor or an electric-vehicle tailpipe factor. EPA states that electric vehicles have no tailpipe emissions; upstream emissions remain outside this calculation.",
    );
  } else if (validated.factorSource === "user") {
    resultLimitations.push(
      "The user-supplied factor and evidence note have not been independently verified. Ensure that the factor covers tailpipe CO₂ per vehicle mile and the same vehicle activity as the avoided miles.",
    );
  }
  const common: ClimateResultCommon = {
    modelVersion: CLIMATE_MODEL_VERSION,
    input: validated,
    summary: "",
    limitations: resultLimitations,
    sources,
  };
  const missing: string[] = [];
  if (validated.avoidedMiles === null)
    missing.push("Annual avoided vehicle miles");
  if (validated.gramsPerMile === null)
    missing.push("Tailpipe CO₂ emissions factor in grams per vehicle mile");
  if (validated.factorSource === null)
    missing.push("Explicit emissions-factor source selection");
  if (
    validated.avoidedMiles === null ||
    validated.gramsPerMile === null ||
    validated.factorSource === null
  ) {
    return {
      ...common,
      status: "missing-inputs",
      grossAvoidedTailpipeTonnes: null,
      missing,
      summary:
        "Climate output is not calculated. Supply annual avoided vehicle miles and explicitly select a sourced tailpipe CO₂ factor. Missing values remain unknown; no uptake is inferred from the project scope.",
    };
  }
  const grossAvoidedTailpipeTonnes =
    (validated.avoidedMiles * validated.gramsPerMile) / 1_000_000;
  const formatted = new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: 4,
  }).format(grossAvoidedTailpipeTonnes);
  return {
    ...common,
    status: "calculated",
    grossAvoidedTailpipeTonnes,
    missing: [],
    summary: `Using ${validated.basis === "hypothetical" ? "hypothetical" : "user-described measured"} annual avoided vehicle miles and the ${validated.factorSource === EPA_GASOLINE_BENCHMARK.id ? "explicitly selected approximate EPA gasoline benchmark" : "user-supplied emissions factor"}, the conditional arithmetic yields about ${formatted} metric tonnes of gross avoided tailpipe CO₂ per year. This is not a project uptake forecast, a causal finding, or a net lifecycle estimate.`,
  };
}
