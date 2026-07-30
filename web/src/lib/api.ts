import {
  coursePageEnvelopeSchema,
  coursePlayerEnvelopeSchema,
  healthEnvelopeSchema,
  tutorJobEnvelopeSchema,
} from "@/lib/schemas";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function getHealth() {
  const response = await fetch(`${apiUrl}/health`, { cache: "no-store" });
  const body: unknown = await response.json();

  return healthEnvelopeSchema.parse(body);
}

export async function getCourses() {
  const response = await fetch(`${apiUrl}/api/v1/courses`, { cache: "no-store" });
  const body: unknown = await response.json();

  return coursePageEnvelopeSchema.parse(body);
}

export async function getCoursePlayer(courseId: string) {
  const response = await fetch(`${apiUrl}/api/v1/learning/courses/${courseId}/player`, {
    cache: "no-store",
  });
  const body: unknown = await response.json();

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

  return tutorJobEnvelopeSchema.parse(body);
}
