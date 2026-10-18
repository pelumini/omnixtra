import { Fragment, type ReactNode } from "react";

type RichNode = { attrs?: Record<string, unknown>; content?: RichNode[]; marks?: RichNode[]; text?: string; type?: string };

function safeHref(value: unknown): string | null {
  if (typeof value !== "string" || !/^(https?:|mailto:)/i.test(value.trim())) return null;
  return value;
}

function marked(text: ReactNode, marks: RichNode[] = [], key: string): ReactNode {
  return marks.reduce<ReactNode>((child, mark, index) => {
    if (mark.type === "bold") return <strong key={`${key}-b-${index}`}>{child}</strong>;
    if (mark.type === "italic") return <em key={`${key}-i-${index}`}>{child}</em>;
    if (mark.type === "code") return <code className="rounded bg-[var(--color-bg-weak-100)] px-1" key={`${key}-c-${index}`}>{child}</code>;
    if (mark.type === "link") { const href = safeHref(mark.attrs?.href); return href ? <a className="text-[var(--color-primary-base)] underline" href={href} key={`${key}-a-${index}`} rel="noopener noreferrer nofollow" target="_blank">{child}</a> : child; }
    return child;
  }, text);
}

function renderNode(node: RichNode, key: string): ReactNode {
  if (node.type === "text") return <Fragment key={key}>{marked(node.text ?? "", node.marks, key)}</Fragment>;
  if (node.type === "hardBreak") return <br key={key} />;
  const children = node.content?.map((child, index) => renderNode(child, `${key}-${index}`)) ?? null;
  if (node.type === "doc") return <Fragment key={key}>{children}</Fragment>;
  if (node.type === "paragraph") return <p key={key}>{children}</p>;
  if (node.type === "heading" && node.attrs?.level === 2) return <h2 className="text-2xl font-semibold" key={key}>{children}</h2>;
  if (node.type === "heading" && node.attrs?.level === 3) return <h3 className="text-xl font-semibold" key={key}>{children}</h3>;
  if (node.type === "bulletList") return <ul className="list-disc pl-6" key={key}>{children}</ul>;
  if (node.type === "orderedList") return <ol className="list-decimal pl-6" key={key}>{children}</ol>;
  if (node.type === "listItem") return <li key={key}>{children}</li>;
  if (node.type === "blockquote") return <blockquote className="border-l-2 border-[var(--color-primary-base)] pl-4" key={key}>{children}</blockquote>;
  return null;
}

export function RichTextContent({ doc }: { doc: Record<string, unknown> }) {
  return <div className="grid gap-3 text-base leading-7">{renderNode(doc as RichNode, "doc")}</div>;
}
