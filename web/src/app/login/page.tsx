import { headers } from "next/headers";

import { BareHostLoginView } from "@/components/auth/bare-host-login-view";
import { SignInView } from "@/components/auth/sign-in-view";
import { tenantSlugFromHost } from "@/lib/tenant-host";

export default async function LoginPage() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "";
  if (tenantSlugFromHost(host) === null) {
    return <BareHostLoginView />;
  }
  return <SignInView />;
}
