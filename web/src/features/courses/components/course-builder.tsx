"use client";

import { ArrowDown, ArrowLeft, ArrowUp, Eye, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { DeniedState } from "@/components/layout/denied-state";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/input";
import { canAuthorCourse } from "@/lib/permissions";

import { createLesson, createSection, deleteLesson, deleteSection, publishCourse, reorderLessons, reorderSections, updateLesson, updateSection } from "../api";

import { CourseDetailsForm } from "./course-builder/CourseDetailsForm";
import { CourseStatus } from "./course-builder/CourseStatus";
import { LessonComposer } from "./course-builder/LessonComposer";
import { ChapterMetadataForm } from "./course-builder/MetadataForms";

import type { Block, Course, CourseStructure, Lesson, Section } from "../schemas";
import type { CourseRole } from "@/lib/schemas/common";
import type { ReactNode } from "react";

type Props = { course: Course; courseRole?: CourseRole; initialStructure: CourseStructure };
type DeleteTarget = { id: string; kind: "lesson" | "section"; title: string } | null;
type BuilderSection = Section & { rolled_duration_minutes: number };

export function CourseBuilder({ course: initialCourse, courseRole = "course_owner", initialStructure }: Props) {
  const [course, setCourse] = useState(initialCourse);
  const [sections, setSections] = useState<BuilderSection[]>(initialStructure.sections.map(sectionValue));
  const [rolledDuration, setRolledDuration] = useState(initialStructure.rolled_duration_minutes);
  const [lessons, setLessons] = useState<Lesson[]>(initialStructure.sections.flatMap((section) => section.lessons.map(lessonValue)));
  const [blocks, setBlocks] = useState<Block[]>(initialStructure.sections.flatMap((section) => section.lessons.flatMap((lesson) => lesson.blocks)));
  const [selectedLessonId, setSelectedLessonId] = useState(lessons[0]?.id ?? "");
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newLessonSectionId, setNewLessonSectionId] = useState(sections[0]?.id ?? "");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"content" | "settings">("content");
  const selectedLesson = lessons.find(({ id }) => id === selectedLessonId) ?? null;
  const orderedSections = useMemo(() => [...sections].sort(byPosition), [sections]);

  function run(action: () => Promise<void>, fallback: string) {
    startTransition(async () => { try { await action(); } catch (error) { setMessage(error instanceof Error ? error.message : fallback); } });
  }
  function addChapter() {
    if (!newChapterTitle.trim()) return;
    run(async () => {
      const response = await createSection(course.id, { position: sections.length, title: newChapterTitle.trim() });
      setSections((items) => [...items, { ...response.data, rolled_duration_minutes: 0 }]); setNewLessonSectionId(response.data.id); setNewChapterTitle(""); setMessage("Chapter added");
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
        const removedDuration = sections.find(({ id }) => id === deleteTarget.id)?.rolled_duration_minutes ?? 0;
        await deleteSection(course.id, deleteTarget.id);
        const childIds = new Set(lessons.filter(({ section_id }) => section_id === deleteTarget.id).map(({ id }) => id));
        setSections((items) => items.filter(({ id }) => id !== deleteTarget.id)); setLessons((items) => items.filter(({ id }) => !childIds.has(id))); setBlocks((items) => items.filter(({ lesson_id }) => !childIds.has(lesson_id)));
        if (selectedLesson && childIds.has(selectedLesson.id)) setSelectedLessonId("");
        setRolledDuration((value) => value - removedDuration);
      } else {
        const removed = lessons.find(({ id }) => id === deleteTarget.id);
        const removedDuration = removed?.estimated_duration_minutes ?? 0;
        await deleteLesson(course.id, deleteTarget.id); setLessons((items) => items.filter(({ id }) => id !== deleteTarget.id)); setBlocks((items) => items.filter(({ lesson_id }) => lesson_id !== deleteTarget.id)); if (selectedLessonId === deleteTarget.id) setSelectedLessonId("");
        setRolledDuration((value) => value - removedDuration);
        if (removed) setSections((items) => items.map((section) => section.id === removed.section_id ? { ...section, rolled_duration_minutes: section.rolled_duration_minutes - removedDuration } : section));
      }
      setDeleteTarget(null); setMessage("Item deleted");
    }, "Item could not be deleted");
  }
  function saveLesson(saved: Lesson) {
    const previous = lessons.find((lesson) => lesson.id === saved.id);
    const delta = (saved.estimated_duration_minutes ?? 0) - (previous?.estimated_duration_minutes ?? 0);
    setLessons((items) => items.map((item) => item.id === saved.id ? saved : item));
    if (delta !== 0) {
      setRolledDuration((value) => value + delta);
      setSections((items) => items.map((section) => section.id === saved.section_id ? { ...section, rolled_duration_minutes: section.rolled_duration_minutes + delta } : section));
    }
  }
  if (!canAuthorCourse(courseRole)) return <DeniedState description="Authoring this course is available to its course owner." title="This course is not yours to edit" />;

  return <main className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[var(--color-bg-weak-100)] text-[var(--color-text-main-900)]">
    <header className="z-20 flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3"><Link aria-label="Back to courses" className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--color-stroke-soft-200)] text-[var(--color-text-sub-500)] hover:bg-[var(--color-bg-weak-100)]" href="/admin/courses"><ArrowLeft className="size-4" /></Link><div className="min-w-0"><h1 className="truncate text-base font-semibold">{course.title}</h1><div className="flex items-center gap-2"><CourseStatus status={course.status} /><span className="text-xs text-[var(--color-text-sub-500)]">{rolledDuration} min total</span></div></div></div>
      <div className="flex gap-2"><Button onClick={() => setMode("content")} variant={mode === "content" ? "primary" : "secondary"}>Content</Button><Button onClick={() => setMode("settings")} variant={mode === "settings" ? "primary" : "secondary"}>Course settings</Button><Button className="gap-2" onClick={() => setMessage("Preview will be available in phase 2d")} variant="secondary"><Eye /> Preview</Button><Button isProcessing={pending} onClick={() => run(async () => { const response = await publishCourse(course.id); setCourse(response.data); setMessage("Course published"); }, "Course could not be published")}>Publish</Button></div>
    </header>
    {message ? <div aria-live="polite" className="shrink-0 border-b border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] px-6 py-2 text-sm text-[var(--color-text-sub-500)]">{message}</div> : null}
    {mode === "settings" ? <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"><div className="mx-auto max-w-3xl"><CourseDetailsForm course={course} onSaved={setCourse} /></div></div> : <div className="grid min-h-0 flex-1 overflow-auto lg:grid-cols-[22rem_minmax(0,1fr)] lg:overflow-hidden">
      <aside className="border-b border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] p-4 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <h2 className="text-sm font-semibold">Course outline</h2><p className="mt-1 text-xs text-[var(--color-text-sub-500)]">Chapters and lessons</p>
        <div className="mt-4 flex gap-2"><Input aria-label="New chapter title" onChange={(e) => setNewChapterTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addChapter(); }} placeholder="New chapter" value={newChapterTitle} /><IconButton label="Add chapter" onClick={addChapter}><Plus /></IconButton></div>
        <div className="mt-4 grid gap-3">{orderedSections.map((section, sectionIndex) => {
          const children = lessons.filter((lesson) => lesson.section_id === section.id).sort(byPosition);
          return <div className="border border-[var(--color-stroke-soft-200)]" key={section.id}>
            <div className="flex items-center gap-1 bg-[var(--color-bg-weak-100)] p-2"><Input aria-label={`Chapter ${sectionIndex + 1} title`} className="min-w-0 flex-1" onChange={(e) => setSections((items) => items.map((item) => item.id === section.id ? { ...item, title: e.target.value } : item))} value={section.title} /><IconButton label={`Save chapter ${section.title}`} onClick={() => run(async () => { await updateSection(course.id, section.id, { title: section.title }); setMessage("Chapter renamed"); }, "Chapter could not be renamed")}><Save /></IconButton><MoveButtons down={sectionIndex === orderedSections.length - 1} label={section.title} onDown={() => moveSection(sectionIndex, 1)} onUp={() => moveSection(sectionIndex, -1)} up={sectionIndex === 0} /><IconButton label={`Delete chapter ${section.title}`} onClick={() => setDeleteTarget({ id: section.id, kind: "section", title: section.title })}><Trash2 /></IconButton></div><ChapterMetadataForm courseId={course.id} duration={section.rolled_duration_minutes} onSaved={(saved) => setSections((items) => items.map((item) => item.id === saved.id ? { ...saved, rolled_duration_minutes: item.rolled_duration_minutes } : item))} section={section} />
            <div className="grid gap-1 p-2">{children.map((lesson, lessonIndex) => <div className={`grid gap-1 p-2 ${selectedLessonId === lesson.id ? "bg-[var(--color-primary-alpha-10)]" : ""}`} key={lesson.id}><button className="truncate text-left text-sm font-medium hover:text-[var(--color-primary-base)]" onClick={() => setSelectedLessonId(lesson.id)} type="button">{lesson.title} · {lesson.estimated_duration_minutes ?? 0}m</button><div className="flex gap-1"><Input aria-label={`Lesson ${lessonIndex + 1} title`} className="min-w-0 flex-1" onChange={(e) => setLessons((items) => items.map((item) => item.id === lesson.id ? { ...item, title: e.target.value } : item))} value={lesson.title} /><IconButton label={`Save lesson ${lesson.title}`} onClick={() => run(async () => { await updateLesson(course.id, lesson.id, { title: lesson.title }); setMessage("Lesson renamed"); }, "Lesson could not be renamed")}><Save /></IconButton><MoveButtons down={lessonIndex === children.length - 1} label={lesson.title} onDown={() => moveLesson(section.id, lessonIndex, 1)} onUp={() => moveLesson(section.id, lessonIndex, -1)} up={lessonIndex === 0} /><IconButton label={`Delete lesson ${lesson.title}`} onClick={() => setDeleteTarget({ id: lesson.id, kind: "lesson", title: lesson.title })}><Trash2 /></IconButton></div></div>)}{children.length === 0 ? <p className="p-2 text-xs text-[var(--color-text-sub-500)]">Add your first lesson</p> : null}</div>
          </div>;
        })}</div>
        <div className="mt-4 grid gap-2 border-t border-[var(--color-stroke-soft-200)] pt-4"><Select aria-label="Chapter for new lesson" onChange={(e) => setNewLessonSectionId(e.target.value)} value={newLessonSectionId}><option value="">Choose chapter</option>{orderedSections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}</Select><div className="flex gap-2"><Input aria-label="New lesson title" onChange={(e) => setNewLessonTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addLesson(); }} placeholder="New lesson" value={newLessonTitle} /><IconButton label="Add lesson" onClick={addLesson}><Plus /></IconButton></div></div>
      </aside>
      <LessonComposer blocks={blocks} courseId={course.id} lesson={selectedLesson} onBlocksChange={setBlocks} onLessonChange={saveLesson} onMessage={setMessage} />
    </div>}
    <Dialog description={deleteTarget?.kind === "section" ? "Deleting this chapter also removes all of its lessons and content blocks." : "Deleting this lesson also removes all of its content blocks."} onClose={() => setDeleteTarget(null)} open={deleteTarget !== null} title={`Delete ${deleteTarget?.title ?? "item"}?`}><div className="flex justify-end gap-2"><Button onClick={() => setDeleteTarget(null)} variant="secondary">Cancel</Button><Button isProcessing={pending} onClick={confirmDelete}>Delete</Button></div></Dialog>
  </main>;
}

