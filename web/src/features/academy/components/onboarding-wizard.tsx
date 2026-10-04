"use client";

import { BookOpen, Check, CreditCard, Palette, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const steps = [
  {
    href: "/pricing",
    icon: CreditCard,
    id: "plan",
    label: "Choose plan",
  },
  {
    href: "/admin",
    icon: Palette,
    id: "brand",
    label: "Set branding",
  },
  {
    href: "/admin/courses",
    icon: BookOpen,
    id: "course",
    label: "Create course",
  },
  {
    href: "/admin",
    icon: UserPlus,
    id: "invite",
    label: "Invite learner",
  },
] as const;

export function OnboardingWizard() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-4xl content-start gap-6 px-5 py-5">
      <header className="border-b border-[var(--border)] pb-4">
        <h1 className="text-xl font-semibold">Onboarding</h1>
        <p className="mt-1 text-sm text-gray-600">Launch checklist</p>
      </header>

      <section className="divide-y divide-[var(--border)] border border-[var(--border)] bg-white">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isDone = completed.has(step.id);
          return (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4" key={step.id}>
              <div className="flex items-center gap-3">
                <button
                  aria-label={step.label}
                  aria-pressed={isDone}
                  className={`grid size-9 place-items-center border ${
                    isDone
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                      : "border-[var(--border)] bg-white text-gray-500"
                  }`}
                  onClick={() => toggle(step.id)}
                  type="button"
                >
                  {isDone ? <Check aria-hidden="true" className="size-4" /> : index + 1}
                </button>
                <div className="flex items-center gap-2">
                  <Icon aria-hidden="true" className="size-4 text-[var(--primary)]" />
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
              </div>
              <Link className="text-sm font-medium text-[var(--primary)]" href={step.href}>
                Open
              </Link>
            </div>
          );
        })}
      </section>
    </main>
  );
}
