import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { error } = await supabase.from("progress").upsert({
    id: 1,
    expedition_day: body.expedition_day ?? null,
    distance_km_total: body.distance_km_total ?? null,
    photos_captured_total: body.photos_captured_total ?? null,
    wildlife_spotted_total: body.wildlife_spotted_total ?? null,
    temperature_min_all_time: body.temperature_min_all_time ?? null,
    temperature_max_all_time: body.temperature_max_all_time ?? null,
    current_position: body.current_position ?? null,
    tokens_used_total: body.tokens_used_total ?? null,
    published_at: body.published_at ?? null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[/api/progress]", error.message);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
