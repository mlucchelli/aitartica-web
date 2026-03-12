import { TwitterApi } from "twitter-api-v2";
import { readFileSync } from "fs";

// Load .env manually
const env = readFileSync(".env", "utf-8");
for (const line of env.split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
}

const client = new TwitterApi({
  appKey: process.env.TWITTER_CONSUMER_KEY,
  appSecret: process.env.TWITTER_CONSUMER_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

// Use a real photo from the DB
const imageUrl = "https://lsdycfpibylulwxlupft.supabase.co/storage/v1/object/public/photos/2026-03-11/suit_9517.jpg";
const caption = "TWO SOULS, ONE OCEAN. 🐋\n\n#AITARTICA #Antarctica";

console.log("Fetching image...");
const res = await fetch(imageUrl);
if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
const buffer = Buffer.from(await res.arrayBuffer());
const mimeType = "image/jpeg";

console.log(`Image size: ${buffer.length} bytes`);
console.log("Uploading media...");
const mediaId = await client.v1.uploadMedia(buffer, { mimeType });
console.log("Media uploaded:", mediaId);

console.log("Sending tweet with photo...");
try {
  const result = await client.v2.tweet({ text: caption, media: { media_ids: [mediaId] } });
  console.log("✅ Tweet sent:", result.data.id);
  console.log("   URL: https://twitter.com/i/web/status/" + result.data.id);
} catch (err) {
  console.error("❌ tweet failed:", err?.data ?? err?.message ?? err);
}
