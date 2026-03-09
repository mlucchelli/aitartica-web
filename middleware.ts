import { NextRequest, NextResponse } from "next/server";

const WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

export function middleware(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isWrite = WRITE_METHODS.includes(req.method);
  const writeKey = process.env.REMOTE_SYNC_API_KEY;
  const readKey = process.env.REMOTE_READ_API_KEY;

  if (isWrite && token !== writeKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isWrite && token !== writeKey && token !== readKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
