"use client";


import { AppShell } from "./app-shell";

import type { TenantBranding } from "@/lib/schemas/academy";
import type { OrgRole } from "@/lib/schemas/common";
import type { ReactNode } from "react";

type AdminShellProps = {
  brandLoading?: boolean;
  branding: TenantBranding;
  children: ReactNode;
  initialCollapsed?: boolean;
  viewerRole: OrgRole;
};

export function AdminShell({
  brandLoading = false,
  branding,
  children,
  initialCollapsed = false,
  viewerRole,
}: AdminShellProps) {
  return (
    <AppShell
      brandLoading={brandLoading}
      branding={branding}
      initialCollapsed={initialCollapsed}
      viewerRole={viewerRole}
    >
      {children}
    </AppShell>
  );
}
