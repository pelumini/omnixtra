"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";

import { SaveStatus } from "./SaveStatus";
import { useAutosave, type SaveState } from "./useAutosave";

export function AutosaveTitle({ ariaLabel, entityKey, onChange, onStatusChange, save, value }: {
  ariaLabel: string; entityKey: string; onChange: (value: string) => void;
  onStatusChange?: (key: string, state: SaveState) => void;
  save: (value: string) => Promise<string>; value: string;
}) {
  const [error, setError] = useState("");
  const autosave = useAutosave({
    initialValue: value,
    onSaved: onChange,
    onStatusChange: (state) => onStatusChange?.(entityKey, state),
    save,
    validate: (next) => next.trim().length > 0 && next.length <= 200,
  });
  function update(next: string) {
    onChange(next); setError(next.trim() ? "" : "Title can't be empty"); autosave.schedule(next);
  }
  return <div className="grid min-w-0 flex-1 gap-1">
    <Input aria-label={ariaLabel} hasError={Boolean(error)} maxLength={200} onBlur={() => void autosave.flush()} onChange={(event) => update(event.target.value)} value={value} />
    <div className="flex min-h-5 items-center justify-between gap-2">{error ? <span className="text-xs text-[var(--color-state-error)]" role="alert">{error}</span> : <span /> }<button onClick={autosave.retry} type="button"><SaveStatus state={autosave.status} /></button></div>
  </div>;
}
