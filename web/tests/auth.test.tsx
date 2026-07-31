import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AuthPanel } from "@/components/auth/auth-panel";

describe("auth UI", () => {
  it("renders signup and login forms with validation affordances", () => {
    const html = renderToStaticMarkup(<AuthPanel />);

    expect(html).toContain("Create Tenant");
    expect(html).toContain("Sign In");
    expect(html).toContain("name=\"tenant_slug\"");
    expect(html).toContain("type=\"email\"");
    expect(html).toContain("minLength=\"12\"");
    expect(html).toContain("Sign up");
    expect(html).toContain("Login");
  });
});
