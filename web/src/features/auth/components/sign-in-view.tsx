"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { Field, FormError, SubmitButton } from "@/components/ui/form-controls";
import { login } from "@/lib/api/auth";
import { resolveMessage } from "@/lib/forms/messages";
import { useFormSubmit } from "@/lib/forms/use-form-submit";
import { signInSchema, type SignInInput } from "@/lib/schemas/auth";

type SignInViewProps = {
  academyName?: string;
};

export function SignInView({ academyName }: SignInViewProps = {}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
    watch,
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
  const [email, password] = watch(["email", "password"]);

  return (
    <main className="grid min-h-[100dvh] bg-white lg:h-[100dvh] lg:min-h-0 lg:grid-cols-[minmax(0,3fr)_minmax(25rem,2fr)] lg:overflow-hidden">
      <section className="relative flex min-h-[100dvh] items-center justify-center px-6 py-24 sm:px-10 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:px-16">
        <div className="w-full max-w-[25rem]">
          <h1 className="text-[2rem] font-bold leading-tight text-[var(--foreground)]">{academyName ? `Sign in to ${academyName}` : "Sign in to OmniXtra"}</h1>
          <p className="mt-2 text-sm font-medium text-[var(--color-text-sub-500)]">To continue your academy</p>

          <form className="mt-10 space-y-5" noValidate onSubmit={handleSubmit(submit)}>
            <fieldset className="space-y-5" disabled={isSubmitting}>
              <Field autoComplete="email" error={fieldError("email")} label="Email Address" placeholder="Enter email" registration={register("email")} type="email" />
              <Field autoComplete="current-password" error={fieldError("password")} label="Password" placeholder="Enter password" registration={register("password")} type="password" />
            </fieldset>

            <Link className="inline-block text-sm font-medium text-[var(--color-text-sub-500)] hover:text-[var(--primary)]" href="/forgot-password">Forgot Password?</Link>
            <FormError>{formError}</FormError>
            <SubmitButton className="h-12 rounded-full text-sm font-semibold" disabled={!email.trim() || !password} isSubmitting={isSubmitting} pendingLabel="Signing in...">Sign In</SubmitButton>
          </form>
        </div>
      </section>
      <div className="relative hidden h-full overflow-hidden lg:block">
        <Image alt="" className="object-cover" fill priority sizes="40vw" src="/images/auth/login-img.png" />
        <Image alt="" aria-hidden="true" className="z-10 object-contain object-bottom" fill priority sizes="40vw" src="/images/auth/astronaut.png" />
      </div>
    </main>
  );
}
