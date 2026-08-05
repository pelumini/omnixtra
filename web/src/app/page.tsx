import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { InvitationPending } from "@/components/app/invitation-pending";
import { PublicLanding } from "@/components/app/public-landing";
import { getAuthSession } from "@/lib/api";
import { e2eFixturesEnabled, e2ePendingSession } from "@/lib/e2e-fixtures";

type HomeProps = {
  searchParams?: Promise<{
    e2e_session?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const e2eSession = e2eFixturesEnabled() ? (await searchParams)?.e2e_session : undefined;
  if (e2eSession === "admin") {
    redirect("/admin");
  }
  if (e2eSession === "member") {
    redirect("/my-courses?e2e=member");
  }
  if (e2eSession === "pending") {
    return <InvitationPending session={e2ePendingSession} />;
  }

  const requestHeaders = await headers();
  const context = {
    cookie: requestHeaders.get("cookie") ?? undefined,
    host: requestHeaders.get("host") ?? undefined,
  };
  const session = await loadSession(context);

  if (session === null) {
    return <PublicLanding />;
  }
  if (session.data.membership === null) {
    return <InvitationPending session={session.data} />;
  }
  if (session.data.membership.org_role === "tenant_admin") {
    redirect("/admin");
  }
  redirect("/my-courses");
}

async function loadSession(context: { cookie?: string; host?: string }) {
  try {
    return await getAuthSession(context);
  } catch {
    return null;
  }
}
