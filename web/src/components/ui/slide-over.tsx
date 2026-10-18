"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

import type { ReactNode } from "react";

const focusableSelector =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function SlideOver({ children, onClose, open, title }: {
  children: ReactNode; onClose: () => void; open: boolean; title: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector));
      const first = items[0]; const last = items.at(-1);
      if (!first) { event.preventDefault(); panel.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    panel?.querySelector<HTMLElement>(focusableSelector)?.focus();
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); previousFocus?.focus(); };
  }, [onClose, open]);

  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div aria-modal="true" className="flex h-full w-full max-w-xl flex-col border-l border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] shadow-[var(--shadow-large)]" ref={panelRef} role="dialog" tabIndex={-1}>
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--color-stroke-soft-200)] px-5 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button aria-label="Close settings" iconOnly onClick={onClose} size="small" variant="secondary"><X aria-hidden="true" /></Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
    </div>
  </div>;
}
