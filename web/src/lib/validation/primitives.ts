import { z } from "zod";

// Form schemas compose these primitives so blank and short values stay distinct.
// Render their constraint keys through resolveMessage instead of schema-local prose.

export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;
export const NAME_MIN = 2;
export const NAME_MAX = 200;
export const SUBDOMAIN_MIN = 2;
export const SUBDOMAIN_MAX = 63;

export const requiredText = z.string().trim().min(1, "required");
export const requiredUntrimmedTextSchema = (max: number) =>
  z.string().min(1, "required").max(max, "max_length");
export const textSchema = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, "required")
    .max(max, "max_length")
    .refine((value) => value.length === 0 || value.length >= min, "min_length");
export const optionalTextSchema = (max: number) => z.string().trim().max(max, "max_length");

export const emailSchema = z
  .string()
  .trim()
  .min(1, "required")
  .refine((value) => value.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "email");

export const passwordSchema = z
  .string()
  .min(1, "required")
  .max(PASSWORD_MAX, "max_length")
  .refine((value) => value.length === 0 || value.length >= PASSWORD_MIN, "min_length");

export const fullNameSchema = textSchema(NAME_MIN, NAME_MAX);
export const firstNameSchema = textSchema(1, 100);
export const lastNameSchema = textSchema(1, 100);
export const phoneSchema = textSchema(1, 32);

export const academyNameSchema = textSchema(NAME_MIN, NAME_MAX);

export const subdomainSchema = z
  .string()
  .trim()
  .min(1, "required")
  .max(SUBDOMAIN_MAX, "max_length")
  .refine((value) => value.length === 0 || value.length >= SUBDOMAIN_MIN, "min_length")
  .refine(
    (value) => value.length === 0 || /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(value),
    "subdomain_format",
  );

export const invitationTokenSchema = z.string().min(1, "required");
