"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, UserPlus } from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, FormError, SelectField, SubmitButton } from "@/components/ui/form-controls";
import { feedbackToast } from "@/lib/feedback/toast";
import { resolveMessage } from "@/lib/forms/messages";
import { useFormSubmit } from "@/lib/forms/use-form-submit";

import { createUser } from "../api";
import { createUserFormSchema, type CreateUserFormInput, type Membership } from "../schemas";

import type { OrgRole } from "@/lib/schemas/common";

type CreateUserDialogProps = {
  initialOpen?: boolean;
  initialRole?: OrgRole;
  onCreated: (member: Membership, activationLink: string) => void;
  onMessage: (message: string | null) => void;
  seats: { adminSeatsIncluded: number; adminSeatsUsed: number };
};

const emptyMemberForm = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  orgRole: "member" as const,
};

export function CreateUserDialog({
  initialOpen = false,
  initialRole = "member",
  onCreated,
  onMessage,
  seats,
}: CreateUserDialogProps) {
  const [open, setOpen] = useState(initialOpen);
  const closeDialog = useCallback(() => setOpen(false), []);
  const {
    formState: { errors, isValid },
    handleSubmit,
    register,
    reset,
    setError,
    watch,
  } = useForm<CreateUserFormInput>({
    defaultValues: { ...emptyMemberForm, orgRole: initialRole },
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(createUserFormSchema),
  });
  const createBlocked =
    watch("orgRole") === "tenant_admin" && seats.adminSeatsUsed >= seats.adminSeatsIncluded;
  const { formError, isSubmitting, submit } = useFormSubmit({
    action: (input: CreateUserFormInput) => createUser(input),
    errorMessage: "User could not be created.",
    onSuccess: (result) => {
      const user = result.data;
      onCreated(
        {
          email: user.email,
          full_name: `${user.first_name} ${user.last_name}`,
          id: user.id,
          invitation_token: null,
          org_role: user.org_role,
          status: user.status,
          user_id: user.id,
        },
        user.activation_link,
      );
      onMessage(null);
      setOpen(false);
      reset(emptyMemberForm);
    },
    setError,
    successMessage: "User created and activation email sent.",
  });
  const fieldError = (field: keyof CreateUserFormInput) => {
    const message = errors[field]?.message;
    return message ? resolveMessage(field, message) : undefined;
  };

  return (
    <>
      <Button className="gap-2" onClick={() => setOpen(true)}>
        <UserPlus aria-hidden="true" />
        Create user
      </Button>
      <Dialog
        description="Add their details and assign academy access. We will email them an activation link."
        onClose={closeDialog}
        open={open}
        title="Create user"
      >
        <form
          noValidate
          onSubmit={handleSubmit((input) => {
            onMessage(null);
            return submit(input);
          })}
        >
          <FormError>{formError}</FormError>
          <fieldset className="mt-4 grid gap-3" disabled={isSubmitting}>
            <Field error={fieldError("email")} label="Email" placeholder="name@company.com" registration={register("email")} type="email" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field autoComplete="given-name" error={fieldError("firstName")} label="First name" registration={register("firstName")} />
              <Field autoComplete="family-name" error={fieldError("lastName")} label="Last name" registration={register("lastName")} />
            </div>
            <Field autoComplete="tel" error={fieldError("phone")} label="Phone" registration={register("phone")} type="tel" />
            <SelectField error={fieldError("orgRole")} label="Role" registration={register("orgRole")}>
              <option value="member">Member</option>
              <option value="tenant_admin">Admin</option>
            </SelectField>
          </fieldset>
          {createBlocked ? (
            <p className="mt-2 text-xs text-amber-700">
              You&apos;ve used all {seats.adminSeatsIncluded} admin seats on your plan. Upgrade your plan or create this person as a member.
            </p>
          ) : null}
          <div className="mt-5 flex items-center justify-end gap-2">
            <Button onClick={() => { closeDialog(); reset(emptyMemberForm); }} variant="secondary">Cancel</Button>
            <SubmitButton className="w-auto" disabled={createBlocked || !isValid} isSubmitting={isSubmitting} pendingLabel="Creating...">Create user</SubmitButton>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function ActivationSuccess({ activationLink, onDismiss }: { activationLink: string; onDismiss: () => void }) {
  return (
    <section className="rounded-lg border border-[var(--color-stroke-soft-200)] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-bold text-[var(--color-text-main-900)]">Activation email sent</h2>
          <p className="mt-1 text-sm text-[var(--color-text-sub-500)]">The user should activate from their email. Keep this one-time link only as a fallback.</p>
        </div>
        <Button onClick={onDismiss} size="small" variant="secondary">Dismiss</Button>
      </div>
      <div className="mt-4 flex min-w-0 items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-md bg-[var(--color-bg-weak-100)] px-3 py-2 text-xs text-[var(--color-text-sub-500)]">{activationLink}</code>
        <Button aria-label="Copy activation link" iconOnly onClick={async () => { await navigator.clipboard.writeText(activationLink); feedbackToast.success("Activation link copied"); }} size="small" variant="secondary">
          <Copy aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
