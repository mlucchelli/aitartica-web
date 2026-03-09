import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const file = formData.get("file") as File | null;
  const metadataRaw = formData.get("metadata") as string | null;

  if (!file || !metadataRaw) {
    return NextResponse.json(
      { error: "Missing file or metadata" },
      { status: 400 }
    );
  }

  let metadata: Record<string, unknown>;
  try {
    metadata = JSON.parse(metadataRaw);
  } catch {
    return NextResponse.json(
      { error: "Invalid metadata JSON" },
      { status: 400 }
    );
  }

  const fileName = metadata.file_name as string;
  const recordedAt = metadata.recorded_at as string | null;
  const datePart = recordedAt
    ? recordedAt.slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const storagePath = `${datePart}/${fileName}`;

  // Upload to Supabase Storage
  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("photos")
    .upload(storagePath, bytes, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("photos")
    .getPublicUrl(storagePath);

  // Insert metadata row
  const { error: dbError } = await supabase.from("photos").insert({
    file_name: fileName,
    file_url: urlData.publicUrl,
    recorded_at: recordedAt ?? null,
    latitude: (metadata.latitude as number) ?? null,
    longitude: (metadata.longitude as number) ?? null,
    significance_score: (metadata.significance_score as number) ?? null,
    vision_description: (metadata.vision_description as string) ?? null,
    vision_summary: (metadata.vision_summary as string) ?? null,
    agent_quote: (metadata.agent_quote as string) ?? null,
    tags: (metadata.tags as string[]) ?? null,
    width: (metadata.width as number) ?? null,
    height: (metadata.height as number) ?? null,
  });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, file_url: urlData.publicUrl });
}
