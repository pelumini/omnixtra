import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { CourseBuilder } from "@/components/admin/course-builder";
import { getCourses } from "@/lib/api";

type CourseBuilderPageProps = {
  params: Promise<{
    courseId: string;
  }>;
};

export default async function CourseBuilderPage({ params }: CourseBuilderPageProps) {
  const { courseId } = await params;
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? undefined;
  const cookie = requestHeaders.get("cookie") ?? undefined;
  const response = await getCourses({ cookie, host });
  const course = response.data.items.find((item) => item.id === courseId);

  if (!course) {
    notFound();
  }

  return <CourseBuilder course={course} />;
}
