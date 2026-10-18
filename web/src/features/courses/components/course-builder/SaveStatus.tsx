import { AlertCircle, Check, LoaderCircle } from "lucide-react";

import type { SaveState } from "./useAutosave";

export function SaveStatus({ state }: { state: SaveState }) {
  const content = state === "saving" || state === "dirty"
    ? <><LoaderCircle aria-hidden="true" className="size-3 animate-spin" /> Saving...</>
    : state === "error"
      ? <><AlertCircle aria-hidden="true" className="size-3" /> Couldn&apos;t save - Retry</>
      : <><Check aria-hidden="true" className="size-3" /> Saved</>;
  return <span aria-live="polite" className={`inline-flex min-h-5 min-w-24 items-center justify-end gap-1 text-xs ${state === "error" ? "text-[var(--color-state-error)]" : "text-[var(--color-text-sub-500)]"}`}>{content}</span>;
}

export function ErrorSaveStatus({ onRetry, state }: { onRetry: () => void; state: SaveState }) {
  if (state !== "error") return null;
  return <button onClick={onRetry} type="button"><SaveStatus state={state} /></button>;
}
