import Link from "next/link";
import type { ReactNode } from "react";

export function PublicLanding() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="mx-auto max-w-6xl px-6">
        <section className="grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr] lg:py-24">
          <div>
            <p className="text-sm font-semibold uppercase text-[var(--primary)]">
              OmniXtra LMS
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-[var(--foreground)] sm:text-5xl">
              Launch your fully branded academy with role-aware courses and an AI tutor.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Create your academy, invite your team, and give every member the right home
              for the courses they take, facilitate, or own.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                className="inline-flex h-11 items-center justify-center bg-[var(--primary)] px-6 text-base font-medium text-white hover:bg-emerald-800"
                href="/get-started"
              >
                Create your academy
              </Link>
              <Link
                className="text-sm font-medium text-[var(--primary)] hover:underline"
                href="/login"
              >
                or sign in to an existing one
              </Link>
            </div>

            <p className="mt-4 text-sm text-slate-500">
              Free to start. No sales call. Your first course can be live today.
            </p>
          </div>

          <aside className="hidden rounded-lg border border-[var(--border)] bg-white p-6 lg:block">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              What you get on day one
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <Feature>Your own branded academy and subdomain</Feature>
              <Feature>Invite admins, facilitators, and learners by email</Feature>
              <Feature>An AI tutor grounded in your own course content</Feature>
              <Feature>Completion tracking and certificates</Feature>
            </ul>
          </aside>
        </section>

        <section className="border-t border-[var(--border)] py-14">
          <div className="grid gap-6 md:grid-cols-3">
            <Persona
              body="Manage branding, members, billing, and reports. Set up the academy and keep it running."
              title="Admin"
            />
            <Persona
              body="Own or facilitate specific courses without broad academy powers. Access is granted per course."
              title="Course team"
            />
            <Persona
              body="Resume enrolled courses and track progress from one focused home."
              title="Learner"
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Feature({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2">
      <span aria-hidden="true" className="mt-1 text-[var(--primary)]">
        -
      </span>
      <span>{children}</span>
    </li>
  );
}

function Persona({ body, title }: { body: string; title: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-6">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-slate-500">
        <span>(c) OmniXtra</span>
        <Link className="hover:text-[var(--foreground)]" href="/join">
          Have an invitation? Join here
        </Link>
      </div>
    </footer>
  );
}
