"use client";

import { File, Headphones, Image, Plus, Type, Video } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";

import { createBlock, deleteBlock, reorderBlocks, updateBlock } from "../../api";
import { MediaUploadField } from "../MediaUploadField";

import { ErrorSaveStatus } from "./SaveStatus";
import { useAutosave, type SaveState } from "./useAutosave";

import type { Block, BlockContent, Lesson } from "../../schemas";

export type LessonComposerActions = {
  deleteBlock: (blockId: string) => void;
  moveBlock: (blockId: string, direction: -1 | 1) => void;
  openAddContent: () => void;
};

type ComposerType = "text" | "image" | "video" | "audio" | "file";
type Props = {
  blocks: Block[];
  courseId: string;
  lesson: Lesson | null;
  onBlocksChange: (blocks: Block[]) => void;
  onLessonChange: (lesson: Lesson) => void;
  onMessage: (message: string) => void;
  actionsRef: { current: LessonComposerActions | null };
  onSelectedBlockChange: (blockId: string | null) => void;
  onStatusChange?: (key: string, state: SaveState) => void;
  selectedBlockId: string | null;
};

const choices = [
  { icon: Type, label: "Text", type: "text" },
  { icon: Image, label: "Image", type: "image" },
  { icon: Video, label: "Video", type: "video" },
  { icon: Headphones, label: "Audio", type: "audio" },
  { icon: File, label: "File", type: "file" },
] as const;

export function LessonComposer({ actionsRef, blocks, courseId, lesson, onBlocksChange, onMessage, onSelectedBlockChange, onStatusChange, selectedBlockId }: Props) {
  const [pickerPosition, setPickerPosition] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Block | null>(null);
  const [revealBlockId, setRevealBlockId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const blockRefs = useRef(new Map<string, HTMLElement>());
  const lessonBlocks = useMemo(() => lesson
    ? blocks.filter((block) => block.lesson_id === lesson.id).sort(byPosition)
    : [], [blocks, lesson]);

  function add(type: ComposerType) {
    if (!lesson) return;
    startTransition(async () => {
      try {
        const insertionPosition = pickerPosition ?? lessonBlocks.length;
        const response = await createBlock(courseId, {
          block_type: type,
          content: emptyContent(type),
          lesson_id: lesson.id,
          position: lessonBlocks.length,
        });
        const reordered = [...lessonBlocks];
        reordered.splice(insertionPosition, 0, response.data);
        if (insertionPosition < lessonBlocks.length) {
          await reorderBlocks(courseId, lesson.id, reordered.map(({ id }) => id));
        }
        const positioned = reordered.map((block, position) => ({ ...block, position }));
        onBlocksChange(blocks.filter((block) => block.lesson_id !== lesson.id).concat(positioned));
        onSelectedBlockChange(response.data.id);
        setPickerPosition(null);
        setRevealBlockId(response.data.id);
        onMessage(`${labelFor(type)} block added`);
      } catch (error) {
        onMessage(error instanceof Error ? error.message : "Content could not be added");
      }
    });
  }

  function moveBlock(index: number, direction: -1 | 1) {
    if (!lesson) return;
    const previous = [...blocks];
    const reordered = move(lessonBlocks, index, direction).map((block, position) => ({
      ...block,
      position,
    }));
    onBlocksChange(blocks.filter((block) => block.lesson_id !== lesson.id).concat(reordered));
    startTransition(async () => {
      try {
        await reorderBlocks(courseId, lesson.id, reordered.map(({ id }) => id));
        onMessage("Content order saved");
      } catch (error) {
        onBlocksChange(previous);
        onMessage(error instanceof Error ? error.message : "Content order could not be saved");
      }
    });
  }

  function confirmDelete() {
    if (!lesson || !deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteBlock(courseId, lesson.id, deleteTarget.id);
        onBlocksChange(blocks.filter(({ id }) => id !== deleteTarget.id));
        setDeleteTarget(null);
        onMessage("Content block deleted");
      } catch (error) {
        onMessage(error instanceof Error ? error.message : "Content could not be deleted");
      }
    });
  }

  actionsRef.current = {
    deleteBlock: (blockId) => {
      const block = lessonBlocks.find(({ id }) => id === blockId);
      if (block) setDeleteTarget(block);
    },
    moveBlock: (blockId, direction) => {
      const index = lessonBlocks.findIndex(({ id }) => id === blockId);
      if (index >= 0) moveBlock(index, direction);
    },
    openAddContent: () => {
      const selectedIndex = lessonBlocks.findIndex(({ id }) => id === selectedBlockId);
      setPickerPosition(selectedIndex >= 0 ? selectedIndex + 1 : lessonBlocks.length);
    },
  };

  useEffect(() => {
    if (!revealBlockId) return;
    const container = scrollContainerRef.current;
    const block = blockRefs.current.get(revealBlockId);
    if (!container || !block) return;
    const containerRect = container.getBoundingClientRect();
    const blockRect = block.getBoundingClientRect();
    if (blockRect.top < containerRect.top) {
      container.scrollTop += blockRect.top - containerRect.top;
    } else if (blockRect.bottom > containerRect.bottom) {
      container.scrollTop += blockRect.bottom - containerRect.bottom;
    }
    setRevealBlockId(null);
  }, [lessonBlocks, revealBlockId]);

  if (!lesson) {
    return <EmptyState title="Add your first lesson" body="Choose a chapter, then add a lesson to start composing." />;
  }

  return (
    <section className="min-h-0 min-w-0 overflow-y-auto p-4 pb-8 sm:p-6 sm:pb-10 lg:p-8 lg:pb-12" ref={scrollContainerRef}>
      <div className="mx-auto max-w-3xl">
        <div className="grid gap-4">
          {pickerPosition === 0 ? <ContentPicker disabled={pending} onAdd={add} /> : null}
          {lessonBlocks.map((block, index) => <div className="grid gap-4" key={block.id}>
            <div ref={(element) => { if (element) blockRefs.current.set(block.id, element); else blockRefs.current.delete(block.id); }}><BlockEditor block={block} courseId={courseId} onChange={(next) => onBlocksChange(blocks.map((item) => item.id === next.id ? next : item))} onSelect={() => onSelectedBlockChange(block.id)} onStatusChange={onStatusChange} selected={selectedBlockId === block.id} /></div>
            {pickerPosition === index + 1 ? <ContentPicker disabled={pending} onAdd={add} /> : null}
            {selectedBlockId === block.id && pickerPosition !== index + 1 ? <InlineAddButton onClick={() => setPickerPosition(index + 1)} /> : null}
          </div>)}
          {lessonBlocks.length === 0 && pickerPosition === null ? <EmptyState body="Text, media, and files can be mixed in any order." onClick={() => setPickerPosition(0)} title="Add your first content block" /> : null}
          {lessonBlocks.length > 0 && selectedBlockId !== lessonBlocks.at(-1)?.id && pickerPosition !== lessonBlocks.length ? <InlineAddButton onClick={() => setPickerPosition(lessonBlocks.length)} /> : null}
        </div>
      </div>
      <Dialog description="This removes the block from the lesson. This action cannot be undone." onClose={() => setDeleteTarget(null)} open={deleteTarget !== null} title="Delete content block?">
        <div className="flex justify-end gap-2">
          <Button onClick={() => setDeleteTarget(null)} variant="secondary">Cancel</Button>
          <Button isProcessing={pending} onClick={confirmDelete}>Delete</Button>
        </div>
      </Dialog>
    </section>
  );
}

