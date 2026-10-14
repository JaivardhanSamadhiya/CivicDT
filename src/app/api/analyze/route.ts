import { NextResponse } from "next/server";
import { analyze } from "@/lib/engine";
import { analysisInputSchema } from "@/lib/schema";
import { readBoundedJSON, UploadError } from "@/lib/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = analysisInputSchema.safeParse(await readBoundedJSON(request));
    if (!input.success)
      return NextResponse.json(
        {
          error:
            "Review the proposal and cost assumptions. All values must be within the displayed supported ranges.",
        },
        { status: 400 },
      );
    try {
      return NextResponse.json(analyze(input.data), {
        headers: { "Cache-Control": "no-store" },
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "The supplied inputs could not be analyzed.",
        },
        { status: 400 },
      );
    }
  } catch (error) {
    if (error instanceof UploadError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    return NextResponse.json(
      { error: "The analysis request could not be processed." },
      { status: 500 },
    );
  }
}
