import { describe, expect, it } from "vitest";

import { homeForOrgRole, homeForSession } from "@/lib/routing/home";

import type { SessionResponse } from "@/lib/schemas/auth";

const baseSession: SessionResponse = {
  membership: null,
  user: {
    email: "person@example.com",
    full_name: "Person One",
    id: "00000000-0000-0000-0000-000000000001",
  },
};

describe("root routing decision", () => {
  it("sends authenticated tenant admins to admin home before public landing renders", () => {
    expect(
      homeForSession({
        ...baseSession,
        membership: {
          org_role: "tenant_admin",
          tenant_id: "00000000-0000-0000-0000-000000000002",
        },
      }),
    ).toBe("/admin");
  });

  it("sends authenticated members to my courses and leaves unauthenticated/pending without a redirect", () => {
    expect(homeForOrgRole("member")).toBe("/my-courses");
    expect(
      homeForSession({
        ...baseSession,
        membership: {
          org_role: "member",
          tenant_id: "00000000-0000-0000-0000-000000000002",
        },
      }),
    ).toBe("/my-courses");
    expect(homeForSession(baseSession)).toBeNull();
    expect(homeForSession(null)).toBeNull();
  });
});
