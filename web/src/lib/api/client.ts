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
let refreshInFlight: Promise<boolean> | null = null;
let redirectingToLogin = false;

export type RequestContext = {
  cookie?: string;
  host?: string;
};

export async function getHealth() {
  const response = await fetchWithRefresh(`${apiUrl()}/health`, {
    cache: "no-store",
    headers: browserTenantHeaders(),
  });
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
    headers["x-tenant-host"] = context.host;
  }
  const originSecret = process.env.ORIGIN_SECRET;
  if (originSecret) {
    headers["x-origin-secret"] = originSecret;
  }
  return headers;
}

export async function postJson(
  path: string,
  body: unknown,
  headers: HeadersInit = {},
  baseUrl = apiUrl(),
) {
  const response = await fetchWithRefresh(`${baseUrl}${path}`, {
    body: body === null ? undefined : JSON.stringify(body),
    cache: "no-store",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...browserTenantHeaders(), ...headers },
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

function browserTenantHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }
  return { "x-tenant-host": window.location.host };
}

export async function fetchWithRefresh(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  if (typeof window === "undefined") return fetch(input, init);

  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  if (!headers.has("x-tenant-host")) {
    headers.set("x-tenant-host", window.location.host);
  }
  const requestInit = { ...init, headers };
  const response = await fetch(input, requestInit);
  if (response.status !== 401 || !isRefreshableApiRequest(input)) return response;

  const refreshed = await refreshSession();
  if (!refreshed) {
    redirectToLogin();
    return response;
  }
  return fetch(input, requestInit);
}

function isRefreshableApiRequest(input: RequestInfo | URL): boolean {
  const rawUrl = input instanceof Request ? input.url : input.toString();
  const requestUrl = new URL(rawUrl, window.location.origin);
  const appApiUrl = new URL(apiUrl());
  if (requestUrl.origin !== appApiUrl.origin || !requestUrl.pathname.startsWith("/api/")) {
    return false;
  }
  return ![
    "/api/v1/auth/refresh",
    "/api/v1/auth/login",
    "/api/v1/auth/logout",
  ].includes(requestUrl.pathname);
}

function refreshSession(): Promise<boolean> {
  if (refreshInFlight === null) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function performRefresh(): Promise<boolean> {
  try {
    const response = await fetch(`${apiUrl()}/api/v1/auth/refresh`, {
      cache: "no-store",
      credentials: "include",
      headers: browserTenantHeaders(),
      method: "POST",
    });
    return response.ok;
  } catch {
    return false;
  }
}

function redirectToLogin() {
  if (redirectingToLogin) return;
  redirectingToLogin = true;

  const returnTo = `${window.location.pathname}${window.location.search}`;
  const loginUrl = new URL("/login", window.location.origin);
  if (returnTo !== "/login") loginUrl.searchParams.set("redirect", returnTo);
  window.location.assign(loginUrl.toString());
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
