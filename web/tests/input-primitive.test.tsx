import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Input, SearchInput, controlSurface } from "@/components/ui/input";

describe("input primitives", () => {
  it("keeps element and wrapper focus styles on one surface contract", () => {
    expect(controlSurface()).toContain("border-transparent");
    expect(controlSurface()).toContain("bg-[var(--color-bg-weak-100)]");
    expect(controlSurface()).toContain("focus-visible:border-[var(--color-primary-base)]");
    expect(controlSurface()).toContain(
      "focus-visible:shadow-[var(--shadow-button-focus-primary)]",
    );
    expect(controlSurface({ focusWithin: true })).toContain(
      "focus-within:border-[var(--color-primary-base)]",
    );
    expect(controlSurface({ hasError: true })).toContain(
      "focus-visible:shadow-[var(--shadow-button-focus-error)]",
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
    expect(markup).toContain("focus-within:border-[var(--color-primary-base)]");
    expect(markup).toContain('type="search"');
  });
});
