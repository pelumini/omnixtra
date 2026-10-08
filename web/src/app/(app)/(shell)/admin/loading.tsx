import {
  CardSkeleton,
  ListSkeleton,
  Skeleton,
} from "@/components/ui/skeletons";

export default function AdminDashboardLoading() {
  return (
    <main className="mx-auto grid min-h-screen max-w-[104rem] content-start gap-5 px-5 py-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid gap-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-56" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-11 w-28" />
          <Skeleton className="h-11 w-20" />
        </div>
      </header>
      <section className="grid gap-5 xl:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <Skeleton className="h-80 w-full" />
        <CardSkeleton />
      </section>
      <ListSkeleton rows={3} />
    </main>
  );
}
