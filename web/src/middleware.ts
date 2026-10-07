import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const secret = process.env.ORIGIN_SECRET;
  if (!secret) {
    return NextResponse.next();
  }
  const headers = new Headers(request.headers);
  headers.set("x-origin-secret", secret);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: "/api/:path*",
};
