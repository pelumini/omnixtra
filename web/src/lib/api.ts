import {
  blockCreateRequestSchema,
  blockEnvelopeSchema,
  billingPlansEnvelopeSchema,
  certificateEnvelopeSchema,
  courseCompletionAnalyticsEnvelopeSchema,
  courseCompletionEnvelopeSchema,
  courseCreateRequestSchema,
  courseEnvelopeSchema,
  coursePageEnvelopeSchema,
  coursePlayerEnvelopeSchema,
  enrolmentEnvelopeSchema,
  errorBodySchema,
  healthEnvelopeSchema,
  lessonCreateRequestSchema,
  lessonEnvelopeSchema,
  lessonProgressEnvelopeSchema,
  lessonProgressRequestSchema,
  learnerProgressReportEnvelopeSchema,
  mediaAssetCreateRequestSchema,
  mediaAssetEnvelopeSchema,
  quizAttemptEnvelopeSchema,
  quizAttemptRequestSchema,
  sectionCreateRequestSchema,
  sectionEnvelopeSchema,
  tenantBrandingEnvelopeSchema,
  tutorJobEnvelopeSchema,
  tutorEventSchema,
} from "@/lib/schemas";
import type {
  CourseCreateRequest,
  CourseUpdateRequest,
  LessonCreateRequest,
  LessonProgressRequest,
  MediaAssetCreateRequest,
  SectionCreateRequest,
} from "@/lib/schemas";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type RequestContext = {
  cookie?: string;
  host?: string;
};

export async function getHealth() {
  const response = await fetch(`${apiUrl}/health`, { cache: "no-store" });
  const body: unknown = await response.json();

  return healthEnvelopeSchema.parse(body);
}

export async function getTenantBranding(context: RequestContext = {}) {
  const response = await fetch(`${apiUrl}/api/v1/tenant/branding`, {
    cache: "no-store",
    headers: requestHeaders(context),
  });
  const body: unknown = await response.json();
  throwIfApiError(response, body);

  return tenantBrandingEnvelopeSchema.parse(body);
}

export async function getBillingPlans(context: RequestContext = {}) {
  const response = await fetch(`${apiUrl}/api/v1/billing/plans`, {
    cache: "no-store",
    credentials: "include",
    headers: requestHeaders(context),
  });
  const body: unknown = await response.json();
  throwIfApiError(response, body);

  return billingPlansEnvelopeSchema.parse(body);
}

export async function getCompletionAnalytics(context: RequestContext = {}) {
  const response = await fetch(`${apiUrl}/api/v1/admin/analytics/completions`, {
    cache: "no-store",
    credentials: "include",
    headers: requestHeaders(context),
  });
  const body: unknown = await response.json();
  throwIfApiError(response, body);

  return courseCompletionAnalyticsEnvelopeSchema.parse(body);
}

export async function getLearnerProgressReport(context: RequestContext = {}) {
  const response = await fetch(`${apiUrl}/api/v1/admin/reports/learner-progress`, {
    cache: "no-store",
    credentials: "include",
    headers: requestHeaders(context),
  });
  const body: unknown = await response.json();
  throwIfApiError(response, body);

  return learnerProgressReportEnvelopeSchema.parse(body);
}

export function learnerProgressCsvUrl() {
  return `${apiUrl}/api/v1/admin/reports/learner-progress.csv`;
}

export async function getCourses(context: RequestContext = {}) {
  const response = await fetch(`${apiUrl}/api/v1/courses`, {
    cache: "no-store",
    credentials: "include",
    headers: requestHeaders(context),
  });
  const body: unknown = await response.json();
  throwIfApiError(response, body);

  return coursePageEnvelopeSchema.parse(body);
}

export async function getCoursePlayer(courseId: string, context: RequestContext = {}) {
  const response = await fetch(`${apiUrl}/api/v1/learning/courses/${courseId}/player`, {
    cache: "no-store",
    credentials: "include",
    headers: requestHeaders(context),
  });
  const body: unknown = await response.json();
  throwIfApiError(response, body);

  return coursePlayerEnvelopeSchema.parse(body);
}

export async function enrolInCourse(courseId: string, idempotencyKey: string) {
  const response = await postJson(`/api/v1/learning/courses/${courseId}/enrolments`, null, {
    "Idempotency-Key": idempotencyKey,
  });

  return enrolmentEnvelopeSchema.parse(response);
}

export async function updateLessonProgress(
  courseId: string,
  lessonId: string,
  request: LessonProgressRequest,
) {
  const body = lessonProgressRequestSchema.parse(request);
  const response = await fetch(
    `${apiUrl}/api/v1/learning/courses/${courseId}/lessons/${lessonId}/progress`,
    {
      body: JSON.stringify(body),
      cache: "no-store",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    },
  );
  const responseBody: unknown = await response.json();
  throwIfApiError(response, responseBody);

  return lessonProgressEnvelopeSchema.parse(responseBody);
}

