"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Field, FormError, SubmitButton } from "@/components/ui/form-controls";
import { Toggle } from "@/components/ui/toggle";
import { resolveMessage } from "@/lib/forms/messages";
import { useFormSubmit } from "@/lib/forms/use-form-submit";
import { createAcademySchema, type CreateAcademyInput } from "@/lib/schemas/auth";

import type { FormEvent } from "react";

type CreateAcademyFormProps = {
  action: (input: CreateAcademyInput) => Promise<{ accessToken: string; subdomain: string }>;
  initialStep?: 1 | 2;
  onSuccess: (result: { accessToken: string; subdomain: string }) => void | Promise<void>;
};

const personalFields: Array<keyof CreateAcademyInput> = ["firstName", "lastName", "phone", "email", "password"];
export function CreateAcademyForm({ action, initialStep = 1, onSuccess }: CreateAcademyFormProps) {
  const [step, setStep] = useState<1 | 2>(initialStep);
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
      {step === 2 ? <button className="absolute left-6 top-8 text-sm font-medium text-[var(--color-text-sub-500)] hover:text-[var(--color-primary-base)] sm:left-10 lg:left-16" onClick={() => setStep(1)} type="button">Changed your mind? <span className="font-semibold text-[var(--color-primary-base)]">Go Back</span></button> : null}
      <div className="w-full max-w-[27rem]">
        <h1 className="text-[1.75rem] font-bold leading-tight text-[var(--foreground)]">Set up your academy space.</h1>
        <p className="mt-1.5 text-xs leading-5 text-[var(--color-text-sub-500)]">Name your academy, choose its address and create your academy admin account. You&apos;ll go straight into your admin area when it&apos;s ready.</p>
        <div className="mt-4 flex items-center justify-between gap-3 border-b border-[var(--color-stroke-soft-200)] pb-2"><span className="text-[10px] font-semibold tracking-wide text-[var(--color-text-sub-500)]">STEP {step} OF 2</span><span className="rounded-full bg-[var(--color-primary-lighter)] px-3 py-1.5 text-[10px] font-bold tracking-wide text-[var(--color-primary-base)]">{step === 1 ? "PERSONAL DETAILS" : "ACADEMY DETAILS"}</span></div>
        {formError ? <div className="mt-2"><FormError>{formError}</FormError></div> : null}
        {step === 1 ? <fieldset className="mt-3 space-y-2" disabled={isSubmitting}>
          <div className="grid gap-3 sm:grid-cols-2"><Field autoComplete="given-name" error={fieldError("firstName")} label="First Name" placeholder="Enter first name" registration={register("firstName")} /><Field autoComplete="family-name" error={fieldError("lastName")} label="Last Name" placeholder="Enter last name" registration={register("lastName")} /></div>
          <Field autoComplete="tel" error={fieldError("phone")} label="Phone" placeholder="Enter phone number" registration={register("phone")} type="tel" />
          <Field autoComplete="email" error={fieldError("email")} label="Email Address" placeholder="Enter email" registration={register("email")} type="email" />
          <div><Field autoComplete="new-password" error={fieldError("password")} label="Password" placeholder="Create a password" registration={register("password")} type="password" /><PasswordStrength password={password} /></div>
          <div className="pt-3">
            <button className="h-11 w-full rounded-full bg-[var(--primary)] text-sm font-semibold text-white lg:h-10 lg:text-xs" onClick={() => void continueToAcademy()} type="button">Continue</button>
          </div>
        </fieldset> : <fieldset className="mt-3 space-y-3" disabled={isSubmitting}>
          <Field error={fieldError("academyName")} label="Academy Name" placeholder="Enter academy name" registration={register("academyName")} />
          <Field error={fieldError("subdomain")} hint={!errors.subdomain ? `Your academy will live at ${subdomain || "your-academy"}.omnixtra.app` : undefined} label="Subdomain" placeholder="your-academy" registration={register("subdomain", { setValueAs: (value: unknown) => typeof value === "string" ? value.toLowerCase().replace(/[^a-z0-9-]/g, "") : value })} suffix=".omnixtra.app" />
          <Toggle checked={acceptedTerms} className="items-start text-xs leading-4 text-[var(--color-text-sub-500)]" label={<span>I accept the <Link className="font-semibold text-[var(--primary)] hover:underline" href="/terms">Terms &amp; Conditions</Link> and <Link className="font-semibold text-[var(--primary)] hover:underline" href="/privacy">Privacy Policy</Link>.</span>} onChange={(event) => setAcceptedTerms(event.target.checked)} />
          <SubmitButton className="h-11 rounded-full text-sm font-semibold lg:h-10 lg:text-xs" disabled={!acceptedTerms} isSubmitting={isSubmitting} pendingLabel="Creating academy...">Create Academy</SubmitButton>
        </fieldset>}
      </div>
    </section>
    <div className="relative hidden min-h-screen overflow-hidden lg:block"><Image alt="" className="object-cover" fill priority sizes="40vw" src="/images/auth/login-img.png" /><Image alt="" aria-hidden="true" className="z-10 object-contain object-bottom" fill priority sizes="40vw" src="/images/auth/astronaut.png" /></div>
  </form>;
}

function PasswordStrength({ password }: { password: string }) {
  const conditions = [
    { label: "At least 12 characters", met: password.length >= 12 },
    { label: "Upper & lowercase letters", met: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: "A number or symbol", met: /[\d\W_]/.test(password) },
  ];
  const level = conditions.filter(({ met }) => met).length;
  const strength = level === 3 ? "Strong password." : level === 2 ? "Fair password." : "Weak password. Must contain at least:";
  const tone = level === 3 ? "bg-[var(--color-state-success)]" : level === 2 ? "bg-[var(--color-state-warning)]" : "bg-[var(--color-state-error)]";

  return <div className="mt-2.5">
    <div aria-label={`Password strength: ${level === 3 ? "strong" : level === 2 ? "fair" : "weak"}`} aria-valuemax={3} aria-valuemin={0} aria-valuenow={level} className="grid grid-cols-3 gap-2" role="meter">
      {[1, 2, 3].map((bar) => <span className={`h-1 rounded-full ${bar <= level ? tone : "bg-[var(--color-stroke-soft-200)]"}`} key={bar} />)}
    </div>
    <div className="lg:hidden">
      <p className="mt-1.5 text-[11px] leading-4 text-[var(--color-text-sub-500)]">{strength}</p>
      <ul className="mt-2 grid gap-1.5 text-[11px] leading-4 text-[var(--color-text-sub-500)]">
        {conditions.map(({ label, met }) => <li className="flex items-center gap-2" key={label}>
          <span aria-hidden="true" className={`grid size-4 shrink-0 place-items-center rounded-full ${met ? "bg-[var(--color-state-success)] text-[var(--color-text-white-0)]" : "bg-[var(--color-bg-weak-100)] text-[var(--color-text-soft-400)]"}`}>
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
