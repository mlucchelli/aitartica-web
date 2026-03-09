import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually
readFileSync(resolve(__dirname, "../.env"), "utf8")
  .split("\n")
  .forEach((line) => {
    const [k, ...v] = line.split("=");
    if (k && !k.startsWith("#") && v.length)
      process.env[k.trim()] = v.join("=").trim();
  });

// 1. Run SQL schema
console.log("Running schema migrations...");
const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });
const schema = readFileSync(resolve(__dirname, "../supabase/schema.sql"), "utf8");

try {
  await sql.unsafe(schema);
  console.log("✅ Schema applied");
} catch (e) {
  console.error("❌ Schema error:", e.message);
  process.exit(1);
} finally {
  await sql.end();
}

// 2. Create photos storage bucket
console.log("Creating storage bucket...");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const { error: bucketError } = await supabase.storage.createBucket("photos", {
  public: true,
  fileSizeLimit: 10485760, // 10MB
  allowedMimeTypes: ["image/jpeg"],
});

if (bucketError && bucketError.message !== "The resource already exists") {
  console.error("❌ Bucket error:", bucketError.message);
  process.exit(1);
} else {
  console.log("✅ Storage bucket `photos` ready");
}

console.log("\n✅ Migration complete");
