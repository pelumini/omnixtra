"use client";

import { ArrowLeft, ArrowRight, BookOpen, Download, FileText } from "lucide-react";
import Image from "next/image";
import { Fragment, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

import { getMediaUrl } from "../../api";
import { formatBytes, uploadedMediaFromReference } from "../MediaUploadField";

import type { Block, Course, Lesson, Section } from "../../schemas";
import type { ReactNode } from "react";

type BuilderSection = Section & { rolled_duration_minutes: number };
type MediaDetails = { byteSize?: number; fileName?: string; url: string };
type MediaState = { details?: MediaDetails; error?: string; loading: boolean };

const mediaCache = new Map<string, Promise<MediaDetails>>();

export function LearnerPreview({
  blocks,
  course,
  initialLessonId,
  lessons,
  onBack,
  sections,
}: {
  blocks: Block[];
  course: Course;
  initialLessonId: string;
  lessons: Lesson[];
  onBack: () => void;
  sections: BuilderSection[];
}) {
  const orderedSections = useMemo(
    () => [...sections].sort(byPosition),
    [sections],
  );
  const orderedLessons = useMemo(
    () =>
      orderedSections.flatMap((section) =>
        lessons
          .filter((lesson) => lesson.section_id === section.id)
          .sort(byPosition)
          .map((lesson) => ({ lesson, section })),
      ),
    [lessons, orderedSections],
  );
  const [selectedLessonId, setSelectedLessonId] = useState(
    initialLessonId || orderedLessons[0]?.lesson.id || "",
  );
  const selectedIndex = Math.max(
    0,
    orderedLessons.findIndex(({ lesson }) => lesson.id === selectedLessonId),
  );
  const selected = orderedLessons[selectedIndex];
  const lessonBlocks = useMemo(
    () =>
      blocks
        .filter((block) => block.lesson_id === selected?.lesson.id)
        .sort(byPosition),
    [blocks, selected?.lesson.id],
  );

  return (
    <main className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[var(--color-bg-weak-100)] text-[var(--color-text-main-900)]">
      <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--color-primary-alpha-10)] text-[var(--color-primary-base)]">
            <BookOpen aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-[var(--color-primary-base)]">
              Learner preview
            </p>
            <h1 className="truncate text-base font-semibold">{course.title}</h1>
          </div>
        </div>
        <Button className="gap-2" onClick={onBack} variant="secondary">
          <ArrowLeft aria-hidden="true" /> Back to editing
        </Button>
      </header>

      {orderedLessons.length === 0 ? (
        <div className="grid min-h-0 flex-1 place-items-center p-6 text-center">
          <div>
            <BookOpen aria-hidden="true" className="mx-auto size-8 text-[var(--color-primary-base)]" />
            <h2 className="mt-3 text-lg font-semibold">Nothing to preview yet</h2>
            <p className="mt-1 text-sm text-[var(--color-text-sub-500)]">Add a lesson to begin.</p>
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 overflow-auto lg:grid-cols-[18rem_minmax(0,1fr)] lg:overflow-hidden">
          <nav aria-label="Course lessons" className="border-b border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] p-4 lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <h2 className="text-sm font-semibold">Course outline</h2>
            <div className="mt-4 grid gap-4">
              {orderedSections.map((section) => (
                <section key={section.id}>
                  <h3 className="mb-1 text-xs font-semibold uppercase text-[var(--color-text-sub-500)]">{section.title}</h3>
                  <div className="grid gap-1">
                    {orderedLessons
                      .filter((item) => item.section.id === section.id)
                      .map(({ lesson }) => (
                        <button
                          aria-current={lesson.id === selected?.lesson.id ? "page" : undefined}
                          className={`min-h-10 rounded-[6px] px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] ${lesson.id === selected?.lesson.id ? "bg-[var(--color-primary-alpha-10)] font-semibold text-[var(--color-primary-base)]" : "hover:bg-[var(--color-bg-weak-100)]"}`}
                          key={lesson.id}
                          onClick={() => setSelectedLessonId(lesson.id)}
                          type="button"
                        >
                          {lesson.title}
                        </button>
                      ))}
                  </div>
                </section>
              ))}
            </div>
          </nav>

          <div className="min-h-0 overflow-y-auto">
            <article className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
              <p className="text-xs font-semibold uppercase text-[var(--color-primary-base)]">{selected.section.title}</p>
              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">{selected.lesson.title}</h2>
              {selected.lesson.summary ? <p className="mt-3 text-base leading-7 text-[var(--color-text-sub-500)]">{selected.lesson.summary}</p> : null}
              {selected.lesson.image_url ? <ResolvedMedia assetId={assetIdFromReference(selected.lesson.image_url)} courseId={course.id}>{(media) => <Image alt="" className="mt-6 aspect-video w-full rounded-[8px] bg-[var(--color-bg-soft-200)] object-cover" height={675} src={media.url} unoptimized width={1200} />}</ResolvedMedia> : null}
              <div className="mt-8 grid gap-8">
                {lessonBlocks.map((block) => <PreviewBlock block={block} courseId={course.id} key={block.id} />)}
                {lessonBlocks.length === 0 ? <div className="border-y border-[var(--color-stroke-soft-200)] py-10 text-center text-sm text-[var(--color-text-sub-500)]">This lesson has no content yet.</div> : null}
              </div>
              <footer className="mt-12 flex items-center justify-between gap-3 border-t border-[var(--color-stroke-soft-200)] pt-5">
                <Button disabled={selectedIndex === 0} onClick={() => setSelectedLessonId(orderedLessons[selectedIndex - 1].lesson.id)} variant="secondary"><ArrowLeft aria-hidden="true" /> Previous lesson</Button>
                <span className="text-xs text-[var(--color-text-sub-500)]">{selectedIndex + 1} of {orderedLessons.length}</span>
                <Button disabled={selectedIndex === orderedLessons.length - 1} onClick={() => setSelectedLessonId(orderedLessons[selectedIndex + 1].lesson.id)} variant="secondary">Next lesson <ArrowRight aria-hidden="true" /></Button>
              </footer>
            </article>
          </div>
        </div>
      )}
    </main>
  );
}

