import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="grid gap-3 border border-[var(--border)] bg-white p-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="divide-y divide-[var(--border)] border border-[var(--border)] bg-white">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="grid gap-3 px-4 py-4" key={index}>
          <div className="flex items-start justify-between gap-4">
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-7 w-20" />
          </div>
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <main className="mx-auto grid min-h-screen max-w-6xl content-start gap-6 px-5 py-5">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div className="grid min-w-0 flex-1 gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-2/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
        <Skeleton className="h-8 w-20" />
      </header>
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="grid content-start gap-4">
          <Skeleton className="h-5 w-24" />
          <CardSkeleton />
          <CardSkeleton />
        </section>
        <CardSkeleton />
      </section>
    </main>
  );
}

export function CoursesListSkeleton() {
  return (
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
      <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <CardSkeleton />
        <section className="grid content-start gap-4">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-24" />
          </div>
          <ListSkeleton rows={3} />
        </section>
      </section>
    </main>
  );
}
