import {
  apiUrl,
  postJson,
  requestHeaders,
  type RequestContext,
  throwIfApiError,
} from "@/lib/api/client";
import {
  certificateEnvelopeSchema,
  courseCompletionEnvelopeSchema,
  coursePlayerEnvelopeSchema,
  enrolmentEnvelopeSchema,
  lessonProgressEnvelopeSchema,
  lessonProgressRequestSchema,
  myCoursesEnvelopeSchema,
  quizAttemptEnvelopeSchema,
  quizAttemptRequestSchema,
  tutorEventSchema,
  tutorJobEnvelopeSchema,
  type LessonProgressRequest,
} from "./schemas";
export async function getCoursePlayer(courseId: string, context: RequestContext = {}) {
  const response = await fetch(`${apiUrl()}/api/v1/learning/courses/${courseId}/player`, {
    cache: "no-store",
    credentials: "include",
    headers: requestHeaders(context),
  });
  const body: unknown = await response.json();
  throwIfApiError(response, body);

  return coursePlayerEnvelopeSchema.parse(body);
}

export async function getMyCourses(context: RequestContext = {}) {
  const response = await fetch(`${apiUrl()}/api/v1/learning/my-courses`, {
    cache: "no-store",
    credentials: "include",
    headers: requestHeaders(context),
  });
  const body: unknown = await response.json();
  throwIfApiError(response, body);

  return myCoursesEnvelopeSchema.parse(body);
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
    `${apiUrl()}/api/v1/learning/courses/${courseId}/lessons/${lessonId}/progress`,
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
  return `${apiUrl()}/api/v1/learning/courses/${courseId}/certificate/download`;
}

export async function createTutorJob(courseId: string, question: string, idempotencyKey: string) {
  const response = await fetch(`${apiUrl()}/api/v1/ai/courses/${courseId}/tutor/jobs`, {
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
  return `${apiUrl()}/api/v1/ai/courses/${courseId}/tutor/jobs/${jobId}/events`;
}

export function parseTutorEventMessage(data: string) {
  return tutorEventSchema.parse(JSON.parse(data));
}
