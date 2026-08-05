import { z } from "zod";

export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;
export const NAME_MIN = 2;
export const NAME_MAX = 200;
export const SUBDOMAIN_MIN = 2;
export const SUBDOMAIN_MAX = 63;

export const emailSchema = z.string().min(1, "required").email("email");

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, "min_length")
  .max(PASSWORD_MAX, "max_length");

export const fullNameSchema = z
  .string()
  .min(NAME_MIN, "min_length")
  .max(NAME_MAX, "max_length");

export const academyNameSchema = z
  .string()
  .min(NAME_MIN, "min_length")
  .max(NAME_MAX, "max_length");

export const subdomainSchema = z
  .string()
  .min(SUBDOMAIN_MIN, "min_length")
  .max(SUBDOMAIN_MAX, "max_length")
  .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, "subdomain_format");

export const invitationTokenSchema = z.string().min(1, "required");
