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

  if (body.latitude == null || body.longitude == null || !body.recorded_at) {
    return NextResponse.json(
      { error: "Missing required fields: latitude, longitude, recorded_at" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("weather_snapshots").insert({
    latitude: body.latitude,
    longitude: body.longitude,
    temperature: body.temperature ?? null,
    apparent_temperature: body.apparent_temperature ?? null,
    wind_speed: body.wind_speed ?? null,
    wind_gusts: body.wind_gusts ?? null,
    wind_direction: body.wind_direction ?? null,
    precipitation: body.precipitation ?? null,
    snowfall: body.snowfall ?? null,
    condition: body.condition ?? null,
    recorded_at: body.recorded_at,
  });

  if (error) {
    console.error("[/api/weather]", error.message);
    return NextResponse.json({ error: "Failed to save weather snapshot" }, { status: 500 });
  }

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
