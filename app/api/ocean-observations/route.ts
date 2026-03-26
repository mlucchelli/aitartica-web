import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.analyzed_at) {
    return NextResponse.json({ error: "Missing required field: analyzed_at" }, { status: 400 });
  }

  const { error } = await supabase.from("ocean_observations").insert({
    wave_height_m:    body.wave_height_m    ?? null,
    sea_state:        body.sea_state        ?? null,
    beaufort:         body.beaufort         ?? null,
    swell_direction:  body.swell_direction  ?? null,
    drake_assessment: body.drake_assessment ?? null,
    confidence:       body.confidence       ?? null,
    analyzed_at:      body.analyzed_at,
  });

  if (error) {
    console.error("[/api/ocean-observations]", error.message);
    return NextResponse.json({ error: "Failed to save ocean observation" }, { status: 500 });
  }

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
