import { errorBodySchema, healthEnvelopeSchema } from "@/lib/schemas/common";
import { tenantApiUrl } from "@/lib/tenant-host";

export class ApiRequestError extends Error {
  envelope: unknown;
  status: number;

  constructor(message: string, envelope: unknown, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.envelope = envelope;
    this.status = status;
  }
}

export const publicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const serverApiUrl = process.env.API_INTERNAL_URL ?? publicApiUrl;

export type RequestContext = {
  cookie?: string;
  host?: string;
};

export async function getHealth() {
  const response = await fetch(`${apiUrl()}/health`, { cache: "no-store" });
  const body: unknown = await response.json();

  return healthEnvelopeSchema.parse(body);
}

export function requestHeaders(context: RequestContext): HeadersInit {
  const headers: Record<string, string> = {};
  if (context.cookie) {
    headers.cookie = context.cookie;
  }
  if (context.host) {
    headers.host = context.host;
    headers["x-forwarded-host"] = context.host;
  }
  return headers;
}

export async function postJson(
  path: string,
  body: unknown,
  headers: HeadersInit = {},
  baseUrl = apiUrl(),
) {
  const response = await fetch(`${baseUrl}${path}`, {
    body: body === null ? undefined : JSON.stringify(body),
    cache: "no-store",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...headers },
    method: "POST",
  });
  const responseBody: unknown = await response.json();
  throwIfApiError(response, responseBody);

  return responseBody;
}

export function apiUrl(): string {
  if (typeof window === "undefined") {
    return serverApiUrl;
  }
  return tenantApiUrl(publicApiUrl, window.location.host);
}

export function throwIfApiError(response: Response, body: unknown) {
  if (response.ok) {
    return;
  }
  const parsed = errorBodySchema.safeParse((body as { error?: unknown }).error);
  throw new ApiRequestError(
    parsed.success ? parsed.data.message : "API request failed",
    body,
    response.status,
  );
}
