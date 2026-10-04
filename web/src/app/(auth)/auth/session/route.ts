import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/api/auth";

export async function GET() {
  const requestHeaders = await headers();
  const context = {
    cookie: requestHeaders.get("cookie") ?? undefined,
    host: requestHeaders.get("host") ?? undefined,
  };

  try {
    const session = await getAuthSession(context);
    return NextResponse.json(session);
  } catch {
    return NextResponse.json({ data: null, error: null, meta: {} }, { status: 401 });
  }
}
