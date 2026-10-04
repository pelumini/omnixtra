import { cn } from "@/lib/utils";

import type { ButtonHTMLAttributes, ReactNode } from "react";


type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  iconOnly?: boolean;
  isProcessing?: boolean;
  processingLabel?: string;
  size?: "medium" | "small" | "x-small";
  variant?: "primary" | "secondary";
};

export function Button({
  children,
  className,
  disabled,
  iconOnly = false,
  isProcessing = false,
  processingLabel = "Processing...",
  size = "medium",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isProcessing;

  return (
    <button
      aria-busy={isProcessing || undefined}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-1 rounded-full text-sm font-semibold leading-5 transition-[background-color,border-color,color,box-shadow] [&>svg]:size-5 focus-visible:outline-none disabled:cursor-not-allowed disabled:border-[var(--color-stroke-soft-200)] disabled:bg-[var(--color-bg-weak-100)] disabled:text-[var(--color-text-disabled-300)] disabled:shadow-none",
        sizeStyles[size],
        iconOnly ? iconOnlyStyles[size] : "",
        variantStyles[variant],
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

const sizeStyles = {
  medium: "h-10 px-2.5 py-2.5",
  small: "h-9 px-2.5 py-2",
  "x-small": "h-8 px-2.5 py-1.5",
} as const;

const iconOnlyStyles = {
  medium: "w-10 px-0",
  small: "w-9 px-0",
  "x-small": "w-8 px-0",
} as const;

const variantStyles = {
  primary:
    "border border-transparent bg-[var(--primary)] text-[var(--color-text-white-0)] shadow-[var(--shadow-app-button-primary)] hover:bg-[var(--color-light-indigo-700)] active:bg-[var(--color-light-indigo-800)] focus-visible:shadow-[var(--shadow-app-button-primary-focus)]",
  secondary:
    "border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] text-[var(--color-text-sub-500)] shadow-[var(--shadow-x-small)] hover:bg-[var(--color-bg-weak-100)] active:bg-[var(--color-bg-soft-200)] focus-visible:border-[var(--color-stroke-strong-900)] focus-visible:shadow-[var(--shadow-button-focus-important)]",
} as const;
