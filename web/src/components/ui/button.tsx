import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  isProcessing?: boolean;
  processingLabel?: string;
};

export function Button({
  children,
  className,
  disabled,
  isProcessing = false,
  processingLabel = "Processing...",
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isProcessing;

  return (
    <button
      aria-busy={isProcessing || undefined}
      className={cn(
        "inline-flex h-10 cursor-pointer items-center justify-center bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      disabled={isDisabled}
      type={type}
      {...props}
    >
      {isProcessing ? (
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
          />
          {processingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
