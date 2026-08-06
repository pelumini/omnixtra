"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Field, FormError, SubmitButton } from "@/components/ui/form-controls";
import { resolveMessage } from "@/lib/forms/messages";
import { useFormSubmit } from "@/lib/forms/use-form-submit";
import { createAcademySchema, type CreateAcademyInput } from "@/lib/schemas/auth";
import { appBaseDomain } from "@/lib/tenant-host";

type CreateAcademyFormProps = {
  action: (input: CreateAcademyInput) => Promise<{ accessToken: string; subdomain: string }>;
  onSuccess: (result: { accessToken: string; subdomain: string }) => void | Promise<void>;
};

export function CreateAcademyForm({ action, onSuccess }: CreateAcademyFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
    watch,
  } = useForm<CreateAcademyInput>({
    defaultValues: {
      academyName: "",
      email: "",
      fullName: "",
      password: "",
      subdomain: "",
    },
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(createAcademySchema),
  });

  const { formError, isSubmitting, submit } = useFormSubmit({
    action,
    onSuccess,
    setError,
  });
  const subdomain = watch("subdomain");
  const fieldError = (field: keyof CreateAcademyInput) => {
    const message = errors[field]?.message;
    return message ? resolveMessage(field, message) : undefined;
  };
  const domainSuffix = `.${appBaseDomain()}`;

  return (
    <form className="space-y-6" noValidate onSubmit={handleSubmit(submit)}>
      <FormError>{formError}</FormError>

      <fieldset className="space-y-4" disabled={isSubmitting}>
        <legend className="text-sm font-semibold text-[var(--foreground)]">Your academy</legend>
        <Field
          error={fieldError("academyName")}
          label="Academy name"
          placeholder="Acme Academy"
          registration={register("academyName")}
        />
        <div>
          <Field
            error={fieldError("subdomain")}
            label="Subdomain"
            placeholder="acme"
            registration={register("subdomain", {
              setValueAs: (value: unknown) =>
                typeof value === "string"
                  ? value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                  : value,
            })}
            suffix={domainSuffix}
          />
          {!errors.subdomain ? (
            <p className="mt-1 text-xs text-slate-500">
              Your academy will live at {subdomain || "yourname"}
              {domainSuffix}
            </p>
          ) : null}
        </div>
      </fieldset>

      <fieldset
        className="space-y-4 border-t border-[var(--border)] pt-5"
        disabled={isSubmitting}
      >
        <legend className="text-sm font-semibold text-[var(--foreground)]">
          Your admin account
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            autoComplete="name"
            error={fieldError("fullName")}
            label="Your full name"
            registration={register("fullName")}
          />
          <Field
            autoComplete="email"
            error={fieldError("email")}
            label="Work email"
            registration={register("email")}
            type="email"
          />
        </div>
        <Field
          autoComplete="new-password"
          error={fieldError("password")}
          hint="At least 12 characters."
          label="Create a password"
          registration={register("password")}
          type="password"
        />
      </fieldset>

      <SubmitButton isSubmitting={isSubmitting}>Create academy</SubmitButton>
    </form>
  );
}
