import { describe, expect, it } from "vitest";

import {
  tenantApiUrl,
  tenantApiUrlForSlug,
  tenantSlugFromHost,
  tenantUrl,
} from "@/lib/tenant-host";

describe("tenant host helpers", () => {
  it("builds localhost subdomain URLs from the configured base domain", () => {
    const location = {
      port: "3001",
      protocol: "http:",
    } as Location;

    expect(tenantUrl("acme", "/admin", location)).toBe("http://acme.localhost:3001/admin");
  });

  it("extracts tenant slugs from localhost and production-style hosts", () => {
    expect(tenantSlugFromHost("acme.localhost:3001", "localhost")).toBe("acme");
    expect(tenantSlugFromHost("acme.omnixtra.app", "omnixtra.app")).toBe("acme");
    expect(tenantSlugFromHost("localhost:3001", "localhost")).toBeNull();
    expect(tenantSlugFromHost("team.acme.localhost:3001", "localhost")).toBeNull();
  });

  it("keeps browser API calls on the matching tenant host", () => {
    expect(tenantApiUrl("http://localhost:8000", "acme.localhost:3001")).toBe(
      "http://acme.localhost:8000",
    );
    expect(tenantApiUrl("http://localhost:8000", "localhost:3001")).toBe(
      "http://localhost:8000",
    );
    expect(tenantApiUrlForSlug("http://localhost:8000", "acme")).toBe(
      "http://acme.localhost:8000",
    );
  });
});
