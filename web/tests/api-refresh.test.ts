import { afterEach, describe, expect, it, vi } from "vitest";

const tenantHost = "acme.localhost:3001";
const apiBaseUrl = "http://acme.localhost:8000";

function stubBrowser() {
  const assign = vi.fn();
  vi.stubGlobal("window", {
    location: {
      assign,
      host: tenantHost,
      origin: `http://${tenantHost}`,
      pathname: "/admin/courses",
      search: "?page=2",
    },
  });
  return assign;
}

async function loadClient() {
  vi.resetModules();
  return import("@/lib/api/client");
}

describe("browser API session refresh", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("refreshes a rejected session and retries the request once", async () => {
    stubBrowser();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchWithRefresh } = await loadClient();

    const response = await fetchWithRefresh(`${apiBaseUrl}/api/v1/courses`, {
      credentials: "include",
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(`${apiBaseUrl}/api/v1/auth/refresh`);
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      credentials: "include",
      method: "POST",
    });
    const requestHeaders = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect(requestHeaders.get("x-tenant-host")).toBe(tenantHost);
  });

  it("shares one refresh across concurrent rejected requests", async () => {
    stubBrowser();
    let refreshCalls = 0;
    let resourceCalls = 0;
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.endsWith("/api/v1/auth/refresh")) {
        refreshCalls += 1;
        return new Response(null, { status: 204 });
      }
      resourceCalls += 1;
      return new Response(null, { status: resourceCalls <= 2 ? 401 : 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const { fetchWithRefresh } = await loadClient();

    const responses = await Promise.all([
      fetchWithRefresh(`${apiBaseUrl}/api/v1/courses`),
      fetchWithRefresh(`${apiBaseUrl}/api/v1/members`),
    ]);

    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(refreshCalls).toBe(1);
  });

  it("does not refresh exempt authentication requests", async () => {
    stubBrowser();
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, { status: 401 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { fetchWithRefresh } = await loadClient();

    const response = await fetchWithRefresh(`${apiBaseUrl}/api/v1/auth/login`);

    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("redirects concurrent failures once and preserves the return path", async () => {
    const assign = stubBrowser();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchWithRefresh } = await loadClient();

    await Promise.all([
      fetchWithRefresh(`${apiBaseUrl}/api/v1/courses`),
      fetchWithRefresh(`${apiBaseUrl}/api/v1/members`),
    ]);

    expect(assign).toHaveBeenCalledOnce();
    expect(assign).toHaveBeenCalledWith(
      `http://${tenantHost}/login?redirect=%2Fadmin%2Fcourses%3Fpage%3D2`,
    );
    expect(
      fetchMock.mock.calls.filter(([input]) =>
        String(input).endsWith("/api/v1/auth/refresh"),
      ),
    ).toHaveLength(1);
  });
});
