"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { login } from "@/lib/api";
import { AuthShell, Field } from "./auth-shell";

export function SignInView() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        await login({
          email: formString(form, "email"),
          password: formString(form, "password"),
        });
        window.location.assign("/");
      } catch {
        setMessage("That email and password do not match. Try again.");
      }
    });
  }

  return (
    <AuthShell title="Sign in" subtitle="Continue to your academy.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field autoComplete="email" label="Email" name="email" placeholder="you@company.com" required type="email" />
        <Field
          autoComplete="current-password"
          label="Password"
          maxLength={128}
          name="password"
          required
          type="password"
        />

        {message ? <p className="text-sm text-red-600">{message}</p> : null}

        <Button className="h-11 w-full" disabled={isPending} type="submit">
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="mt-6 space-y-2 border-t border-[var(--border)] pt-5 text-sm text-slate-600">
        <p>
          New to OmniXtra?{" "}
          <Link className="font-medium text-[var(--primary)] hover:underline" href="/get-started">
            Create an academy
          </Link>
        </p>
        <p>
          Have an invitation?{" "}
          <Link className="font-medium text-[var(--primary)] hover:underline" href="/join">
            Join an existing one
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

function formString(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}
