import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { error } = await supabase.from("reflections").upsert(
    {
      date: body.date,
      content: body.content,
      created_at: body.created_at ?? new Date().toISOString(),
    },
    { onConflict: "date" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
