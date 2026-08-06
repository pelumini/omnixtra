import { createTenant, type ApiRequestError } from "@/lib/api";
import type { CreateAcademyInput } from "@/lib/schemas/auth";

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
