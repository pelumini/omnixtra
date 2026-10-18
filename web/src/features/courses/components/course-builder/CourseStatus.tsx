import type { Course } from "../../schemas";

export function CourseStatus({ status }: { status: Course["status"] }) {
  const styles = {
    archived: "bg-gray-100 text-gray-700",
    draft: "bg-amber-100 text-amber-800",
    published: "bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)]",
  };

  return <span className={`px-2 py-1 text-xs font-medium capitalize ${styles[status]}`}>{status}</span>;
}
