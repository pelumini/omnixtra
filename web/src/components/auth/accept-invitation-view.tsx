"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { acceptInvitation } from "@/lib/api";
import type { InvitationPreview } from "@/lib/schemas";
import { AuthShell, Field } from "./auth-shell";

type AcceptInvitationViewProps = {
  preview: InvitationPreview | null;
  token: string | null;
};

export function AcceptInvitationView({ preview, token }: AcceptInvitationViewProps) {
  if (!token) {
    return <TokenFallback />;
  }
  if (!preview) {
    return <InvalidInvitation />;
  }
  return <AcceptForm preview={preview} token={token} />;
}

function AcceptForm({ preview, token }: { preview: InvitationPreview; token: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        await acceptInvitation({
          email: preview.email,
          full_name: formString(form, "full_name"),
          password: formString(form, "password"),
          token,
        });
        window.location.assign("/");
      } catch {
        setMessage("This invitation cannot be accepted. It may have expired; ask for a new one.");
      }
    });
  }

  return (
    <AuthShell
      subtitle={`You have been invited to join ${preview.organization_name}.`}
      title={`Join ${preview.organization_name}`}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <span className="block text-xs font-medium text-slate-600">Invited email</span>
          <p className="mt-1 flex h-10 items-center truncate rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-slate-700">
            {preview.email}
          </p>
        </div>
        <Field autoComplete="name" label="Full name" name="full_name" required />
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
          {isPending ? "Joining..." : "Accept invitation and join"}
        </Button>
      </form>
    </AuthShell>
  );
}

function InvalidInvitation() {
  return (
    <AuthShell
      subtitle="Ask your academy admin for a fresh invitation link."
      title="This invitation is not valid"
    >
      <p className="text-sm text-slate-600">
        The invitation link cannot be used. It may be incorrect or no longer active.
      </p>
    </AuthShell>
  );
}

function TokenFallback() {
  const [token, setToken] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedToken = token.trim();
    if (normalizedToken) {
      window.location.assign(`/join?token=${encodeURIComponent(normalizedToken)}`);
    }
  }

  return (
    <AuthShell
      subtitle="Invitations are usually links in your email. Lost it? Enter your code below."
      title="Join an academy"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field
          label="Invitation code"
          name="token"
          onChange={setToken}
          placeholder="Paste your invitation code"
          required
          value={token}
        />
        <Button className="h-11 w-full" disabled={token.trim().length === 0} type="submit">
          Continue
        </Button>
      </form>
    </AuthShell>
  );
}

function formString(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}
