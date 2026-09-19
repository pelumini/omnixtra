"use client";

import type { ReactNode } from "react";

import { AppShell } from "@/components/app/app-shell";
import type { OrgRole, TenantBranding } from "@/lib/schemas";

type AdminShellProps = {
  branding: TenantBranding;
  children: ReactNode;
  initialCollapsed?: boolean;
  viewerRole: OrgRole;
};

export function AdminShell({
  branding,
  children,
  initialCollapsed = false,
  viewerRole,
}: AdminShellProps) {
  return (
    <AppShell
      branding={branding}
      initialCollapsed={initialCollapsed}
      viewerRole={viewerRole}
    >
      {children}
    </AppShell>
  );
}
