import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.analyzed_at || !body.date) {
    return NextResponse.json(
      { error: "Missing required fields: analyzed_at, date" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("route_analyses").insert({
    analyzed_at: body.analyzed_at,
    date: body.date,
    window_hours: body.window_hours ?? null,
    point_count: body.point_count ?? null,
    position: body.position ?? null,
    bearing_deg: body.bearing_deg ?? null,
    bearing_compass: body.bearing_compass ?? null,
    speed_kmh: body.speed_kmh ?? null,
    avg_speed_kmh: body.avg_speed_kmh ?? null,
    distance_km: body.distance_km ?? null,
    stopped: body.stopped ?? null,
    wind: body.wind ?? null,
    nearest_sites: body.nearest_sites ?? null,
  });

  if (error) {
    console.error("[/api/route-analysis]", error.message);
    return NextResponse.json({ error: "Failed to save route analysis" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
