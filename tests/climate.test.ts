import { describe, expect, it } from "vitest";
import {
  calculateClimate,
  climateInputSchema,
  climateThoughtExperiment,
  emptyClimateInput,
  EPA_GASOLINE_BENCHMARK,
} from "../src/lib/climate";

describe("optional climate thought experiment", () => {
  it("starts without numeric defaults and never treats missing activity as zero", () => {
    const input = emptyClimateInput();
    expect(input.avoidedMiles).toBeNull();
    expect(input.gramsPerMile).toBeNull();
    expect(input.factorSource).toBeNull();
    const result = calculateClimate(input);
    expect(result.status).toBe("missing-inputs");
    expect(result.grossAvoidedTailpipeTonnes).toBeNull();
    expect(result.missing).toHaveLength(3);
    expect(result.input).toEqual(input);
  });

  it("does not apply the EPA value when avoided miles alone are supplied", () => {
    const input = emptyClimateInput();
    input.avoidedMiles = 10_000;
    const result = calculateClimate(input);
    expect(result.status).toBe("missing-inputs");
    expect(result.grossAvoidedTailpipeTonnes).toBeNull();
    expect(result.input.gramsPerMile).toBeNull();
    expect(result.sources).toEqual([]);
  });

  it("requires miles when a benchmark is selected", () => {
    const input = emptyClimateInput();
    input.gramsPerMile = EPA_GASOLINE_BENCHMARK.gramsPerMile;
    input.factorSource = EPA_GASOLINE_BENCHMARK.id;
    expect(calculateClimate(input).missing).toEqual([
      "Annual avoided vehicle miles",
    ]);
  });

  it("requires explicit source selection even when both numbers are supplied", () => {
    const input = emptyClimateInput();
    input.avoidedMiles = 10_000;
    input.gramsPerMile = 400;
    const result = calculateClimate(input);
    expect(result.status).toBe("missing-inputs");
    expect(result.missing).toEqual([
      "Explicit emissions-factor source selection",
    ]);
  });

  it("converts grams to metric tonnes for the explicitly loaded thought experiment", () => {
    const result = calculateClimate(climateThoughtExperiment());
    expect(result.status).toBe("calculated");
    expect(result.grossAvoidedTailpipeTonnes).toBe(4);
    expect(result.missing).toEqual([]);
    expect(result.summary).toContain("hypothetical");
    expect(result.summary).toContain("gross avoided tailpipe CO₂ per year");
    expect(result.sources).toEqual([
      { title: EPA_GASOLINE_BENCHMARK.title, url: EPA_GASOLINE_BENCHMARK.url },
    ]);
  });

  it("accepts zero avoided miles as a supplied quantity", () => {
    const input = climateThoughtExperiment();
    input.avoidedMiles = 0;
    const result = calculateClimate(input);
    expect(result.status).toBe("calculated");
    expect(result.grossAvoidedTailpipeTonnes).toBe(0);
  });

  it("accepts a sourced zero tailpipe factor without claiming net zero emissions", () => {
    const input = climateThoughtExperiment();
    input.factorSource = "user";
    input.gramsPerMile = 0;
    input.evidenceNote =
      "User-defined battery-electric-vehicle tailpipe factor; upstream electricity and manufacturing are excluded.";
    const result = calculateClimate(input);
    expect(result.grossAvoidedTailpipeTonnes).toBe(0);
    expect(result.sources).toEqual([]);
    expect(result.limitations.join(" ")).toContain("not net lifecycle");
  });

  it("keeps fractional vehicle miles and supplied factors in the arithmetic", () => {
    const input = climateThoughtExperiment();
    input.avoidedMiles = 2_500.5;
    input.gramsPerMile = 250;
    input.factorSource = "user";
    input.evidenceNote =
      "Hypothetical tailpipe factor of 250 g CO₂ per vehicle mile; no local fleet study.";
    expect(calculateClimate(input).grossAvoidedTailpipeTonnes).toBeCloseTo(
      0.625125,
    );
  });

  it.each([
    { field: "avoidedMiles", value: -1 },
    { field: "gramsPerMile", value: -0.1 },
    { field: "avoidedMiles", value: Number.NaN },
    { field: "gramsPerMile", value: Number.POSITIVE_INFINITY },
    { field: "avoidedMiles", value: "10000" },
  ])("rejects invalid $field without coercion", ({ field, value }) => {
    const input = { ...climateThoughtExperiment(), [field]: value };
    expect(climateInputSchema.safeParse(input).success).toBe(false);
  });

  it("rejects relabeling a different factor as the verified EPA benchmark", () => {
    const input = climateThoughtExperiment();
    input.gramsPerMile = 250;
    expect(() => calculateClimate(input)).toThrow(
      "Select a user-supplied factor",
    );
  });

  it("requires evidence before recording measured activity", () => {
    const input = climateThoughtExperiment();
    input.basis = "measured";
    input.evidenceNote = "   ";
    expect(() => calculateClimate(input)).toThrow(
      "measurement source, period, and method",
    );
    input.evidenceNote =
      "User-described pilot trip diary covering an identified week; annualization documented separately. Not independently verified.";
    const result = calculateClimate(input);
    expect(result.summary).toContain("user-described measured");
    expect(result.limitations.join(" ")).toContain("does not verify");
  });

  it("requires provenance for a custom factor", () => {
    const input = climateThoughtExperiment();
    input.factorSource = "user";
    input.evidenceNote = "";
    expect(() => calculateClimate(input)).toThrow("source and scope");
  });

  it("strictly excludes project geometry and does not infer vehicle activity", () => {
    const input = { ...emptyClimateInput(), distanceMiles: 1.5 };
    expect(climateInputSchema.safeParse(input).success).toBe(false);
    expect(
      calculateClimate(emptyClimateInput()).limitations.join(" "),
    ).toContain("No avoided miles are inferred from corridor length");
  });

  it("retains lifecycle, substitution, and causal-attribution limitations", () => {
    const all = calculateClimate(climateThoughtExperiment()).limitations.join(
      " ",
    );
    expect(all).toContain("embodied construction");
    expect(all).toContain("replacement travel modes");
    expect(all).toContain("rebound");
    expect(all).toContain("does not verify the data");
    expect(all).toContain("not appropriate as a local mixed-fleet factor");
  });

  it("returns fresh thought-experiment inputs without changing the empty state", () => {
    const first = climateThoughtExperiment();
    first.avoidedMiles = 1;
    expect(climateThoughtExperiment().avoidedMiles).toBe(10_000);
    expect(emptyClimateInput().avoidedMiles).toBeNull();
  });
});
