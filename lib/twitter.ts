import { TwitterApi } from "twitter-api-v2";

function getClient(): TwitterApi | null {
  const { TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET } = process.env;

  if (!TWITTER_CONSUMER_KEY || !TWITTER_CONSUMER_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_TOKEN_SECRET) {
    return null;
  }

  return new TwitterApi({
    appKey: TWITTER_CONSUMER_KEY,
    appSecret: TWITTER_CONSUMER_SECRET,
    accessToken: TWITTER_ACCESS_TOKEN,
    accessSecret: TWITTER_ACCESS_TOKEN_SECRET,
  });
}

export async function tweetText(text: string): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    await client.v2.tweet(truncate(text));
  } catch (err) {
    console.error("[twitter] tweetText failed:", err);
  }
}

export async function tweetPhoto(text: string, imageUrl: string): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const mimeType = imageUrl.endsWith(".webp") ? "image/webp" : "image/jpeg";

    // v1 media upload is available on all plans
    const mediaId = await client.v1.uploadMedia(buffer, { mimeType });
    await client.v2.tweet({ text: truncate(text), media: { media_ids: [mediaId] } });
  } catch (err) {
    console.error("[twitter] tweetPhoto failed:", err);
    // fallback: tweet without photo
    try {
      await client.v2.tweet(truncate(text));
    } catch (err2) {
      console.error("[twitter] tweetPhoto fallback failed:", err2);
    }
  }
}

function truncate(text: string, max = 280): string {
  return text.length <= max ? text : text.slice(0, max - 1) + "…";
}
