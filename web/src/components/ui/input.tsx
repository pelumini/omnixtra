import { ChevronDown, Search } from "lucide-react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

import type { ComponentPropsWithoutRef } from "react";

type ControlSurfaceOptions = {
  disabled?: boolean;
  focusWithin?: boolean;
  hasError?: boolean;
};

export function controlSurface({
  disabled = false,
  focusWithin = false,
  hasError = false,
}: ControlSurfaceOptions = {}) {
  return cn(
    "rounded-[10px] border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] text-[var(--color-text-main-900)] shadow-[var(--shadow-x-small)] transition-[background-color,border-color,box-shadow] hover:border-[var(--color-stroke-sub-300)]",
    hasError && !focusWithin &&
      "border-[var(--color-state-error)] shadow-[var(--shadow-button-focus-error)] focus-visible:border-[var(--color-state-error)] focus-visible:shadow-[var(--shadow-button-focus-error)]",
    hasError && focusWithin &&
      "border-[var(--color-state-error)] shadow-[var(--shadow-button-focus-error)] focus-within:border-[var(--color-state-error)] focus-within:shadow-[var(--shadow-button-focus-error)]",
    !hasError && !focusWithin &&
      "focus-visible:border-[var(--color-primary-base)] focus-visible:shadow-[var(--shadow-button-focus-primary)]",
    !hasError && focusWithin &&
      "focus-within:border-[var(--color-primary-base)] focus-within:shadow-[var(--shadow-button-focus-primary)]",
    disabled &&
      "border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-weak-100)] text-[var(--color-text-disabled-300)] shadow-none hover:border-[var(--color-stroke-soft-200)]",
  );
}

type InputProps = ComponentPropsWithoutRef<"input"> & {
  bare?: boolean;
  hasError?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { bare = false, className, disabled, hasError = false, ...props },
  ref,
) {
  return (
    <input
      {...props}
      aria-invalid={props["aria-invalid"] ?? (hasError || undefined)}
      className={cn(
        !bare &&
          "h-11 w-full py-2.5 pl-3 pr-2.5 text-sm leading-5 text-[var(--color-text-main-900)] placeholder:text-[var(--color-text-soft-400)] focus:outline-none disabled:cursor-not-allowed disabled:placeholder:text-[var(--color-text-disabled-300)]",
        !bare && controlSurface({ disabled, hasError }),
        className,
      )}
      disabled={disabled}
      ref={ref}
    />
  );
});

type TextareaProps = ComponentPropsWithoutRef<"textarea"> & {
  hasError?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, disabled, hasError = false, ...props },
  ref,
) {
  return (
    <textarea
      {...props}
      aria-invalid={props["aria-invalid"] ?? (hasError || undefined)}
      className={cn(
        "min-h-24 w-full resize-y px-3 py-2.5 text-sm leading-5 text-[var(--color-text-main-900)] placeholder:text-[var(--color-text-soft-400)] focus:outline-none disabled:cursor-not-allowed disabled:placeholder:text-[var(--color-text-disabled-300)]",
        controlSurface({ disabled, hasError }),
        className,
      )}
      disabled={disabled}
      ref={ref}
    />
  );
});

type SelectProps = ComponentPropsWithoutRef<"select"> & {
  hasError?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, disabled, hasError = false, ...props },
  ref,
) {
  return (
    <div
      className={cn(
        "relative flex h-11 w-full items-center",
        controlSurface({ disabled, focusWithin: true, hasError }),
        className,
      )}
    >
      <select
        {...props}
        aria-invalid={props["aria-invalid"] ?? (hasError || undefined)}
        className="h-full min-w-0 flex-1 appearance-none bg-transparent py-2.5 pl-3 pr-10 text-sm leading-5 text-[var(--color-text-main-900)] outline-none disabled:cursor-not-allowed disabled:text-[var(--color-text-disabled-300)]"
        disabled={disabled}
        ref={ref}
      />
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 size-5 text-[var(--color-text-soft-400)]" />
    </div>
  );
});

type SearchInputProps = Omit<InputProps, "bare" | "type"> & {
  label: string;
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { className, disabled, hasError = false, label, ...props },
  ref,
) {
  return (
    <label
      className={cn(
        "flex h-11 min-w-64 flex-1 items-center gap-3 px-3 text-sm text-[var(--color-text-sub-500)] sm:max-w-md",
        controlSurface({ disabled, focusWithin: true, hasError }),
        className,
      )}
    >
      <Search aria-hidden="true" className="size-4 shrink-0" />
      <span className="sr-only">{label}</span>
      <Input
        {...props}
        bare
        className="min-w-0 flex-1 bg-transparent text-sm leading-5 text-[var(--color-text-main-900)] outline-none placeholder:text-[var(--color-text-soft-400)]"
        disabled={disabled}
        ref={ref}
        type="search"
      />
    </label>
  );
});
