import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RootLayout from "@/app/layout";

const getTenantBranding = vi.fn();

vi.mock("next/headers", () => ({
  headers: async () =>
    new Map([
      ["host", "acme.localhost"],
    ]),
}));

vi.mock("@/lib/api", () => ({
  getTenantBranding: (context: { host?: string }) => getTenantBranding(context),
}));

describe("tenant branding", () => {
  beforeEach(() => {
    getTenantBranding.mockResolvedValue({
      data: {
        locale: "en-GB",
        logo_url: null,
        primary_color: "#0f766e",
        tenant_name: "Acme Learning",
        time_zone: "Europe/London",
      },
    });
  });

  it("applies tenant name, locale, and primary colour in the app shell", async () => {
    const element = await RootLayout({ children: <main>Loaded</main> });
    const html = renderToStaticMarkup(element);

    expect(getTenantBranding).toHaveBeenCalledWith({ host: "acme.localhost" });
    expect(html).toContain("lang=\"en-GB\"");
    expect(html).toContain("--primary:#0f766e");
    expect(html).toContain("Acme Learning");
    expect(html).toContain("Loaded");
  });
});
