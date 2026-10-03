import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeStatus = "success" | "pending" | "error" | "neutral";
type BadgeVariant = "default" | "lighter";

type BadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, "color"> & {
  children: ReactNode;
  status?: BadgeStatus;
  variant?: BadgeVariant;
};

export function Badge({
  children,
  className,
  status = "neutral",
  variant = "lighter",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium leading-4",
        statusStyles[status].text,
        variant === "lighter" ? statusStyles[status].background : "bg-transparent",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

const statusStyles = {
  success: {
    background: "bg-[var(--color-green-lighter)]",
    text: "text-[var(--color-state-success)]",
  },
  pending: {
    background: "bg-[var(--color-orange-lighter)]",
    text: "text-[var(--color-state-warning)]",
  },
  error: {
    background: "bg-[var(--color-red-lighter)]",
    text: "text-[var(--color-state-error)]",
  },
  neutral: {
    background: "bg-[var(--color-bg-weak-100)]",
    text: "text-[var(--color-state-neutral)]",
  },
} as const;
