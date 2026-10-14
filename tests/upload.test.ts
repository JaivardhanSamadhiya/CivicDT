import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { extractUploadedText, MAX_UPLOAD_BYTES, readBoundedBody, readBoundedJSON, readUploadForm } from "../src/lib/upload";

describe("document ingestion", () => {
  it("reads UTF-8 plain text and treats the filename as a label", async () => {
    const file = new File(["Protected bike lane, 1.5 miles."], "../proposal.txt", { type: "text/plain" });
    expect(await extractUploadedText(file)).toEqual({ text: "Protected bike lane, 1.5 miles.", name: "proposal.txt" });
  });

  it("extracts text from an actual generated PDF", async () => {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    pdf.addPage().drawText("Protected bike lane along a 1.5-mile corridor.", { font, x: 30, y: 400 });
    const result = await extractUploadedText(new File([new Uint8Array(await pdf.save())], "proposal.pdf", { type: "application/pdf" }));
    expect(result.text).toContain("Protected bike lane along a 1.5-mile corridor.");
  });

  it("rejects PDFs without extractable text instead of inventing OCR output", async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage();
    await expect(extractUploadedText(new File([new Uint8Array(await pdf.save())], "scan.pdf", { type: "application/pdf" }))).rejects.toThrow(/no extractable text/);
  });

  it("rejects unsupported extension, empty, oversized and excessive-text documents", async () => {
    await expect(extractUploadedText(new File(["x"], "proposal.docx"))).rejects.toThrow(/Only TXT/);
    await expect(extractUploadedText(new File([], "empty.txt"))).rejects.toThrow(/empty/);
    await expect(extractUploadedText(new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "large.txt"))).rejects.toThrow(/2 MiB/);
    await expect(extractUploadedText(new File(["x".repeat(30_001)], "long.txt"))).rejects.toThrow(/30,000/);
  });

  it("rejects invalid signatures, wrong MIME, binary content and invalid UTF-8", async () => {
    await expect(extractUploadedText(new File(["not a PDF"], "fake.pdf", { type: "application/pdf" }))).rejects.toThrow(/signature/);
    await expect(extractUploadedText(new File(["%PDF-1.7"], "disguised.txt"))).rejects.toThrow(/signature/);
    await expect(extractUploadedText(new File(["text"], "wrong.txt", { type: "image/png" }))).rejects.toThrow(/file type/);
    await expect(extractUploadedText(new File([new Uint8Array([65, 0, 66])], "binary.txt"))).rejects.toThrow(/signature/);
    await expect(extractUploadedText(new File([new Uint8Array([0xff, 0xff])], "encoding.txt"))).rejects.toThrow(/UTF-8/);
  });

  it("bounds actual request bytes even without a Content-Length header", async () => {
    await expect(readBoundedBody(new Request("http://localhost", { method: "POST", body: "123456789" }), 8)).rejects.toThrow(/too large/);
    const bytes = await readBoundedBody(new Request("http://localhost", { method: "POST", body: "1234" }), 8);
    expect(new TextDecoder().decode(bytes)).toBe("1234");
  });

  it("validates JSON and multipart request content types", async () => {
    await expect(readBoundedJSON(new Request("http://localhost", { method: "POST", body: "{}" }))).rejects.toThrow(/JSON request/);
    await expect(readBoundedJSON(new Request("http://localhost", { method: "POST", body: "bad", headers: { "Content-Type": "application/json" } }))).rejects.toThrow(/invalid JSON/);
    await expect(readUploadForm(new Request("http://localhost", { method: "POST", body: "bad" }))).rejects.toThrow(/multipart/);
    const form = new FormData();
    form.set("file", new File(["text"], "proposal.txt", { type: "text/plain" }));
    const parsed = await readUploadForm(new Request("http://localhost", { method: "POST", body: form }));
    expect((parsed.get("file") as File).name).toBe("proposal.txt");
  });
});
