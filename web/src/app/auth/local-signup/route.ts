import { NextRequest, NextResponse } from "next/server";

const ACCESS_TOKEN_COOKIE = "omnixtra_access";
const LOCAL_BASE_DOMAIN = "localhost";
const LOCAL_ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60;

export function GET(request: NextRequest) {
  const baseDomain = process.env.NEXT_PUBLIC_APP_BASE_DOMAIN ?? LOCAL_BASE_DOMAIN;
  const redirectUrl = requestUrlForPath(request, "/admin");
  const loginUrl = requestUrlForPath(request, "/login");
  const accessToken = request.nextUrl.searchParams.get("access_token");

  if (baseDomain !== LOCAL_BASE_DOMAIN || !accessToken) {
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set({
    httpOnly: true,
    maxAge: LOCAL_ACCESS_TOKEN_MAX_AGE_SECONDS,
    name: ACCESS_TOKEN_COOKIE,
    path: "/",
    sameSite: "lax",
    secure: false,
    value: accessToken,
  });
  return response;
}

function requestUrlForPath(request: NextRequest, path: string): URL {
  const url = new URL(request.url);
  const host = request.headers.get("host");
  if (host !== null) {
    url.host = host;
  }
  url.pathname = path;
  url.search = "";
  return url;
}
