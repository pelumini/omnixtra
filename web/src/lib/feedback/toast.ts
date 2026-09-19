"use client";

import { toast as sonnerToast } from "sonner";

export const feedbackToast = {
  error(message: string) {
    sonnerToast.error(message);
  },
  success(message: string) {
    sonnerToast.success(message);
  },
};
