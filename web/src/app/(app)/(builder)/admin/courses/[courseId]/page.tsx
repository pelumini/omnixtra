import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { InvitationPending } from "@/features/auth";
import { CourseBuilder } from "@/features/courses";
import { getCourseStructure } from "@/features/courses/api";
import { getSessionOrNull } from "@/lib/auth/session";

type CourseDetailPageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params;
  const requestHeaders = await headers();
  const context = {
    cookie: requestHeaders.get("cookie") ?? undefined,
    host: requestHeaders.get("host") ?? undefined,
  };
  const authSession = await getSessionOrNull(context);

  if (authSession === null) redirect("/login");
  if (authSession.membership === null) {
    return <InvitationPending session={authSession} />;
  }
  const structure = await loadCourse(courseId, context);
  if (structure === null) notFound();
  return <CourseBuilder course={structure.data} initialStructure={structure.data} />;
}

async function loadCourse(
  courseId: string,
  context: { cookie?: string; host?: string },
) {
  try {
    return await getCourseStructure(courseId, context);
  } catch {
    return null;
  }
}
