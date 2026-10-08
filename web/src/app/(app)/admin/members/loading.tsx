import { AdminShell } from "@/components/layout/admin-shell";
import { ListSkeleton, Skeleton } from "@/components/ui/skeletons";

import type { TenantBranding } from "@/lib/schemas/academy";

const loadingBranding: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#584ce1",
  tenant_name: "Academy",
  time_zone: "UTC",
};

export default function MembersLoading() {
  return (
    <AdminShell branding={loadingBranding} viewerRole="tenant_admin">
      <main className="mx-auto grid min-h-screen max-w-[104rem] content-start gap-5 px-5 py-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid gap-3">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-11 w-36" />
        </header>
        <section className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-lg border border-[#cbd5e1] bg-white p-5 shadow-sm"
              key={index}
            >
              <Skeleton className="size-11" />
              <div className="grid gap-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-16" />
              </div>
            </div>
          ))}
        </section>
        <section className="rounded-lg border border-[#cbd5e1] bg-white shadow-sm">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <Skeleton className="h-5 w-24" />
          </div>
          <ListSkeleton rows={4} />
        </section>
      </main>
    </AdminShell>
  );
}
