import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LearnerPreview } from "@/features/courses";

import { courseId, courseStructure, draftCourse, lessonId, sectionId } from "./fixtures";

import type { Block, Lesson, Section } from "@/features/courses";

const mediaAssetId = "00000000-0000-0000-0000-000000000701";
const mediaReference = `tenants/tenant/courses/${courseId}/${mediaAssetId}/asset`;

const blocks: Block[] = [
  {
    block_type: "text",
    content: {
      markdown: "## Welcome\n**Safe** content [bad](javascript:alert(1))",
      type: "text",
    },
    course_id: courseId,
    id: "00000000-0000-0000-0000-000000000601",
    lesson_id: lessonId,
    position: 0,
  },
  {
    block_type: "image",
    content: {
      alt_text: "Workshop participants",
      asset_id: mediaAssetId,
      object_key: mediaReference,
      type: "image",
      url: mediaReference,
    },
    course_id: courseId,
    id: "00000000-0000-0000-0000-000000000602",
    lesson_id: lessonId,
    position: 1,
  },
  {
    block_type: "video",
    content: {
      asset_id: mediaAssetId,
      caption: "Introduction",
      object_key: mediaReference,
      type: "video",
      url: mediaReference,
    },
    course_id: courseId,
    id: "00000000-0000-0000-0000-000000000603",
    lesson_id: lessonId,
    position: 2,
  },
  {
    block_type: "audio",
    content: {
      asset_id: mediaAssetId,
      caption: "Listen again",
      object_key: mediaReference,
      type: "audio",
      url: mediaReference,
    },
    course_id: courseId,
    id: "00000000-0000-0000-0000-000000000604",
    lesson_id: lessonId,
    position: 3,
  },
  {
    block_type: "file",
    content: {
      asset_id: mediaAssetId,
      file_name: "Guide.pdf",
      object_key: mediaReference,
      size_bytes: 2048,
      type: "file",
      url: mediaReference,
    },
    course_id: courseId,
    id: "00000000-0000-0000-0000-000000000605",
    lesson_id: lessonId,
    position: 4,
  },
  {
    block_type: "quiz",
    content: {
      correct_option_id: "a",
      options: [{ id: "a", text: "First" }, { id: "b", text: "Second" }],
      question: "Which comes first?",
      type: "quiz",
    },
    course_id: courseId,
    id: "00000000-0000-0000-0000-000000000606",
    lesson_id: lessonId,
    position: 5,
  },
];

describe("course learner preview", () => {
  it("renders learner navigation, safe markdown, media placeholders, and a read-only quiz", () => {
    const section = courseStructure.sections[0];
    const html = renderToStaticMarkup(
      <LearnerPreview
        blocks={blocks}
        course={draftCourse}
        initialLessonId={lessonId}
        lessons={section.lessons}
        onBack={() => undefined}
        sections={[section]}
      />,
    );

    expect(html).toContain("Learner preview");
    expect(html).toContain("Back to editing");
    expect(html).toContain("Course outline");
    expect(html).toContain("Previous lesson");
    expect(html).toContain("Next lesson");
    expect(html).toContain("<h3");
    expect(html).toContain("<strong>Safe</strong>");
    expect(html).toContain("bad");
    expect(html).not.toContain("javascript:");
    expect(html.match(/Loading media/g)).toHaveLength(4);
    expect(html).toContain("Quiz preview");
    expect(html).toContain("Responses are disabled in preview.");
    expect(html).not.toContain("Text content");
  });

  it("renders course and lesson empty states", () => {
    const emptyCourse = renderToStaticMarkup(
      <LearnerPreview
        blocks={[]}
        course={draftCourse}
        initialLessonId=""
        lessons={[]}
        onBack={() => undefined}
        sections={[]}
      />,
    );
    expect(emptyCourse).toContain("Nothing to preview yet");

    const section: Section & { rolled_duration_minutes: number } = {
      course_id: courseId,
      description: null,
      id: sectionId,
      image_url: null,
      position: 0,
      rolled_duration_minutes: 0,
      title: "Chapter",
    };
    const lesson: Lesson = {
      body: null,
      course_id: courseId,
      estimated_duration_minutes: null,
      id: lessonId,
      image_url: null,
      position: 0,
      required_for_completion: false,
      section_id: sectionId,
      summary: null,
      title: "Empty lesson",
    };
    const emptyLesson = renderToStaticMarkup(
      <LearnerPreview
        blocks={[]}
        course={draftCourse}
        initialLessonId={lessonId}
        lessons={[lesson]}
        onBack={() => undefined}
        sections={[section]}
      />,
    );
    expect(emptyLesson).toContain("This lesson has no content yet.");
  });
});
