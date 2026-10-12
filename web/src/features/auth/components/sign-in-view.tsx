"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FieldError, FormError, SubmitButton } from "@/components/ui/form-controls";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/api/auth";
import { resolveMessage } from "@/lib/forms/messages";
import { useFormSubmit } from "@/lib/forms/use-form-submit";
import { signInSchema, type SignInInput } from "@/lib/schemas/auth";

type SignInViewProps = {
  academyName?: string;
};

export function SignInView({ academyName }: SignInViewProps = {}) {
  const [showPassword, setShowPassword] = useState(false);
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
              <LoginField error={fieldError("email")} label="Email Address" name="email">
                <Input {...register("email")} autoComplete="email" className="text-sm" hasError={Boolean(fieldError("email"))} id="email" placeholder="Enter email" type="email" />
              </LoginField>
              <LoginField error={fieldError("password")} label="Password" name="password">
                <div className="relative">
                  <Input {...register("password")} autoComplete="current-password" className="pr-11 text-sm" hasError={Boolean(fieldError("password"))} id="password" placeholder="Enter password" type={showPassword ? "text" : "password"} />
                  <button aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-[var(--color-text-soft-400)] hover:text-[var(--foreground)]" onClick={() => setShowPassword((visible) => !visible)} type="button">
                    {showPassword ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
                  </button>
                </div>
              </LoginField>
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

function LoginField({ children, error, label, name }: { children: React.ReactNode; error?: string; label: string; name: string }) {
  return <div>
    <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]" htmlFor={name}>{label}</label>
    {children}
    {error ? <div className="mt-1"><FieldError id={`${name}-error`}>{error}</FieldError></div> : null}
  </div>;
}
