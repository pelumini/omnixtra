import type { ReactNode } from "react";

export const assetRoot = "/images/landing";

export function SectionIntro({
  children,
  eyebrow,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
          {title}
        </h2>
      </div>
      <p className="max-w-xl text-lg leading-8 text-[var(--color-text-sub-500)] lg:justify-self-end">
        {children}
      </p>
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-[var(--color-light-indigo-800)]">
      <span
        aria-hidden="true"
        className="size-2 rounded-full bg-[var(--primary)]"
      />
      {children}
    </p>
  );
}

export function Pattern() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-repeat opacity-[0.035]"
      style={{
        backgroundImage: `url(${assetRoot}/omnixtra_pattern.png)`,
        backgroundSize: "640px 640px",
      }}
    />
  );
}
