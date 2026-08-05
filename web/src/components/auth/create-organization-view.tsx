"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { createTenant } from "@/lib/api";
import { AuthShell, Field } from "./auth-shell";

export function CreateOrganizationView() {
  const [subdomain, setSubdomain] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        await createTenant({
          email: formString(form, "email"),
          full_name: formString(form, "full_name"),
          password: formString(form, "password"),
          tenant_name: formString(form, "tenant_name"),
          tenant_slug: subdomain,
        });
        window.location.assign("/");
      } catch {
        setMessage("We could not create the academy. Check your details and try again.");
      }
    });
  }

  return (
    <AuthShell
      subtitle="Set up your academy and your admin account in one step."
      title="Create your academy"
      width="wide"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Academy name" name="tenant_name" placeholder="Acme Academy" required />

        <div>
          <Field
            label="Subdomain"
            name="tenant_slug"
            onChange={(value) => setSubdomain(value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            pattern="^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$"
            placeholder="acme"
            required
            suffix=".omnixtra.app"
            value={subdomain}
          />
          <p className="mt-1 text-xs text-slate-500">
            Your academy will live at {subdomain || "yourname"}.omnixtra.app
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field autoComplete="name" label="Your full name" name="full_name" required />
          <Field autoComplete="email" label="Work email" name="email" required type="email" />
        </div>

        <Field
          autoComplete="new-password"
          hint="At least 12 characters."
          label="Create a password"
          minLength={12}
          name="password"
          required
          type="password"
        />

        {message ? <p className="text-sm text-red-600">{message}</p> : null}

        <Button className="h-11 w-full" disabled={isPending} type="submit">
          {isPending ? "Creating..." : "Create academy"}
        </Button>
      </form>

      <p className="mt-6 border-t border-[var(--border)] pt-5 text-sm text-slate-600">
        Already have an academy?{" "}
        <Link className="font-medium text-[var(--primary)] hover:underline" href="/login">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

function formString(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}
