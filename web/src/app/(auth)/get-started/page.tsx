"use client";

import { CreateAcademyForm } from "@/features/academy";
import { createAcademy } from "@/lib/api/academy";
import { appBaseDomain, tenantUrl } from "@/lib/tenant-host";

export default function GetStartedPage() {
  return (
    <CreateAcademyForm
        action={createAcademy}
        onSuccess={({ accessToken, subdomain }) => {
          const path =
            appBaseDomain() === "localhost"
              ? `/auth/local-signup?access_token=${encodeURIComponent(accessToken)}`
              : "/admin";
          window.location.assign(tenantUrl(subdomain, path, window.location));
        }}
    />
  );
}
