"use client";

import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  CircleAlert,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { DeniedState } from "@/components/layout/denied-state";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { canAuthorCourse } from "@/lib/permissions";


import {
  deleteLesson,
  deleteSection,
  publishCourse,
  reorderLessons,
  reorderSections,
  updateLesson,
  updateSection,
} from "../api";

import { BlockForm } from "./course-builder/BlockForm";
import { CourseDetailsForm } from "./course-builder/CourseDetailsForm";
import { CourseStatus } from "./course-builder/CourseStatus";
import { LessonForm } from "./course-builder/LessonForm";
import { MediaForm } from "./course-builder/MediaForm";
import { SectionForm } from "./course-builder/SectionForm";

import type {
  Block,
  Course,
  CourseStructure,
  Lesson,
  MediaAsset,
  Section,
} from "../schemas";
import type { CourseRole } from "@/lib/schemas/common";

type Props = {
  course: Course;
  courseRole?: CourseRole;
  initialStructure: CourseStructure;
};
type DeleteTarget = {
  id: string;
  kind: "lesson" | "section";
  title: string;
} | null;

export function CourseBuilder({
  course: initialCourse,
  courseRole = "course_owner",
  initialStructure,
}: Props) {
  const [course, setCourse] = useState(initialCourse);
  const [sections, setSections] = useState<Section[]>(
    initialStructure.sections.map((section) => ({
      course_id: section.course_id,
      id: section.id,
      position: section.position,
      title: section.title,
    })),
  );
  const [lessons, setLessons] = useState<Lesson[]>(
    initialStructure.sections.flatMap((section) =>
      section.lessons.map((lesson) => ({
        body: lesson.body,
        course_id: lesson.course_id,
        id: lesson.id,
        position: lesson.position,
        section_id: lesson.section_id,
        title: lesson.title,
      })),
    ),
  );
  const [blocks, setBlocks] = useState<Block[]>(
    initialStructure.sections.flatMap((section) =>
      section.lessons.flatMap((lesson) => lesson.blocks),
    ),
  );
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState(
    sections[0]?.id ?? "",
  );
  const [selectedLessonId, setSelectedLessonId] = useState(
    lessons[0]?.id ?? "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [isPending, startTransition] = useTransition();
  const selectedLessons = useMemo(
    () =>
      lessons
        .filter((lesson) => lesson.section_id === selectedSectionId)
        .sort(byPosition),
    [lessons, selectedSectionId],
  );

  function run(action: () => Promise<void>, fallback: string) {
    startTransition(async () => {
      try {
        await action();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : fallback);
      }
    });
  }
  function moveSection(index: number, direction: -1 | 1) {
    const previous = [...sections];
    const next = move(previous, index, direction).map((item, position) => ({
      ...item,
      position,
    }));
    setSections(next);
    run(async () => {
      try {
        await reorderSections(
          course.id,
          next.map(({ id }) => id),
        );
        setMessage("Section order saved");
      } catch (error) {
        setSections(previous);
        throw error;
      }
    }, "Section order could not be saved");
  }
  function moveLesson(sectionId: string, index: number, direction: -1 | 1) {
    const previous = [...lessons];
    const siblings = previous
      .filter((item) => item.section_id === sectionId)
      .sort(byPosition);
    const next = move(siblings, index, direction).map((item, position) => ({
      ...item,
      position,
    }));
    setLessons(
      previous.filter((item) => item.section_id !== sectionId).concat(next),
    );
    run(async () => {
      try {
        await reorderLessons(
          course.id,
          sectionId,
          next.map(({ id }) => id),
        );
        setMessage("Lesson order saved");
      } catch (error) {
        setLessons(previous);
        throw error;
      }
    }, "Lesson order could not be saved");
  }
  function confirmDelete() {
    if (!deleteTarget) return;
    run(async () => {
      if (deleteTarget.kind === "section") {
        await deleteSection(course.id, deleteTarget.id);
        const childIds = new Set(
          lessons
            .filter((item) => item.section_id === deleteTarget.id)
            .map(({ id }) => id),
        );
        setSections((items) =>
          items.filter(({ id }) => id !== deleteTarget.id),
        );
        setLessons((items) => items.filter(({ id }) => !childIds.has(id)));
        setBlocks((items) =>
          items.filter(({ lesson_id }) => !childIds.has(lesson_id)),
        );
      } else {
        await deleteLesson(course.id, deleteTarget.id);
        setLessons((items) => items.filter(({ id }) => id !== deleteTarget.id));
        setBlocks((items) =>
          items.filter(({ lesson_id }) => lesson_id !== deleteTarget.id),
        );
      }
      setMessage("Item deleted");
      setDeleteTarget(null);
    }, "Item could not be deleted");
  }

  if (!canAuthorCourse(courseRole))
    return (
      <DeniedState
        description="Authoring this course is available to its course owner."
        title="This course is not yours to edit"
      />
    );

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl content-start gap-5 px-5 py-5">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-stroke-soft-200)] pb-4">
        <div>
          <Link
            className="text-sm text-[var(--color-text-sub-500)] hover:text-[var(--color-primary-base)]"
            href="/admin/courses"
          >
            Courses
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-[var(--color-text-main-900)]">
            {course.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-sub-500)]">
            {course.description ?? course.slug}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CourseStatus status={course.status} />
          <Button
            isProcessing={isPending}
            onClick={() =>
              run(async () => {
                const response = await publishCourse(course.id);
                setCourse(response.data);
                setMessage("Course published");
              }, "Course could not be published")
            }
          >
            <BadgeCheck />
            Publish
          </Button>
        </div>
      </header>
      {message ? (
        <div className="flex gap-2 border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] p-3 text-sm text-[var(--color-text-sub-500)]">
          <CircleAlert className="size-4 text-[var(--color-primary-base)]" />
          {message}
        </div>
      ) : null}
      <section className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)_300px]">
        <aside className="grid content-start gap-4">
          <CourseDetailsForm
            course={course}
            onSaved={(value) => {
              setCourse(value);
              setMessage("Course details saved");
            }}
          />
          <MediaForm
            courseId={course.id}
            onCreated={(asset) => setMedia((items) => [asset, ...items])}
          />
        </aside>
        <section className="grid content-start gap-4">
          <SectionForm
            courseId={course.id}
            position={sections.length}
            onCreated={(section) => {
              setSections((items) => [...items, section]);
              setSelectedSectionId(section.id);
            }}
          />
          <div className="grid gap-3">
            {[...sections].sort(byPosition).map((section, sectionIndex) => {
              const children = lessons
                .filter((item) => item.section_id === section.id)
                .sort(byPosition);
              return (
                <article
                  className="border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)]"
                  key={section.id}
                >
                  <div className="flex items-center gap-2 border-b border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-weak-100)] p-3">
                    <Input
                      aria-label={`Section ${sectionIndex + 1} title`}
                      className="min-w-0 flex-1"
                      onChange={(event) =>
                        setSections((items) =>
                          items.map((item) =>
                            item.id === section.id
                              ? { ...item, title: event.target.value }
                              : item,
                          ),
                        )
                      }
                      value={section.title}
                    />
                    <SaveButton
                      label={`Save section ${section.title}`}
                      onClick={() =>
                        run(async () => {
                          await updateSection(
                            course.id,
                            section.id,
                            section.title,
                          );
                          setMessage("Section renamed");
                        }, "Section could not be renamed")
                      }
                    />
                    <MoveButtons
                      downDisabled={sectionIndex === sections.length - 1}
                      label={section.title}
                      onDown={() => moveSection(sectionIndex, 1)}
                      onUp={() => moveSection(sectionIndex, -1)}
                      upDisabled={sectionIndex === 0}
                    />
                    <DeleteButton
                      label={`Delete section ${section.title}`}
                      onClick={() =>
                        setDeleteTarget({
                          id: section.id,
                          kind: "section",
                          title: section.title,
                        })
                      }
                    />
                  </div>
                  <div className="divide-y divide-[var(--color-stroke-soft-200)]">
                    {children.map((lesson, lessonIndex) => (
                      <div className="grid gap-2 p-3" key={lesson.id}>
                        <div className="flex items-center gap-2">
                          <Input
                            aria-label={`Lesson ${lessonIndex + 1} title`}
                            className="min-w-0 flex-1"
                            onChange={(event) =>
                              setLessons((items) =>
                                items.map((item) =>
                                  item.id === lesson.id
                                    ? { ...item, title: event.target.value }
                                    : item,
                                ),
                              )
                            }
                            value={lesson.title}
                          />
                          <SaveButton
                            label={`Save lesson ${lesson.title}`}
                            onClick={() =>
                              run(async () => {
                                await updateLesson(
                                  course.id,
                                  lesson.id,
                                  lesson.title,
                                );
                                setMessage("Lesson renamed");
                              }, "Lesson could not be renamed")
                            }
                          />
                          <MoveButtons
                            downDisabled={lessonIndex === children.length - 1}
                            label={lesson.title}
                            onDown={() =>
                              moveLesson(section.id, lessonIndex, 1)
                            }
                            onUp={() => moveLesson(section.id, lessonIndex, -1)}
                            upDisabled={lessonIndex === 0}
                          />
                          <DeleteButton
                            label={`Delete lesson ${lesson.title}`}
                            onClick={() =>
                              setDeleteTarget({
                                id: lesson.id,
                                kind: "lesson",
                                title: lesson.title,
                              })
                            }
                          />
                        </div>
                        <ul className="pl-3 text-xs text-[var(--color-text-sub-500)]">
                          {blocks
                            .filter((item) => item.lesson_id === lesson.id)
                            .sort(byPosition)
                            .map((block) => (
                              <li key={block.id}>
                                {block.position + 1}. {block.block_type}
                              </li>
                            ))}
                          {blocks.every(
                            (item) => item.lesson_id !== lesson.id,
                          ) ? (
                            <li>No blocks</li>
                          ) : null}
                        </ul>
                      </div>
                    ))}
                    {children.length === 0 ? (
                      <p className="p-4 text-sm text-[var(--color-text-sub-500)]">
                        No lessons
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
            {sections.length === 0 ? (
              <p className="border border-[var(--color-stroke-soft-200)] p-8 text-center text-sm text-[var(--color-text-sub-500)]">
                No sections
              </p>
            ) : null}
          </div>
        </section>
        <aside className="grid content-start gap-4">
          <LessonForm
            courseId={course.id}
            disabled={sections.length === 0}
            lessons={lessons}
            onCreated={(lesson) => {
              setLessons((items) => [...items, lesson]);
              setSelectedLessonId(lesson.id);
            }}
            onSectionChange={setSelectedSectionId}
            sections={sections}
            selectedSectionId={selectedSectionId}
          />
          <BlockForm
            blocks={blocks}
            courseId={course.id}
            disabled={lessons.length === 0}
            lessons={selectedLessons}
            onCreated={(block) => setBlocks((items) => [...items, block])}
            onLessonChange={setSelectedLessonId}
            selectedLessonId={selectedLessonId}
          />
          <section className="border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] p-4">
            <h2 className="text-sm font-semibold">Assets</h2>
            <p className="mt-2 text-sm text-[var(--color-text-sub-500)]">
              {media.length} saved this session
            </p>
          </section>
        </aside>
      </section>
      <Dialog
        description={
          deleteTarget?.kind === "section"
            ? "Deleting this section also removes all of its lessons and blocks."
            : "This removes the lesson and all of its blocks."
        }
        onClose={() => setDeleteTarget(null)}
        open={deleteTarget !== null}
        title={`Delete ${deleteTarget?.title ?? "item"}?`}
      >
        <div className="flex justify-end gap-2">
          <Button onClick={() => setDeleteTarget(null)} variant="secondary">
            Cancel
          </Button>
          <Button isProcessing={isPending} onClick={confirmDelete}>
            Delete
          </Button>
        </div>
      </Dialog>
    </main>
  );
}

function MoveButtons({
  downDisabled,
  label,
  onDown,
  onUp,
  upDisabled,
}: {
  downDisabled: boolean;
  label: string;
  onDown: () => void;
  onUp: () => void;
  upDisabled: boolean;
}) {
  return (
    <>
      <Button
        aria-label={`Move ${label} up`}
        disabled={upDisabled}
        iconOnly
        onClick={onUp}
        size="x-small"
        variant="secondary"
      >
        <ArrowUp />
      </Button>
      <Button
        aria-label={`Move ${label} down`}
        disabled={downDisabled}
        iconOnly
        onClick={onDown}
        size="x-small"
        variant="secondary"
      >
        <ArrowDown />
      </Button>
    </>
  );
}
function SaveButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      aria-label={label}
      iconOnly
      onClick={onClick}
      size="x-small"
      variant="secondary"
    >
      <Save />
    </Button>
  );
}
function DeleteButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      aria-label={label}
      iconOnly
      onClick={onClick}
      size="x-small"
      variant="secondary"
    >
      <Trash2 />
    </Button>
  );
}
function move<T>(items: T[], index: number, direction: -1 | 1) {
  const result = [...items];
  const target = index + direction;
  if (target < 0 || target >= result.length) return result;
  [result[index], result[target]] = [result[target], result[index]];
  return result;
}
function byPosition<T extends { position: number }>(left: T, right: T) {
  return left.position - right.position;
}
