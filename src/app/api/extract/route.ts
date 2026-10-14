import { NextResponse } from "next/server";
import { z } from "zod";
import { extractProposal, sourceTextSchema } from "@/lib/extraction";
import { readBoundedJSON, UploadError } from "@/lib/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = z.object({ text: sourceTextSchema }).strict().safeParse(await readBoundedJSON(request));
    if (!payload.success) return NextResponse.json({ error: "Enter a nonempty project description of at most 30,000 characters." }, { status: 400 });
    return NextResponse.json(await extractProposal(payload.data.text), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof UploadError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "The proposal could not be extracted. Please try again." }, { status: 500 });
  }
}
