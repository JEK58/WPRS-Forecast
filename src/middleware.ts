import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const requestRecords: Record<string, number[]> = {};
const ALLOWED_REQUESTS = 20;
const TIME_FRAME = 1 * 60 * 1000; // 1 minute

// This function can be marked `async` if using `await` inside
export function middleware(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.ip;

  if (!ip) return NextResponse.next();

  console.log("👮 Too many requests from: " + ip);

  const currentTimestamp = Date.now();
  if (!requestRecords[ip]) requestRecords[ip] = [];

  // Clean up old entries
  requestRecords[ip] =
    requestRecords[ip]?.filter((ts) => currentTimestamp - ts < TIME_FRAME) ??
    [];

  // Checking if the user has exceeded the rate limit
  if ((requestRecords[ip]?.length ?? 0) >= ALLOWED_REQUESTS) {
    return new NextResponse("Rate limit exceeded.", { status: 429 });
  }

  // Recording the new timestamp
  (requestRecords[ip] ??= []).push(currentTimestamp);
  return NextResponse.next();
}

export const config = {
  matcher: "/forecast/",
};
