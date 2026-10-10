"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import type { ReactNode } from "react";

type DropdownProps = {
  children: (close: () => void) => ReactNode;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  panelClassName: string;
  rootClassName?: string;
  trigger: ReactNode;
  triggerClassName: string;
  triggerLabel: string;
};

export function Dropdown({
  children,
  onOpenChange,
  open: controlledOpen,
  panelClassName,
  rootClassName = "relative",
  trigger,
  triggerClassName,
  triggerLabel,
}: DropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const open = controlledOpen ?? internalOpen;

  const setOpen = useCallback((nextOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }, [controlledOpen, onOpenChange]);

  const dismiss = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, [setOpen]);

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        dismiss();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dismiss, open]);

  return (
    <div className={rootClassName} ref={rootRef}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={triggerLabel}
        className={triggerClassName}
        onClick={() => setOpen(!open)}
        ref={triggerRef}
        type="button"
      >
        {trigger}
      </button>
      {open ? (
        <div className={panelClassName} id={panelId} role="menu">
          {children(dismiss)}
        </div>
      ) : null}
    </div>
  );
}
