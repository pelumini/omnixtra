"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Mail, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";

import { DeniedState } from "@/components/app/denied-state";
import { Button } from "@/components/ui/button";
import { Field, FormError, SelectField, SubmitButton } from "@/components/ui/form-controls";
import { createInvitation } from "@/lib/api";
import { feedbackToast } from "@/lib/feedback/toast";
import { resolveMessage } from "@/lib/forms/messages";
import { useFormSubmit } from "@/lib/forms/use-form-submit";
import { canManageMembers } from "@/lib/permissions";
import { inviteMemberFormSchema, type InviteMemberFormInput } from "@/lib/schemas/admin-forms";
import type { Membership, OrgRole } from "@/lib/schemas";
import { appBaseDomain, tenantSlugFromHost } from "@/lib/tenant-host";
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
  const [members, setMembers] = useState(initialMembers);
  const [message, setMessage] = useState(loadError);
  const activeCount = members.filter((member) => member.status === "active").length;
  const invitedCount = members.filter((member) => member.status === "invited").length;

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
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#116149]">
            Access management
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#0c1726]">Members</h1>
          <p className="mt-2 text-sm text-[#52657a]">People in your academy and their access.</p>
        </div>
        <InviteControl
          initialOpen={initialInviteOpen}
          initialRole={initialInviteRole}
          onInvite={(member) => setMembers((current) => [...current, member])}
          onMessage={setMessage}
          seats={seats}
        />
      </header>

      {message ? (
        <div className="rounded-md border border-[#cbd5e1] bg-white px-4 py-3 text-sm text-[#52657a]">
          {message}
        </div>
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
        {members.length === 0 ? <EmptyState /> : <MemberTable members={members} />}
      </section>
    </main>
  );
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-lg border border-[#cbd5e1] bg-white p-5 shadow-sm">
      <span className="grid size-11 place-items-center rounded-md bg-[#e8f5ef] text-[#116149]">
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
            <th className="px-5 py-3 font-semibold">Invitation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf1f5]">
          {members.map((member) => (
            <tr className="hover:bg-[#f8fbf9]" key={member.id}>
              <td className="px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[#e8f5ef] text-sm font-bold text-[#116149]">
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
              <td className="px-5 py-4">
                <CopyInviteLink member={member} />
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
          ? "bg-[#e8f5ef] text-[#116149]"
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
      <span className={cn("h-2 w-2 rounded-full", active ? "bg-[#116149]" : "bg-[#e4b622]")} />
      {active ? "Active" : "Invited"}
    </span>
  );
}

function CopyInviteLink({ member }: { member: Membership }) {
  if (member.status !== "invited" || member.invitation_token === null) {
    return <span className="text-xs text-[#94a3b8]">-</span>;
  }

  return (
    <button
      className="inline-flex items-center gap-2 text-sm font-semibold text-[#116149] hover:underline"
      onClick={async () => {
        await navigator.clipboard.writeText(invitationLink(member.invitation_token ?? ""));
        feedbackToast.success("Invite link copied");
      }}
      type="button"
    >
      <Copy aria-hidden="true" className="size-4" />
      Copy invite link
    </button>
  );
}

function invitationLink(token: string) {
  const slug = tenantSlugFromHost(window.location.host);
  const subdomain = slug ?? "your-academy";
  const port = window.location.port ? `:${window.location.port}` : "";
  return `${window.location.protocol}//${subdomain}.${appBaseDomain()}${port}/join?token=${encodeURIComponent(token)}`;
}

function InviteControl({
  initialOpen = false,
  initialRole = "member",
  onInvite,
  onMessage,
  seats,
}: {
  initialOpen?: boolean;
  initialRole?: OrgRole;
  onInvite: (member: Membership) => void;
  onMessage: (message: string | null) => void;
  seats: SeatUsage;
}) {
  const [open, setOpen] = useState(initialOpen);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
    watch,
  } = useForm<InviteMemberFormInput>({
    defaultValues: { email: "", orgRole: initialRole },
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(inviteMemberFormSchema),
  });
  const email = watch("email");
  const role = watch("orgRole");

  const atAdminLimit = seats.adminSeatsUsed >= seats.adminSeatsIncluded;
  const inviteBlocked = role === "tenant_admin" && atAdminLimit;
  const { formError, isSubmitting, submit } = useFormSubmit({
    action: (input: InviteMemberFormInput) =>
      createInvitation({ email: input.email, org_role: input.orgRole }),
    errorMessage: "Invitation could not be sent.",
    onSuccess: (result) => {
      const invitation = result.data;
      if (
        invitation.invitation_id !== null &&
        invitation.email !== null &&
        invitation.org_role !== null &&
        invitation.status !== null
      ) {
        onInvite({
          email: invitation.email,
          full_name: null,
          id: invitation.invitation_id,
          invitation_token: invitation.token,
          org_role: invitation.org_role,
          status: invitation.status,
          user_id: null,
        });
      }
      onMessage("Invitation sent");
      setOpen(false);
      reset({ email: "", orgRole: "member" });
    },
    setError,
    successMessage: "Invitation sent.",
  });
  const fieldError = (field: keyof InviteMemberFormInput) => {
    const message = errors[field]?.message;
    return message ? resolveMessage(field, message) : undefined;
  };

  if (!open) {
    return (
      <Button className="gap-2" onClick={() => setOpen(true)}>
        <UserPlus aria-hidden="true" className="size-4" />
        Invite member
      </Button>
    );
  }

  return (
    <form
      className="w-full rounded-lg border border-[#cbd5e1] bg-white p-4 shadow-sm sm:w-96"
      noValidate
      onSubmit={handleSubmit((input) => {
        onMessage(null);
        return submit(input);
      })}
    >
      <div className="mb-4">
        <h2 className="text-base font-bold text-[#0c1726]">Invite member</h2>
        <p className="mt-1 text-sm text-[#52657a]">Send an invitation and assign org access.</p>
      </div>
      <FormError>{formError}</FormError>
      <fieldset className="grid gap-3" disabled={isSubmitting}>
        <Field
          error={fieldError("email")}
          label="Email"
          placeholder="name@company.com"
          registration={register("email")}
          type="email"
        />
        <SelectField error={fieldError("orgRole")} label="Role" registration={register("orgRole")}>
          <option value="member">Member</option>
          <option value="tenant_admin">Admin</option>
        </SelectField>
      </fieldset>

      {inviteBlocked ? (
        <p className="mt-2 text-xs text-amber-700">
          You&apos;ve used all {seats.adminSeatsIncluded} admin seats on your plan. Upgrade
          your plan or invite this person as a member.
        </p>
      ) : null}

      <div className="mt-4 flex items-center gap-2">
        <SubmitButton
          className="w-auto"
          disabled={inviteBlocked || email.trim().length === 0}
          isSubmitting={isSubmitting}
          pendingLabel="Sending..."
        >
          Send invitation
        </SubmitButton>
        <button
          className="rounded-md px-3 py-2 text-sm text-[#52657a] hover:bg-[#f3f6f9] hover:text-[#0c1726]"
          onClick={() => {
            setOpen(false);
            reset({ email: "", orgRole: "member" });
          }}
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
    <div className="px-6 py-16 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-md bg-[#e8f5ef] text-[#116149]">
        <Users aria-hidden="true" className="size-7" />
      </div>
      <h2 className="mt-5 text-base font-bold text-[#0c1726]">No members yet</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[#52657a]">
        Invite the first person to your academy, then copy their invitation link to share it.
      </p>
    </div>
  );
}
