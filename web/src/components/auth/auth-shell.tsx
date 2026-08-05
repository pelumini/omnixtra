import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: ReactNode;
  subtitle?: string;
  title: string;
  width?: "narrow" | "wide";
};

export function AuthShell({ children, subtitle, title, width = "narrow" }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <main className="flex flex-1 items-start justify-center px-6 py-12 sm:py-16">
        <div
          className={cn(
            "w-full rounded-xl border border-[var(--border)] bg-white p-8 shadow-sm",
            width === "narrow" ? "max-w-md" : "max-w-lg",
          )}
        >
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            {title}
          </h1>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
