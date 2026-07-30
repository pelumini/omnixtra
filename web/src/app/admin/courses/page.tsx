import { headers } from "next/headers";

import { AdminCourseList } from "@/components/admin/admin-course-list";
import { getCourses } from "@/lib/api";
import type { Course } from "@/lib/schemas";

export default async function AdminCoursesPage() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? undefined;
  const cookie = requestHeaders.get("cookie") ?? undefined;
  let courses: Course[] = [];
  let loadError: string | null = null;

  try {
    const response = await getCourses({ cookie, host });
    courses = response.data.items;
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Courses could not be loaded";
  }

  return <AdminCourseList initialCourses={courses} loadError={loadError} />;
}
