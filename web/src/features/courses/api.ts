import {
  apiUrl,
  postJson,
  requestHeaders,
  type RequestContext,
  throwIfApiError,
} from "@/lib/api/client";

import {
  blockCreateRequestSchema,
  blockEnvelopeSchema,
  courseCreateRequestSchema,
  courseDetailEnvelopeSchema,
  courseEnvelopeSchema,
  coursePageEnvelopeSchema,
  courseStructureEnvelopeSchema,
  lessonCreateRequestSchema,
  lessonEnvelopeSchema,
  lessonUpdateRequestSchema,
  lessonsEnvelopeSchema,
  mediaAssetCreateRequestSchema,
  mediaAssetEnvelopeSchema,
  sectionCreateRequestSchema,
  sectionEnvelopeSchema,
  sectionsEnvelopeSchema,
  sectionUpdateRequestSchema,
  type CourseCreateRequest,
  type CourseUpdateRequest,
  type LessonCreateRequest,
  type MediaAssetCreateRequest,
  type SectionCreateRequest,
} from "./schemas";

export async function getCourses(context: RequestContext = {}) {
  const response = await fetch(`${apiUrl()}/api/v1/courses`, {
    cache: "no-store",
    credentials: "include",
    headers: requestHeaders(context),
  });
  const body: unknown = await response.json();
  throwIfApiError(response, body);

  return coursePageEnvelopeSchema.parse(body);
}

export async function getCourse(
  courseId: string,
  context: RequestContext = {},
) {
  const response = await fetch(`${apiUrl()}/api/v1/courses/${courseId}`, {
    cache: "no-store",
    credentials: "include",
    headers: requestHeaders(context),
  });
  const body: unknown = await response.json();
  throwIfApiError(response, body);

  return courseDetailEnvelopeSchema.parse(body);
}

export async function getCourseStructure(
  courseId: string,
  context: RequestContext = {},
) {
  const response = await fetch(
    `${apiUrl()}/api/v1/courses/${courseId}/structure`,
    {
      cache: "no-store",
      credentials: "include",
      headers: requestHeaders(context),
    },
  );
  const body: unknown = await response.json();
  throwIfApiError(response, body);
  return courseStructureEnvelopeSchema.parse(body);
}

async function mutate(
  path: string,
  method: "PATCH" | "DELETE" | "PUT",
  body?: unknown,
) {
  const response = await fetch(`${apiUrl()}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method,
  });
  const payload: unknown = await response.json();
  throwIfApiError(response, payload);
  return payload;
}

export async function updateSection(
  courseId: string,
  sectionId: string,
  title: string,
) {
  return sectionEnvelopeSchema.parse(
    await mutate(
      `/api/v1/courses/${courseId}/sections/${sectionId}`,
      "PATCH",
      sectionUpdateRequestSchema.parse({ title }),
    ),
  );
}

export async function deleteSection(courseId: string, sectionId: string) {
  return sectionEnvelopeSchema.parse(
    await mutate(`/api/v1/courses/${courseId}/sections/${sectionId}`, "DELETE"),
  );
}

export async function updateLesson(
  courseId: string,
  lessonId: string,
  title: string,
) {
  return lessonEnvelopeSchema.parse(
    await mutate(
      `/api/v1/courses/${courseId}/lessons/${lessonId}`,
      "PATCH",
      lessonUpdateRequestSchema.parse({ title }),
    ),
  );
}

export async function deleteLesson(courseId: string, lessonId: string) {
  return lessonEnvelopeSchema.parse(
    await mutate(`/api/v1/courses/${courseId}/lessons/${lessonId}`, "DELETE"),
  );
}

export async function reorderSections(courseId: string, orderedIds: string[]) {
  return sectionsEnvelopeSchema.parse(
    await mutate(`/api/v1/courses/${courseId}/sections/order`, "PUT", {
      ordered_ids: orderedIds,
    }),
  );
}

export async function reorderLessons(
  courseId: string,
  sectionId: string,
  orderedIds: string[],
) {
  return lessonsEnvelopeSchema.parse(
    await mutate(
      `/api/v1/courses/${courseId}/sections/${sectionId}/lessons/order`,
      "PUT",
      { ordered_ids: orderedIds },
    ),
  );
}

export async function getCourseLessons(
  courseId: string,
  context: RequestContext = {},
) {
  const response = await fetch(
    `${apiUrl()}/api/v1/courses/${courseId}/lessons`,
    {
      cache: "no-store",
      credentials: "include",
      headers: requestHeaders(context),
    },
  );
  const body: unknown = await response.json();
  throwIfApiError(response, body);

  return lessonsEnvelopeSchema.parse(body);
}

export async function createCourse(
  request: CourseCreateRequest,
  context: RequestContext = {},
) {
  const body = courseCreateRequestSchema.parse(request);
  const response = await postJson(
    "/api/v1/courses",
    body,
    requestHeaders(context),
  );

  return courseEnvelopeSchema.parse(response);
}

export async function updateCourse(
  courseId: string,
  request: CourseUpdateRequest,
) {
  const response = await fetch(`${apiUrl()}/api/v1/courses/${courseId}`, {
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

export async function createSection(
  courseId: string,
  request: SectionCreateRequest,
) {
  const body = sectionCreateRequestSchema.parse(request);
  const response = await postJson(`/api/v1/courses/${courseId}/sections`, body);

  return sectionEnvelopeSchema.parse(response);
}

export async function createLesson(
  courseId: string,
  request: LessonCreateRequest,
  context: RequestContext = {},
) {
  const body = lessonCreateRequestSchema.parse(request);
  const response = await postJson(
    `/api/v1/courses/${courseId}/lessons`,
    body,
    requestHeaders(context),
  );

  return lessonEnvelopeSchema.parse(response);
}

export async function createBlock(courseId: string, request: unknown) {
  const body = blockCreateRequestSchema.parse(request);
  const response = await postJson(`/api/v1/courses/${courseId}/blocks`, body);

  return blockEnvelopeSchema.parse(response);
}

export async function createMediaAsset(
  courseId: string,
  request: MediaAssetCreateRequest,
) {
  const body = mediaAssetCreateRequestSchema.parse(request);
  const response = await postJson(`/api/v1/courses/${courseId}/media`, body);

  return mediaAssetEnvelopeSchema.parse(response);
}
