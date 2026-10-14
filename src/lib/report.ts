import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { analyze, formatMoney, projectLabels } from "./engine";
import { type AnalysisInput, type AnalysisResult } from "./schema";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 48;
const WIDTH = PAGE_WIDTH - MARGIN * 2;
const navy = rgb(0.055, 0.11, 0.18);
const teal = rgb(0.035, 0.39, 0.39);
const ink = rgb(0.15, 0.2, 0.26);
const muted = rgb(0.36, 0.41, 0.47);
const border = rgb(0.82, 0.86, 0.88);

function safeText(text: string, font: PDFFont): string {
  const characters = new Set(font.getCharacterSet());
  return [...text.replace(/[\r\n\t]+/g, " ").replace(/[\u2010-\u2015]/g, "-").replace(/\u00d7/g, "x")]
    .map(character => characters.has(character.codePointAt(0)!) ? character : `[U+${character.codePointAt(0)!.toString(16).toUpperCase()}]`).join("");
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = safeText(text, font).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const pieces: string[] = [];
    let piece = "";
    for (const character of word) {
      if (piece && font.widthOfTextAtSize(piece + character, size) > width) {
        pieces.push(piece);
        piece = character;
      } else piece += character;
    }
    if (piece) pieces.push(piece);
    for (const segment of pieces) {
      const next = line ? `${line} ${segment}` : segment;
      if (font.widthOfTextAtSize(next, size) > width && line) {
        lines.push(line);
        line = segment;
      } else line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

/** Content is generated from trusted model output, never client-supplied totals. */
export function decisionBriefText(result: AnalysisResult): string {
  const { proposal, assumptions } = result.input;
  return [
    "CivicDT decision brief", proposal.title, `Location: ${proposal.location}`, result.summary,
    `Model: ${result.modelVersion}`, `Generated: ${result.generatedAt}`,
    `Assumption basis: ${result.input.assumptionBasis}`, `Quantity: ${result.quantity} ${result.unit}`,
    `Proposed construction unit cost: ${formatMoney(assumptions.capitalPerUnit)}`,
    `Alternative construction unit cost: ${formatMoney(assumptions.alternativeCapitalPerUnit)}`,
    ...result.scenarios.map(scenario => `${scenario.name}: capital ${formatMoney(scenario.capitalCost)}, annual maintenance ${formatMoney(scenario.annualMaintenance)}, ${assumptions.horizonYears}-year undiscounted total ${formatMoney(scenario.lifecycleCost)}; capital sensitivity ${formatMoney(scenario.capitalLow)} to ${formatMoney(scenario.capitalHigh)}.`),
    ...result.limitations, ...result.followUp,
    ...(result.sources.length ? result.sources.map(source => `${source.title}: ${source.url}`) : ["No external data source supports the illustrative unit costs. No observed outcome dataset is included."]),
  ].join("\n");
}

export async function generateDecisionBrief(input: AnalysisInput): Promise<Uint8Array<ArrayBuffer>> {
  const result = analyze(input);
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  document.setTitle(safeText(result.input.proposal.title, regular));
  document.setAuthor("CivicDT");
  document.setSubject("Evidence-aware infrastructure scenario cost comparison");
  document.setProducer(`CivicDT ${result.modelVersion} / pdf-lib`);
  document.setCreationDate(new Date(result.generatedAt));
  let page!: PDFPage;
  let y = 0;

  const addPage = () => {
    page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 44, width: PAGE_WIDTH, height: 44, color: navy });
    page.drawText("CIVICDT", { x: MARGIN, y: PAGE_HEIGHT - 28, size: 12, font: bold, color: rgb(1, 1, 1) });
    page.drawText("DECISION SUPPORT / COST COMPARISON", { x: 164, y: PAGE_HEIGHT - 27, size: 8, font: regular, color: rgb(0.68, 0.89, 0.88) });
    y = PAGE_HEIGHT - 72;
  };
  const room = (height: number) => { if (y - height < 55) addPage(); };
  const paragraph = (text: string, options: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; gap?: number; indent?: number } = {}) => {
    const size = options.size ?? 10.2;
    const font = options.font ?? regular;
    const indent = options.indent ?? 0;
    const lineHeight = size * 1.45;
    for (const line of wrap(text, font, size, WIDTH - indent)) {
      room(lineHeight);
      page.drawText(line, { x: MARGIN + indent, y, size, font, color: options.color ?? ink });
      y -= lineHeight;
    }
    y -= options.gap ?? 8;
  };
  const section = (title: string) => {
    room(56);
    y -= 6;
    paragraph(title, { size: 13.4, font: bold, color: teal, gap: 9 });
  };
  const bullet = (text: string) => paragraph(`- ${text}`, { indent: 4, gap: 6 });
  const keyValue = (label: string, value: string) => {
    const lines = wrap(value, regular, 9.8, WIDTH - 226);
    room(Math.max(24, lines.length * 14 + 8));
    page.drawText(safeText(label, bold), { x: MARGIN, y, size: 9.6, font: bold, color: muted });
    for (const line of lines) {
      page.drawText(line, { x: MARGIN + 226, y, size: 9.8, font: regular, color: ink });
      y -= 14;
    }
    y -= 9;
    page.drawLine({ start: { x: MARGIN, y: y + 10 }, end: { x: MARGIN + WIDTH, y: y + 10 }, thickness: 0.45, color: border });
  };
  addPage();
  paragraph(result.input.proposal.title, { size: 23, font: bold, gap: 8 });
  paragraph(`Location: ${result.input.proposal.location}`, { size: 11, color: muted, gap: 10 });
  paragraph(result.input.assumptionBasis === "illustrative" ? "ILLUSTRATIVE DEMONSTRATION / accepted example cost assumptions" : "USER-SUPPLIED ASSUMPTIONS / independent verification required", { size: 8.7, font: bold, color: teal, gap: 12 });

  section("Executive summary");
  paragraph(result.summary);
  paragraph("This brief provides a neutral comparison of incremental costs and qualitative tradeoffs. It does not establish a preferred policy, engineering design, funding commitment, or forecast of social outcomes.", { color: muted });

  section("Scenario cost comparison (USD)");
  const columns = [170, 112, 112, 122];
  const headings = ["Scenario", "Capital", "Annual maintenance", `${result.input.assumptions.horizonYears}-year total*`];
  const drawTableHeader = () => {
    room(42);
    page.drawRectangle({ x: MARGIN, y: y - 24, width: WIDTH, height: 35, color: navy });
    let x = MARGIN + 8;
    headings.forEach((heading, index) => {
      wrap(heading, bold, 8.5, columns[index] - 12).forEach((line, row) => page.drawText(line, { x, y: y - row * 11, size: 8.5, font: bold, color: rgb(1, 1, 1) }));
      x += columns[index];
    });
    y -= 40;
  };
  drawTableHeader();
  for (const scenario of result.scenarios) {
    const cells = [scenario.name, formatMoney(scenario.capitalCost), formatMoney(scenario.annualMaintenance), formatMoney(scenario.lifecycleCost)];
    const rowHeight = Math.max(...cells.map((cell, index) => wrap(cell, regular, 9.2, columns[index] - 14).length)) * 13 + 15;
    if (y - rowHeight < 55) { addPage(); drawTableHeader(); }
    let x = MARGIN + 8;
    cells.forEach((cell, index) => {
      wrap(cell, index === 0 ? bold : regular, 9.2, columns[index] - 14).forEach((line, row) => page.drawText(line, { x, y: y - row * 13, size: 9.2, font: index === 0 ? bold : regular, color: ink }));
      x += columns[index];
    });
    y -= rowHeight;
    page.drawLine({ start: { x: MARGIN, y: y + 12 }, end: { x: MARGIN + WIDTH, y: y + 12 }, thickness: 0.5, color: border });
  }
  paragraph("* Capital plus incremental annual maintenance x years, undiscounted. Baseline zero means no new project spending; existing municipal spending is excluded.", { size: 8.6, color: muted });

  section("Inputs and assumptions");
  const { proposal, assumptions } = result.input;
  keyValue("Project type", projectLabels[proposal.type!]);
  keyValue("Supplied project quantity", `${result.quantity} ${result.unit}${result.quantity === 1 ? "" : "s"}`);
  keyValue("Stated project budget", proposal.budget === null ? "Not supplied; no budget was inferred" : `${formatMoney(proposal.budget)} (stated, unverified)`);
  keyValue("Assumption basis", result.input.assumptionBasis === "illustrative" ? "Explicitly accepted illustrative demonstration inputs" : "User-supplied inputs, unverified");
  keyValue(`Proposed construction / ${result.unit}`, formatMoney(assumptions.capitalPerUnit));
  keyValue(`Alternative construction / ${result.unit}`, formatMoney(assumptions.alternativeCapitalPerUnit));
  keyValue(`Proposed annual maintenance / ${result.unit}`, formatMoney(assumptions.annualMaintenancePerUnit));
  keyValue(`Alternative annual maintenance / ${result.unit}`, formatMoney(assumptions.alternativeAnnualMaintenancePerUnit));
  keyValue("Design / contingency", `${assumptions.designPercent}% of construction / ${assumptions.contingencyPercent}% of construction plus design`);
  keyValue("Sensitivity / horizon", `+/- ${assumptions.sensitivityPercent}% in unit costs / ${assumptions.horizonYears} years`);
  paragraph("Quantity comes from confirmed proposal inputs. The map is illustrative and does not determine project mileage. All costs use USD. Unit costs describe the complete corridor or crossing scope supplied by the user, not per-lane or per-direction mileage.", { size: 9, color: muted });

  if (proposal.changes.length || proposal.objectives.length) {
    section("Proposal statements (unverified)");
    proposal.changes.forEach(change => bullet(`Infrastructure change: ${change}`));
    proposal.objectives.forEach(objective => bullet(`Stated objective: ${objective}`));
  }

  section("Sensitivity and cost arithmetic");
  paragraph("Construction = supplied quantity x construction unit cost. Design = construction x design percentage. Contingency = (construction + design) x contingency percentage. Annual maintenance = quantity x annual maintenance unit cost.");
  paragraph(`Sensitivity varies construction and maintenance unit costs by +/- ${assumptions.sensitivityPercent}%. Quantity and design/contingency percentages stay fixed. These are arithmetic scenario bounds; they are not statistical confidence intervals or likelihoods.`, { color: muted });
  for (const scenario of result.scenarios.filter(scenario => scenario.id !== "baseline")) {
    paragraph(scenario.name, { font: bold, gap: 4 });
    bullet(`Construction ${formatMoney(scenario.constructionCost)} + design ${formatMoney(scenario.designCost)} + contingency ${formatMoney(scenario.contingencyCost)} = capital ${formatMoney(scenario.capitalCost)}.`);
    bullet(`Capital range: ${formatMoney(scenario.capitalLow)} to ${formatMoney(scenario.capitalHigh)}. Annual maintenance range: ${formatMoney(scenario.maintenanceLow)} to ${formatMoney(scenario.maintenanceHigh)}.`);
  }

  section("Qualitative tradeoffs");
  for (const scenario of result.scenarios) {
    room(62);
    paragraph(scenario.name, { font: bold, gap: 4 });
    paragraph(scenario.description, { size: 9.4, color: muted, gap: 5 });
    bullet(`Access: ${scenario.tradeoffs.access}`);
    bullet(`Safety: ${scenario.tradeoffs.safety}`);
    bullet(`Operations: ${scenario.tradeoffs.operations}`);
    bullet(`Delivery: ${scenario.tradeoffs.delivery}`);
  }

  section("Quantitative limitations");
  result.limitations.forEach(bullet);
  section("Recommended follow-up investigations");
  result.followUp.forEach(bullet);
  section("Sources and traceability");
  if (result.sources.length) result.sources.forEach(source => bullet(`${source.title}: ${source.url}`));
  else paragraph("No external data source is attached to the illustrative unit costs. No observed city statistics, outcome dataset, or empirical benefit model was used. The source proposal and confirmed user inputs establish scope only; they do not establish observed effects.");
  paragraph(`Confirmed proposal evidence: ${proposal.evidence.length} linked text passage${proposal.evidence.length === 1 ? "" : "s"}. User edits may supersede extraction; confirm edited fields against the original proposal. Missing or edited fields are not independently verified.`, { size: 9, color: muted });
  paragraph("The PDF uses standard Latin fonts. Any unsupported character is represented by its Unicode code point in brackets so it is not silently omitted.", { size: 8.5, color: muted });
  section("Model and generation record");
  keyValue("Model version", result.modelVersion);
  keyValue("Generated timestamp (UTC)", result.generatedAt);
  keyValue("Analysis and report generation", "Deterministic arithmetic and authored report template; no AI numerical claims");

  const pages = document.getPages();
  pages.forEach((item, index) => {
    item.drawLine({ start: { x: MARGIN, y: 40 }, end: { x: MARGIN + WIDTH, y: 40 }, thickness: 0.5, color: border });
    item.drawText(result.modelVersion, { x: MARGIN, y: 25, size: 8, font: regular, color: muted });
    item.drawText(`${index + 1} / ${pages.length}`, { x: PAGE_WIDTH - MARGIN - 36, y: 25, size: 8, font: regular, color: muted });
  });
  return new Uint8Array(await document.save());
}
