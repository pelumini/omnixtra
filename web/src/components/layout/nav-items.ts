import {
  BookOpen,
  CreditCard,
  GraduationCap,
  HelpCircle,
  Home,
  Settings,
  Users,
} from "lucide-react";

import { canManageBilling, canManageMembers } from "@/lib/permissions";

import type { OrgRole } from "@/lib/schemas/common";

export type AppNavItem = {
  href: string;
  icon: typeof Home;
  label: string;
  roles: OrgRole[];
};

export const mainItems: AppNavItem[] = [
  { href: "/admin", icon: Home, label: "Dashboard", roles: ["tenant_admin"] },
  { href: "/admin/courses", icon: BookOpen, label: "Courses", roles: ["tenant_admin", "member"] },
  { href: "/admin/members", icon: Users, label: "Members", roles: ["tenant_admin"] },
  { href: "/my-courses", icon: GraduationCap, label: "My Courses", roles: ["tenant_admin", "member"] },
];

export const otherItems: AppNavItem[] = [
  { href: "/onboarding", icon: Settings, label: "Settings", roles: ["tenant_admin"] },
  { href: "/pricing", icon: CreditCard, label: "Billing", roles: ["tenant_admin"] },
  { href: "/admin", icon: HelpCircle, label: "Help", roles: ["tenant_admin", "member"] },
];

export function visibleNavItems(items: AppNavItem[], role: OrgRole) {
  return items.filter((item) => {
    if (!item.roles.includes(role)) return false;
    if (item.label === "Members") return canManageMembers(role);
    if (item.label === "Billing") return canManageBilling(role);
    return true;
  });
}
