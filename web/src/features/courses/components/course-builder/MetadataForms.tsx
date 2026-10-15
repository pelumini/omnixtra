"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";

import { updateLesson, updateSection } from "../../api";

import type { Lesson, Section } from "../../schemas";

export function ChapterMetadataForm({ courseId, duration, onSaved, section }: { courseId: string; duration: number; onSaved: (value: Section) => void; section: Section }) {
  const [description, setDescription] = useState(section.description ?? "");
  const [imageUrl, setImageUrl] = useState(section.image_url ?? "");
  useEffect(() => { setDescription(section.description ?? ""); setImageUrl(section.image_url ?? ""); }, [section]);
  return <div className="grid gap-2 border-t border-[var(--color-stroke-soft-200)] p-2"><p className="text-xs text-[var(--color-text-sub-500)]">{duration} min chapter total</p><Textarea aria-label={`${section.title} description`} maxLength={2000} onChange={(event) => setDescription(event.target.value)} placeholder="Chapter description" rows={2} value={description} /><Input aria-label={`${section.title} image URL`} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://example.com/chapter.jpg" type="url" value={imageUrl} /><Button onClick={async () => onSaved((await updateSection(courseId, section.id, { description: description || null, image_url: imageUrl || null })).data)} size="x-small" variant="secondary">Save chapter details</Button></div>;
}

export function LessonMetadataForm({ courseId, lesson, onSaved }: { courseId: string; lesson: Lesson; onSaved: (value: Lesson) => void }) {
  const [summary, setSummary] = useState(lesson.summary ?? ""); const [imageUrl, setImageUrl] = useState(lesson.image_url ?? ""); const [duration, setDuration] = useState(lesson.estimated_duration_minutes === null ? "" : String(lesson.estimated_duration_minutes)); const [unit, setUnit] = useState<"minutes" | "hours">("minutes"); const [required, setRequired] = useState(lesson.required_for_completion);
  useEffect(() => { setSummary(lesson.summary ?? ""); setImageUrl(lesson.image_url ?? ""); setDuration(lesson.estimated_duration_minutes === null ? "" : String(lesson.estimated_duration_minutes)); setUnit("minutes"); setRequired(lesson.required_for_completion); }, [lesson]);
  return <section className="mb-6 grid gap-3 border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] p-4"><h2 className="text-sm font-semibold">Lesson details</h2><Textarea aria-label="Lesson summary" maxLength={2000} onChange={(event) => setSummary(event.target.value)} placeholder="Lesson summary" rows={3} value={summary} /><Input aria-label="Lesson image URL" onChange={(event) => setImageUrl(event.target.value)} placeholder="https://example.com/lesson.jpg" type="url" value={imageUrl} /><div className="grid grid-cols-[minmax(0,1fr)_8rem] gap-2"><Input aria-label="Estimated duration" min="0" onChange={(event) => setDuration(event.target.value)} type="number" value={duration} /><select aria-label="Duration unit" className="rounded-md border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] px-3" onChange={(event) => setUnit(event.target.value as "minutes" | "hours")} value={unit}><option value="minutes">Minutes</option><option value="hours">Hours</option></select></div><Toggle checked={required} label="Required for completion" onChange={(event) => setRequired(event.target.checked)} /><Button onClick={async () => onSaved((await updateLesson(courseId, lesson.id, { estimated_duration_minutes: duration === "" ? null : Math.round(Number(duration) * (unit === "hours" ? 60 : 1)), image_url: imageUrl || null, required_for_completion: required, summary: summary || null })).data)}>Save lesson details</Button></section>;
}