function sectionValue(section: CourseStructure["sections"][number]): BuilderSection { return { course_id: section.course_id, description: section.description, id: section.id, image_url: section.image_url, position: section.position, rolled_duration_minutes: section.rolled_duration_minutes, title: section.title }; }
function lessonValue(lesson: CourseStructure["sections"][number]["lessons"][number]): Lesson { return { body: lesson.body, course_id: lesson.course_id, estimated_duration_minutes: lesson.estimated_duration_minutes, id: lesson.id, image_url: lesson.image_url, position: lesson.position, required_for_completion: lesson.required_for_completion, section_id: lesson.section_id, summary: lesson.summary, title: lesson.title }; }
function byPosition<T extends { position: number }>(a: T, b: T) { return a.position - b.position; }
function move<T>(items: T[], index: number, direction: -1 | 1) { const next = [...items]; const target = index + direction; if (target < 0 || target >= next.length) return next; [next[index], next[target]] = [next[target], next[index]]; return next; }
function IconButton({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) { return <Button aria-label={label} iconOnly onClick={onClick} size="x-small" variant="secondary">{children}</Button>; }
function MoveButtons({ down, label, onDown, onUp, up }: { down: boolean; label: string; onDown: () => void; onUp: () => void; up: boolean }) { return <><Button aria-label={`Move ${label} up`} disabled={up} iconOnly onClick={onUp} size="x-small" variant="secondary"><ArrowUp /></Button><Button aria-label={`Move ${label} down`} disabled={down} iconOnly onClick={onDown} size="x-small" variant="secondary"><ArrowDown /></Button></>; }