function PreviewBlock({ block, courseId }: { block: Block; courseId: string }) {
  const content = block.content;
  if (content.type === "text") return <SafeMarkdown markdown={content.markdown} />;
  if (content.type === "quiz") return <section aria-label="Quiz preview" className="rounded-[8px] border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] p-5"><p className="text-xs font-semibold uppercase text-[var(--color-primary-base)]">Quiz preview</p><h3 className="mt-2 text-lg font-semibold">{content.question}</h3><ol className="mt-4 grid gap-2">{content.options.map((option, index) => <li className="rounded-[6px] border border-[var(--color-stroke-soft-200)] px-3 py-2 text-sm" key={option.id}>{String.fromCharCode(65 + index)}. {option.text}</li>)}</ol><p className="mt-3 text-xs text-[var(--color-text-sub-500)]">Responses are disabled in preview.</p></section>;
  return <ResolvedMedia assetId={content.asset_id ?? assetIdFromReference(content.object_key ?? content.url)} courseId={courseId}>{(media) => {
    if (content.type === "image") return <figure className="grid gap-2"><div className="aspect-video overflow-hidden rounded-[8px] bg-[var(--color-bg-soft-200)]"><Image alt={content.alt_text} className="h-full w-full object-contain" height={675} src={media.url} unoptimized width={1200} /></div></figure>;
    if (content.type === "video") return <figure className="grid gap-2"><video aria-label={content.caption ?? "Course video"} className="aspect-video w-full rounded-[8px] bg-[var(--color-bg-strong-900)] object-contain" controls preload="metadata" src={media.url} />{content.caption ? <figcaption className="text-sm text-[var(--color-text-sub-500)]">{content.caption}</figcaption> : null}</figure>;
    if (content.type === "audio") return <figure className="grid gap-2"><audio aria-label={content.caption ?? "Course audio"} className="w-full" controls preload="metadata" src={media.url} />{content.caption ? <figcaption className="text-sm text-[var(--color-text-sub-500)]">{content.caption}</figcaption> : null}</figure>;
    return <div className="flex items-center gap-3 rounded-[8px] border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] p-4"><FileText aria-hidden="true" className="size-6 shrink-0 text-[var(--color-primary-base)]" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{media.fileName ?? content.file_name}</p>{media.byteSize ? <p className="text-xs text-[var(--color-text-sub-500)]">{formatBytes(media.byteSize)}</p> : null}</div><a className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary-base)] hover:underline" href={media.url} rel="noopener noreferrer" target="_blank">View <Download aria-hidden="true" className="size-4" /></a></div>;
  }}</ResolvedMedia>;
}

