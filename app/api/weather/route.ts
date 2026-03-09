import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
