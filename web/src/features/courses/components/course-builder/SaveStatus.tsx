import { AlertCircle, Check, LoaderCircle } from "lucide-react";

import type { SaveState } from "./useAutosave";

export function SaveStatus({ state }: { state: SaveState }) {
  const content = state === "saving"
    ? <><LoaderCircle aria-hidden="true" className="size-3 animate-spin" /> Saving...</>
    : state === "error"
      ? <><AlertCircle aria-hidden="true" className="size-3" /> Couldn&apos;t save - Retry</>
      : state === "dirty"
        ? "Unsaved changes"
        : <><Check aria-hidden="true" className="size-3" /> Saved</>;
  return <span aria-live="polite" className={`inline-flex min-h-5 min-w-24 items-center justify-end gap-1 text-xs ${state === "error" ? "text-[var(--color-state-error)]" : "text-[var(--color-text-sub-500)]"}`}>{content}</span>;
}
