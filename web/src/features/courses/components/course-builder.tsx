"use client";

import { BadgeCheck, CircleAlert, Layers3 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { BlockForm } from "./course-builder/BlockForm";
import { CourseDetailsForm } from "./course-builder/CourseDetailsForm";
import { CourseStatus } from "./course-builder/CourseStatus";
import { LessonForm } from "./course-builder/LessonForm";
import { MediaForm } from "./course-builder/MediaForm";
import { SectionForm } from "./course-builder/SectionForm";
import { DeniedState } from "@/components/app/denied-state";
import { Button } from "@/components/ui/button";
import { publishCourse } from "../api";
import { canAuthorCourse } from "@/lib/permissions";
import type { CourseRole } from "@/lib/schemas/common";
import type { Block, Course, Lesson, MediaAsset, Section } from "../schemas";

type CourseBuilderProps = { course: Course; courseRole?: CourseRole };

export function CourseBuilder({ course: initialCourse, courseRole = "course_owner" }: CourseBuilderProps) {
  const [course, setCourse] = useState(initialCourse);
  const [sections, setSections] = useState<Section[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectedSectionLessons = useMemo(() => lessons.filter((lesson) => lesson.section_id === selectedSectionId), [lessons, selectedSectionId]);

  function handlePublish() {
    startTransition(async () => {
      try { const response = await publishCourse(course.id); setCourse(response.data); setMessage("Course published"); }
      catch (error) { setMessage(errorMessage(error, "Course could not be published")); }
    });
  }

  if (!canAuthorCourse(courseRole)) return <DeniedState description="Authoring this course is available to its course owner. You can still use the learner course player for courses you are enrolled in." title="This course is not yours to edit" />;

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl content-start gap-5 px-5 py-5">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div><Link className="text-sm text-gray-600 hover:text-[var(--primary)]" href="/admin/courses">Courses</Link><h1 className="mt-1 text-xl font-semibold">{course.title}</h1><p className="mt-1 text-sm text-gray-600">{course.description ?? course.slug}</p></div>
        <div className="flex items-center gap-2"><CourseStatus status={course.status} /><Button className="gap-2" isProcessing={isPending} onClick={handlePublish} processingLabel="Publishing..."><BadgeCheck aria-hidden="true" className="size-4" />Publish</Button></div>
      </header>
      {message ? <div className="flex items-start gap-2 border border-[var(--border)] bg-white px-4 py-3 text-sm text-gray-700"><CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" /><span>{message}</span></div> : null}
      <section className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)_300px]">
        <aside className="grid content-start gap-4">
          <CourseDetailsForm course={course} onSaved={(updatedCourse) => { setCourse(updatedCourse); setMessage("Course details saved"); }} />
          <MediaForm courseId={course.id} onCreated={(asset) => { setMedia((current) => [asset, ...current]); setMessage("Media metadata saved"); }} />
        </aside>
        <section className="grid content-start gap-4">
          <SectionForm courseId={course.id} position={sections.length} onCreated={(section) => { setSections((current) => [...current, section]); setSelectedSectionId(section.id); setMessage("Section added"); }} />
          <div className="grid gap-3">
            {sections.map((section, index) => { const sectionLessons = lessons.filter((lesson) => lesson.section_id === section.id); return <article className="border border-[var(--border)] bg-white" key={section.id}><button className="flex w-full items-center justify-between gap-3 border-b border-[var(--border)] bg-gray-50 px-4 py-3 text-left" onClick={() => setSelectedSectionId(section.id)} type="button"><span className="text-sm font-semibold">{index + 1}. {section.title}</span><Layers3 aria-hidden="true" className="size-4 text-gray-500" /></button><div className="divide-y divide-[var(--border)]">{sectionLessons.map((lesson) => <button className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50" key={lesson.id} onClick={() => setSelectedLessonId(lesson.id)} type="button"><span className="min-w-0 truncate text-sm">{lesson.title}</span><span className="text-xs text-gray-500">{blocks.filter((block) => block.lesson_id === lesson.id).length} blocks</span></button>)}{sectionLessons.length === 0 ? <div className="px-4 py-4 text-sm text-gray-600">No lessons</div> : null}</div></article>; })}
            {sections.length === 0 ? <div className="border border-[var(--border)] bg-white px-4 py-10 text-center text-sm text-gray-600">No sections</div> : null}
          </div>
        </section>
        <aside className="grid content-start gap-4">
          <LessonForm courseId={course.id} disabled={sections.length === 0} lessons={lessons} onCreated={(lesson) => { setLessons((current) => [...current, lesson]); setSelectedLessonId(lesson.id); setMessage("Lesson added"); }} onSectionChange={setSelectedSectionId} sections={sections} selectedSectionId={selectedSectionId} />
          <BlockForm blocks={blocks} courseId={course.id} disabled={lessons.length === 0} lessons={selectedSectionLessons} onCreated={(block) => { setBlocks((current) => [...current, block]); setMessage("Block added"); }} onLessonChange={setSelectedLessonId} selectedLessonId={selectedLessonId} />
          <section className="border border-[var(--border)] bg-white"><div className="border-b border-[var(--border)] px-4 py-3"><h2 className="text-sm font-semibold">Assets</h2></div><div className="divide-y divide-[var(--border)]">{media.map((asset) => <article className="px-4 py-3" key={asset.id}><p className="truncate text-sm font-medium">{asset.file_name}</p><p className="mt-1 text-xs text-gray-500">{asset.content_type}</p></article>)}{media.length === 0 ? <div className="px-4 py-4 text-sm text-gray-600">No assets</div> : null}</div></section>
        </aside>
      </section>
    </main>
  );
}

function errorMessage(error: unknown, fallback: string) { return error instanceof Error ? error.message : fallback; }
