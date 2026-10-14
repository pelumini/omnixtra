"use client";

import { ArrowDown, ArrowLeft, ArrowUp, Eye, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { DeniedState } from "@/components/layout/denied-state";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { canAuthorCourse } from "@/lib/permissions";

import { createLesson, createSection, deleteLesson, deleteSection, publishCourse, reorderLessons, reorderSections, updateLesson, updateSection } from "../api";

import { CourseStatus } from "./course-builder/CourseStatus";
import { LessonComposer } from "./course-builder/LessonComposer";

import type { Block, Course, CourseStructure, Lesson, Section } from "../schemas";
import type { CourseRole } from "@/lib/schemas/common";
import type { ReactNode } from "react";

type Props = { course: Course; courseRole?: CourseRole; initialStructure: CourseStructure };
type DeleteTarget = { id: string; kind: "lesson" | "section"; title: string } | null;

export function CourseBuilder({ course: initialCourse, courseRole = "course_owner", initialStructure }: Props) {
  const [course, setCourse] = useState(initialCourse);
  const [sections, setSections] = useState<Section[]>(initialStructure.sections.map(sectionValue));
  const [lessons, setLessons] = useState<Lesson[]>(initialStructure.sections.flatMap((section) => section.lessons.map(lessonValue)));
  const [blocks, setBlocks] = useState<Block[]>(initialStructure.sections.flatMap((section) => section.lessons.flatMap((lesson) => lesson.blocks)));
  const [selectedLessonId, setSelectedLessonId] = useState(lessons[0]?.id ?? "");
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newLessonSectionId, setNewLessonSectionId] = useState(sections[0]?.id ?? "");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const selectedLesson = lessons.find(({ id }) => id === selectedLessonId) ?? null;
  const orderedSections = useMemo(() => [...sections].sort(byPosition), [sections]);

  function run(action: () => Promise<void>, fallback: string) {
    startTransition(async () => { try { await action(); } catch (error) { setMessage(error instanceof Error ? error.message : fallback); } });
  }
  function addChapter() {
    if (!newChapterTitle.trim()) return;
    run(async () => {
      const response = await createSection(course.id, { position: sections.length, title: newChapterTitle.trim() });
      setSections((items) => [...items, response.data]); setNewLessonSectionId(response.data.id); setNewChapterTitle(""); setMessage("Chapter added");
    }, "Chapter could not be added");
  }
  function addLesson() {
    if (!newLessonTitle.trim() || !newLessonSectionId) return;
    run(async () => {
      const response = await createLesson(course.id, { position: lessons.filter(({ section_id }) => section_id === newLessonSectionId).length, section_id: newLessonSectionId, title: newLessonTitle.trim() });
      setLessons((items) => [...items, response.data]); setSelectedLessonId(response.data.id); setNewLessonTitle(""); setMessage("Lesson added");
    }, "Lesson could not be added");
  }
  function moveSection(index: number, direction: -1 | 1) {
    const previous = sections;
    const next = move(orderedSections, index, direction).map((item, position) => ({ ...item, position })); setSections(next);
    run(async () => { try { await reorderSections(course.id, next.map(({ id }) => id)); setMessage("Chapter order saved"); } catch (error) { setSections(previous); throw error; } }, "Chapter order could not be saved");
  }
  function moveLesson(sectionId: string, index: number, direction: -1 | 1) {
    const previous = lessons; const siblings = lessons.filter((item) => item.section_id === sectionId).sort(byPosition);
    const next = move(siblings, index, direction).map((item, position) => ({ ...item, position })); setLessons(lessons.filter((item) => item.section_id !== sectionId).concat(next));
    run(async () => { try { await reorderLessons(course.id, sectionId, next.map(({ id }) => id)); setMessage("Lesson order saved"); } catch (error) { setLessons(previous); throw error; } }, "Lesson order could not be saved");
  }
  function confirmDelete() {
    if (!deleteTarget) return;
    run(async () => {
      if (deleteTarget.kind === "section") {
        await deleteSection(course.id, deleteTarget.id);
        const childIds = new Set(lessons.filter(({ section_id }) => section_id === deleteTarget.id).map(({ id }) => id));
        setSections((items) => items.filter(({ id }) => id !== deleteTarget.id)); setLessons((items) => items.filter(({ id }) => !childIds.has(id))); setBlocks((items) => items.filter(({ lesson_id }) => !childIds.has(lesson_id)));
        if (selectedLesson && childIds.has(selectedLesson.id)) setSelectedLessonId("");
      } else {
        await deleteLesson(course.id, deleteTarget.id); setLessons((items) => items.filter(({ id }) => id !== deleteTarget.id)); setBlocks((items) => items.filter(({ lesson_id }) => lesson_id !== deleteTarget.id)); if (selectedLessonId === deleteTarget.id) setSelectedLessonId("");
      }
      setDeleteTarget(null); setMessage("Item deleted");
    }, "Item could not be deleted");
  }
  if (!canAuthorCourse(courseRole)) return <DeniedState description="Authoring this course is available to its course owner." title="This course is not yours to edit" />;

  return <main className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[var(--color-bg-weak-100)] text-[var(--color-text-main-900)]">
    <header className="z-20 flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3"><Link aria-label="Back to courses" className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--color-stroke-soft-200)] text-[var(--color-text-sub-500)] hover:bg-[var(--color-bg-weak-100)]" href="/admin/courses"><ArrowLeft className="size-4" /></Link><div className="min-w-0"><h1 className="truncate text-base font-semibold">{course.title}</h1><CourseStatus status={course.status} /></div></div>
      <div className="flex gap-2"><Button className="gap-2" onClick={() => setMessage("Preview will be available in phase 2d")} variant="secondary"><Eye /> Preview</Button><Button isProcessing={pending} onClick={() => run(async () => { const response = await publishCourse(course.id); setCourse(response.data); setMessage("Course published"); }, "Course could not be published")}>Publish</Button></div>
    </header>
    {message ? <div aria-live="polite" className="shrink-0 border-b border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] px-6 py-2 text-sm text-[var(--color-text-sub-500)]">{message}</div> : null}
    <div className="grid min-h-0 flex-1 overflow-auto lg:grid-cols-[22rem_minmax(0,1fr)] lg:overflow-hidden">
      <aside className="border-b border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] p-4 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <h2 className="text-sm font-semibold">Course outline</h2><p className="mt-1 text-xs text-[var(--color-text-sub-500)]">Chapters and lessons</p>
        <div className="mt-4 flex gap-2"><Input aria-label="New chapter title" onChange={(e) => setNewChapterTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addChapter(); }} placeholder="New chapter" value={newChapterTitle} /><IconButton label="Add chapter" onClick={addChapter}><Plus /></IconButton></div>
        <div className="mt-4 grid gap-3">{orderedSections.map((section, sectionIndex) => {
          const children = lessons.filter((lesson) => lesson.section_id === section.id).sort(byPosition);
          return <div className="border border-[var(--color-stroke-soft-200)]" key={section.id}>
            <div className="flex items-center gap-1 bg-[var(--color-bg-weak-100)] p-2"><Input aria-label={`Chapter ${sectionIndex + 1} title`} className="min-w-0 flex-1" onChange={(e) => setSections((items) => items.map((item) => item.id === section.id ? { ...item, title: e.target.value } : item))} value={section.title} /><IconButton label={`Save chapter ${section.title}`} onClick={() => run(async () => { await updateSection(course.id, section.id, section.title); setMessage("Chapter renamed"); }, "Chapter could not be renamed")}><Save /></IconButton><MoveButtons down={sectionIndex === orderedSections.length - 1} label={section.title} onDown={() => moveSection(sectionIndex, 1)} onUp={() => moveSection(sectionIndex, -1)} up={sectionIndex === 0} /><IconButton label={`Delete chapter ${section.title}`} onClick={() => setDeleteTarget({ id: section.id, kind: "section", title: section.title })}><Trash2 /></IconButton></div>
            <div className="grid gap-1 p-2">{children.map((lesson, lessonIndex) => <div className={`grid gap-1 p-2 ${selectedLessonId === lesson.id ? "bg-[var(--color-primary-alpha-10)]" : ""}`} key={lesson.id}><button className="truncate text-left text-sm font-medium hover:text-[var(--color-primary-base)]" onClick={() => setSelectedLessonId(lesson.id)} type="button">{lesson.title}</button><div className="flex gap-1"><Input aria-label={`Lesson ${lessonIndex + 1} title`} className="min-w-0 flex-1" onChange={(e) => setLessons((items) => items.map((item) => item.id === lesson.id ? { ...item, title: e.target.value } : item))} value={lesson.title} /><IconButton label={`Save lesson ${lesson.title}`} onClick={() => run(async () => { await updateLesson(course.id, lesson.id, lesson.title); setMessage("Lesson renamed"); }, "Lesson could not be renamed")}><Save /></IconButton><MoveButtons down={lessonIndex === children.length - 1} label={lesson.title} onDown={() => moveLesson(section.id, lessonIndex, 1)} onUp={() => moveLesson(section.id, lessonIndex, -1)} up={lessonIndex === 0} /><IconButton label={`Delete lesson ${lesson.title}`} onClick={() => setDeleteTarget({ id: lesson.id, kind: "lesson", title: lesson.title })}><Trash2 /></IconButton></div></div>)}{children.length === 0 ? <p className="p-2 text-xs text-[var(--color-text-sub-500)]">Add your first lesson</p> : null}</div>
          </div>;
        })}</div>
        <div className="mt-4 grid gap-2 border-t border-[var(--color-stroke-soft-200)] pt-4"><select aria-label="Chapter for new lesson" className="h-10 rounded-[10px] bg-[var(--color-bg-weak-100)] px-3 text-xs" onChange={(e) => setNewLessonSectionId(e.target.value)} value={newLessonSectionId}><option value="">Choose chapter</option>{orderedSections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}</select><div className="flex gap-2"><Input aria-label="New lesson title" onChange={(e) => setNewLessonTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addLesson(); }} placeholder="New lesson" value={newLessonTitle} /><IconButton label="Add lesson" onClick={addLesson}><Plus /></IconButton></div></div>
      </aside>
      <LessonComposer blocks={blocks} courseId={course.id} lesson={selectedLesson} onBlocksChange={setBlocks} onMessage={setMessage} />
    </div>
    <Dialog description={deleteTarget?.kind === "section" ? "Deleting this chapter also removes all of its lessons and content blocks." : "Deleting this lesson also removes all of its content blocks."} onClose={() => setDeleteTarget(null)} open={deleteTarget !== null} title={`Delete ${deleteTarget?.title ?? "item"}?`}><div className="flex justify-end gap-2"><Button onClick={() => setDeleteTarget(null)} variant="secondary">Cancel</Button><Button isProcessing={pending} onClick={confirmDelete}>Delete</Button></div></Dialog>
  </main>;
}

