import { AdminShell } from "@/components/admin/admin-shell";
import { DetailSkeleton } from "@/components/ui/skeletons";
import type { TenantBranding } from "@/lib/schemas";

const loadingBranding: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#116149",
  tenant_name: "Academy",
  time_zone: "UTC",
};

export default function CourseDetailLoading() {
  return (
    <AdminShell branding={loadingBranding} viewerRole="tenant_admin">
      <DetailSkeleton />
    </AdminShell>
  );
}
