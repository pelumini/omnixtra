import { NextResponse } from "next/server";

const ACCESS_TOKEN_COOKIE = "omnixtra_access";

export function POST() {
  const response = NextResponse.json({ data: { accepted: true }, error: null, meta: {} });
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  return response;
}
