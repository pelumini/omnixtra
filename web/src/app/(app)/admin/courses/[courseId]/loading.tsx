import { AdminShell } from "@/components/layout/admin-shell";
import { DetailSkeleton } from "@/components/ui/skeletons";

import type { TenantBranding } from "@/lib/schemas/academy";

const loadingBranding: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#584ce1",
  tenant_name: "Academy",
  time_zone: "UTC",
};

export default function CourseDetailLoading() {
  return (
    <AdminShell brandLoading branding={loadingBranding} viewerRole="tenant_admin">
      <DetailSkeleton />
    </AdminShell>
  );
}
