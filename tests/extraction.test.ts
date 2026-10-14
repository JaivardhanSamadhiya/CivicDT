import { describe, expect, it } from "vitest";
import { examples } from "../src/lib/examples";
import {
  extractDeterministic,
  extractProposal,
  validateAIExtraction,
} from "../src/lib/extraction";
import { proposalSchema } from "../src/lib/schema";

function candidateFor(text: string) {
  const {
    title: _title,
    missing: _missing,
    sourceText: _sourceText,
    ...candidate
  } = extractDeterministic(text);
  return candidate;
}

describe("proposal extraction", () => {
  it.each(examples)(
    "extracts the explicitly labeled $id example with valid source passages",
    (example) => {
      const proposal = extractDeterministic(example.text);
      expect(proposalSchema.safeParse(proposal).success).toBe(true);
      expect(proposal.type).toBe(example.id);
      expect(proposal.location).toContain("Demo City");
      expect(proposal.budget).toBeNull();
      expect(proposal.changes.length).toBeGreaterThan(0);
      expect(proposal.objectives.length).toBeGreaterThan(0);
      proposal.evidence.forEach((item) =>
        expect(example.text.slice(item.start, item.end)).toBe(item.quote),
      );
      expect(proposal.sourceText).toBe(example.text);
    },
  );

  it("does not fabricate missing proposal values or use a default length", () => {
    const proposal = extractDeterministic(
      "Consider a protected bike lane. No project budget is specified.",
    );
    expect(proposal.distanceMiles).toBeNull();
    expect(proposal.location).toBeNull();
    expect(proposal.budget).toBeNull();
    expect(proposal.missing).toEqual(
      expect.arrayContaining(["location", "distanceMiles", "budget"]),
    );
  });

  it("extracts explicit budget magnitude and converts explicit km without inventing a measurement", () => {
    const proposal = extractDeterministic(
      "Protected bike lane. Location: Elm Avenue. Length: 1.609344 km. Budget: $1.2 million.",
    );
    expect(proposal.distanceMiles).toBe(1);
    expect(proposal.budget).toBe(1_200_000);
    expect(
      proposal.evidence.find((item) => item.field === "distanceMiles")?.quote,
    ).toBe("1.609344 km");
  });

  it("leaves conflicting explicit quantities and project types unresolved", () => {
    const proposal = extractDeterministic(
      "Evaluate a protected bike lane or a bus-priority corridor along a 1.5-mile or 2-mile route.",
    );
    expect(proposal.type).toBeNull();
    expect(proposal.distanceMiles).toBeNull();
    expect(proposal.missing).toContain("type");
  });

  it("does not parse negated intervention or arbitrary dollar unit cost as project budget", () => {
    const proposal = extractDeterministic(
      "No protected bike lane is proposed. A construction unit cost is $500,000.",
    );
    expect(proposal.type).toBeNull();
    expect(proposal.budget).toBeNull();
  });

  it("does not promote an unspecified bike lane to protected infrastructure or accept negative length", () => {
    const proposal = extractDeterministic(
      "Consider a bike lane over -2 miles.",
    );
    expect(proposal.type).toBeNull();
    expect(proposal.distanceMiles).toBeNull();
  });

  it("does not extract numeric fragments from malformed or out-of-range quantities", () => {
    const proposal = extractDeterministic(
      "Protected bike lane over 1,500 miles. Budget: $1,,000.",
    );
    expect(proposal.distanceMiles).toBeNull();
    expect(proposal.budget).toBeNull();
    expect(extractDeterministic("Budget: $1,000,000.").budget).toBe(1_000_000);
  });

  it("caps long statement lists within the validated evidence limit", () => {
    const text =
      "Protected bike lane on Elm Avenue in Demo City, 1.5 miles. " +
      Array.from(
        { length: 30 },
        (_, index) =>
          `Add improvement ${index}. Objectives: assess option ${index}.`,
      ).join(" ");
    const proposal = extractDeterministic(text);
    expect(proposal.evidence.length).toBeLessThanOrEqual(60);
    expect(proposal.changes.length).toBeGreaterThan(0);
    expect(proposalSchema.safeParse(proposal).success).toBe(true);
  });

  it("rejects whitespace, empty or excessively long text", () => {
    for (const text of ["", "   \n", "x".repeat(30_001)])
      expect(() => extractDeterministic(text)).toThrow();
  });

  it("validates AI facts against both exact offsets and source value support", () => {
    const text = examples[0].text;
    const candidate = candidateFor(text);
    expect(validateAIExtraction(candidate, text).distanceMiles).toBe(1.5);
    expect(() =>
      validateAIExtraction({ ...candidate, distanceMiles: 99 }, text),
    ).toThrow(/not supported/);
    const damaged = {
      ...candidate,
      evidence: candidate.evidence.map((item) => ({
        ...item,
        start: item.start + 1,
      })),
    };
    expect(() => validateAIExtraction(damaged, text)).toThrow(/evidence/);
    expect(() =>
      validateAIExtraction({ ...candidate, location: "Invented City" }, text),
    ).toThrow(/not present/);
    const numericLocation = {
      ...candidate,
      location: "1.5-mile",
      evidence: candidate.evidence.map((item) =>
        item.field === "location"
          ? {
              ...item,
              quote: "1.5-mile",
              start: text.indexOf("1.5-mile"),
              end: text.indexOf("1.5-mile") + 8,
            }
          : item,
      ),
    };
    expect(() => validateAIExtraction(numericLocation, text)).toThrow(
      /verified location/,
    );
  });

  it("does not let an AI arbitrarily select a quantity from conflicting source values", () => {
    const text = examples[0].text + " An alternative route is 2 miles.";
    const candidate = candidateFor(examples[0].text);
    expect(() => validateAIExtraction(candidate, text)).toThrow(
      /not supported/,
    );
  });

  it("requires array evidence and rejects AI paraphrases or unrecognized fields", () => {
    const text = examples[0].text;
    const candidate = candidateFor(text);
    expect(() =>
      validateAIExtraction(
        { ...candidate, changes: ["Prevent 100 crashes"] },
        text,
      ),
    ).toThrow();
    expect(() =>
      validateAIExtraction(
        {
          ...candidate,
          evidence: candidate.evidence.filter(
            (item) => !item.field.startsWith("objectives"),
          ),
        },
        text,
      ),
    ).toThrow(/passage/);
    expect(() =>
      validateAIExtraction({ ...candidate, travelTimeSaved: 8 }, text),
    ).toThrow();
  });

  it("reports honest deterministic mode without a provider", async () => {
    const result = await extractProposal(examples[0].text, null);
    expect(result.mode).toBe("demo");
    expect(result.provider).toBeUndefined();
    expect(result.warning).toContain("No AI model was called");
  });

  it("accepts verified provider extraction and safely falls back when values are fabricated", async () => {
    const text = examples[0].text;
    const verified = await extractProposal(text, {
      name: "Test provider",
      extract: async () => candidateFor(text),
    });
    expect(verified.mode).toBe("ai");
    const rejected = await extractProposal(text, {
      name: "Test provider",
      extract: async () => ({ ...candidateFor(text), distanceMiles: 100 }),
    });
    expect(rejected.mode).toBe("demo");
    expect(rejected.proposal.distanceMiles).toBe(1.5);
  });
});
