import { NextResponse } from "next/server";
import { extractUploadedText, readUploadForm, UploadError } from "@/lib/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await readUploadForm(request);
    const file = form.get("file");
    if (!(file instanceof File) || form.getAll("file").length !== 1)
      return NextResponse.json(
        { error: "Choose one TXT or text-based PDF document." },
        { status: 400 },
      );
    return NextResponse.json(await extractUploadedText(file), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof UploadError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    return NextResponse.json(
      {
        error:
          "The document could not be processed. Please try a shorter TXT or text-based PDF.",
      },
      { status: 500 },
    );
  }
}
