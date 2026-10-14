import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function extractBikeExample(page: Page) {
  await page.goto("/analysis?example=bike-lane");
  await expect(
    page.getByLabel("Project description", { exact: false }),
  ).toHaveValue(/1\.5-mile/);
  await page
    .getByRole("button", { name: "Extract proposal", exact: false })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review the extracted proposal" }),
  ).toBeVisible();
}

async function calculateReviewedProposal(page: Page) {
  const run = page.getByRole("button", {
    name: "Run scenario analysis",
    exact: false,
  });
  await expect(run).toBeDisabled();
  await page
    .getByRole("checkbox", { name: /I have reviewed the proposal/ })
    .check();
  await expect(run).toBeEnabled();
  await run.click();
  await expect(
    page.getByRole("heading", { name: "A brief grounded in the model" }),
  ).toBeVisible();
}

async function downloadPdf(page: Page) {
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download PDF", exact: false })
    .click();
  const download = await downloadPromise;
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  const path = await download.path();
  expect(path).not.toBeNull();
  const bytes = await readFile(path!);
  expect(bytes.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  expect(bytes.length).toBeGreaterThan(1500);
  return bytes;
}

test("bike proposal executes, recalculates, persists, and downloads actual PDF bytes", async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await extractBikeExample(page);
  await expect(page.getByText(/No AI model was called/)).toBeVisible();
  await expect(page.getByLabel(/Stated budget \(USD\)/)).toHaveValue("");
  await expect(
    page.getByText("Source: “1.5-mile”", { exact: true }),
  ).toBeVisible();
  await calculateReviewedProposal(page);
  await expect(
    page.getByText("$1,345,500", { exact: true }).first(),
  ).toBeVisible();

  await page
    .getByRole("link", { name: "Compare scenarios", exact: false })
    .click();
  await expect(page).toHaveURL(/\/comparison$/);
  await expect(
    page.getByRole("heading", { name: "Qualitative tradeoff matrix" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Edit assumptions", exact: true })
    .click();
  await page
    .getByRole("spinbutton", {
      name: "Proposed construction unit cost",
      exact: true,
    })
    .fill("700000");
  await expect(
    page.getByText("$1,449,000", { exact: true }).first(),
  ).toBeVisible();

  const analysisTitle = await page
    .getByRole("combobox", { name: "Active analysis", exact: true })
    .inputValue();
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Active analysis", exact: true }),
  ).toHaveValue(analysisTitle);
  await expect(
    page.getByText("$1,449,000", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Open decision brief", exact: false })
    .click();
  await expect(page).toHaveURL(/\/reports$/);

  await downloadPdf(page);
  expect(runtimeErrors).toEqual([]);
});

test("missing location and scope remain empty and block analysis", async ({
  page,
}) => {
  await page.goto("/analysis");
  await page
    .getByLabel("Project description", { exact: false })
    .fill(
      "Evaluate a protected bike lane. Objectives: improve cycling access. No location or corridor distance is specified.",
    );
  await page
    .getByRole("button", { name: "Extract proposal", exact: false })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review the extracted proposal" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Project location", { exact: false }),
  ).toHaveValue("");
  await expect(
    page.getByLabel("Corridor distance (miles)", { exact: false }),
  ).toHaveValue("");
  await page
    .getByRole("checkbox", { name: /I have reviewed the proposal/ })
    .check();
  await page
    .getByRole("button", { name: "Run scenario analysis", exact: false })
    .click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Supply a project location before calculating.",
  );
  await expect(
    page.getByRole("heading", { name: "A brief grounded in the model" }),
  ).not.toBeVisible();
});

test("UTF-8 TXT ingestion works and invalid PDF recovers with a visible error", async ({
  page,
}) => {
  await page.goto("/analysis");
  const upload = page.getByLabel("Upload proposal", { exact: true });
  await upload.setInputFiles({
    name: "fake.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("This is not a PDF."),
  });
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "The file signature does not match a PDF document.",
  );
  await expect(upload).toBeEnabled();

  const source =
    "Evaluate a protected bike lane on Elm Avenue in Demo City along a 1.5-mile corridor. Objectives: improve cycling connectivity.";
  await upload.setInputFiles({
    name: "proposal.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(source, "utf8"),
  });
  await expect(
    page.getByLabel("Project description", { exact: false }),
  ).toHaveValue(source);
  await expect(page.locator("main").getByRole("alert")).not.toBeVisible();
  await page
    .getByRole("button", { name: "Extract proposal", exact: false })
    .click();
  await expect(
    page.getByLabel("Project location", { exact: false }),
  ).toHaveValue("Elm Avenue in Demo City");
  await expect(
    page.getByLabel("Corridor distance (miles)", { exact: false }),
  ).toHaveValue("1.5");
});

test("phone layout keeps controls labeled and avoids horizontal page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await extractBikeExample(page);
  await expect(
    page.getByRole("navigation", { name: "Main navigation", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("spinbutton", {
      name: "Proposed construction unit cost",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: /I have reviewed the proposal/ }),
  ).toBeVisible();
  const reviewOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(reviewOverflow).toBeLessThanOrEqual(1);

  await calculateReviewedProposal(page);
  await page
    .getByRole("link", { name: "Compare scenarios", exact: false })
    .click();
  await expect(
    page.getByRole("button", { name: "Edit assumptions", exact: true }),
  ).toBeVisible();
  const comparisonOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(comparisonOverflow).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "Maintenance", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Maintenance", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("climate inputs start unknown and explicitly saved thought experiment appears in actual PDF appendix", async ({
  page,
}) => {
  await extractBikeExample(page);
  await calculateReviewedProposal(page);
  await page.goto("/climate");
  await expect(
    page.getByRole("heading", { name: "Not yet calculated", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("spinbutton", {
      name: "Annual avoided vehicle miles",
      exact: false,
    }),
  ).toHaveValue("");
  await expect(
    page.getByRole("combobox", {
      name: "Emissions-factor source",
      exact: false,
    }),
  ).toHaveValue("");
  await page
    .getByRole("button", { name: "Load hypothetical example", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "4 metric tonnes / year", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/not a causal project finding, net lifecycle estimate/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Save climate worksheet", exact: false })
    .click();
  await expect(
    page.getByText(
      "Climate worksheet saved. The PDF now includes a conditional climate appendix.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Open decision brief", exact: false })
    .click();
  await expect(page).toHaveURL(/\/reports$/);
  const bytes = await downloadPdf(page);
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: bytes });
  try {
    const pdf = await parser.getText();
    expect(pdf.text).toContain("Optional climate worksheet");
    expect(pdf.text).toContain("10,000 vehicle miles/year (hypothetical)");
    expect(pdf.text).toContain(
      "About 4 metric tonnes/year (conditional arithmetic only)",
    );
    expect(pdf.text).toContain("civicdt-tailpipe-v1.0.0");
    expect(pdf.text).toContain(
      "https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle",
    );
  } finally {
    await parser.destroy();
  }
});
