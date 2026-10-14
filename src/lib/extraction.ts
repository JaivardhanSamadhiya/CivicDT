import { z } from "zod";
import { aiExtractionSchema, getExtractionProvider, type AIExtraction, type ExtractionProvider } from "./ai";
import { proposalSchema, type ExtractionResult, type ProjectType, type Proposal } from "./schema";

export const MAX_SOURCE_CHARACTERS = 30_000;
export const sourceTextSchema = z.string().min(1).max(MAX_SOURCE_CHARACTERS).refine(text => text.trim().length > 0, "Enter a project description before extracting.");

const typePatterns: Record<ProjectType, RegExp> = {
  "bike-lane": /\b(?:protected\s+|separated\s+)(?:bike|bicycle|cycling)[- ]lanes?\b/i,
  "bus-priority": /\b(?:bus[- ]priority(?:\s+corridor)?|dedicated\s+bus\s+lanes?|bus[- ]only\s+lanes?)\b/i,
  pedestrian: /\b(?:pedestrian\s+(?:crossing(?:\s+improvements?)?|safety(?:\s+improvements?)?)|crosswalk(?:\s+improvements?)?)\b/i,
};

function evidence(field: string, source: string, start: number, end: number): Proposal["evidence"][number] {
  return { field, quote: source.slice(start, end), start, end };
}

function unambiguousNumber(source: string, pattern: RegExp, convert: (match: RegExpMatchArray) => number) {
  const matches = [...source.matchAll(pattern)].filter(match => !isNegated(source, match.index ?? 0) && !/[-\d.]$/.test(source.slice(0, match.index ?? 0)));
  const candidates = matches.map(match => ({ value: convert(match), match })).filter(candidate => Number.isFinite(candidate.value) && candidate.value > 0);
  if (!candidates.length || new Set(candidates.map(candidate => candidate.value)).size !== 1) return null;
  return candidates[0];
}

function isNegated(text: string, index: number): boolean {
  const prefix = text.slice(Math.max(0, index - 45), index);
  return /\b(?:not|no|without|exclude|excluding|reject|rejected)\s+(?:(?:a|an|any|new|the)\s+)?$/i.test(prefix);
}

function inferredTitle(proposal: Pick<Proposal, "type" | "location">): string {
  const type = proposal.type === "bike-lane" ? "Protected bike lane" : proposal.type === "bus-priority" ? "Bus-priority corridor" : proposal.type === "pedestrian" ? "Pedestrian crossing improvement" : "Infrastructure proposal";
  return `${type}${proposal.location ? ` · ${proposal.location}` : ""}`.slice(0, 180);
}

export function identifyMissing(proposal: Pick<Proposal, "type" | "location" | "distanceMiles" | "crossingCount" | "budget" | "changes" | "objectives">): string[] {
  const missing: string[] = [];
  if (proposal.type === null) missing.push("type");
  if (proposal.location === null) missing.push("location");
  if (proposal.type === "pedestrian") {
    if (proposal.crossingCount === null) missing.push("crossingCount");
  } else if (proposal.distanceMiles === null) missing.push("distanceMiles");
  if (proposal.budget === null) missing.push("budget");
  if (!proposal.changes.length) missing.push("changes");
  if (!proposal.objectives.length) missing.push("objectives");
  return missing;
}

