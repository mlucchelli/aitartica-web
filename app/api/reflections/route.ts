import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.date || !body.content) {
    return NextResponse.json(
      { error: "Missing required fields: date, content" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("reflections").upsert(
    {
      date: body.date,
      content: body.content,
      created_at: body.created_at ?? new Date().toISOString(),
    },
    { onConflict: "date" }
  );

  if (error) {
    console.error("[/api/reflections]", error.message);
    return NextResponse.json({ error: "Failed to save reflection" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
