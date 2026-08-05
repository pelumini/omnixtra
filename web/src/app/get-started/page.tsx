"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { CreateAcademyForm } from "@/components/forms/create-academy-form";
import { createAcademy } from "@/lib/api/academy";

export default function GetStartedPage() {
  const router = useRouter();

  return (
    <AuthShell
      subtitle="Set up your academy and your admin account in one step."
      title="Create your academy"
      width="wide"
    >
      <CreateAcademyForm action={createAcademy} onSuccess={() => router.push("/")} />
      <p className="mt-6 border-t border-[var(--border)] pt-5 text-sm text-slate-600">
        Already have an academy?{" "}
        <Link className="font-medium text-[var(--primary)] hover:underline" href="/login">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
