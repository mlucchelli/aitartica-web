import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "deprecated, use POST /api/location" },
    { status: 410 }
  );
}

function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");

  let query = supabase
    .from("gps_points")
    .select("longitude, latitude, recorded_at")
    .order("recorded_at", { ascending: true });

  if (date) {
    query = query
      .gte("recorded_at", `${date}T00:00:00Z`)
      .lt("recorded_at", `${date}T24:00:00Z`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[GET /api/track]", error.message);
    return NextResponse.json({ error: "Failed to fetch track" }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ type: "FeatureCollection", features: [] });
  }

  const coordinates = data.map((p) => [p.longitude, p.latitude]);

  let distance_km = 0;
  for (let i = 1; i < data.length; i++) {
    distance_km += haversineKm(
      data[i - 1].latitude, data[i - 1].longitude,
      data[i].latitude, data[i].longitude
    );
  }

  return NextResponse.json({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "LineString", coordinates },
        properties: {
          recorded_at_first: data[0].recorded_at,
          recorded_at_last: data[data.length - 1].recorded_at,
          total_points: data.length,
          distance_km: Math.round(distance_km * 10) / 10,
        },
      },
    ],
  });
}
