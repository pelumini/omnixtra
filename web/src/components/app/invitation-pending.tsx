import { KeyRound } from "lucide-react";
import Link from "next/link";

import type { SessionResponse } from "@/lib/schemas";

type InvitationPendingProps = {
  session: SessionResponse;
};

export function InvitationPending({ session }: InvitationPendingProps) {
  return (
    <main className="mx-auto grid min-h-screen max-w-2xl content-center px-5 py-12">
      <section className="border border-[var(--border)] bg-white p-6 text-center">
        <div className="mx-auto grid size-11 place-items-center bg-[var(--primary)] text-white">
          <KeyRound aria-hidden="true" className="size-5" />
        </div>
        <h1 className="mt-4 text-xl font-semibold">Invitation required</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {session.user.full_name} is signed in, but this academy has not added the account yet.
        </p>
        <Link
          className="mt-5 inline-flex h-10 items-center justify-center bg-[var(--primary)] px-4 text-sm font-medium text-white hover:bg-[var(--color-primary-dark)]"
          href="/join"
        >
          Accept invitation
        </Link>
      </section>
    </main>
  );
}
