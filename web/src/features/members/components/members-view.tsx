"use client";

import { Filter, Mail, ShieldCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { DeniedState } from "@/components/layout/denied-state";
import { SearchInput } from "@/components/ui/input";
import { canManageMembers } from "@/lib/permissions";
import { cn } from "@/lib/utils";

import { getMemberships } from "../api";

import { ActivationSuccess, CreateUserDialog } from "./create-user-dialog";

import type { Membership } from "../schemas";
import type { OrgRole } from "@/lib/schemas/common";
import type { ReactNode } from "react";

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

const memberStatusTabs = ["all", "active", "invited"] as const;

export function MembersView({
  initialMembers,
  initialInviteOpen = false,
  initialInviteRole = "member",
  loadError,
  seats,
  viewerRole,
}: MembersViewProps) {
  const [members, setMembers] = useState(initialMembers);
  const [message, setMessage] = useState(loadError);
  const [activationLink, setActivationLink] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof memberStatusTabs)[number]>("all");
  const activeCount = members.filter((member) => member.status === "active").length;
  const invitedCount = members.filter((member) => member.status === "invited").length;
  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return members.filter((member) => {
      const matchesStatus = status === "all" || member.status === status;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        member.email.toLowerCase().includes(normalizedQuery) ||
        (member.full_name ?? "").toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [members, query, status]);

  if (!canManageMembers(viewerRole)) {
    return (
      <DeniedState
        description="Managing members is available to academy admins. If you need access, ask an admin in your academy."
        title="This area is for admins"
      />
    );
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-[104rem] content-start gap-5 px-5 py-6 lg:px-8">
      <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            label="Search members by name or email"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or email"
            value={query}
          />
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-sub-500)]">
            <Filter aria-hidden="true" className="size-4" />
            <span>{filteredMembers.length} visible</span>
          </div>
          <div className="ml-auto">
            <CreateUserDialog
              initialOpen={initialInviteOpen}
              initialRole={initialInviteRole}
              onCreated={(member, link) => {
                setMembers((current) => [...current.filter((item) => item.id !== member.id), member]);
                setActivationLink(link);
                void getMemberships()
                  .then((response) => setMembers(response.data))
                  .catch(() => undefined);
              }}
              onMessage={setMessage}
              seats={seats}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {memberStatusTabs.map((tab) => (
            <button
              className={cn(
                "h-9 rounded-md border px-3 text-sm font-semibold",
                status === tab
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--border)] bg-white text-[var(--color-text-sub-500)] hover:border-[var(--primary)] hover:text-[var(--primary)]",
              )}
              key={tab}
              onClick={() => setStatus(tab)}
              type="button"
            >
              {tab === "invited" ? "Pending" : `${tab.slice(0, 1).toUpperCase()}${tab.slice(1)}`}
            </button>
          ))}
        </div>
      </section>

      {message ? (
        <div className="rounded-md border border-[#cbd5e1] bg-white px-4 py-3 text-sm text-[#52657a]">
          {message}
        </div>
      ) : null}

      {activationLink ? (
        <ActivationSuccess activationLink={activationLink} onDismiss={() => setActivationLink(null)} />
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={<Users className="size-5" />} label="Active members" value={activeCount} />
        <SummaryCard icon={<Mail className="size-5" />} label="Pending invites" value={invitedCount} />
        <SummaryCard
          icon={<ShieldCheck className="size-5" />}
          label="Admin seats"
          value={`${seats.adminSeatsUsed}/${seats.adminSeatsIncluded}`}
        />
      </section>

      <section className="rounded-lg border border-[#cbd5e1] bg-white shadow-sm">
        <div className="border-b border-[#d6dee8] px-5 py-4">
          <h2 className="text-lg font-bold text-[#0c1726]">Directory</h2>
        </div>
        {filteredMembers.length === 0 ? <EmptyState /> : <MemberTable members={filteredMembers} />}
      </section>
    </main>
  );
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-lg border border-[#cbd5e1] bg-white p-5 shadow-sm">
      <span className="grid size-11 place-items-center rounded-md bg-[var(--color-primary-lighter)] text-[var(--primary)]">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold uppercase text-[#51647d]">{label}</span>
        <span className="mt-1 block text-2xl font-bold text-[#0c1726]">{value}</span>
      </span>
    </div>
  );
}

function MemberTable({ members }: { members: Membership[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-[#d6dee8] bg-[#f6f8fb] text-xs uppercase tracking-wide text-[#51647d]">
          <tr>
            <th className="px-5 py-3 font-semibold">Member</th>
            <th className="px-5 py-3 font-semibold">Role</th>
            <th className="px-5 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf1f5]">
          {members.map((member) => (
            <tr className="hover:bg-[#f8fbf9]" key={member.id}>
              <td className="px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[var(--color-primary-lighter)] text-sm font-bold text-[var(--primary)]">
                    {(member.full_name ?? member.email).slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-[#0c1726]">
                      {member.full_name ?? "Invited member"}
                    </span>
                    <span className="block truncate text-xs text-[#52657a]">{member.email}</span>
                  </span>
                </div>
              </td>
              <td className="px-5 py-4">
                <RoleBadge role={member.org_role} />
              </td>
              <td className="px-5 py-4">
                <StatusBadge status={member.status} />
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
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        role === "tenant_admin"
          ? "bg-[var(--color-primary-lighter)] text-[var(--primary)]"
          : "bg-slate-100 text-slate-600",
      )}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: Membership["status"] }) {
  const active = status === "active";

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#52657a]">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          active ? "bg-[var(--primary)]" : "bg-[var(--color-state-warning)]",
        )}
      />
      {active ? "Active" : "Pending"}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-md bg-[var(--color-primary-lighter)] text-[var(--primary)]">
        <Users aria-hidden="true" className="size-7" />
      </div>
      <h2 className="mt-5 text-base font-bold text-[#0c1726]">No members yet</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[#52657a]">
        Create the first user in your academy and assign their access.
      </p>
    </div>
  );
}
