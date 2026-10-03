import {
  apiUrl,
  type ApiRequestError,
  postJson,
  publicApiUrl,
  requestHeaders,
  type RequestContext,
  throwIfApiError,
} from "@/lib/api/client";
import {
  tenantBrandingEnvelopeSchema,
  tenantCreateEnvelopeSchema,
  tenantCreateRequestSchema,
  type TenantCreateRequest,
} from "@/lib/schemas/academy";
import type { CreateAcademyInput } from "@/lib/schemas/auth";
import { tenantApiUrlForSlug } from "@/lib/tenant-host";

export async function createTenant(request: TenantCreateRequest) {
  const body = tenantCreateRequestSchema.parse(request);
  const response = await postJson(
    "/api/v1/tenants",
    body,
    {},
    tenantApiUrlForSlug(publicApiUrl, body.tenant_slug),
  );

  return tenantCreateEnvelopeSchema.parse(response);
}

export async function getTenantBranding(context: RequestContext = {}) {
  const response = await fetch(`${apiUrl()}/api/v1/tenant/branding`, {
    cache: "no-store",
    headers: requestHeaders(context),
  });
  const body: unknown = await response.json();
  throwIfApiError(response, body);

  return tenantBrandingEnvelopeSchema.parse(body);
}

type CreateAcademyResult = {
  accessToken: string;
  subdomain: string;
};

const serverToClientFields: Record<string, keyof CreateAcademyInput> = {
  tenantName: "academyName",
  tenantSlug: "subdomain",
  fullName: "fullName",
  email: "email",
  password: "password",
  subdomain: "subdomain",
};

export async function createAcademy(input: CreateAcademyInput): Promise<CreateAcademyResult> {
  try {
    const response = await createTenant({
      email: input.email,
      full_name: input.fullName,
      password: input.password,
      tenant_name: input.academyName,
      tenant_slug: input.subdomain,
    });
    return { accessToken: response.data.access_token, subdomain: response.data.tenant_slug };
  } catch (error) {
    remapCreateAcademyErrors(error);
    throw error;
  }
}

function remapCreateAcademyErrors(error: unknown) {
  const envelope = (error as Partial<ApiRequestError> | null)?.envelope;
  if (
    typeof envelope !== "object" ||
    envelope === null ||
    !("error" in envelope) ||
    typeof envelope.error !== "object" ||
    envelope.error === null ||
    !("details" in envelope.error) ||
    !Array.isArray(envelope.error.details)
  ) {
    return;
  }

  for (const detail of envelope.error.details) {
    if (
      typeof detail === "object" &&
      detail !== null &&
      "field" in detail &&
      typeof detail.field === "string"
    ) {
      detail.field = serverToClientFields[detail.field] ?? detail.field;
    }
  }
}
