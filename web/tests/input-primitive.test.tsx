import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Field, SelectField, TextareaField } from "@/components/ui/form-controls";
import { Input, SearchInput, Select, controlSurface } from "@/components/ui/input";

describe("input primitives", () => {
  it("keeps element and wrapper focus styles on one surface contract", () => {
    expect(controlSurface()).toContain("border-[var(--color-stroke-soft-200)]");
    expect(controlSurface()).toContain("bg-[var(--color-bg-white-0)]");
    expect(controlSurface()).toContain("shadow-[var(--shadow-x-small)]");
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

  it("shares the outlined floating-label treatment across textarea and select fields", () => {
    const registration = { name: "summary", onBlur: async () => undefined, onChange: async () => undefined, ref: () => undefined };
    const textarea = renderToStaticMarkup(<TextareaField label="Summary" placeholder="Enter summary" registration={registration} />);
    const select = renderToStaticMarkup(<SelectField label="Access" registration={{ ...registration, name: "access" }}><option>Private</option></SelectField>);

    for (const markup of [textarea, select]) {
      expect(markup).toContain("top-[-10px]");
      expect(markup).toContain("left-4");
      expect(markup).toContain("bg-[var(--color-bg-white-0)]");
    }
    expect(select).toContain("lucide-chevron-down");
  });

  it("gives bare selects the shared surface and a trailing chevron", () => {
    const markup = renderToStaticMarkup(<Select name="role"><option>Admin</option></Select>);
    expect(markup).toContain("focus-within:border-[var(--color-primary-base)]");
    expect(markup).toContain("lucide-chevron-down");
    expect(markup).toContain("appearance-none");
  });

  it("provides password visibility from the shared field primitive", () => {
    const registration = { name: "password", onBlur: async () => undefined, onChange: async () => undefined, ref: () => undefined };
    const markup = renderToStaticMarkup(<Field label="Password" registration={registration} type="password" />);

    expect(markup).toContain('type="password"');
    expect(markup).toContain('aria-label="Show password"');
    expect(markup).toContain("lucide-eye");
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
