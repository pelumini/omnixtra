"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        classNames: {
          error: "border-red-200 bg-red-50 text-red-800",
          success: "border-emerald-200 bg-emerald-50 text-emerald-900",
          toast: "rounded-md border shadow-sm",
        },
      }}
    />
  );
}
