"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

import type { ReactNode } from "react";

type DialogProps = {
  children: ReactNode;
  description: string;
  onClose: () => void;
  open: boolean;
  title: string;
};

const focusableSelector =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function Dialog({ children, description, onClose, open, title }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const panel = panelRef.current;
    document.body.style.overflow = "hidden";
    panel?.querySelector<HTMLElement>(focusableSelector)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || panel === null) {
        return;
      }
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        aria-describedby="dialog-description"
        aria-labelledby="dialog-title"
        aria-modal="true"
        className="relative my-auto w-full max-w-lg rounded-lg border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] p-6 shadow-[var(--shadow-large)]"
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <Button
          aria-label="Close dialog"
          className="absolute right-4 top-4"
          iconOnly
          onClick={onClose}
          size="small"
          variant="secondary"
        >
          <X aria-hidden="true" />
        </Button>
        <div className="pr-12">
          <h2 className="text-lg font-bold text-[var(--color-text-main-900)]" id="dialog-title">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-sub-500)]" id="dialog-description">
            {description}
          </p>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
