"use client";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Code, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote } from "lucide-react";

import { Button } from "@/components/ui/button";

type RichTextDoc = Record<string, unknown>;
type Props = { doc?: RichTextDoc; markdown?: string; onChange: (doc: RichTextDoc) => void };

const safeHref = (href: string) => /^(https?:|mailto:)/i.test(href.trim());
const extensions = [
  StarterKit.configure({ codeBlock: false, dropcursor: false, gapcursor: false, heading: { levels: [2, 3] }, horizontalRule: false, strike: false }),
  Link.configure({ HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" }, autolink: false, openOnClick: false, protocols: ["http", "https", "mailto"], validate: safeHref }),
  Placeholder.configure({ placeholder: "Start writing..." }),
];

function legacyContent(markdown?: string): RichTextDoc {
  const paragraphs = (markdown ?? "").split(/\r?\n/).filter(Boolean);
  return { type: "doc", content: paragraphs.length > 0 ? paragraphs.map((line) => ({ type: "paragraph", content: [{ type: "text", text: line }] })) : [{ type: "paragraph" }] };
}

export default function RichTextEditor({ doc, markdown, onChange }: Props) {
  const editor = useEditor({
    content: doc ?? legacyContent(markdown), extensions, immediatelyRender: false,
    editorProps: { attributes: { "aria-label": "Text content", class: "min-h-40 px-3 py-3 text-sm leading-6 text-[var(--color-text-main-900)] focus:outline-none" } },
    onUpdate: ({ editor: current }) => { if (!current.isEmpty) onChange(current.getJSON()); },
  });
  if (!editor) return <div className="min-h-48 animate-pulse rounded-[10px] bg-[var(--color-bg-weak-100)]" />;
  const link = () => {
    const current = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Link URL", current ?? "");
    if (href === null) return;
    if (!href) editor.chain().focus().unsetLink().run();
    else if (safeHref(href)) editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };
  const tools = [
    ["Bold", Bold, () => editor.chain().focus().toggleBold().run(), editor.isActive("bold")],
    ["Italic", Italic, () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic")],
    ["Heading 2", Heading2, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 })],
    ["Heading 3", Heading3, () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 })],
    ["Bullet list", List, () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList")],
    ["Ordered list", ListOrdered, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList")],
    ["Link", Link2, link, editor.isActive("link")],
    ["Blockquote", Quote, () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote")],
    ["Inline code", Code, () => editor.chain().focus().toggleCode().run(), editor.isActive("code")],
  ] as const;
  return <div className="overflow-hidden rounded-[10px] border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] shadow-[var(--shadow-x-small)] focus-within:border-[var(--color-primary-base)] focus-within:shadow-[var(--shadow-button-focus-primary)]">
    <div aria-label="Text formatting" className="flex flex-wrap gap-1 border-b border-[var(--color-stroke-soft-200)] p-2" role="toolbar">
      {tools.map(([label, Icon, action, active]) => <Button aria-label={label} aria-pressed={active} className={active ? "bg-[var(--color-primary-lighter)] text-[var(--color-primary-base)]" : ""} iconOnly key={label} onClick={action} size="x-small" variant="secondary"><Icon /></Button>)}
    </div>
    <EditorContent editor={editor} />
  </div>;
}
