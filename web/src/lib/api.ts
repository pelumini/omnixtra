import {
  blockCreateRequestSchema,
  blockEnvelopeSchema,
  courseCreateRequestSchema,
  courseEnvelopeSchema,
  coursePageEnvelopeSchema,
  coursePlayerEnvelopeSchema,
  errorBodySchema,
  healthEnvelopeSchema,
  lessonCreateRequestSchema,
  lessonEnvelopeSchema,
  mediaAssetCreateRequestSchema,
  mediaAssetEnvelopeSchema,
  sectionCreateRequestSchema,
  sectionEnvelopeSchema,
  tutorJobEnvelopeSchema,
} from "@/lib/schemas";
import type {
  CourseCreateRequest,
  CourseUpdateRequest,
  LessonCreateRequest,
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

export async function getCoursePlayer(courseId: string) {
  const response = await fetch(`${apiUrl}/api/v1/learning/courses/${courseId}/player`, {
    cache: "no-store",
  });
  const body: unknown = await response.json();
  throwIfApiError(response, body);

  return coursePlayerEnvelopeSchema.parse(body);
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

async function postJson(path: string, body: unknown) {
  const response = await fetch(`${apiUrl}${path}`, {
    body: body === null ? undefined : JSON.stringify(body),
    cache: "no-store",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
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
