import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const feature = body?.features?.[0];
  if (!feature) {
    return NextResponse.json({ error: "Invalid GeoJSON" }, { status: 400 });
  }

  const { properties } = feature;

  const { error } = await supabase.from("track_snapshots").upsert({
    id: 1,
    geojson: body,
    total_points: properties.total_points ?? null,
    distance_km: properties.distance_km ?? null,
    recorded_at_first: properties.recorded_at_first ?? null,
    recorded_at_last: properties.recorded_at_last ?? null,
    last_updated: properties.last_updated ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
