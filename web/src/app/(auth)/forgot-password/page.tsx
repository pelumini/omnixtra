import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-bg-weak-100)] px-6 py-12">
      <section className="w-full max-w-md rounded-lg border border-[var(--border)] bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Password reset</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-sub-500)]">Password reset is not available yet. Contact your academy administrator for help accessing your account.</p>
        <Link className="mt-6 inline-flex text-sm font-semibold text-[var(--primary)] hover:underline" href="/login">Return to sign in</Link>
      </section>
    </main>
  );
}
