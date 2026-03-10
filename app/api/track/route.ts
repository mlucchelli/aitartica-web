import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const features = b?.features as unknown[] | undefined;
  const feature = features?.[0] as Record<string, unknown> | undefined;

  if (!feature) {
    return NextResponse.json({ error: "Invalid GeoJSON: missing features" }, { status: 400 });
  }

  const properties = feature.properties as Record<string, unknown> | undefined;

  const { error } = await supabase.from("track_snapshots").upsert({
    id: 1,
    geojson: body,
    total_points: (properties?.total_points as number) ?? null,
    distance_km: (properties?.distance_km as number) ?? null,
    recorded_at_first: (properties?.recorded_at_first as string) ?? null,
    recorded_at_last: (properties?.recorded_at_last as string) ?? null,
    last_updated: (properties?.last_updated as string) ?? null,
  });

  if (error) {
    console.error("[/api/track]", error.message);
    return NextResponse.json({ error: "Failed to save track" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
