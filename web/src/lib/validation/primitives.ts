import { z } from "zod";

export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;
export const NAME_MIN = 2;
export const NAME_MAX = 200;
export const SUBDOMAIN_MIN = 2;
export const SUBDOMAIN_MAX = 63;

export const requiredText = z.string().trim().min(1, "required");
export const textSchema = (min: number, max: number) =>
  z.string().trim().min(min, "min_length").max(max, "max_length");
export const optionalTextSchema = (max: number) => z.string().trim().max(max, "max_length");

export const emailSchema = z
  .string()
  .trim()
  .min(1, "required")
  .refine((value) => value.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "email");

export const passwordSchema = textSchema(PASSWORD_MIN, PASSWORD_MAX);

export const fullNameSchema = textSchema(NAME_MIN, NAME_MAX);

export const academyNameSchema = textSchema(NAME_MIN, NAME_MAX);

export const subdomainSchema = z
  .string()
  .min(SUBDOMAIN_MIN, "min_length")
  .max(SUBDOMAIN_MAX, "max_length")
  .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, "subdomain_format");

export const invitationTokenSchema = z.string().min(1, "required");
