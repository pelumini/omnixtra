import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] p-6 shadow-[var(--shadow-x-small)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