/** Conservative rule-based demo parsing, with no implicit input defaults. */
export function extractDeterministic(text: string): Proposal {
  const sourceText = sourceTextSchema.parse(text);
  const result: Proposal = {
    title: "Infrastructure proposal", type: null, location: null, distanceMiles: null,
    crossingCount: null, budget: null, changes: [], objectives: [], missing: [], evidence: [], sourceText,
  };
  const types = Object.entries(typePatterns).flatMap(([type, pattern]) => {
    const match = pattern.exec(sourceText);
    return match && !isNegated(sourceText, match.index) ? [{ type: type as ProjectType, match }] : [];
  });
  if (types.length === 1) {
    result.type = types[0].type;
    result.evidence.push(evidence("type", sourceText, types[0].match.index, types[0].match.index + types[0].match[0].length));
  }

  const locationPatterns = [
    /\b(?:location|city)\s*:\s*([^\r\n.;]{2,240})/i,
    /\bon\s+([^\r\n.;]{2,150}?\b(?:Avenue|Ave|Street|St|Road|Rd|Boulevard|Blvd|Way|Drive|Dr|Lane|Ln|Highway|Hwy)\b(?:\s+in\s+[^\r\n.;]{2,70})?)/i,
    /\bin\s+([A-Z][A-Za-z ',-]{1,100})(?=[.;\r\n]|$)/,
  ];
  for (const pattern of locationPatterns) {
    const match = pattern.exec(sourceText);
    if (!match) continue;
    const value = match[1].trim();
    const start = match.index + match[0].indexOf(value);
    result.location = value;
    result.evidence.push(evidence("location", sourceText, start, start + value.length));
    break;
  }

  const distance = unambiguousNumber(sourceText, /\b(\d+(?:\.\d+)?)\s*[- ]?\s*(miles?|mi|kilometers?|kilometres?|km)\b/gi, match => Number(match[1]) / (/^(?:k|kil)/i.test(match[2]) ? 1.609344 : 1));
  if (distance && distance.value <= 1000) {
    result.distanceMiles = distance.value;
    const start = distance.match.index ?? 0;
    result.evidence.push(evidence("distanceMiles", sourceText, start, start + distance.match[0].length));
  }
  const crossings = unambiguousNumber(sourceText, /\b(\d+)\s+(?:(?:new|enhanced|pedestrian|marked)\s+)?crossings?\b/gi, match => Number(match[1]));
  if (crossings && crossings.value <= 10_000) {
    result.crossingCount = crossings.value;
    const start = crossings.match.index ?? 0;
    result.evidence.push(evidence("crossingCount", sourceText, start, start + crossings.match[0].length));
  }
  const budgetMatches = [...sourceText.matchAll(/\bbudget(?:ed)?\s*(?:(?:of|is|at|up\s+to)\s*)?[:=]?\s*(?:USD\s*)?\$\s*(\d[\d,]*(?:\.\d+)?)\s*(million|billion|thousand|m|k)?\b/gi)];
  const budgets = budgetMatches.map(match => {
    const suffix = match[2]?.toLowerCase();
    const factor = suffix === "million" || suffix === "m" ? 1_000_000 : suffix === "billion" ? 1_000_000_000 : suffix === "thousand" || suffix === "k" ? 1000 : 1;
    return { value: Number(match[1].replaceAll(",", "")) * factor, match };
  }).filter(candidate => Number.isFinite(candidate.value) && candidate.value >= 0 && candidate.value <= 1e12 && !isNegated(sourceText, candidate.match.index ?? 0));
  if (budgets.length && new Set(budgets.map(candidate => candidate.value)).size === 1) {
    result.budget = budgets[0].value;
    const start = budgets[0].match.index ?? 0;
    result.evidence.push(evidence("budget", sourceText, start, start + budgets[0].match[0].length));
  }

  // Copy action and objective passages verbatim; statements are not verified outcomes.
  for (const match of sourceText.matchAll(/[^.!?\r\n]+(?:[.!?]|$)/g)) {
    const raw = match[0];
    const trimmed = raw.trim().replace(/[.!?]$/, "").trim();
    const start = (match.index ?? 0) + raw.indexOf(trimmed);
    if (/^(?:add|install|construct|replace|review|convert|reallocate|build|upgrade|widen|narrow|remove)\b/i.test(trimmed) && trimmed.length <= 600 && result.changes.length < 30) {
      const index = result.changes.length;
      result.changes.push(trimmed);
      result.evidence.push(evidence(`changes.${index}`, sourceText, start, start + trimmed.length));
    }
    const objective = /^(?:objectives?|goals?|purpose)\s*:\s*(.+)$/i.exec(trimmed);
    if (objective && objective[1].length <= 600 && result.objectives.length < 30) {
      const value = objective[1];
      const valueStart = start + trimmed.indexOf(value);
      const index = result.objectives.length;
      result.objectives.push(value);
      result.evidence.push(evidence(`objectives.${index}`, sourceText, valueStart, valueStart + value.length));
    }
  }
  result.title = inferredTitle(result);
  result.missing = identifyMissing(result);
  return proposalSchema.parse(result);
}

/** Quote offsets alone do not demonstrate that a value is supported. */
export function validateAIExtraction(candidate: unknown, sourceText: string): Proposal {
  const facts: AIExtraction = aiExtractionSchema.parse(candidate);
  const evidenceFields = new Set<string>();
  for (const item of facts.evidence) {
    if (!item.quote.trim() || item.start >= item.end || item.end > sourceText.length || sourceText.slice(item.start, item.end) !== item.quote || evidenceFields.has(item.field)) {
      throw new Error("The extraction evidence could not be verified.");
    }
    evidenceFields.add(item.field);
  }
  const supported = (field: string) => {
    const item = facts.evidence.find(item => item.field === field);
    if (!item) throw new Error("A source passage is required for every extracted fact.");
    return item.quote;
  };
  for (const field of ["type", "distanceMiles", "crossingCount", "budget"] as const) {
    if (facts[field] === null) continue;
    const quote = supported(field);
    const parsed = extractDeterministic(quote);
    if (parsed[field] === null || (typeof facts[field] === "number" && typeof parsed[field] === "number"
      ? Math.abs(facts[field] - parsed[field]) > 1e-9
      : facts[field] !== parsed[field])) {
      throw new Error("An extracted value is not supported by its source passage.");
    }
  }
  if (facts.location !== null && (!facts.location.trim() || !supported("location").includes(facts.location))) throw new Error("The extracted location is not present in its source passage.");
  for (const field of ["changes", "objectives"] as const) {
    facts[field].forEach((value, index) => {
      if (!value.trim() || !supported(`${field}.${index}`).includes(value)) throw new Error("An extracted statement is not present in its source passage.");
    });
  }
  const validFields = new Set(["type", "location", "distanceMiles", "crossingCount", "budget", ...facts.changes.map((_, index) => `changes.${index}`), ...facts.objectives.map((_, index) => `objectives.${index}`)]);
  if (facts.evidence.some(item => !validFields.has(item.field))) throw new Error("Unknown evidence field.");
  const proposal: Proposal = { ...facts, title: inferredTitle(facts), sourceText, missing: identifyMissing(facts) };
  return proposalSchema.parse(proposal);
}

export async function extractProposal(text: string, provider?: ExtractionProvider | null): Promise<ExtractionResult> {
  const sourceText = sourceTextSchema.parse(text);
  const selected = provider === undefined ? getExtractionProvider() : provider;
  if (selected === null) return { proposal: extractDeterministic(sourceText), mode: "demo", warning: "Demo mode: rule-based extraction ran. No AI model was called. Review every field; this parser only recognizes explicit supported formats." };
  try {
    const proposal = validateAIExtraction(await selected.extract(sourceText), sourceText);
    return { proposal, mode: "ai", provider: selected.name };
  } catch {
    return { proposal: extractDeterministic(sourceText), mode: "demo", warning: "AI extraction was unavailable or its source support could not be verified. Rule-based demo extraction ran instead; review all fields." };
  }
}
