import { headers } from "next/headers";

import { LearnerCoursePlayer } from "@/components/learning/learner-course-player";
import { getCoursePlayer } from "@/lib/api";
import type { CoursePlayer } from "@/lib/schemas";

type LearnerCoursePageProps = {
  params: Promise<{
    courseId: string;
  }>;
};

export default async function LearnerCoursePage({ params }: LearnerCoursePageProps) {
  const { courseId } = await params;
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? undefined;
  const cookie = requestHeaders.get("cookie") ?? undefined;
  let player: CoursePlayer | null = null;
  let loadError: string | null = null;

  try {
    const response = await getCoursePlayer(courseId, { cookie, host });
    player = response.data;
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Course player could not be loaded";
  }

  return <LearnerCoursePlayer courseId={courseId} initialPlayer={player} loadError={loadError} />;
}
