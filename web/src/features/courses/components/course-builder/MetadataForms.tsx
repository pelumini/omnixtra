"use client";

import { useEffect, useRef, useState } from "react";

import { Input, Select, Textarea } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";

import { updateLesson, updateSection } from "../../api";
import { MediaUploadField, uploadedMediaFromReference } from "../MediaUploadField";

import { ErrorSaveStatus } from "./SaveStatus";
import { useAutosave, type SaveState } from "./useAutosave";

import type { Lesson, LessonUpdateRequest, Section, SectionUpdateRequest } from "../../schemas";

type StatusReporter = (key: string, state: SaveState) => void;

export function ChapterMetadataForm({ courseId, duration, onSaved, onStatusChange, section }: {
  courseId: string; duration: number; onSaved: (value: Section) => void;
  onStatusChange?: StatusReporter; section: Section;
}) {
  const initial = chapterPayload(section);
  const [details, setDetails] = useState(initial);
  const autosave = useAutosave({
    initialValue: initial,
    onSaved: (value) => onSaved({ ...section, ...value }),
    onStatusChange: (state) => onStatusChange?.(`section:${section.id}:details`, state),
    save: async (value) => chapterPayload((await updateSection(courseId, section.id, value)).data),
  });
  const autosaveStatus = useRef(autosave.status);
  autosaveStatus.current = autosave.status;
  useEffect(() => {
    if (autosaveStatus.current !== "dirty" && autosaveStatus.current !== "saving") setDetails(chapterPayload(section));
  }, [section]);
  function change(next: SectionUpdateRequest, immediate = false) {
    const value = { ...details, ...next }; setDetails(value); autosave.schedule(value, immediate);
  }
  return <div className="grid gap-2 border-t border-[var(--color-stroke-soft-200)] p-2" onBlur={() => void autosave.flush()}>
    <div className="flex items-center justify-between gap-2"><p className="text-xs text-[var(--color-text-sub-500)]">{duration} min chapter total</p><ErrorSaveStatus onRetry={autosave.retry} state={autosave.status} /></div>
    <Textarea aria-label={`${section.title} description`} maxLength={2000} onChange={(event) => change({ description: event.target.value || null })} placeholder="Chapter description" rows={2} value={details.description ?? ""} />
    <MediaUploadField courseId={courseId} kind="thumbnail" label="Chapter Thumbnail" onChange={(media) => change({ image_url: media?.objectKey ?? null }, true)} value={uploadedMediaFromReference(details.image_url ?? "", "Chapter thumbnail")} />
  </div>;
}

export function LessonMetadataForm({ courseId, lesson, onSaved, onStatusChange }: {
  courseId: string; lesson: Lesson; onSaved: (value: Lesson) => void; onStatusChange?: StatusReporter;
}) {
  const initial = lessonPayload(lesson);
  const [details, setDetails] = useState(initial);
  const [duration, setDuration] = useState(lesson.estimated_duration_minutes === null ? "" : String(lesson.estimated_duration_minutes));
  const [unit, setUnit] = useState<"minutes" | "hours">("minutes");
  const autosave = useAutosave({
    initialValue: initial,
    onSaved: (value) => onSaved({ ...lesson, ...value }),
    onStatusChange: (state) => onStatusChange?.(`lesson:${lesson.id}:details`, state),
    save: async (value) => lessonPayload((await updateLesson(courseId, lesson.id, value)).data),
  });
  useEffect(() => { const value = lessonPayload(lesson); setDetails(value); setDuration(lesson.estimated_duration_minutes === null ? "" : String(lesson.estimated_duration_minutes)); setUnit("minutes"); }, [lesson]);
  function change(next: LessonUpdateRequest, immediate = false) {
    const value = { ...details, ...next }; setDetails(value); autosave.schedule(value, immediate);
  }
  function durationValue(raw: string, nextUnit = unit) {
    setDuration(raw); change({ estimated_duration_minutes: raw === "" ? null : Math.round(Number(raw) * (nextUnit === "hours" ? 60 : 1)) });
  }
  return <section className="mb-6 grid gap-3 border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] p-4" onBlur={() => void autosave.flush()}>
    <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">Lesson details</h2><ErrorSaveStatus onRetry={autosave.retry} state={autosave.status} /></div>
    <Textarea aria-label="Lesson summary" maxLength={2000} onChange={(event) => change({ summary: event.target.value || null })} placeholder="Lesson summary" rows={3} value={details.summary ?? ""} />
    <MediaUploadField courseId={courseId} kind="thumbnail" label="Lesson Thumbnail" onChange={(media) => change({ image_url: media?.objectKey ?? null }, true)} value={uploadedMediaFromReference(details.image_url ?? "", "Lesson thumbnail")} />
    <div className="grid grid-cols-[minmax(0,1fr)_8rem] gap-2"><Input aria-label="Estimated duration" min="0" onChange={(event) => durationValue(event.target.value)} type="number" value={duration} /><Select aria-label="Duration unit" onChange={(event) => { const next = event.target.value as "minutes" | "hours"; setUnit(next); durationValue(duration, next); queueMicrotask(() => void autosave.flush()); }} value={unit}><option value="minutes">Minutes</option><option value="hours">Hours</option></Select></div>
    <Toggle checked={details.required_for_completion} label="Required for completion" onChange={(event) => change({ required_for_completion: event.target.checked }, true)} />
  </section>;
}

function chapterPayload(section: Section): SectionUpdateRequest { return { description: section.description, image_url: section.image_url }; }
function lessonPayload(lesson: Lesson): LessonUpdateRequest { return { estimated_duration_minutes: lesson.estimated_duration_minutes, image_url: lesson.image_url, required_for_completion: lesson.required_for_completion, summary: lesson.summary }; }
