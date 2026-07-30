import { coursePageEnvelopeSchema, healthEnvelopeSchema } from "@/lib/schemas";

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
