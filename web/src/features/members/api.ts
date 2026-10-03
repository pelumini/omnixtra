import {
  apiUrl,
  postJson,
  requestHeaders,
  type RequestContext,
  throwIfApiError,
} from "@/lib/api/client";
import { authEnvelopeSchema } from "@/lib/schemas/auth";
import {
  invitationAcceptRequestSchema,
  invitationCreateEnvelopeSchema,
  invitationCreateRequestSchema,
  invitationPreviewEnvelopeSchema,
  membershipsEnvelopeSchema,
  type InvitationAcceptRequest,
  type InvitationCreateRequest,
} from "./schemas";

export async function acceptInvitation(request: InvitationAcceptRequest, context: RequestContext = {}) {
  const body = invitationAcceptRequestSchema.parse(request);
  const response = await postJson("/api/v1/auth/invitations/accept", body, requestHeaders(context));

  return authEnvelopeSchema.parse(response);
}

export async function getInvitationPreview(token: string, context: RequestContext = {}) {
  const response = await fetch(
    `${apiUrl()}/api/v1/auth/invitations/${encodeURIComponent(token)}`,
    {
      cache: "no-store",
      headers: requestHeaders(context),
    },
  );
  const body: unknown = await response.json();
  if (response.status === 404) {
    return null;
  }
  throwIfApiError(response, body);

  return invitationPreviewEnvelopeSchema.parse(body).data;
}

export async function getMemberships(context: RequestContext = {}) {
  const response = await fetch(`${apiUrl()}/api/v1/tenant/memberships`, {
    cache: "no-store",
    credentials: "include",
    headers: requestHeaders(context),
  });
  const body: unknown = await response.json();
  throwIfApiError(response, body);

  return membershipsEnvelopeSchema.parse(body);
}

export async function createInvitation(request: InvitationCreateRequest, context: RequestContext = {}) {
  const body = invitationCreateRequestSchema.parse(request);
  const response = await postJson("/api/v1/tenant/invitations", body, requestHeaders(context));

  return invitationCreateEnvelopeSchema.parse(response);
}
