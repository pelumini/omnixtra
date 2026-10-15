import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Toggle } from "@/components/ui/toggle";

describe("Toggle", () => {
  it("renders an accessible branded switch", () => {
    const html = renderToStaticMarkup(
      <Toggle defaultChecked label="Required for completion" name="required" />,
    );

    expect(html).toContain('role="switch"');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("Required for completion");
    expect(html).toContain("--color-primary-base");
    expect(html).toContain("--shadow-button-focus-primary");
  });
});
