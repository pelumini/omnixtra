import { headers } from "next/headers";

import { AcceptInvitationView } from "@/features/auth";
import { getInvitationPreview } from "@/features/members";

type JoinPageProps = {
  searchParams?: Promise<{
    token?: string;
  }>;
};

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const token = (await searchParams)?.token?.trim() || null;
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const preview = token ? await getInvitationPreview(token, host ? { host } : {}) : null;

  return <AcceptInvitationView preview={preview} token={token} />;
}
