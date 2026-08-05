"use client";

import {
  BadgeCheck,
  Boxes,
  CircleAlert,
  FileText,
  Image,
  Layers3,
  ListChecks,
  Pencil,
  PlaySquare,
  Plus,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { FormEvent } from "react";

import { DeniedState } from "@/components/app/denied-state";
import { Button } from "@/components/ui/button";
import {
  createBlock,
  createLesson,
  createMediaAsset,
  createSection,
  publishCourse,
  updateCourse,
} from "@/lib/api";
import { canAuthorCourse } from "@/lib/permissions";
import type { Block, Course, Lesson, MediaAsset, Section } from "@/lib/schemas";
import type { CourseRole } from "@/lib/schemas";

type CourseBuilderProps = {
  course: Course;
  courseRole?: CourseRole;
};

const blockTypes = [
  { value: "text", label: "Text", icon: FileText },
  { value: "video", label: "Video", icon: PlaySquare },
  { value: "image", label: "Image", icon: Image },
  { value: "quiz", label: "Quiz", icon: ListChecks },
] as const;

export function CourseBuilder({
  course: initialCourse,
  courseRole = "course_owner",
}: CourseBuilderProps) {
  const [course, setCourse] = useState(initialCourse);
  const [sections, setSections] = useState<Section[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedSectionLessons = useMemo(
    () => lessons.filter((lesson) => lesson.section_id === selectedSectionId),
    [lessons, selectedSectionId],
  );

  function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = formString(form, "title");
    const descriptionValue = formString(form, "description");

    startTransition(async () => {
      try {
        const response = await updateCourse(course.id, {
          description: descriptionValue === "" ? null : descriptionValue,
          title,
        });
        setCourse(response.data);
        setMessage("Course details saved");
      } catch (error) {
        setMessage(errorMessage(error, "Course details could not be saved"));
      }
    });
  }

  function handleSectionCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = formString(form, "title");

    startTransition(async () => {
      try {
        const response = await createSection(course.id, {
          position: sections.length,
          title,
        });
        setSections((current) => [...current, response.data]);
        setSelectedSectionId(response.data.id);
        setMessage("Section added");
        event.currentTarget.reset();
      } catch (error) {
        setMessage(errorMessage(error, "Section could not be added"));
      }
    });
  }

  function handleLessonCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = formString(form, "title");
    const sectionId = formString(form, "section_id");
    const position = lessons.filter((lesson) => lesson.section_id === sectionId).length;

    startTransition(async () => {
      try {
        const response = await createLesson(course.id, {
          position,
          section_id: sectionId,
          title,
        });
        setLessons((current) => [...current, response.data]);
        setSelectedLessonId(response.data.id);
        setMessage("Lesson added");
        event.currentTarget.reset();
      } catch (error) {
        setMessage(errorMessage(error, "Lesson could not be added"));
      }
    });
  }

  function handleBlockCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const lessonId = formString(form, "lesson_id");
    const blockType = formString(form, "block_type");
    const body = formString(form, "body");
    const position = blocks.filter((block) => block.lesson_id === lessonId).length;

    startTransition(async () => {
      try {
        const response = await createBlock(course.id, {
          block_type: blockType,
          content: blockContent(blockType, body),
          lesson_id: lessonId,
          position,
        });
        setBlocks((current) => [...current, response.data]);
        setMessage("Block added");
        event.currentTarget.reset();
      } catch (error) {
        setMessage(errorMessage(error, "Block could not be added"));
      }
    });
  }

  function handleMediaCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fileName = formString(form, "file_name");
    const contentType = formString(form, "content_type");

    startTransition(async () => {
      try {
        const response = await createMediaAsset(course.id, {
          byte_size: Number(formString(form, "byte_size")),
          checksum_sha256: null,
          content_type: contentType,
          file_name: fileName,
          object_key: `tenants/current/courses/${course.id}/${fileName}`,
        });
        setMedia((current) => [response.data, ...current]);
        setMessage("Media metadata saved");
        event.currentTarget.reset();
      } catch (error) {
        setMessage(errorMessage(error, "Media metadata could not be saved"));
      }
    });
  }

  function handlePublish() {
    startTransition(async () => {
      try {
        const response = await publishCourse(course.id);
        setCourse(response.data);
        setMessage("Course published");
      } catch (error) {
        setMessage(errorMessage(error, "Course could not be published"));
      }
    });
  }

  if (!canAuthorCourse(courseRole)) {
    return (
      <DeniedState
        description="Authoring this course is available to its course owner. You can still use the learner course player for courses you are enrolled in."
        title="This course is not yours to edit"
      />
    );
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl content-start gap-5 px-5 py-5">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <Link className="text-sm text-gray-600 hover:text-[var(--primary)]" href="/admin/courses">
            Courses
          </Link>
          <h1 className="mt-1 text-xl font-semibold">{course.title}</h1>
          <p className="mt-1 text-sm text-gray-600">{course.description ?? course.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <CourseStatus status={course.status} />
          <Button className="gap-2" disabled={isPending} onClick={handlePublish}>
            <BadgeCheck aria-hidden="true" className="size-4" />
            Publish
          </Button>
        </div>
      </header>

      {message ? (
        <div className="flex items-start gap-2 border border-[var(--border)] bg-white px-4 py-3 text-sm text-gray-700">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" />
          <span>{message}</span>
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)_300px]">
        <aside className="grid content-start gap-4">
          <form className="grid gap-3 border border-[var(--border)] bg-white p-4" onSubmit={handleUpdate}>
            <div className="flex items-center gap-2">
              <Pencil aria-hidden="true" className="size-4 text-gray-500" />
              <h2 className="text-sm font-semibold">Details</h2>
            </div>
            <label className="grid gap-1 text-sm font-medium">
              Title
              <input
                className="h-10 border border-[var(--border)] px-3 text-sm font-normal outline-none focus:border-[var(--primary)]"
                defaultValue={course.title}
                maxLength={200}
                minLength={3}
                name="title"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Description
              <textarea
                className="min-h-24 resize-y border border-[var(--border)] px-3 py-2 text-sm font-normal outline-none focus:border-[var(--primary)]"
                defaultValue={course.description ?? ""}
                maxLength={2000}
                name="description"
              />
            </label>
            <Button disabled={isPending} type="submit">
              Save
            </Button>
          </form>

          <form
            className="grid gap-3 border border-[var(--border)] bg-white p-4"
            onSubmit={handleMediaCreate}
          >
            <div className="flex items-center gap-2">
              <Upload aria-hidden="true" className="size-4 text-gray-500" />
              <h2 className="text-sm font-semibold">Media</h2>
            </div>
            <label className="grid gap-1 text-sm font-medium">
              File
              <input
                className="h-10 border border-[var(--border)] px-3 text-sm font-normal outline-none focus:border-[var(--primary)]"
                name="file_name"
                required
              />
            </label>
            <select
              className="h-10 border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)]"
              name="content_type"
            >
              <option value="image/png">image/png</option>
              <option value="image/jpeg">image/jpeg</option>
              <option value="video/mp4">video/mp4</option>
            </select>
            <label className="grid gap-1 text-sm font-medium">
              Bytes
              <input
                className="h-10 border border-[var(--border)] px-3 text-sm font-normal outline-none focus:border-[var(--primary)]"
                min={1}
                name="byte_size"
                required
                type="number"
              />
            </label>
            <Button className="gap-2" disabled={isPending} type="submit">
              <Upload aria-hidden="true" className="size-4" />
              Save
            </Button>
          </form>
        </aside>

        <section className="grid content-start gap-4">
          <form
            className="flex flex-wrap items-end gap-3 border border-[var(--border)] bg-white p-4"
            onSubmit={handleSectionCreate}
          >
            <label className="grid min-w-56 flex-1 gap-1 text-sm font-medium">
              Section
              <input
                className="h-10 border border-[var(--border)] px-3 text-sm font-normal outline-none focus:border-[var(--primary)]"
                name="title"
                required
              />
            </label>
            <Button className="gap-2" disabled={isPending} type="submit">
              <Plus aria-hidden="true" className="size-4" />
              Add
            </Button>
          </form>

          <div className="grid gap-3">
            {sections.map((section, index) => {
              const sectionLessons = lessons.filter((lesson) => lesson.section_id === section.id);

              return (
                <article className="border border-[var(--border)] bg-white" key={section.id}>
                  <button
                    className="flex w-full items-center justify-between gap-3 border-b border-[var(--border)] bg-gray-50 px-4 py-3 text-left"
                    onClick={() => setSelectedSectionId(section.id)}
                    type="button"
                  >
                    <span className="text-sm font-semibold">
                      {index + 1}. {section.title}
                    </span>
                    <Layers3 aria-hidden="true" className="size-4 text-gray-500" />
                  </button>
                  <div className="divide-y divide-[var(--border)]">
                    {sectionLessons.map((lesson) => (
                      <button
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50"
                        key={lesson.id}
                        onClick={() => setSelectedLessonId(lesson.id)}
                        type="button"
                      >
                        <span className="min-w-0 truncate text-sm">{lesson.title}</span>
                        <span className="text-xs text-gray-500">
                          {blocks.filter((block) => block.lesson_id === lesson.id).length} blocks
                        </span>
                      </button>
                    ))}
                    {sectionLessons.length === 0 ? (
                      <div className="px-4 py-4 text-sm text-gray-600">No lessons</div>
                    ) : null}
                  </div>
                </article>
              );
            })}
            {sections.length === 0 ? (
              <div className="border border-[var(--border)] bg-white px-4 py-10 text-center text-sm text-gray-600">
                No sections
              </div>
            ) : null}
          </div>
        </section>

        <aside className="grid content-start gap-4">
          <form className="grid gap-3 border border-[var(--border)] bg-white p-4" onSubmit={handleLessonCreate}>
            <div className="flex items-center gap-2">
              <BookIcon />
              <h2 className="text-sm font-semibold">Lesson</h2>
            </div>
            <select
              className="h-10 border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)]"
              name="section_id"
              onChange={(event) => setSelectedSectionId(event.target.value)}
              required
              value={selectedSectionId}
            >
              <option value="">Select section</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>
            <input
              className="h-10 border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)]"
              name="title"
              placeholder="Lesson title"
              required
            />
            <Button className="gap-2" disabled={isPending || sections.length === 0} type="submit">
              <Plus aria-hidden="true" className="size-4" />
              Add
            </Button>
          </form>

          <form className="grid gap-3 border border-[var(--border)] bg-white p-4" onSubmit={handleBlockCreate}>
            <div className="flex items-center gap-2">
              <Boxes aria-hidden="true" className="size-4 text-gray-500" />
              <h2 className="text-sm font-semibold">Block</h2>
            </div>
            <select
              className="h-10 border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)]"
              name="lesson_id"
              onChange={(event) => setSelectedLessonId(event.target.value)}
              required
              value={selectedLessonId}
            >
              <option value="">Select lesson</option>
              {selectedSectionLessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              {blockTypes.map((blockType) => {
                const Icon = blockType.icon;

                return (
                  <label
                    className="flex h-10 items-center gap-2 border border-[var(--border)] bg-white px-3 text-sm"
                    key={blockType.value}
                  >
                    <input name="block_type" required type="radio" value={blockType.value} />
                    <Icon aria-hidden="true" className="size-4 text-gray-500" />
                    {blockType.label}
                  </label>
                );
              })}
            </div>
            <textarea
              className="min-h-24 resize-y border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              name="body"
              required
            />
            <Button className="gap-2" disabled={isPending || lessons.length === 0} type="submit">
              <Plus aria-hidden="true" className="size-4" />
              Add
            </Button>
          </form>

          <section className="border border-[var(--border)] bg-white">
            <div className="border-b border-[var(--border)] px-4 py-3">
              <h2 className="text-sm font-semibold">Assets</h2>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {media.map((asset) => (
                <article className="px-4 py-3" key={asset.id}>
                  <p className="truncate text-sm font-medium">{asset.file_name}</p>
                  <p className="mt-1 text-xs text-gray-500">{asset.content_type}</p>
                </article>
              ))}
              {media.length === 0 ? <div className="px-4 py-4 text-sm text-gray-600">No assets</div> : null}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function CourseStatus({ status }: { status: Course["status"] }) {
  const styles = {
    archived: "bg-gray-100 text-gray-700",
    draft: "bg-amber-100 text-amber-800",
    published: "bg-emerald-100 text-emerald-800",
  };

  return <span className={`px-2 py-1 text-xs font-medium ${styles[status]}`}>{status}</span>;
}

function BookIcon() {
  return <FileText aria-hidden="true" className="size-4 text-gray-500" />;
}

function blockContent(blockType: string, body: string) {
  if (blockType === "video") {
    return { caption: null, type: "video", url: body };
  }
  if (blockType === "image") {
    return { alt_text: body, type: "image", url: "https://example.com/image.png" };
  }
  if (blockType === "quiz") {
    return {
      correct_option_id: "a",
      options: [
        { id: "a", text: "Option A" },
        { id: "b", text: "Option B" },
      ],
      question: body,
      type: "quiz",
    };
  }
  return { markdown: body, type: "text" };
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formString(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}
