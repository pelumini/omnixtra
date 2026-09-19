import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SessionHeader } from "@/components/app/session-header";
import type { SessionResponse, TenantBranding } from "@/lib/schemas";

const branding: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#116149",
  tenant_name: "Pastors Academy",
  time_zone: "UTC",
};

const adminSession: SessionResponse = {
  membership: {
    org_role: "tenant_admin",
    tenant_id: "00000000-0000-0000-0000-000000000001",
  },
  user: {
    email: "admin@example.com",
    full_name: "Admin User",
    id: "00000000-0000-0000-0000-000000000002",
  },
};

const memberSession: SessionResponse = {
  ...adminSession,
  membership: {
    org_role: "member",
    tenant_id: "00000000-0000-0000-0000-000000000001",
  },
};

describe("session header logo", () => {
  it("links tenant admins to the admin home", () => {
    const html = renderToStaticMarkup(
      <SessionHeader
        branding={branding}
        initialSession={adminSession}
        refreshSession={false}
      />,
    );

    expect(html).toContain("fixed");
    expect(html).toContain("top-0");
    expect(html).toContain("transition-shadow");
    expect(html).toContain('href="/admin"');
    expect(html).toContain("Pastors Academy");
  });

  it("links members to my courses and unauthenticated visitors to public home", () => {
    const memberHtml = renderToStaticMarkup(
      <SessionHeader
        branding={branding}
        initialSession={memberSession}
        refreshSession={false}
      />,
    );
    const publicHtml = renderToStaticMarkup(
      <SessionHeader branding={branding} initialSession={null} refreshSession={false} />,
    );
    const apexHtml = renderToStaticMarkup(
      <SessionHeader
        branding={branding}
        initialSession={null}
        refreshSession={false}
        showAuthLink={false}
      />,
    );

    expect(memberHtml).toContain('href="/my-courses"');
    expect(publicHtml).toContain('href="/"');
    expect(publicHtml).toContain('href="/login"');
    expect(apexHtml).toContain('href="/"');
    expect(apexHtml).toContain('href="/#platform"');
    expect(apexHtml).toContain('href="/get-started"');
    expect(apexHtml).not.toContain('href="/login"');
  });
});
