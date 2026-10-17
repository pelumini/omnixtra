"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

type Options<T> = {
  delay?: number;
  initialValue: T;
  onSaved?: (value: T) => void;
  onStatusChange?: (state: SaveState) => void;
  save: (value: T) => Promise<T>;
  validate?: (value: T) => boolean;
};

const same = <T,>(left: T, right: T) => JSON.stringify(left) === JSON.stringify(right);

export function useAutosave<T>({
  delay = 800,
  initialValue,
  onSaved,
  onStatusChange,
  save,
  validate = () => true,
}: Options<T>) {
  const [status, setStatus] = useState<SaveState>("idle");
  const latest = useRef(initialValue);
  const persisted = useRef(initialValue);
  const queued = useRef<T | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);
  const mounted = useRef(true);
  const options = useRef({ onSaved, onStatusChange, save, validate });
  options.current = { onSaved, onStatusChange, save, validate };

  const updateStatus = useCallback((next: SaveState) => {
    if (mounted.current) setStatus(next);
    options.current.onStatusChange?.(next);
  }, []);

  const persist = useCallback(async (value: T): Promise<void> => {
    if (!options.current.validate(value) || same(value, persisted.current)) {
      if (same(value, persisted.current)) updateStatus("saved");
      return;
    }
    if (inFlight.current) {
      queued.current = value;
      return inFlight.current;
    }
    updateStatus("saving");
    const request = options.current.save(value).then((saved) => {
      persisted.current = saved;
      options.current.onSaved?.(saved);
      updateStatus("saved");
    }).catch(() => {
      updateStatus("error");
    }).finally(async () => {
      inFlight.current = null;
      const next = queued.current;
      queued.current = null;
      if (next && !same(next, persisted.current) && options.current.validate(next)) {
        await persist(next);
      }
    });
    inFlight.current = request;
    return request;
  }, [updateStatus]);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    return persist(latest.current);
  }, [persist]);

  const schedule = useCallback((value: T, immediate = false) => {
    latest.current = value;
    if (timer.current) clearTimeout(timer.current);
    if (!options.current.validate(value)) {
      updateStatus("dirty");
      return;
    }
    if (same(value, persisted.current)) {
      updateStatus("saved");
      return;
    }
    updateStatus("dirty");
    if (immediate) void flush();
    else timer.current = setTimeout(() => void flush(), delay);
  }, [delay, flush, updateStatus]);

  const retry = useCallback(() => void flush(), [flush]);

  useEffect(() => () => {
    mounted.current = false;
    if (timer.current) clearTimeout(timer.current);
    if (options.current.validate(latest.current) && !same(latest.current, persisted.current)) {
      void persist(latest.current);
    }
  }, [persist]);

  return { flush, retry, schedule, status };
}
