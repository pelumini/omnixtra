import { GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center bg-[var(--primary)] text-[var(--primary-foreground)]">
            <GraduationCap aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">OmniXtra</h1>
            <p className="text-sm text-gray-600">Sprint 0 foundation</p>
          </div>
        </div>
        <Button>Open dashboard</Button>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {["Tenant-safe LMS", "Course authoring", "AI tutor"].map((title) => (
          <article key={title} className="border border-[var(--border)] bg-white p-4">
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-gray-600">
              MVP work is tracked directly in AGENTS.md.
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
