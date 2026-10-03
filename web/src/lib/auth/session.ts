import { getAuthSession } from "@/lib/api/auth";
import type { RequestContext } from "@/lib/api/client";
import type { SessionResponse } from "@/lib/schemas/auth";

export async function getSessionOrNull(
  context: RequestContext,
): Promise<SessionResponse | null> {
  try {
    const response = await getAuthSession(context);
    return response.data;
  } catch {
    return null;
  }
}
