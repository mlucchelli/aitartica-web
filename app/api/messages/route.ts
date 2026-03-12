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

  if (!body.content || !body.published_at) {
    return NextResponse.json(
      { error: "Missing required fields: content, published_at" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("messages").insert({
    content: body.content,
    published_at: body.published_at,
  });

  if (error) {
    console.error("[/api/messages]", error.message);
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
  }

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