function sectionValue(section: CourseStructure["sections"][number]): Section { return { course_id: section.course_id, id: section.id, position: section.position, title: section.title }; }
function lessonValue(lesson: CourseStructure["sections"][number]["lessons"][number]): Lesson { return { body: lesson.body, course_id: lesson.course_id, id: lesson.id, position: lesson.position, section_id: lesson.section_id, title: lesson.title }; }
function byPosition<T extends { position: number }>(a: T, b: T) { return a.position - b.position; }
function move<T>(items: T[], index: number, direction: -1 | 1) { const next = [...items]; const target = index + direction; if (target < 0 || target >= next.length) return next; [next[index], next[target]] = [next[target], next[index]]; return next; }
function IconButton({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) { return <Button aria-label={label} iconOnly onClick={onClick} size="x-small" variant="secondary">{children}</Button>; }
function MoveButtons({ down, label, onDown, onUp, up }: { down: boolean; label: string; onDown: () => void; onUp: () => void; up: boolean }) { return <><Button aria-label={`Move ${label} up`} disabled={up} iconOnly onClick={onUp} size="x-small" variant="secondary"><ArrowUp /></Button><Button aria-label={`Move ${label} down`} disabled={down} iconOnly onClick={onDown} size="x-small" variant="secondary"><ArrowDown /></Button></>; }
