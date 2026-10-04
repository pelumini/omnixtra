import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sonnerToast = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: sonnerToast,
}));

import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/form-controls";
import { CoursesListSkeleton, DetailSkeleton } from "@/components/ui/skeletons";
import { feedbackToast } from "@/lib/feedback/toast";

import type { TenantBranding } from "@/lib/schemas/academy";

const branding: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#116149",
  tenant_name: "Acme Academy",
  time_zone: "UTC",
};

describe("loading and feedback standard", () => {
  beforeEach(() => {
    sonnerToast.error.mockClear();
    sonnerToast.success.mockClear();
  });

  it("renders pending submit buttons with contextual copy", () => {
    const html = renderToStaticMarkup(
      <SubmitButton isSubmitting pendingLabel="Creating...">
        Create course
      </SubmitButton>,
    );

    expect(html).toContain("disabled");
    expect(html).toContain("Creating...");
    expect(html).not.toContain("Create course");
  });

  it("renders shared buttons with pointer and processing states", () => {
    const defaultHtml = renderToStaticMarkup(<Button>Invite member</Button>);
    const processingHtml = renderToStaticMarkup(
      <Button isProcessing processingLabel="Processing...">
        Invite member
      </Button>,
    );
    const disabledHtml = renderToStaticMarkup(<Button disabled>Invite member</Button>);

    expect(defaultHtml).toContain("cursor-pointer");
    expect(processingHtml).toContain("aria-busy=\"true\"");
    expect(processingHtml).toContain("disabled");
    expect(processingHtml).toContain("Processing...");
    expect(processingHtml).not.toContain("Invite member");
    expect(disabledHtml).toContain("disabled:cursor-not-allowed");
  });

  it("renders skeletons for list and detail loading states", () => {
    const html = renderToStaticMarkup(
      <>
        <CoursesListSkeleton />
        <DetailSkeleton />
      </>,
    );

    expect(html).toContain("animate-pulse");
    expect(html).toContain("max-w-7xl");
    expect(html).toContain("max-w-6xl");
  });

  it("routes success and error feedback through the shared toast wrapper", () => {
    feedbackToast.success("Course created.");
    feedbackToast.error("Course could not be created.");

    expect(sonnerToast.success).toHaveBeenCalledWith("Course created.");
    expect(sonnerToast.error).toHaveBeenCalledWith("Course could not be created.");
  });

  it("links the context-aware academy logo to admin home", () => {
    const html = renderToStaticMarkup(
      <AdminShell branding={branding} viewerRole="tenant_admin">
        <main>Dashboard</main>
      </AdminShell>,
    );

    expect(html).toContain('href="/admin"');
    expect(html).toContain("Acme Academy");
  });
});
