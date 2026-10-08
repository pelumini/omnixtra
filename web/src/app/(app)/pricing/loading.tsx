import { CardSkeleton, Skeleton } from "@/components/ui/skeletons";

export default function PricingLoading() {
  return (
    <main className="mx-auto grid min-h-screen max-w-6xl content-start gap-6 px-5 py-5">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="grid gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="size-10" />
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </section>
    </main>
  );
}
