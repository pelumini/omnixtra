"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Eye, EyeOff, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormError, SubmitButton } from "@/components/ui/form-controls";
import { Input, controlSurface } from "@/components/ui/input";
import { resolveMessage } from "@/lib/forms/messages";
import { useFormSubmit } from "@/lib/forms/use-form-submit";
import { createAcademySchema, type CreateAcademyInput } from "@/lib/schemas/auth";
import { cn } from "@/lib/utils";

import type { FormEvent, ReactNode } from "react";

type CreateAcademyFormProps = {
  action: (input: CreateAcademyInput) => Promise<{ accessToken: string; subdomain: string }>;
  initialStep?: 1 | 2;
  onSuccess: (result: { accessToken: string; subdomain: string }) => void | Promise<void>;
};

const personalFields: Array<keyof CreateAcademyInput> = ["firstName", "lastName", "phone", "email", "password"];
const inputClass = "text-sm lg:h-9 lg:text-xs";

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
    <section className="relative flex min-h-screen items-center justify-center px-6 py-5 sm:px-10 lg:px-16 lg:py-4">
      {step === 2 ? <button className="absolute left-6 top-8 text-sm font-medium text-[var(--color-text-sub-500)] hover:text-[var(--primary)] sm:left-10 lg:left-16" onClick={() => setStep(1)} type="button">Changed your mind? <span className="font-semibold text-[#ac3d8c]">Go Back</span></button> : null}
      <div className="w-full max-w-[27rem]">
        <h1 className="text-[1.75rem] font-bold leading-tight text-[var(--foreground)]">Set up your academy space.</h1>
        <p className="mt-1.5 text-xs leading-5 text-[var(--color-text-sub-500)]">Name your academy, choose its address and create your academy admin account. You&apos;ll go straight into your admin area when it&apos;s ready.</p>
        <div className="mt-4 flex items-center justify-between gap-3 border-b border-[var(--border)] pb-2"><span className="text-[10px] font-semibold tracking-wide text-[var(--color-text-sub-500)]">STEP {step} OF 2</span><span className="rounded-full bg-[#faedf6] px-3 py-1.5 text-[10px] font-bold tracking-wide text-[#ac3d8c]">{step === 1 ? "PERSONAL DETAILS" : "ACADEMY DETAILS"}</span></div>
        {formError ? <div className="mt-2"><FormError>{formError}</FormError></div> : null}
        {step === 1 ? <fieldset className="mt-3 space-y-2" disabled={isSubmitting}>
          <div className="grid gap-3 sm:grid-cols-2"><WizardField error={fieldError("firstName")} label="First Name" name="firstName"><Input {...register("firstName")} autoComplete="given-name" className={inputClass} hasError={Boolean(fieldError("firstName"))} id="firstName" placeholder="Enter first name" /></WizardField><WizardField error={fieldError("lastName")} label="Last Name" name="lastName"><Input {...register("lastName")} autoComplete="family-name" className={inputClass} hasError={Boolean(fieldError("lastName"))} id="lastName" placeholder="Enter last name" /></WizardField></div>
          <WizardField error={fieldError("phone")} label="Phone" name="phone"><Input {...register("phone")} autoComplete="tel" className={inputClass} hasError={Boolean(fieldError("phone"))} id="phone" placeholder="Enter phone number" type="tel" /></WizardField>
          <WizardField error={fieldError("email")} label="Email Address" name="email"><Input {...register("email")} autoComplete="email" className={inputClass} hasError={Boolean(fieldError("email"))} id="email" placeholder="Enter email" type="email" /></WizardField>
          <WizardField error={fieldError("password")} label="Password" name="password"><div className="relative"><Input {...register("password")} autoComplete="new-password" className={`${inputClass} pr-11`} hasError={Boolean(fieldError("password"))} id="password" placeholder="Create a password" type={showPassword ? "text" : "password"} /><button aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-[var(--color-text-soft-400)]" onClick={() => setShowPassword((value) => !value)} type="button">{showPassword ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}</button></div><PasswordStrength password={password} /></WizardField>
          <div className="pt-3">
            <button className="h-11 w-full rounded-full bg-[var(--primary)] text-sm font-semibold text-white lg:h-10 lg:text-xs" onClick={() => void continueToAcademy()} type="button">Continue</button>
          </div>
        </fieldset> : <fieldset className="mt-3 space-y-3" disabled={isSubmitting}>
          <WizardField error={fieldError("academyName")} label="Academy Name" name="academyName"><Input {...register("academyName")} className={inputClass} hasError={Boolean(fieldError("academyName"))} id="academyName" placeholder="Enter academy name" /></WizardField>
          <WizardField error={fieldError("subdomain")} label="Subdomain" name="subdomain"><div className={cn("flex h-10 lg:h-9", controlSurface({ focusWithin: true, hasError: Boolean(fieldError("subdomain")) }))}><Input {...register("subdomain", { setValueAs: (value: unknown) => typeof value === "string" ? value.toLowerCase().replace(/[^a-z0-9-]/g, "") : value })} bare className="min-w-0 flex-1 rounded-l-[10px] px-3 text-sm outline-none lg:text-xs" hasError={Boolean(fieldError("subdomain"))} id="subdomain" placeholder="your-academy" /><span className="flex items-center rounded-r-[10px] border-l border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-weak-100)] px-3 text-xs text-[var(--color-text-sub-500)]">.omnixtra.app</span></div>{!errors.subdomain ? <p className="mt-1 text-[11px] leading-4 text-[var(--color-text-sub-500)]">Your academy will live at {subdomain || "your-academy"}.omnixtra.app</p> : null}</WizardField>
          <label className="flex items-center gap-2.5 text-xs leading-4 text-[var(--color-text-sub-500)]"><Input bare checked={acceptedTerms} className="size-4 shrink-0 accent-[var(--primary)]" onChange={(event) => setAcceptedTerms(event.target.checked)} type="checkbox" /><span>I accept the <Link className="font-semibold text-[var(--primary)] hover:underline" href="/terms">Terms &amp; Conditions</Link> and <Link className="font-semibold text-[var(--primary)] hover:underline" href="/privacy">Privacy Policy</Link>.</span></label>
          <SubmitButton className="h-11 rounded-full text-sm font-semibold lg:h-10 lg:text-xs" disabled={!acceptedTerms} isSubmitting={isSubmitting} pendingLabel="Creating academy...">Create Academy</SubmitButton>
        </fieldset>}
      </div>
    </section>
    <div className="relative hidden min-h-screen overflow-hidden lg:block"><Image alt="" className="object-cover" fill priority sizes="40vw" src="/images/auth/login-img.png" /><Image alt="" aria-hidden="true" className="z-10 object-contain object-bottom" fill priority sizes="40vw" src="/images/auth/astronaut.png" /></div>
  </form>;
}

