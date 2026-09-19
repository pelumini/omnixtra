"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        classNames: {
          error: "border-red-200 bg-red-50 text-red-800",
          success: "border-[var(--color-state-success)] bg-[var(--color-green-lighter)] text-[var(--color-text-main-900)]",
          toast: "rounded-md border shadow-sm",
        },
      }}
    />
  );
}
