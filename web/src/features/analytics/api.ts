import {
  apiUrl,
  requestHeaders,
  type RequestContext,
  throwIfApiError,
} from "@/lib/api/client";

import {
  courseCompletionAnalyticsEnvelopeSchema,
  learnerProgressReportEnvelopeSchema,
} from "./schemas";

export async function getCompletionAnalytics(context: RequestContext = {}) {
  const response = await fetch(`${apiUrl()}/api/v1/admin/analytics/completions`, {
    cache: "no-store",
    credentials: "include",
    headers: requestHeaders(context),
  });
  const body: unknown = await response.json();
  throwIfApiError(response, body);

  return courseCompletionAnalyticsEnvelopeSchema.parse(body);
}

export async function getLearnerProgressReport(context: RequestContext = {}) {
  const response = await fetch(`${apiUrl()}/api/v1/admin/reports/learner-progress`, {
    cache: "no-store",
    credentials: "include",
    headers: requestHeaders(context),
  });
  const body: unknown = await response.json();
  throwIfApiError(response, body);

  return learnerProgressReportEnvelopeSchema.parse(body);
}

export function learnerProgressCsvUrl() {
  return `${apiUrl()}/api/v1/admin/reports/learner-progress.csv`;
}