function WizardField({ children, error, label, name }: { children: ReactNode; error?: string; label: string; name: string }) {
  return <div><label className="mb-1 block text-sm font-semibold leading-5 text-[var(--foreground)] lg:text-xs lg:leading-4" htmlFor={name}>{label}</label>{children}{error ? <p className="mt-0.5 text-[11px] leading-3 text-[var(--color-state-error)]" role="alert">{error}</p> : null}</div>;
}

function PasswordStrength({ password }: { password: string }) {
  const conditions = [
    { label: "At least 12 characters", met: password.length >= 12 },
    { label: "Upper & lowercase letters", met: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: "A number or symbol", met: /[\d\W_]/.test(password) },
  ];
  const level = conditions.filter(({ met }) => met).length;
  const strength = level === 3 ? "Strong password." : level === 2 ? "Fair password." : "Weak password. Must contain at least:";
  const tone = level === 3 ? "bg-[#38c793]" : level === 2 ? "bg-amber-400" : "bg-rose-400";

  return <div className="mt-2.5">
    <div aria-label={`Password strength: ${level === 3 ? "strong" : level === 2 ? "fair" : "weak"}`} aria-valuemax={3} aria-valuemin={0} aria-valuenow={level} className="grid grid-cols-3 gap-2" role="meter">
      {[1, 2, 3].map((bar) => <span className={`h-1 rounded-full ${bar <= level ? tone : "bg-[var(--border)]"}`} key={bar} />)}
    </div>
    <div className="lg:hidden">
      <p className="mt-1.5 text-[11px] leading-4 text-[var(--color-text-sub-500)]">{strength}</p>
      <ul className="mt-2 grid gap-1.5 text-[11px] leading-4 text-[var(--color-text-sub-500)]">
        {conditions.map(({ label, met }) => <li className="flex items-center gap-2" key={label}>
          <span aria-hidden="true" className={`grid size-4 shrink-0 place-items-center rounded-full ${met ? "bg-[#38c793] text-white" : "bg-[var(--color-bg-weak-100)] text-[var(--color-text-soft-400)]"}`}>
            {met ? <Check className="size-3" strokeWidth={3} /> : <X className="size-3" strokeWidth={2.5} />}
          </span>
          <span>{label}</span>
        </li>)}
      </ul>
    </div>
    <ul className="mt-2 hidden space-y-1 text-xs text-[var(--color-text-sub-500)] lg:block">
      <li>At least 12 characters</li>
      <li>Strength booster: mix uppercase and lowercase letters</li>
      <li>Strength booster: add a number or symbol</li>
    </ul>
  </div>;
}
