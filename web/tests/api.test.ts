import { afterEach, describe, expect, it, vi } from "vitest";

import { getInvitationPreview } from "@/lib/api";

describe("API request context", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards the academy host on server-side invitation preview calls", async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string>;
      expect(headers.host).toBe("acme.localhost:3001");
      expect(headers["x-forwarded-host"]).toBe("acme.localhost:3001");

      return new Response(
        JSON.stringify({
          data: {
            email: "member@example.com",
            organization_name: "Acme",
          },
          error: null,
          meta: { request_id: "req_test", timestamp: null },
        }),
        { status: 200 },
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getInvitationPreview("token-value", { host: "acme.localhost:3001" }),
    ).resolves.toEqual({
      email: "member@example.com",
      organization_name: "Acme",
    });
  });
});
