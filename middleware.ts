import { NextRequest, NextResponse } from "next/server";

const WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

// In-memory rate limiter — fixed window per IP
// Writes (agent sync): 30 req/min  — satellite agent won't exceed this
// Reads (external GET): 60 req/min — generous for monitoring scripts
const WRITE_LIMIT = 30;
const READ_LIMIT  = 60;
const WINDOW_MS   = 60_000;

type WindowEntry = { count: number; resetAt: number };
const windows = new Map<string, WindowEntry>();

function isRateLimited(key: string, limit: number): boolean {
  const now = Date.now();
  let entry = windows.get(key);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 1, resetAt: now + WINDOW_MS };
    windows.set(key, entry);
    return false;
  }

  entry.count++;
  return entry.count > limit;
}

// Evict expired entries periodically to avoid unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of windows) {
    if (now >= entry.resetAt) windows.delete(key);
  }
}, WINDOW_MS);

export function middleware(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const writeKey = process.env.REMOTE_SYNC_API_KEY;
  const readKey  = process.env.REMOTE_READ_API_KEY;

  if (!writeKey || !readKey) {
    console.error("REMOTE_SYNC_API_KEY or REMOTE_READ_API_KEY is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const isWrite = WRITE_METHODS.includes(req.method);

  if (isWrite && token !== writeKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isWrite && token !== readKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const limitKey = `${isWrite ? "w" : "r"}:${ip}`;
  const limit = isWrite ? WRITE_LIMIT : READ_LIMIT;

  if (isRateLimited(limitKey, limit)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