function BlockEditor({ block, courseId, onChange, onSelect, onStatusChange, selected }: {
  block: Block; courseId: string; onChange: (block: Block) => void; onSelect: () => void;
  onStatusChange?: (key: string, state: SaveState) => void; selected: boolean;
}) {
  const [content, setContent] = useState<BlockContent>(block.content);
  const mediaReady = content.type === "text" || content.type === "quiz"
    || Boolean(content.url && content.asset_id && content.object_key);
  const autosave = useAutosave({
    initialValue: block.content,
    onSaved: (saved) => onChange({ ...block, content: saved }),
    onStatusChange: (state) => onStatusChange?.(`block:${block.id}`, state),
    save: async (value) => (await updateBlock(courseId, block.lesson_id, block.id, value)).data.content,
    validate: (value) => value.type === "text" ? typeof value.markdown === "string" : value.type === "quiz" || Boolean(value.url && value.asset_id && value.object_key),
  });
  const autosaveStatus = useRef(autosave.status);
  autosaveStatus.current = autosave.status;
  useEffect(() => {
    if (autosaveStatus.current !== "dirty" && autosaveStatus.current !== "saving") setContent(block.content);
  }, [block]);
  function change(value: BlockContent, immediate = false) {
    setContent(value); autosave.schedule(value, immediate);
  }
  return (
    <article aria-label={`Select ${labelFor(block.block_type)} block`} className={`border bg-[var(--color-bg-white-0)] shadow-[var(--shadow-x-small)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] ${selected ? "border-[var(--color-primary-base)] ring-2 ring-[var(--color-primary-alpha-10)]" : "border-[var(--color-stroke-soft-200)]"}`} onClick={onSelect} onFocusCapture={onSelect} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect(); }} tabIndex={0}>
      <header className="flex items-center justify-between gap-3 border-b border-[var(--color-stroke-soft-200)] px-4 py-3">
        <span className="text-sm font-semibold text-[var(--color-text-main-900)]">{labelFor(block.block_type as ComposerType)}</span>
      </header>
      <div className="grid gap-3 p-4" onBlur={() => void autosave.flush()}>{contentFields(content, change, courseId)}</div>
      <footer className="flex justify-end border-t border-[var(--color-stroke-soft-200)] px-4 py-3">
        {!mediaReady ? <span className="mr-auto text-xs text-[var(--color-state-error)]">Upload a file before this block can be saved.</span> : null}
        {mediaReady ? <ErrorSaveStatus onRetry={autosave.retry} state={autosave.status} /> : null}
      </footer>
    </article>
  );
}

