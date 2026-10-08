import { CardSkeleton, ListSkeleton, Skeleton } from "@/components/ui/skeletons";

export default function LearnerCourseLoading() {
  return (
    <main className="mx-auto grid min-h-screen max-w-7xl content-start gap-5 px-5 py-5">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10" />
          <div className="grid gap-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-28" />
        </div>
      </header>
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="grid content-start gap-4">
          <CardSkeleton />
          <ListSkeleton rows={4} />
        </section>
        <section className="grid content-start gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </section>
      </section>
    </main>
  );
}
