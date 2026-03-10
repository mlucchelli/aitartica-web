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
  const latitude = b?.latitude;
  const longitude = b?.longitude;
  const recorded_at = b?.recorded_at;

  if (typeof latitude !== "number" || typeof longitude !== "number" || typeof recorded_at !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid fields: latitude, longitude, recorded_at" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("gps_points")
    .insert({ latitude, longitude, recorded_at });

  if (error) {
    console.error("[/api/location]", error.message);
    return NextResponse.json({ error: "Failed to save location" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