function contentFields(content: BlockContent, setContent: (value: BlockContent, immediate?: boolean) => void, courseId: string) {
  if (content.type === "text") return <Textarea aria-label="Text content" maxLength={20000} onChange={(event) => setContent({ type: "text", markdown: event.target.value })} placeholder="Start writing..." rows={8} value={content.markdown ?? ""} />;
  if (content.type === "quiz") return <Textarea aria-label="Quiz question" maxLength={1000} onChange={(e) => setContent({ ...content, question: e.target.value })} rows={4} value={content.question} />;
  const uploaded = content.asset_id ? { assetId: content.asset_id, deliveryUrl: "", fileName: content.type === "file" ? content.file_name : `${content.type} upload`, objectKey: content.object_key ?? content.url } : null;
  const upload = <MediaUploadField courseId={courseId} kind={content.type} label={`${labelFor(content.type)} File`} onChange={(media) => setContent(media ? { ...content, asset_id: media.assetId, object_key: media.objectKey, url: media.objectKey } : { ...content, asset_id: null, object_key: null, url: "" }, true)} value={uploaded} />;
  if (content.type === "image") return <>{upload}<Input aria-label="Image alt text" maxLength={300} onChange={(e) => setContent({ ...content, alt_text: e.target.value })} placeholder="Describe the image" value={content.alt_text} /></>;
  if (content.type === "file") return <>{upload}<Input aria-label="File name" maxLength={255} onChange={(e) => setContent({ ...content, file_name: e.target.value })} placeholder="File name" value={content.file_name} /></>;
  return <>{upload}<Input aria-label={`${labelFor(content.type)} caption`} maxLength={500} onChange={(e) => setContent({ ...content, caption: e.target.value || null })} placeholder="Caption (optional)" value={content.caption ?? ""} /></>;
}

function emptyContent(type: ComposerType): BlockContent {
  if (type === "text") return { markdown: "", type };
  if (type === "image") return { alt_text: "Image description", type, url: "https://example.com/image.jpg" };
  if (type === "file") return { file_name: "document.pdf", size_bytes: null, type, url: "https://example.com/document.pdf" };
  return { caption: null, type, url: `https://example.com/${type}` };
}
function labelFor(type: string) { return type.charAt(0).toUpperCase() + type.slice(1); }
function byPosition(a: Block, b: Block) { return a.position - b.position; }
function move<T>(items: T[], index: number, direction: -1 | 1) { const next = [...items]; const target = index + direction; if (target < 0 || target >= next.length) return next; [next[index], next[target]] = [next[target], next[index]]; return next; }
function ContentPicker({ disabled, onAdd }: { disabled: boolean; onAdd: (type: ComposerType) => void }) { return <div aria-label="Choose content type" className="grid grid-cols-2 gap-2 border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] p-3 sm:grid-cols-5">{choices.map(({ icon: Icon, label, type }) => <Button className="h-auto flex-col gap-2 py-3" disabled={disabled} key={type} onClick={() => onAdd(type)} variant="secondary"><Icon aria-hidden="true" /> {label}</Button>)}</div>; }
function InlineAddButton({ onClick }: { onClick: () => void }) { return <Button className="w-full gap-2 border-dashed" onClick={onClick} variant="secondary"><Plus aria-hidden="true" /> Add content</Button>; }
function EmptyState({ body, onClick, title }: { body: string; onClick?: () => void; title: string }) { const className = "grid min-h-48 w-full place-content-center border border-dashed border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-weak-100)] p-8 text-center"; const content = <><h3 className="font-semibold text-[var(--color-text-main-900)]">{title}</h3><p className="mt-1 text-sm text-[var(--color-text-sub-500)]">{body}</p></>; return onClick ? <button className={`${className} hover:border-[var(--color-primary-base)] hover:bg-[var(--color-primary-lighter)]`} onClick={onClick} type="button">{content}</button> : <div className={className}>{content}</div>; }
