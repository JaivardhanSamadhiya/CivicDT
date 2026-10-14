import { describe, expect, it } from "vitest";
import { analyze, DEFAULT_ASSUMPTIONS, MODEL_VERSION } from "../src/lib/engine";
import { exampleInput, examples } from "../src/lib/examples";
import { type ProjectType } from "../src/lib/schema";

describe("deterministic incremental cost analysis", () => {
  it("calculates the 1.5-mile bike demo from transparent arithmetic", () => {
    const result = analyze(exampleInput("bike-lane"));
    const [baseline, proposed, alternative] = result.scenarios;
    expect(result.modelVersion).toBe(MODEL_VERSION);
    expect(result.quantity).toBe(1.5);
    expect(result.unit).toBe("corridor mile");
    expect(proposed.constructionCost).toBe(975_000);
    expect(proposed.designCost).toBe(146_250);
    expect(proposed.contingencyCost).toBe(224_250);
    expect(proposed.capitalCost).toBe(1_345_500);
    expect(proposed.annualMaintenance).toBe(21_000);
    expect(proposed.lifecycleCost).toBe(1_555_500);
    expect(alternative.capitalCost).toBe(372_600);
    expect(alternative.annualMaintenance).toBe(10_500);
    expect(baseline.capitalCost).toBe(0);
    expect(baseline.annualMaintenance).toBe(0);
    expect(baseline.description).toContain("Existing city spending");
  });

  it.each<ProjectType>(["bike-lane", "bus-priority", "pedestrian"])(
    "runs the %s demo without external services",
    (type) => {
      const result = analyze(exampleInput(type));
      expect(result.scenarios.map((item) => item.id)).toEqual([
        "baseline",
        "proposed",
        "alternative",
      ]);
      expect(result.scenarios[1].capitalCost).toBeGreaterThan(
        result.scenarios[2].capitalCost,
      );
      for (const scenario of result.scenarios) {
        expect(scenario.lifecycleCost).toBeCloseTo(
          scenario.capitalCost +
            scenario.annualMaintenance * result.input.assumptions.horizonYears,
        );
        expect(scenario.capitalLow).toBeLessThanOrEqual(scenario.capitalCost);
        expect(scenario.capitalHigh).toBeGreaterThanOrEqual(
          scenario.capitalCost,
        );
      }
      expect(result.sources).toEqual([]);
      expect(result.limitations.join(" ")).toContain("not observed city data");
      expect(Number.isNaN(Date.parse(result.generatedAt))).toBe(false);
    },
  );

  it("uses crossings for pedestrian projects, not a supplied distance", () => {
    const input = exampleInput("pedestrian");
    input.proposal.distanceMiles = 500;
    const result = analyze(input);
    expect(result.quantity).toBe(4);
    expect(result.unit).toBe("crossing");
    expect(result.scenarios[1].capitalCost).toBe(662_400);
    expect(result.scenarios[1].annualMaintenance).toBe(12_000);
  });

  it("varies unit costs while holding design and contingency percentages fixed", () => {
    const input = exampleInput("bike-lane");
    input.assumptions.sensitivityPercent = 30;
    const proposed = analyze(input).scenarios[1];
    const low = 1.5 * 650_000 * 0.7 * 1.15 * 1.2;
    const high = 1.5 * 650_000 * 1.3 * 1.15 * 1.2;
    expect(proposed.capitalLow).toBeCloseTo(low);
    expect(proposed.capitalHigh).toBeCloseTo(high);
    expect(proposed.maintenanceLow).toBeCloseTo(14_700);
    expect(proposed.maintenanceHigh).toBeCloseTo(27_300);
    expect(analyze(input).limitations.join(" ")).toContain(
      "not confidence intervals",
    );
  });

  it("recalculates both comparisons and horizon totals after assumption changes", () => {
    const input = exampleInput("bike-lane");
    const before = analyze(input);
    input.assumptions.capitalPerUnit *= 2;
    input.assumptions.horizonYears = 20;
    const after = analyze(input);
    expect(after.scenarios[1].capitalCost).toBe(
      before.scenarios[1].capitalCost * 2,
    );
    expect(after.scenarios[2].capitalCost).toBe(
      before.scenarios[2].capitalCost,
    );
    expect(after.scenarios[1].lifecycleCost).toBe(
      after.scenarios[1].capitalCost + 420_000,
    );
  });

  it("supports zero design, contingency, maintenance, and sensitivity without artificial costs", () => {
    const input = exampleInput("bike-lane");
    Object.assign(input.assumptions, {
      designPercent: 0,
      contingencyPercent: 0,
      annualMaintenancePerUnit: 0,
      alternativeAnnualMaintenancePerUnit: 0,
      sensitivityPercent: 0,
      horizonYears: 1,
    });
    const proposed = analyze(input).scenarios[1];
    expect(proposed.capitalCost).toBe(975_000);
    expect(proposed.designCost).toBe(0);
    expect(proposed.contingencyCost).toBe(0);
    expect(proposed.lifecycleCost).toBe(proposed.capitalCost);
    expect(proposed.capitalLow).toBe(proposed.capitalCost);
    expect(proposed.capitalHigh).toBe(proposed.capitalCost);
  });

  it("accepts a same-capital-cost alternative and the upper sensitivity boundary", () => {
    const input = exampleInput("bike-lane");
    input.assumptions.alternativeCapitalPerUnit =
      input.assumptions.capitalPerUnit;
    input.assumptions.sensitivityPercent = 90;
    const result = analyze(input);
    expect(result.scenarios[2].capitalCost).toBe(
      result.scenarios[1].capitalCost,
    );
    expect(result.scenarios[1].capitalLow).toBeCloseTo(
      result.scenarios[1].capitalCost * 0.1,
    );
    expect(result.scenarios[1].capitalHigh).toBeCloseTo(
      result.scenarios[1].capitalCost * 1.9,
    );
  });

  it("requires illustrative acceptance and allows user-supplied assumptions", () => {
    const input = exampleInput("bike-lane");
    input.illustrativeAccepted = false;
    expect(() => analyze(input)).toThrow(
      "Accept the clearly labeled illustrative",
    );
    input.assumptionBasis = "user";
    expect(analyze(input).limitations[0]).toContain(
      "not been independently verified",
    );
  });

  it("never fills null type, location, distance, or crossing inputs", () => {
    const typeMissing = exampleInput("bike-lane");
    typeMissing.proposal.type = null;
    expect(() => analyze(typeMissing)).toThrow("project type");
    expect(typeMissing.proposal.type).toBeNull();
    const locationMissing = exampleInput("bike-lane");
    locationMissing.proposal.location = null;
    expect(() => analyze(locationMissing)).toThrow("location");
    locationMissing.proposal.location = "   ";
    expect(() => analyze(locationMissing)).toThrow("location");
    const distanceMissing = exampleInput("bike-lane");
    distanceMissing.proposal.distanceMiles = null;
    expect(() => analyze(distanceMissing)).toThrow("distance in miles");
    const crossingMissing = exampleInput("pedestrian");
    crossingMissing.proposal.crossingCount = null;
    expect(() => analyze(crossingMissing)).toThrow("number of crossings");
  });

  it("allows an unknown budget without inventing a budget", () => {
    const input = exampleInput("bike-lane");
    const result = analyze(input);
    expect(result.input.proposal.budget).toBeNull();
    expect(result.input.proposal.missing).toContain("budget");
    input.proposal.budget = 1_000_000;
    expect(analyze(input).limitations.join(" ")).toContain(
      "not an observed cost or proof of funding",
    );
  });

  it.each([
    { field: "capitalPerUnit", value: 0 },
    { field: "annualMaintenancePerUnit", value: -1 },
    { field: "designPercent", value: 101 },
    { field: "sensitivityPercent", value: 91 },
    { field: "horizonYears", value: 1.5 },
    { field: "capitalPerUnit", value: Number.POSITIVE_INFINITY },
  ])("rejects invalid assumption $field = $value", ({ field, value }) => {
    const input = exampleInput("bike-lane");
    Object.assign(input.assumptions, { [field]: value });
    expect(() => analyze(input)).toThrow(field);
  });

  it("rejects zero distances, fractional crossing counts, and a higher-cost alternative", () => {
    const corridor = exampleInput("bike-lane");
    corridor.proposal.distanceMiles = 0;
    expect(() => analyze(corridor)).toThrow("distanceMiles");
    const crossings = exampleInput("pedestrian");
    crossings.proposal.crossingCount = 1.5;
    expect(() => analyze(crossings)).toThrow("crossingCount");
    const costs = exampleInput("bike-lane");
    costs.assumptions.alternativeCapitalPerUnit =
      costs.assumptions.capitalPerUnit + 1;
    expect(() => analyze(costs)).toThrow("lower-cost alternative");
  });

  it("returns independent demo assumptions and verifiable source-text evidence", () => {
    const input = exampleInput("bike-lane");
    input.assumptions.capitalPerUnit = 1;
    expect(DEFAULT_ASSUMPTIONS["bike-lane"].capitalPerUnit).toBe(650_000);
    for (const example of examples) {
      const proposal = exampleInput(example.id).proposal;
      for (const evidence of proposal.evidence) {
        expect(proposal.sourceText.slice(evidence.start, evidence.end)).toBe(
          evidence.quote,
        );
      }
    }
  });
});
