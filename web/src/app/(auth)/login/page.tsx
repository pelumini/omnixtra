import { headers } from "next/headers";

import { BareHostLoginView, SignInView } from "@/features/auth";
import { tenantSlugFromHost } from "@/lib/tenant-host";

export default async function LoginPage() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "";
  if (tenantSlugFromHost(host) === null) {
    return <BareHostLoginView />;
  }
  return <SignInView />;
}
