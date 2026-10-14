import { MAX_SOURCE_CHARACTERS } from "./extraction";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export const MAX_PDF_PAGES = 50;
export const MAX_UPLOAD_REQUEST_BYTES = MAX_UPLOAD_BYTES + 64 * 1024;

export class UploadError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = "UploadError";
  }
}

/** Limit the actual body, including chunked requests with no Content-Length. */
export async function readBoundedBody(request: Request, limit: number): Promise<Uint8Array<ArrayBuffer>> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) throw new UploadError("The request is too large.", 413);
  if (!request.body) throw new UploadError("The request body is empty.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel();
        throw new UploadError("The request is too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export async function readBoundedJSON(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) throw new UploadError("Send a JSON request.", 415);
  try {
    const body = await readBoundedBody(request, 200 * 1024);
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
  } catch (error) {
    if (error instanceof UploadError) throw error;
    throw new UploadError("The request contains invalid JSON.");
  }
}

export async function readUploadForm(request: Request): Promise<FormData> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) throw new UploadError("Upload the document as multipart form data.", 415);
  const bytes = await readBoundedBody(request, MAX_UPLOAD_REQUEST_BYTES);
  try {
    return await new Request(request.url, { method: "POST", headers: { "content-type": request.headers.get("content-type")! }, body: bytes }).formData();
  } catch {
    throw new UploadError("The uploaded form could not be read.");
  }
}

function validateText(text: string): string {
  if (!text.trim()) throw new UploadError("The document has no extractable text. Scanned PDFs require OCR and are not supported.");
  if (text.length > MAX_SOURCE_CHARACTERS) throw new UploadError(`The document exceeds ${MAX_SOURCE_CHARACTERS.toLocaleString("en-US")} characters. Upload a shorter project description.`, 413);
  if (/\u0000/.test(text) || /[\x01-\x08\x0b\x0c\x0e-\x1f]/.test(text)) throw new UploadError("The document contains binary or unsupported control characters.");
  return text;
}

/** Never use a supplied path, retain a file, or execute document content. */
export async function extractUploadedText(file: File): Promise<{ text: string; name: string }> {
  if (file.size === 0) throw new UploadError("The uploaded document is empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("Documents must be 2 MiB or smaller.", 413);
  const extension = file.name.toLowerCase().split(".").pop();
  const mime = file.type.toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isPDF = bytes.length >= 5 && new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-";
  const name = file.name.replace(/[\x00-\x1f\x7f]/g, "").split(/[\\/]/).pop()?.slice(0, 180) || "proposal";
  if (extension === "txt") {
    if (mime && mime !== "text/plain" && mime !== "application/octet-stream") throw new UploadError("The file type does not match a plain-text document.", 415);
    if (isPDF || bytes.some(byte => byte === 0)) throw new UploadError("The file signature does not match a plain-text document.", 415);
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      throw new UploadError("TXT documents must use UTF-8 encoding.", 415);
    }
    return { text: validateText(text), name };
  }
  if (extension !== "pdf") throw new UploadError("Only TXT and text-based PDF documents are supported.", 415);
  if (mime && mime !== "application/pdf" && mime !== "application/octet-stream") throw new UploadError("The file type does not match a PDF document.", 415);
  if (!isPDF) throw new UploadError("The file signature does not match a PDF document.", 415);

  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: bytes });
  try {
    const info = await parser.getInfo();
    if (info.total > MAX_PDF_PAGES) throw new UploadError(`PDF documents must contain ${MAX_PDF_PAGES} pages or fewer.`, 413);
    const result = await parser.getText({ pageJoiner: "\n", cellSeparator: " " });
    return { text: validateText(result.text), name };
  } catch (error) {
    if (error instanceof UploadError) throw error;
    throw new UploadError("The PDF could not be read. Use an unencrypted, text-based PDF or a UTF-8 TXT document.");
  } finally {
    await parser.destroy();
  }
}
