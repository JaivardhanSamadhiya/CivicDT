import { DEFAULT_ASSUMPTIONS } from "./engine";
import { type AnalysisInput, type ProjectType, type Proposal } from "./schema";

export interface Example {
  id: ProjectType;
  title: string;
  description: string;
  text: string;
}

export const examples: Example[] = [
  {
    id: "bike-lane",
    title: "Elm Avenue protected bike lane",
    description: "Most complete demo · hypothetical 1.5-mile corridor · illustrative USD costs",
    text: "Evaluate a protected bike lane along a hypothetical 1.5-mile corridor on Elm Avenue in Demo City. Replace curbside space with a separated cycling lane and review intersections and loading access. Objectives: improve cycling connectivity and assess access tradeoffs. No project budget is specified. This is an illustrative demonstration, not a real city proposal.",
  },
  {
    id: "bus-priority",
    title: "Central Avenue bus-priority corridor",
    description: "Hypothetical 2-mile corridor · cost-only demonstration · illustrative USD costs",
    text: "Evaluate a bus-priority corridor along a hypothetical 2-mile route on Central Avenue in Demo City. Add priority bus space and review stop access and signal coordination. Objectives: assess transit corridor alternatives and understand cost tradeoffs. No project budget is specified. This is an illustrative demonstration, not a real city proposal.",
  },
  {
    id: "pedestrian",
    title: "Market Street crossing improvements",
    description: "Hypothetical 4 crossings · cost-only demonstration · illustrative USD costs",
    text: "Evaluate pedestrian crossing improvements at 4 crossings on Market Street in Demo City. Review visibility, curb ramps, crossing geometry and potential refuge treatments. Objectives: assess accessible pedestrian connections and compare intervention scope. No project budget is specified. This is an illustrative demonstration, not a real city proposal.",
  },
];

const demoDetails: Record<ProjectType, {
  location: string;
  distanceMiles: number | null;
  crossingCount: number | null;
  changes: string[];
  objectives: string[];
}> = {
  "bike-lane": {
    location: "Elm Avenue in Demo City",
    distanceMiles: 1.5,
    crossingCount: null,
    changes: ["Replace curbside space with a separated cycling lane", "Review intersections and loading access"],
    objectives: ["Improve cycling connectivity", "Assess access tradeoffs"],
  },
  "bus-priority": {
    location: "Central Avenue in Demo City",
    distanceMiles: 2,
    crossingCount: null,
    changes: ["Add priority bus space", "Review stop access and signal coordination"],
    objectives: ["Assess transit corridor alternatives", "Understand cost tradeoffs"],
  },
  pedestrian: {
    location: "Market Street in Demo City",
    distanceMiles: null,
    crossingCount: 4,
    changes: ["Review visibility, curb ramps, crossing geometry and potential refuge treatments"],
    objectives: ["Assess accessible pedestrian connections", "Compare intervention scope"],
  },
};

function evidenceFor(text: string, field: string, quote: string): Proposal["evidence"][number] {
  const start = text.indexOf(quote);
  if (start < 0) throw new Error(`The authored example is missing evidence for ${field}.`);
  return { field, quote, start, end: start + quote.length };
}

/**
 * Explicitly loading a labeled example accepts its illustrative model inputs.
 * This function is separate from extraction: ordinary proposals never default
 * missing values through it. Callers must label the load-example action clearly.
 */
export function exampleInput(type: ProjectType): AnalysisInput {
  const example = examples.find(item => item.id === type);
  if (!example) throw new Error("Unknown demonstration project type.");
  const details = demoDetails[type];
  const typeQuote = type === "bike-lane" ? "protected bike lane" : type === "bus-priority" ? "bus-priority corridor" : "pedestrian crossing improvements";
  const quantityQuote = type === "bike-lane" ? "1.5-mile" : type === "bus-priority" ? "2-mile" : "4 crossings";
  return {
    proposal: {
      title: example.title,
      type,
      ...details,
      budget: null,
      missing: ["budget"],
      evidence: [
        evidenceFor(example.text, "type", typeQuote),
        evidenceFor(example.text, "location", details.location),
        evidenceFor(example.text, type === "pedestrian" ? "crossingCount" : "distanceMiles", quantityQuote),
      ],
      sourceText: example.text,
    },
    assumptions: { ...DEFAULT_ASSUMPTIONS[type] },
    assumptionBasis: "illustrative",
    illustrativeAccepted: true,
  };
}