function ResolvedMedia({ assetId, children, courseId }: { assetId: string | null; children: (details: MediaDetails) => ReactNode; courseId: string }) {
  const [state, setState] = useState<MediaState>({ loading: Boolean(assetId) });
  useEffect(() => {
    if (!assetId) { setState({ error: "Media is not attached.", loading: false }); return; }
    setState({ loading: true });
    let active = true;
    const key = `${courseId}:${assetId}`;
    let request = mediaCache.get(key);
    if (!request) {
      request = getMediaUrl(courseId, assetId).then(({ data }) => ({ byteSize: data.byte_size, fileName: data.file_name, url: data.url }));
      mediaCache.set(key, request);
    }
    void request.then((details) => { if (active) setState({ details, loading: false }); }).catch(() => { mediaCache.delete(key); if (active) setState({ error: "Media could not be loaded.", loading: false }); });
    return () => { active = false; };
  }, [assetId, courseId]);
  if (state.loading) return <div aria-label="Loading media" className="aspect-video animate-pulse rounded-[8px] bg-[var(--color-bg-soft-200)]" role="status" />;
  if (state.error || !state.details) return <div className="grid min-h-24 place-items-center rounded-[8px] border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] p-4 text-sm text-[var(--color-state-error)]" role="alert">{state.error ?? "Media unavailable."}</div>;
  return children(state.details);
}

function SafeMarkdown({ markdown }: { markdown: string }) {
  const lines = markdown.split(/\r?\n/);
  return <div className="grid gap-3 text-base leading-7">{lines.map((line, index) => {
    if (line.startsWith("### ")) return <h4 className="text-lg font-semibold" key={index}>{inlineMarkdown(line.slice(4))}</h4>;
    if (line.startsWith("## ")) return <h3 className="text-xl font-semibold" key={index}>{inlineMarkdown(line.slice(3))}</h3>;
    if (line.startsWith("# ")) return <h3 className="text-2xl font-semibold" key={index}>{inlineMarkdown(line.slice(2))}</h3>;
    if (/^[-*] /.test(line)) return <p className="pl-5 before:mr-2 before:content-['•']" key={index}>{inlineMarkdown(line.slice(2))}</p>;
    if (!line.trim()) return <span aria-hidden="true" className="h-1" key={index} />;
    return <p key={index}>{inlineMarkdown(line)}</p>;
  })}</div>;
}

function inlineMarkdown(value: string): ReactNode[] {
  const pattern = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g;
  return value.split(pattern).filter(Boolean).map((part, index) => {
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) return safeUrl(link[2]) ? <a className="text-[var(--color-primary-base)] underline" href={link[2]} key={index} rel="noopener noreferrer" target="_blank">{link[1]}</a> : <Fragment key={index}>{link[1]}</Fragment>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code className="rounded-[4px] bg-[var(--color-bg-soft-200)] px-1 py-0.5 text-sm" key={index}>{part.slice(1, -1)}</code>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function safeUrl(value: string) { try { const url = new URL(value, "https://preview.invalid"); return ["http:", "https:", "mailto:"].includes(url.protocol); } catch { return false; } }
function assetIdFromReference(reference: string | null | undefined) { return reference ? uploadedMediaFromReference(reference, "Media")?.assetId ?? null : null; }
function byPosition<T extends { position: number }>(a: T, b: T) { return a.position - b.position; }
