"use client";

import Link from "next/link";

import { CreateAcademyForm } from "@/features/academy";
import { AuthShell } from "@/features/auth";
import { createAcademy } from "@/lib/api/academy";
import { appBaseDomain, tenantUrl } from "@/lib/tenant-host";

export default function GetStartedPage() {
  return (
    <AuthShell
      subtitle="Set up your academy and your admin account in one step."
      title="Create your academy"
      width="wide"
    >
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
      <p className="mt-6 border-t border-[var(--border)] pt-5 text-sm text-slate-600">
        Already have an academy?{" "}
        <Link className="font-medium text-[var(--primary)] hover:underline" href="/login">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
