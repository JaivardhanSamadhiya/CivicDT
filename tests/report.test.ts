import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { PDFParse } from "pdf-parse";
import { generateDecisionBrief, decisionBriefText } from "../src/lib/report";
import { analyze } from "../src/lib/engine";
import { exampleInput } from "../src/lib/examples";
import { POST } from "../src/app/api/report/route";

async function pdfText(bytes: Uint8Array) {
  const parser = new PDFParse({ data: bytes });
  try { return (await parser.getText()).text; } finally { await parser.destroy(); }
}

describe("decision briefs", () => {
  it("creates a real paginated PDF with trusted scenario values and required sections", async () => {
    const bytes = await generateDecisionBrief(exampleInput("bike-lane"));
    expect(new TextDecoder().decode(bytes.subarray(0, 5))).toBe("%PDF-");
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBeGreaterThan(1);
    const text = await pdfText(bytes);
    expect(text).toContain("Elm Avenue protected bike lane");
    expect(text).toContain("Executive summary");
    expect(text).toContain("$1,345,500");
    expect(text).toContain("$21,000");
    expect(text).toContain("$372,600");
    expect(text).toContain("Quantitative limitations");
    expect(text).toContain("Qualitative tradeoffs");
    expect(text).toContain("Recommended follow-up investigations");
    expect(text).toContain("Sources and traceability");
    expect(text).toContain("civicdt-cost-v1.0.0");
    expect(text).toMatch(/Generated timestamp \(UTC\)/);
    expect(text).toContain("not statistical confidence intervals");
  });

  it.each(["bus-priority", "pedestrian"] as const)("generates consistent %s example reports", async type => {
    const input = exampleInput(type);
    const result = analyze(input);
    const text = await pdfText(await generateDecisionBrief(input));
    expect(text).toContain(input.proposal.title);
    expect(text).toContain(new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(result.scenarios[1].capitalCost));
    expect(text).toContain("No observed city statistics");
  });

  it("handles long and unsupported characters without broken PDF generation", async () => {
    const input = exampleInput("bike-lane");
    input.proposal.title = "街路 " + "x".repeat(170);
    input.proposal.location = "東京都";
    const text = await pdfText(await generateDecisionBrief(input));
    expect(text).toContain("[U+8857]");
    expect(text).toContain("[U+6771]");
  });

  it("requires confirmed missing inputs and explicit acceptance before reporting", async () => {
    const input = exampleInput("bike-lane");
    input.proposal.distanceMiles = null;
    await expect(generateDecisionBrief(input)).rejects.toThrow(/distance/);
    const unaccepted = exampleInput("bike-lane");
    unaccepted.illustrativeAccepted = false;
    await expect(generateDecisionBrief(unaccepted)).rejects.toThrow(/Accept/);
  });

  it("provides traceable report text without invented external citations", () => {
    const result = analyze(exampleInput("bike-lane"));
    expect(decisionBriefText(result)).toContain("No external data source");
    expect(result.sources).toEqual([]);
  });

  it("recomputes PDF on the server instead of accepting forged client totals", async () => {
    const input = exampleInput("bike-lane");
    const response = await POST(new Request("http://localhost/api/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, scenarios: [{ capitalCost: 1 }] }) }));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain("attachment");
    const text = await pdfText(new Uint8Array(await response.arrayBuffer()));
    expect(text).toContain("$1,345,500");
    const invalid = await POST(new Request("http://localhost/api/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenarios: [{ capitalCost: 1 }] }) }));
    expect(invalid.status).toBe(400);
  });
});
