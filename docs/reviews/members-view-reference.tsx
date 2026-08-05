/**
 * REFERENCE COMPONENT — Tenant Admin: Member Management
 * ------------------------------------------------------
 * This is the canonical pattern the frontend redesign should match. It is NOT
 * meant to be dropped in unchanged — it demonstrates the app-shell slot, the
 * list + empty-state pattern, the role-gated action pattern, and the denied
 * state, all using the repo's existing tokens (--primary #116149) and the
 * shadcn-style Button + cn() utility already in src/.
 *
 * Copy the PATTERNS, not the literal data. Wire to the real API client
 * (src/lib/api.ts) and the real membership/invitation endpoints.
 *
 * Permission behaviour demonstrated:
 *  - Only a tenant_admin membership reaches this screen (see AdminOnly guard).
 *  - A non-admin who navigates here directly gets the Denied state, never a
 *    blank page and never the underlying data.
 *  - The "Invite member" action is disabled (not hidden) when the tenant is at
 *    its admin-seat limit, with legible feedback — matching the backend rule.
 */

"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---- Types (mirror the backend envelope; real ones come from src/lib/schemas) ----

type OrgRole = "tenant_admin" | "member";

type Member = {
  id: string;
  fullName: string;
  email: string;
  orgRole: OrgRole;
  status: "active" | "invited";
};

type SeatUsage = {
  adminSeatsUsed: number;
  adminSeatsIncluded: number;
};

// ---- The screen ----

type MembersViewProps = {
  /** The viewer's own org role, derived from their membership after login. */
  viewerRole: OrgRole;
  members: Member[];
  seats: SeatUsage;
  onInvite: (email: string, role: OrgRole) => Promise<void>;
};

export function MembersView({ viewerRole, members, seats, onInvite }: MembersViewProps) {
  // Permission gate FIRST. The UI must never render admin data or controls to a
  // non-admin, even though the backend would also reject the mutation. This is
  // the "UI never grants what the backend denies" property, enforced client-side
  // as defense-in-depth and as honest UX.
  if (viewerRole !== "tenant_admin") {
    return <DeniedState />;
  }

  return (
    <Shell
      title="Members"
      description="People in your organization and their access."
      action={<InviteControl seats={seats} onInvite={onInvite} />}
    >
      {members.length === 0 ? (
        <EmptyState />
      ) : (
        <MemberTable members={members} />
      )}
    </Shell>
  );
}

// ---- App-shell slot ----
// The redesign's real shell (nav, tenant switcher, sign-out) wraps this; here we
// show only the page-level frame so the pattern is legible in isolation.

function Shell({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

// ---- List + row pattern ----

function MemberTable({ members }: { members: Member[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-[var(--border)] bg-[var(--background)] text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {members.map((m) => (
            <tr key={m.id} className="hover:bg-[var(--background)]">
              <td className="px-4 py-3 font-medium text-[var(--foreground)]">{m.fullName}</td>
              <td className="px-4 py-3 text-slate-600">{m.email}</td>
              <td className="px-4 py-3">
                <RoleBadge role={m.orgRole} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={m.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoleBadge({ role }: { role: OrgRole }) {
  const label = role === "tenant_admin" ? "Admin" : "Member";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        role === "tenant_admin"
          ? "bg-[var(--primary)]/10 text-[var(--primary)]"
          : "bg-slate-100 text-slate-600",
      )}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: Member["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs",
        status === "active" ? "text-slate-600" : "text-amber-600",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "active" ? "bg-emerald-500" : "bg-amber-500",
        )}
      />
      {status === "active" ? "Active" : "Invited"}
    </span>
  );
}

// ---- Role-gated + seat-limited action ----

function InviteControl({
  seats,
  onInvite,
}: {
  seats: SeatUsage;
  onInvite: (email: string, role: OrgRole) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("member");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const atAdminLimit = seats.adminSeatsUsed >= seats.adminSeatsIncluded;
  // Inviting a *member* is always allowed; inviting an *admin* is blocked at the
  // seat limit. The control communicates the limit rather than failing silently.
  const inviteBlocked = role === "tenant_admin" && atAdminLimit;

  async function submit() {
    setError(null);
    setPending(true);
    try {
      await onInvite(email, role);
      setOpen(false);
      setEmail("");
      setRole("member");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the invitation.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Invite member</Button>;
  }

  return (
    <div className="w-80 rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <label className="block text-xs font-medium text-slate-600">Email</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="name@company.com"
        className="mt-1 h-10 w-full rounded-md border border-[var(--border)] px-3 text-sm focus:border-[var(--primary)] focus:outline-none"
      />

      <label className="mt-3 block text-xs font-medium text-slate-600">Role</label>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as OrgRole)}
        className="mt-1 h-10 w-full rounded-md border border-[var(--border)] px-3 text-sm focus:border-[var(--primary)] focus:outline-none"
      >
        <option value="member">Member</option>
        <option value="tenant_admin">Admin</option>
      </select>

      {/* Seat-limit feedback: legible, specific, actionable — not a silent block. */}
      {inviteBlocked && (
        <p className="mt-2 text-xs text-amber-700">
          You&apos;ve used all {seats.adminSeatsIncluded} admin seats on your plan. Upgrade
          your plan or invite this person as a member.
        </p>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-4 flex items-center gap-2">
        <Button onClick={submit} disabled={pending || inviteBlocked || email.length === 0}>
          {pending ? "Sending…" : "Send invitation"}
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---- Empty and denied states ----

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] bg-white px-6 py-16 text-center">
      <h2 className="text-sm font-semibold text-[var(--foreground)]">No members yet</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        Invite the first person to your organization. They&apos;ll get an email link to set a
        password and join.
      </p>
    </div>
  );
}

function DeniedState() {
  // No org data, no controls, no confirmation the member list exists. A member
  // who reaches this route sees only that it isn't theirs to use.
  return (
    <section className="mx-auto w-full max-w-md px-6 py-24 text-center">
      <h1 className="text-lg font-semibold text-[var(--foreground)]">
        This area is for admins
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Managing members is available to organization admins. If you need access, ask an
        admin in your organization.
      </p>
    </section>
  );
}
