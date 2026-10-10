import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ pathname: "/admin" }));

vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
}));

import { SessionHeader } from "@/components/layout/session-header";

import type { TenantBranding } from "@/lib/schemas/academy";
import type { SessionResponse } from "@/lib/schemas/auth";

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

describe("session header chrome", () => {
  it("renders the admin header in the content column without duplicate branding", () => {
    route.pathname = "/admin";
    const html = renderToStaticMarkup(
      <SessionHeader
        branding={branding}
        initialSession={adminSession}
        refreshSession={false}
      />,
    );

    expect(html).toContain("fixed");
    expect(html).toContain("top-0");
    expect(html).toContain("md:left-[var(--app-sidebar-width,13rem)]");
    expect(html).toContain("Dashboard");
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Open navigation menu"');
    expect(html).not.toContain("<details");
    expect(html).not.toContain("Pastors Academy");
  });

  it("links members to my courses and unauthenticated visitors to public home", () => {
    route.pathname = "/my-courses";
    const memberHtml = renderToStaticMarkup(
      <SessionHeader
        branding={branding}
        initialSession={memberSession}
        refreshSession={false}
      />,
    );
    route.pathname = "/";
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

    expect(memberHtml).toContain("My Courses");
    expect(memberHtml).not.toContain("Pastors Academy");
    expect(publicHtml).toContain('href="/"');
    expect(publicHtml).toContain('href="/login"');
    expect(apexHtml).toContain('href="/"');
    expect(apexHtml).toContain('href="/#platform"');
    expect(apexHtml).toContain('href="/get-started"');
    expect(apexHtml).not.toContain('href="/login"');
  });
});
