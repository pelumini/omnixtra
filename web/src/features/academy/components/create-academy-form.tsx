"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FieldError, FormError, SubmitButton } from "@/components/ui/form-controls";
import { resolveMessage } from "@/lib/forms/messages";
import { useFormSubmit } from "@/lib/forms/use-form-submit";
import { createAcademySchema, type CreateAcademyInput } from "@/lib/schemas/auth";

import type { FormEvent, ReactNode } from "react";

type CreateAcademyFormProps = {
  action: (input: CreateAcademyInput) => Promise<{ accessToken: string; subdomain: string }>;
  initialStep?: 1 | 2;
  onSuccess: (result: { accessToken: string; subdomain: string }) => void | Promise<void>;
};

const personalFields: Array<keyof CreateAcademyInput> = ["firstName", "lastName", "phone", "email", "password"];
const inputClass = "h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[#868c98] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15";

export function CreateAcademyForm({ action, initialStep = 1, onSuccess }: CreateAcademyFormProps) {
  const [step, setStep] = useState<1 | 2>(initialStep);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { formState: { errors }, handleSubmit, register, setError, trigger, watch } = useForm<CreateAcademyInput>({
    defaultValues: { academyName: "", email: "", firstName: "", lastName: "", password: "", phone: "", subdomain: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(createAcademySchema),
  });
  const { formError, isSubmitting, submit } = useFormSubmit({ action, errorMessage: "Academy could not be created.", onSuccess, resetOnSuccess: false, setError, successMessage: "Academy created." });
  const password = watch("password");
  const subdomain = watch("subdomain");
  const fieldError = (field: keyof CreateAcademyInput) => {
    const message = errors[field]?.message;
    return message ? resolveMessage(field, message) : undefined;
  };

  async function continueToAcademy() {
    if (await trigger(personalFields)) setStep(2);
  }

  const onFormSubmit = step === 1
    ? (event: FormEvent) => {
        event.preventDefault();
        void continueToAcademy();
      }
    : handleSubmit(submit);

  return <form className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,3fr)_minmax(25rem,2fr)]" noValidate onSubmit={onFormSubmit}>
    <section className="relative flex min-h-screen items-center justify-center px-6 py-16 sm:px-10 lg:px-16">
      {step === 2 ? <button className="absolute left-6 top-8 text-sm font-medium text-[var(--color-text-sub-500)] hover:text-[var(--primary)] sm:left-10 lg:left-16" onClick={() => setStep(1)} type="button">Changed your mind? <span className="font-semibold text-[#ac3d8c]">Go Back</span></button> : null}
      <div className="w-full max-w-[31rem]">
        <h1 className="text-[2rem] font-bold leading-tight text-[var(--foreground)]">Set up your academy space.</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-sub-500)]">Name your academy, choose its address and create your academy admin account. You&apos;ll go straight into your admin area when it&apos;s ready.</p>
        <div className="mt-8 flex items-center justify-between gap-4 border-b border-[var(--border)] pb-4"><span className="text-xs font-semibold tracking-wide text-[var(--color-text-sub-500)]">STEP {step} OF 2</span><span className="rounded-full bg-[#faedf6] px-4 py-2 text-xs font-bold tracking-wide text-[#ac3d8c]">{step === 1 ? "PERSONAL DETAILS" : "ACADEMY DETAILS"}</span></div>
        <div className="mt-4"><FormError>{formError}</FormError></div>
        {step === 1 ? <fieldset className="mt-6 space-y-4" disabled={isSubmitting}>
          <div className="grid gap-4 sm:grid-cols-2"><WizardField error={fieldError("firstName")} label="First Name" name="firstName"><input {...register("firstName")} autoComplete="given-name" className={inputClass} id="firstName" placeholder="Enter first name" /></WizardField><WizardField error={fieldError("lastName")} label="Last Name" name="lastName"><input {...register("lastName")} autoComplete="family-name" className={inputClass} id="lastName" placeholder="Enter last name" /></WizardField></div>
          <WizardField error={fieldError("phone")} label="Phone" name="phone"><input {...register("phone")} autoComplete="tel" className={inputClass} id="phone" placeholder="Enter phone number" type="tel" /></WizardField>
          <WizardField error={fieldError("email")} label="Email Address" name="email"><input {...register("email")} autoComplete="email" className={inputClass} id="email" placeholder="Enter email" type="email" /></WizardField>
          <WizardField error={fieldError("password")} label="Password" name="password"><div className="relative"><input {...register("password")} autoComplete="new-password" className={`${inputClass} pr-11`} id="password" placeholder="Create a password" type={showPassword ? "text" : "password"} /><button aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-[var(--color-text-soft-400)]" onClick={() => setShowPassword((value) => !value)} type="button">{showPassword ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}</button></div><PasswordStrength password={password} /></WizardField>
          <button className="mt-2 h-12 w-full rounded-full bg-[var(--primary)] text-sm font-semibold text-white" onClick={() => void continueToAcademy()} type="button">Continue</button>
        </fieldset> : <fieldset className="mt-6 space-y-5" disabled={isSubmitting}>
          <WizardField error={fieldError("academyName")} label="Academy Name" name="academyName"><input {...register("academyName")} className={inputClass} id="academyName" placeholder="Enter academy name" /></WizardField>
          <WizardField error={fieldError("subdomain")} label="Subdomain" name="subdomain"><div className="flex h-10 rounded-lg border border-[var(--border)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/15"><input {...register("subdomain", { setValueAs: (value: unknown) => typeof value === "string" ? value.toLowerCase().replace(/[^a-z0-9-]/g, "") : value })} className="min-w-0 flex-1 rounded-l-lg px-3 text-sm outline-none" id="subdomain" placeholder="your-academy" /><span className="flex items-center rounded-r-lg border-l border-[var(--border)] bg-[var(--color-bg-weak-100)] px-3 text-xs text-[var(--color-text-sub-500)]">.omnixtra.app</span></div>{!errors.subdomain ? <p className="mt-1 text-xs text-[var(--color-text-sub-500)]">Your academy will live at {subdomain || "your-academy"}.omnixtra.app</p> : null}</WizardField>
          <label className="flex items-start gap-3 text-sm leading-5 text-[var(--color-text-sub-500)]"><input checked={acceptedTerms} className="mt-1 size-4 accent-[var(--primary)]" onChange={(event) => setAcceptedTerms(event.target.checked)} type="checkbox" /><span>I accept the <Link className="font-semibold text-[var(--primary)] hover:underline" href="/terms">Terms &amp; Conditions</Link> and <Link className="font-semibold text-[var(--primary)] hover:underline" href="/privacy">Privacy Policy</Link>.</span></label>
          <SubmitButton className="h-12 rounded-full text-sm font-semibold" disabled={!acceptedTerms} isSubmitting={isSubmitting} pendingLabel="Creating academy...">Create Academy</SubmitButton>
        </fieldset>}
      </div>
    </section>
    <div className="relative hidden min-h-screen overflow-hidden lg:block"><Image alt="" className="object-cover" fill priority sizes="40vw" src="/images/auth/login-img.png" /></div>
  </form>;
}

function WizardField({ children, error, label, name }: { children: ReactNode; error?: string; label: string; name: string }) {
  return <div><label className="mb-2 block text-sm font-semibold text-[var(--foreground)]" htmlFor={name}>{label}</label>{children}{error ? <div className="mt-1"><FieldError>{error}</FieldError></div> : null}</div>;
}

function PasswordStrength({ password }: { password: string }) {
  const variety = [/[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(password)).length;
  const level = password.length >= 12 && variety >= 3 ? 3 : password.length >= 8 && variety >= 2 ? 2 : password ? 1 : 0;
  const tone = level === 3 ? "bg-emerald-500" : level === 2 ? "bg-amber-400" : "bg-rose-400";
  return <div className="mt-3"><div className="grid grid-cols-3 gap-2">{[1, 2, 3].map((bar) => <span className={`h-1 rounded-full ${bar <= level ? tone : "bg-[var(--border)]"}`} key={bar} />)}</div><ul className="mt-2 space-y-1 text-xs text-[var(--color-text-sub-500)]"><li>At least 12 characters</li><li>Strength booster: mix uppercase and lowercase letters</li><li>Strength booster: add a number or symbol</li></ul></div>;
}
