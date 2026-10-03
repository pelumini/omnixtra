import {
  apiUrl,
  postJson,
  requestHeaders,
  type RequestContext,
  throwIfApiError,
} from "@/lib/api/client";
import {
  authEnvelopeSchema,
  loginRequestSchema,
  sessionEnvelopeSchema,
  type LoginRequest,
} from "@/lib/schemas/auth";

export async function login(request: LoginRequest) {
  const body = loginRequestSchema.parse(request);
  const response = await postJson("/api/v1/auth/login", body);

  return authEnvelopeSchema.parse(response);
}

export async function logout() {
  await postJson("/api/v1/auth/logout", null);
}

export async function getAuthSession(context: RequestContext = {}) {
  const response = await fetch(`${apiUrl()}/api/v1/auth/session`, {
    cache: "no-store",
    credentials: "include",
    headers: requestHeaders(context),
  });
  const body: unknown = await response.json();
  throwIfApiError(response, body);

  return sessionEnvelopeSchema.parse(body);
}
