import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  console.log("IP: " + request.headers.get("X-Forwarded-For"));

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: "/forecast/",
};
