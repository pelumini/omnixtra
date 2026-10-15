import { forwardRef, useId } from "react";

import { cn } from "@/lib/utils";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ToggleProps = Omit<ComponentPropsWithoutRef<"input">, "type"> & {
  label: ReactNode;
};

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(function Toggle(
  { className, disabled, id, label, onKeyDown, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-3 text-sm text-[var(--color-text-main-900)]",
        disabled && "cursor-not-allowed text-[var(--color-text-disabled-300)]",
        className,
      )}
      htmlFor={inputId}
    >
      <input
        {...props}
        className="peer sr-only"
        disabled={disabled}
        id={inputId}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (!event.defaultPrevented && event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.click();
          }
        }}
        ref={ref}
        role="switch"
        type="checkbox"
      />
      <span
        aria-hidden="true"
        className="relative h-6 w-11 shrink-0 rounded-full border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-weak-100)] transition-[background-color,border-color,box-shadow] after:absolute after:left-0.5 after:top-0.5 after:size-[18px] after:rounded-full after:bg-[var(--color-bg-white-0)] after:shadow-[var(--shadow-radio-checkbox-default)] after:transition-transform peer-checked:border-[var(--color-primary-base)] peer-checked:bg-[var(--color-primary-base)] peer-checked:after:translate-x-5 peer-focus-visible:border-[var(--color-primary-base)] peer-focus-visible:shadow-[var(--shadow-button-focus-primary)] peer-disabled:opacity-60"
      />
      <span>{label}</span>
    </label>
  );
});
