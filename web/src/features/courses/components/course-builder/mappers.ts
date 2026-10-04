import { resolveMessage } from "@/lib/forms/messages";

import type { BlockFormInput } from "../../schemas";

export type StandardContentType = BlockFormInput["blockType"];

export function backendBlockType(blockType: StandardContentType) {
  if (blockType === "content" || blockType === "web_content") return "text";
  return blockType;
}

export function contentBodyLabel(blockType: StandardContentType) {
  if (blockType === "web_content") return "Web content URL";
  if (blockType === "video") return "Video URL";
  if (blockType === "image") return "Image URL or description";
  if (blockType === "quiz") return "Quiz question";
  return "Content";
}

export function blockContent(blockType: StandardContentType, body: string) {
  if (blockType === "web_content") {
    return { markdown: `[Open web content](${body})`, type: "text" };
  }
  if (blockType === "video") {
    return { caption: null, type: "video", url: body };
  }
  if (blockType === "image") {
    return { alt_text: "Course image", type: "image", url: body };
  }
  if (blockType === "quiz") {
    return {
      correct_option_id: "a",
      options: [
        { id: "a", text: "Option A" },
        { id: "b", text: "Option B" },
      ],
      question: body,
      type: "quiz",
    };
  }
  return { markdown: body, type: "text" };
}

export function formFieldError<T extends Record<string, { message?: string } | undefined>>(errors: T) {
  return (field: keyof T & string) => {
    const message = errors[field]?.message;
    return message ? resolveMessage(field, message) : undefined;
  };
}
