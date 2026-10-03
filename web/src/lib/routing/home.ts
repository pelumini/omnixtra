import type { SessionResponse } from "@/lib/schemas/auth";
import type { OrgRole } from "@/lib/schemas/common";

export function homeForOrgRole(role: OrgRole): string {
  return role === "tenant_admin" ? "/admin" : "/my-courses";
}

export function homeForSession(session: SessionResponse | null): string | null {
  if (session?.membership === null || session === null) {
    return null;
  }
  return homeForOrgRole(session.membership.org_role);
}
