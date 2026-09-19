import { AdminShell } from "@/components/admin/admin-shell";
import { CoursesListSkeleton } from "@/components/ui/skeletons";
import type { TenantBranding } from "@/lib/schemas";

const loadingBranding: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#116149",
  tenant_name: "Academy",
  time_zone: "UTC",
};

export default function AdminCoursesLoading() {
  return (
    <AdminShell branding={loadingBranding} viewerRole="tenant_admin">
      <CoursesListSkeleton />
    </AdminShell>
  );
}
