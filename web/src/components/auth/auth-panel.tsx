"use client";

import { Building2, CircleAlert, LogIn, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { login, signup } from "@/lib/api";

export function AuthPanel() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const response = await signup({
          email: formString(form, "signup_email"),
          full_name: formString(form, "full_name"),
          password: formString(form, "signup_password"),
          tenant_name: formString(form, "tenant_name"),
          tenant_slug: formString(form, "tenant_slug"),
        });
        setMessage(`Signed in as ${response.data.user.full_name}`);
        event.currentTarget.reset();
      } catch (error) {
        setMessage(errorMessage(error, "Signup could not be completed"));
      }
    });
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const response = await login({
          email: formString(form, "login_email"),
          password: formString(form, "login_password"),
        });
        setMessage(`Welcome back, ${response.data.user.full_name}`);
        event.currentTarget.reset();
      } catch (error) {
        setMessage(errorMessage(error, "Login could not be completed"));
      }
    });
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl content-start gap-6 px-5 py-5">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-xl font-semibold">Access</h1>
          <p className="mt-1 text-sm text-gray-600">Sign up or continue to your learning workspace</p>
        </div>
        <div className="grid size-10 place-items-center bg-[var(--primary)] text-white">
          <Building2 aria-hidden="true" className="size-5" />
        </div>
      </header>

      {message ? (
        <div className="flex items-start gap-2 border border-[var(--border)] bg-white px-4 py-3 text-sm text-gray-700">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" />
          <span>{message}</span>
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-2">
        <form
          className="grid content-start gap-4 border border-[var(--border)] bg-white p-4"
          onSubmit={handleSignup}
        >
          <div className="flex items-center gap-2">
            <UserPlus aria-hidden="true" className="size-4 text-gray-500" />
            <h2 className="text-sm font-semibold">Create Tenant</h2>
          </div>
          <label className="grid gap-1 text-sm font-medium">
            Organization
            <input
              className="h-10 border border-[var(--border)] px-3 text-sm font-normal"
              maxLength={200}
              minLength={2}
              name="tenant_name"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Subdomain
            <input
              className="h-10 border border-[var(--border)] px-3 text-sm font-normal"
              name="tenant_slug"
              pattern="^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Full name
            <input
              className="h-10 border border-[var(--border)] px-3 text-sm font-normal"
              maxLength={200}
              minLength={2}
              name="full_name"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Email
            <input
              className="h-10 border border-[var(--border)] px-3 text-sm font-normal"
              name="signup_email"
              required
              type="email"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Password
            <input
              className="h-10 border border-[var(--border)] px-3 text-sm font-normal"
              maxLength={128}
              minLength={12}
              name="signup_password"
              required
              type="password"
            />
          </label>
          <Button className="gap-2" disabled={isPending} type="submit">
            <UserPlus aria-hidden="true" className="size-4" />
            Sign up
          </Button>
        </form>

        <form
          className="grid content-start gap-4 border border-[var(--border)] bg-white p-4"
          onSubmit={handleLogin}
        >
          <div className="flex items-center gap-2">
            <LogIn aria-hidden="true" className="size-4 text-gray-500" />
            <h2 className="text-sm font-semibold">Sign In</h2>
          </div>
          <label className="grid gap-1 text-sm font-medium">
            Email
            <input
              className="h-10 border border-[var(--border)] px-3 text-sm font-normal"
              name="login_email"
              required
              type="email"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Password
            <input
              className="h-10 border border-[var(--border)] px-3 text-sm font-normal"
              maxLength={128}
              name="login_password"
              required
              type="password"
            />
          </label>
          <Button className="gap-2" disabled={isPending} type="submit">
            <LogIn aria-hidden="true" className="size-4" />
            Login
          </Button>
        </form>
      </section>
    </main>
  );
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formString(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}