export async function submitQuizAttempt(
  courseId: string,
  blockId: string,
  selectedOptionId: string,
) {
  const body = quizAttemptRequestSchema.parse({ selected_option_id: selectedOptionId });
  const response = await postJson(`/api/v1/learning/courses/${courseId}/quizzes/${blockId}/attempts`, body);

  return quizAttemptEnvelopeSchema.parse(response);
}

export async function completeCourse(courseId: string, idempotencyKey: string) {
  const response = await postJson(`/api/v1/learning/courses/${courseId}/completion`, null, {
    "Idempotency-Key": idempotencyKey,
  });

  return courseCompletionEnvelopeSchema.parse(response);
}

export async function issueCertificate(courseId: string, idempotencyKey: string) {
  const response = await postJson(`/api/v1/learning/courses/${courseId}/certificate`, null, {
    "Idempotency-Key": idempotencyKey,
  });

  return certificateEnvelopeSchema.parse(response);
}

export function certificateDownloadUrl(courseId: string) {
  return `${apiUrl}/api/v1/learning/courses/${courseId}/certificate/download`;
}

export async function createTutorJob(courseId: string, question: string, idempotencyKey: string) {
  const response = await fetch(`${apiUrl}/api/v1/ai/courses/${courseId}/tutor/jobs`, {
    body: JSON.stringify({ question }),
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    method: "POST",
  });
  const body: unknown = await response.json();
  throwIfApiError(response, body);

  return tutorJobEnvelopeSchema.parse(body);
}

export function tutorJobEventsUrl(courseId: string, jobId: string) {
  return `${apiUrl}/api/v1/ai/courses/${courseId}/tutor/jobs/${jobId}/events`;
}

export function parseTutorEventMessage(data: string) {
  return tutorEventSchema.parse(JSON.parse(data));
}

export async function createCourse(request: CourseCreateRequest) {
  const body = courseCreateRequestSchema.parse(request);
  const response = await postJson("/api/v1/courses", body);

  return courseEnvelopeSchema.parse(response);
}

export async function updateCourse(courseId: string, request: CourseUpdateRequest) {
  const response = await fetch(`${apiUrl}/api/v1/courses/${courseId}`, {
    body: JSON.stringify(request),
    cache: "no-store",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });
  const body: unknown = await response.json();
  throwIfApiError(response, body);

  return courseEnvelopeSchema.parse(body);
}

export async function publishCourse(courseId: string) {
  const response = await postJson(`/api/v1/courses/${courseId}/publish`, null);

  return courseEnvelopeSchema.parse(response);
}

export async function createSection(courseId: string, request: SectionCreateRequest) {
  const body = sectionCreateRequestSchema.parse(request);
  const response = await postJson(`/api/v1/courses/${courseId}/sections`, body);

  return sectionEnvelopeSchema.parse(response);
}

export async function createLesson(courseId: string, request: LessonCreateRequest) {
  const body = lessonCreateRequestSchema.parse(request);
  const response = await postJson(`/api/v1/courses/${courseId}/lessons`, body);

  return lessonEnvelopeSchema.parse(response);
}

export async function createBlock(courseId: string, request: unknown) {
  const body = blockCreateRequestSchema.parse(request);
  const response = await postJson(`/api/v1/courses/${courseId}/blocks`, body);

  return blockEnvelopeSchema.parse(response);
}

export async function createMediaAsset(courseId: string, request: MediaAssetCreateRequest) {
  const body = mediaAssetCreateRequestSchema.parse(request);
  const response = await postJson(`/api/v1/courses/${courseId}/media`, body);

  return mediaAssetEnvelopeSchema.parse(response);
}

function requestHeaders(context: RequestContext): HeadersInit {
  const headers: Record<string, string> = {};
  if (context.cookie) {
    headers.cookie = context.cookie;
  }
  if (context.host) {
    headers.host = context.host;
  }
  return headers;
}

async function postJson(path: string, body: unknown, headers: HeadersInit = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    body: body === null ? undefined : JSON.stringify(body),
    cache: "no-store",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...headers },
    method: "POST",
  });
  const responseBody: unknown = await response.json();
  throwIfApiError(response, responseBody);

  return responseBody;
}

function throwIfApiError(response: Response, body: unknown) {
  if (response.ok) {
    return;
  }
  const parsed = errorBodySchema.safeParse((body as { error?: unknown }).error);
  throw new Error(parsed.success ? parsed.data.message : "API request failed");
}
