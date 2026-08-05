import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: ReactNode;
  subtitle?: string;
  title: string;
  width?: "narrow" | "wide";
};

type FieldProps = {
  autoComplete?: string;
  hint?: string;
  label: string;
  maxLength?: number;
  minLength?: number;
  name: string;
  onBlur?: () => void;
  onChange?: (value: string) => void;
  pattern?: string;
  placeholder?: string;
  required?: boolean;
  suffix?: string;
  type?: string;
  value?: string;
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

export function Field({
  autoComplete,
  hint,
  label,
  maxLength,
  minLength,
  name,
  onBlur,
  onChange,
  pattern,
  placeholder,
  required,
  suffix,
  type = "text",
  value,
}: FieldProps) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600">{label}</span>
      <div
        className={cn(
          "mt-1 flex items-stretch",
          suffix ? "rounded-md border border-[var(--border)]" : "",
        )}
      >
        <input
          autoComplete={autoComplete}
          className={cn(
            "h-10 w-full px-3 text-sm text-[var(--foreground)] focus:outline-none",
            suffix
              ? "rounded-l-md focus:ring-1 focus:ring-[var(--primary)]"
              : "rounded-md border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]",
          )}
          maxLength={maxLength}
          minLength={minLength}
          name={name}
          onBlur={onBlur}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          pattern={pattern}
          placeholder={placeholder}
          required={required}
          type={type}
          value={value}
        />
        {suffix ? (
          <span className="flex items-center rounded-r-md bg-[var(--background)] px-3 text-sm text-slate-500">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}
