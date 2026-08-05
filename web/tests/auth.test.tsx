import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AuthPanel } from "@/components/auth/auth-panel";

describe("auth UI", () => {
  it("renders tenant creation, invitation acceptance, and login forms", () => {
    const html = renderToStaticMarkup(<AuthPanel />);

    expect(html).toContain("Create Organization");
    expect(html).toContain("Accept Invitation");
    expect(html).toContain("Sign In");
    expect(html).toContain("name=\"tenant_slug\"");
    expect(html).toContain("name=\"invite_token\"");
    expect(html).toContain("type=\"email\"");
    expect(html).toContain("minLength=\"12\"");
    expect(html).toContain("Create organization");
    expect(html).toContain("Join organization");
    expect(html).toContain("Login");
  });
});
