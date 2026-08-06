import type { ReactNode } from "react";
import type { OrgRole, TenantBranding } from "@/lib/schemas";

type AppShellProps = {
  branding: TenantBranding;
  children: ReactNode;
  viewerRole: OrgRole;
};

export function AppShell({ branding, children, viewerRole }: AppShellProps) {
  void branding;
  void viewerRole;

  return <>{children}</>;
}
