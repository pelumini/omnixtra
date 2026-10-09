import { afterEach, describe, expect, it, vi } from "vitest";

import { createUser, getInvitationPreview } from "@/features/members";

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
            first_name: "Member",
            last_name: "Example",
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
      first_name: "Member",
      last_name: "Example",
      organization_name: "Acme",
    });
  });

  it("posts the provisioned user fields to the tenant users endpoint", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toContain("/api/v1/tenant/users");
      expect(JSON.parse(String(init?.body))).toEqual({
        email: "member@example.com",
        first_name: "Member",
        last_name: "Example",
        phone: "+44000000000",
        org_role: "member",
      });
      return new Response(
        JSON.stringify({
          data: {
            activation_link: "https://acme.example.com/join?token=raw-token",
            email: "member@example.com",
            first_name: "Member",
            id: "00000000-0000-0000-0000-000000000101",
            last_name: "Example",
            org_role: "member",
            phone: "+44000000000",
            status: "invited",
          },
          error: null,
          meta: { request_id: "req_test", timestamp: null },
        }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createUser({
        email: "member@example.com",
        firstName: "Member",
        lastName: "Example",
        phone: "+44000000000",
        orgRole: "member",
      }),
    ).resolves.toMatchObject({ data: { status: "invited" } });
  });
});
