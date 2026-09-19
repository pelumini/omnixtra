"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { Field, FormError, SubmitButton } from "@/components/ui/form-controls";
import { login } from "@/lib/api";
import { resolveMessage } from "@/lib/forms/messages";
import { useFormSubmit } from "@/lib/forms/use-form-submit";
import { signInSchema, type SignInInput } from "@/lib/schemas/auth";
import { AuthShell } from "./auth-shell";

type SignInViewProps = {
  academyName?: string;
};

export function SignInView({ academyName }: SignInViewProps = {}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<SignInInput>({
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(signInSchema),
  });
  const { formError, isSubmitting, submit } = useFormSubmit({
    action: login,
    errorMessage: "Sign in failed.",
    onSuccess: () => window.location.assign("/"),
    resetOnSuccess: false,
    setError,
    successMessage: "Signed in.",
  });
  const fieldError = (field: keyof SignInInput) => {
    const message = errors[field]?.message;
    return message ? resolveMessage(field, message) : undefined;
  };

  return (
    <AuthShell
      title={academyName ? `Sign in to ${academyName}` : "Sign in"}
      subtitle="Continue to your academy."
    >
      <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
        <FormError>{formError}</FormError>
        <fieldset className="space-y-4" disabled={isSubmitting}>
          <Field
            autoComplete="email"
            error={fieldError("email")}
            label="Email"
            placeholder="you@company.com"
            registration={register("email")}
            type="email"
          />
          <Field
            autoComplete="current-password"
            error={fieldError("password")}
            label="Password"
            registration={register("password")}
            type="password"
          />
        </fieldset>

        <SubmitButton isSubmitting={isSubmitting} pendingLabel="Signing in...">
          Sign in
        </SubmitButton>
      </form>

      <div className="mt-6 space-y-2 border-t border-[var(--border)] pt-5 text-sm text-slate-600">
        <p>
          New to OmniXtra?{" "}
          <Link className="font-medium text-[var(--primary)] hover:underline" href="/get-started">
            Create an academy
          </Link>
        </p>
        <p>
          Have an invitation?{" "}
          <Link className="font-medium text-[var(--primary)] hover:underline" href="/join">
            Join an existing one
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
