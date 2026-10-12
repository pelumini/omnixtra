import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Input, SearchInput, controlSurface } from "@/components/ui/input";

describe("input primitives", () => {
  it("keeps element and wrapper focus styles on one surface contract", () => {
    expect(controlSurface()).toContain("focus:border-[var(--color-stroke-strong-900)]");
    expect(controlSurface({ focusWithin: true })).toContain(
      "focus-within:border-[var(--color-stroke-strong-900)]",
    );
    expect(controlSurface({ hasError: true })).toContain(
      "focus:shadow-[var(--shadow-button-focus-error)]",
    );
    expect(controlSurface({ disabled: true })).toContain("bg-[var(--color-bg-weak-100)]");
  });

  it("wires invalid state to the native control", () => {
    const markup = renderToStaticMarkup(<Input hasError name="email" />);

    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain('name="email"');
  });

  it("gives search controls an accessible label and the shared focus surface", () => {
    const markup = renderToStaticMarkup(<SearchInput label="Search courses" />);

    expect(markup).toContain("Search courses");
    expect(markup).toContain("focus-within:border-[var(--color-stroke-strong-900)]");
    expect(markup).toContain('type="search"');
  });
});
