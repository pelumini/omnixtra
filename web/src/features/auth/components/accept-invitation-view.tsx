"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Field, FormError, SubmitButton } from "@/components/ui/form-controls";
import { acceptInvitation, type InvitationPreview } from "@/features/members";
import { resolveMessage } from "@/lib/forms/messages";
import { useFormSubmit } from "@/lib/forms/use-form-submit";
import {
  acceptInvitationSchema,
  type AcceptInvitationInput,
} from "@/lib/schemas/auth";
import { invitationTokenSchema } from "@/lib/validation/primitives";

import { AuthShell } from "./auth-shell";

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
  const {
    formState: { errors, isValid },
    handleSubmit,
    register,
    setError,
    watch,
  } = useForm<AcceptInvitationInput>({
    defaultValues: { confirmPassword: "", password: "" },
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(acceptInvitationSchema),
  });
  const { formError, isSubmitting, submit } = useFormSubmit({
    action: (input: AcceptInvitationInput) =>
      acceptInvitation({
        email: preview.email,
        password: input.password,
        token,
      }),
    errorMessage: "Invitation could not be accepted.",
    onSuccess: () => window.location.assign("/"),
    resetOnSuccess: false,
    setError,
    successMessage: "Invitation accepted.",
  });
  const fieldError = (field: keyof AcceptInvitationInput) => {
    const message = errors[field]?.message;
    if (message === "password_mismatch") {
      return "Passwords must match.";
    }
    return message ? resolveMessage(field, message) : undefined;
  };
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  return (
    <AuthShell
      subtitle={`Activating your account for ${preview.first_name} ${preview.last_name}.`}
      title={`Join ${preview.organization_name}`}
    >
      <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
        <FormError>{formError}</FormError>
        <fieldset className="space-y-4" disabled={isSubmitting}>
          <div>
            <span className="block text-xs font-medium text-slate-600">Account email</span>
            <p className="mt-1 flex h-10 items-center truncate rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-slate-700">
              {preview.email}
            </p>
          </div>
          <Field
            autoComplete="new-password"
            error={fieldError("password")}
            hint="At least 12 characters."
            label="Create a password"
            registration={register("password")}
            type="password"
          />
          <Field
            autoComplete="new-password"
            error={fieldError("confirmPassword")}
            label="Confirm password"
            registration={register("confirmPassword")}
            type="password"
          />
        </fieldset>

        <SubmitButton
          disabled={!isValid || password.length < 12 || confirmPassword !== password}
          isSubmitting={isSubmitting}
          pendingLabel="Activating..."
        >
          Activate account
        </SubmitButton>
      </form>
    </AuthShell>
  );
}

function InvalidInvitation() {
  return (
    <AuthShell
      subtitle="Ask your academy admin for a fresh invitation link."
      title="This link is no longer valid"
    >
      <p className="text-sm text-slate-600">
        The activation link may be incorrect, expired, or already used.
      </p>
    </AuthShell>
  );
}

function TokenFallback() {
  const tokenFallbackSchema = z.object({ token: invitationTokenSchema });
  type TokenFallbackInput = z.infer<typeof tokenFallbackSchema>;
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    watch,
  } = useForm<TokenFallbackInput>({
    defaultValues: { token: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(tokenFallbackSchema),
  });
  const token = watch("token");
  const tokenError = errors.token?.message
    ? resolveMessage("token", errors.token.message)
    : undefined;

  return (
    <AuthShell
      subtitle="Invitations are usually links in your email. Lost it? Enter your code below."
      title="Join an academy"
    >
      <form
        className="space-y-4"
        noValidate
        onSubmit={handleSubmit(({ token }) => {
          window.location.assign(`/join?token=${encodeURIComponent(token.trim())}`);
        })}
      >
        <fieldset disabled={isSubmitting}>
          <Field
            error={tokenError}
            label="Invitation code"
            placeholder="Paste your invitation code"
            registration={register("token")}
          />
        </fieldset>
        <SubmitButton disabled={token.trim().length === 0} isSubmitting={isSubmitting} pendingLabel="Checking...">
          Continue
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
