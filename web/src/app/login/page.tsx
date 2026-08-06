import { headers } from "next/headers";

import { SignInView } from "@/components/auth/sign-in-view";
import { tenantSlugFromHost } from "@/lib/tenant-host";

export default async function LoginPage() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "";
  return <SignInView requiresAcademyHost={tenantSlugFromHost(host) === null} />;
}
