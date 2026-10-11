import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ pathname: "/admin" }));

vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
}));

import { RouteChrome } from "@/components/layout/route-chrome";
import { SessionHeader } from "@/components/layout/session-header";
import { Hero } from "@/features/marketing/components/landing/Hero";

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
  it("suppresses global chrome on auth routes and preserves it on marketing routes", () => {
    route.pathname = "/login";
    const authHtml = renderToStaticMarkup(
      <RouteChrome branding={branding} fixtureMode={false} initialSession={null} refreshSession={false} showAuthLink>
        <main>Login body</main>
      </RouteChrome>,
    );
    route.pathname = "/";
    const marketingHtml = renderToStaticMarkup(
      <RouteChrome branding={branding} fixtureMode={false} initialSession={null} refreshSession={false} showAuthLink={false}>
        <main>Marketing body</main>
      </RouteChrome>,
    );

    expect(authHtml).toBe("<main>Login body</main>");
    expect(marketingHtml).toContain("Pastors Academy home");
    expect(marketingHtml).toContain("pt-20");
  });

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
    expect(html).not.toContain("Logout Account");
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
    expect(apexHtml).toContain("relative h-20");
    expect(apexHtml).toContain("absolute left-1/2 hidden -translate-x-1/2");
    expect(apexHtml).not.toContain('href="/login"');
  });

  it("adds mobile hero clearance and restores the integrated desktop spacing", () => {
    const html = renderToStaticMarkup(<Hero />);

    expect(html).toContain("pt-12");
    expect(html).toContain("sm:pt-16");
    expect(html).toContain("lg:pt-0");
  });
});
