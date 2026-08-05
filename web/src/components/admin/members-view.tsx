"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import type { ReactNode } from "react";

import { DeniedState } from "@/components/app/denied-state";
import { Button } from "@/components/ui/button";
import { createInvitation } from "@/lib/api";
import { canManageMembers } from "@/lib/permissions";
import type { Membership, OrgRole } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type SeatUsage = {
  adminSeatsIncluded: number;
  adminSeatsUsed: number;
};

type MembersViewProps = {
  initialMembers: Membership[];
  initialInviteOpen?: boolean;
  initialInviteRole?: OrgRole;
  loadError: string | null;
  seats: SeatUsage;
  viewerRole: OrgRole;
};

export function MembersView({
  initialMembers,
  initialInviteOpen = false,
  initialInviteRole = "member",
  loadError,
  seats,
  viewerRole,
}: MembersViewProps) {
  const [members] = useState(initialMembers);
  const [message, setMessage] = useState(loadError);

  if (!canManageMembers(viewerRole)) {
    return (
      <DeniedState
        description="Managing members is available to organization admins. If you need access, ask an admin in your organization."
        title="This area is for admins"
      />
    );
  }

  return (
    <Shell
      action={
        <InviteControl
          initialOpen={initialInviteOpen}
          initialRole={initialInviteRole}
          onMessage={setMessage}
          seats={seats}
        />
      }
      description="People in your organization and their access."
      title="Members"
    >
      {message ? (
        <div className="mb-4 rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}
      {members.length === 0 ? <EmptyState /> : <MemberTable members={members} />}
    </Shell>
  );
}

function Shell({
  action,
  children,
  description,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  description: string;
  title: string;
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

function MemberTable({ members }: { members: Membership[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-[var(--border)] bg-[var(--background)] text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Member</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {members.map((member) => (
            <tr className="hover:bg-[var(--background)]" key={member.id}>
              <td className="px-4 py-3">
                <div className="font-medium text-[var(--foreground)]">{member.user_id}</div>
                <div className="text-xs text-slate-500">{member.id}</div>
              </td>
              <td className="px-4 py-3">
                <RoleBadge role={member.org_role} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge />
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

function StatusBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  );
}

function InviteControl({
  initialOpen = false,
  initialRole = "member",
  onMessage,
  seats,
}: {
  initialOpen?: boolean;
  initialRole?: OrgRole;
  onMessage: (message: string | null) => void;
  seats: SeatUsage;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>(initialRole);
  const [isPending, startTransition] = useTransition();

  const atAdminLimit = seats.adminSeatsUsed >= seats.adminSeatsIncluded;
  const inviteBlocked = role === "tenant_admin" && atAdminLimit;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onMessage(null);
    startTransition(async () => {
      try {
        await createInvitation({ email, org_role: role });
        onMessage("Invitation sent");
        setOpen(false);
        setEmail("");
        setRole("member");
      } catch (error) {
        onMessage(error instanceof Error ? error.message : "Could not send the invitation.");
      }
    });
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Invite member</Button>;
  }

  return (
    <form
      className="w-80 rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm"
      onSubmit={submit}
    >
      <label className="block text-xs font-medium text-slate-600">
        Email
        <input
          className="mt-1 h-10 w-full rounded-md border border-[var(--border)] px-3 text-sm font-normal focus:border-[var(--primary)] focus:outline-none"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@company.com"
          required
          type="email"
          value={email}
        />
      </label>

      <label className="mt-3 block text-xs font-medium text-slate-600">
        Role
        <select
          className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm font-normal focus:border-[var(--primary)] focus:outline-none"
          onChange={(event) => setRole(event.target.value as OrgRole)}
          value={role}
        >
          <option value="member">Member</option>
          <option value="tenant_admin">Admin</option>
        </select>
      </label>

      {inviteBlocked ? (
        <p className="mt-2 text-xs text-amber-700">
          You&apos;ve used all {seats.adminSeatsIncluded} admin seats on your plan. Upgrade
          your plan or invite this person as a member.
        </p>
      ) : null}

      <div className="mt-4 flex items-center gap-2">
        <Button disabled={isPending || inviteBlocked || email.length === 0} type="submit">
          {isPending ? "Sending..." : "Send invitation"}
        </Button>
        <button
          className="text-sm text-slate-500 hover:text-slate-700"
          onClick={() => setOpen(false)}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

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
