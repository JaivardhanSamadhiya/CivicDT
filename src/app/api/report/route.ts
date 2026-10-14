import { NextResponse } from "next/server";
import { generateDecisionBrief } from "@/lib/report";
import { analysisInputSchema } from "@/lib/schema";
import { readBoundedJSON, UploadError } from "@/lib/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = analysisInputSchema.safeParse(await readBoundedJSON(request));
    if (!input.success) return NextResponse.json({ error: "Review the proposal and cost assumptions before generating the decision brief." }, { status: 400 });
    try {
      const bytes = await generateDecisionBrief(input.data);
      const filename = input.data.proposal.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "civicdt-decision-brief";
      return new Response(bytes, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}.pdf"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
    } catch {
      return NextResponse.json({ error: "The decision brief could not be generated. Confirm a project type, location, quantity and accepted cost assumptions." }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof UploadError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "The report request could not be processed." }, { status: 500 });
  }
}
