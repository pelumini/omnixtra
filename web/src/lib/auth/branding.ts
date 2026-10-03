import { getTenantBranding } from "@/lib/api/academy";
import type { RequestContext } from "@/lib/api/client";
import type { TenantBranding } from "@/lib/schemas/academy";

export const DEFAULT_BRANDING: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#584ce1",
  tenant_name: "OmniXtra",
  time_zone: "UTC",
};

export async function getBrandingOrDefault(
  context: RequestContext,
  fallback: TenantBranding = DEFAULT_BRANDING,
): Promise<TenantBranding> {
  try {
    const response = await getTenantBranding(context);
    return response.data;
  } catch {
    return fallback;
  }
}
