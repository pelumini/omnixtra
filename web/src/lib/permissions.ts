import type { CourseRole, OrgRole } from "@/lib/schemas";

export function isTenantAdmin(role: OrgRole) {
  return role === "tenant_admin";
}

export function canCreateCourse(role: OrgRole) {
  return isTenantAdmin(role);
}

export function canManageMembers(role: OrgRole) {
  return isTenantAdmin(role);
}

export function canManageBilling(role: OrgRole) {
  return isTenantAdmin(role);
}

export function canAuthorCourse(role: CourseRole) {
  return role === "course_owner";
}

export function canViewCourseProgress(role: CourseRole) {
  return role === "course_owner" || role === "facilitator";
}

export function canUseCoursePlayer(role: CourseRole) {
  return role === "course_owner" || role === "facilitator" || role === "learner";
}
