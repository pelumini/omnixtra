import Link from "next/link";

import { appBaseDomain } from "@/lib/tenant-host";

import { AuthShell } from "./auth-shell";

export function BareHostLoginView() {
  const exampleHost =
    appBaseDomain() === "localhost"
      ? "your-academy.localhost:3001"
      : `your-academy.${appBaseDomain()}`;

  return (
    <AuthShell
      subtitle="Sign in from your academy's own address."
      title="Open your academy"
    >
      <div className="space-y-5 text-sm leading-6 text-slate-600">
        <p>
          OmniXtra accounts are scoped to an academy. Open your academy URL, then sign in
          there.
        </p>
        <div className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-xs text-[var(--foreground)]">
          {exampleHost}/login
        </div>
        <div className="space-y-2 border-t border-[var(--border)] pt-5">
          <p>
            Starting a new academy?{" "}
            <Link className="font-medium text-[var(--primary)] hover:underline" href="/get-started">
              Create an academy
            </Link>
          </p>
          <p>
            Joining with an invite?{" "}
            <Link className="font-medium text-[var(--primary)] hover:underline" href="/join">
              Use your invitation
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
