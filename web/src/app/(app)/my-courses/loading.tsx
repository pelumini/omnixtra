import { AppShell } from "@/components/layout/app-shell";
import { CardSkeleton, Skeleton } from "@/components/ui/skeletons";

import type { TenantBranding } from "@/lib/schemas/academy";

const loadingBranding: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#584ce1",
  tenant_name: "Academy",
  time_zone: "UTC",
};

export default function MyCoursesLoading() {
  return (
    <AppShell brandLoading branding={loadingBranding} viewerRole="member">
      <main className="mx-auto grid min-h-screen max-w-7xl content-start gap-6 px-5 py-5">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10" />
            <div className="grid gap-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-10 w-28" />
        </header>
        <section className="grid gap-3">
          <div className="flex items-start gap-3">
            <Skeleton className="size-9" />
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </section>
      </main>
    </AppShell>
  );
}
