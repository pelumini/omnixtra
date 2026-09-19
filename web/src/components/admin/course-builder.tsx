"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BadgeCheck,
  Boxes,
  CircleAlert,
  FileText,
  Globe,
  Image,
  Layers3,
  ListChecks,
  Pencil,
  PlaySquare,
  Plus,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { DeniedState } from "@/components/app/denied-state";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FormError,
  SelectField,
  SubmitButton,
  TextareaField,
} from "@/components/ui/form-controls";
import {
  createBlock,
  createLesson,
  createMediaAsset,
  createSection,
  publishCourse,
  updateCourse,
} from "@/lib/api";
import { resolveMessage } from "@/lib/forms/messages";
import { useFormSubmit } from "@/lib/forms/use-form-submit";
import { canAuthorCourse } from "@/lib/permissions";
import {
  blockFormSchema,
  courseDetailsFormSchema,
  lessonFormSchema,
  mediaFormSchema,
  sectionFormSchema,
  type BlockFormInput,
  type CourseDetailsFormInput,
  type LessonFormInput,
  type MediaFormInput,
  type SectionFormInput,
} from "@/lib/schemas/admin-forms";
import type { Block, Course, Lesson, MediaAsset, Section } from "@/lib/schemas";
import type { CourseRole } from "@/lib/schemas";

type CourseBuilderProps = {
  course: Course;
  courseRole?: CourseRole;
};

const blockTypes = [
  {
    value: "content",
    label: "Content",
    hint: "Write lesson text, notes, or instructions.",
    icon: FileText,
  },
  {
    value: "web_content",
    label: "Web content",
    hint: "Add a useful link or embedded-resource URL.",
    icon: Globe,
  },
  {
    value: "video",
    label: "Video",
    hint: "Paste a video URL for the lesson.",
    icon: PlaySquare,
  },
  {
    value: "image",
    label: "Image",
    hint: "Add an image URL or reference.",
    icon: Image,
  },
  {
    value: "quiz",
    label: "Quiz",
    hint: "Add a quick check question.",
    icon: ListChecks,
  },
] as const;

export function CourseBuilder({
  course: initialCourse,
  courseRole = "course_owner",
}: CourseBuilderProps) {
  const [course, setCourse] = useState(initialCourse);
  const [sections, setSections] = useState<Section[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedSectionLessons = useMemo(
    () => lessons.filter((lesson) => lesson.section_id === selectedSectionId),
    [lessons, selectedSectionId],
  );

  function handlePublish() {
    startTransition(async () => {
      try {
        const response = await publishCourse(course.id);
        setCourse(response.data);
        setMessage("Course published");
      } catch (error) {
        setMessage(errorMessage(error, "Course could not be published"));
      }
    });
  }

  if (!canAuthorCourse(courseRole)) {
    return (
      <DeniedState
        description="Authoring this course is available to its course owner. You can still use the learner course player for courses you are enrolled in."
        title="This course is not yours to edit"
      />
    );
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl content-start gap-5 px-5 py-5">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <Link className="text-sm text-gray-600 hover:text-[var(--primary)]" href="/admin/courses">
            Courses
          </Link>
          <h1 className="mt-1 text-xl font-semibold">{course.title}</h1>
          <p className="mt-1 text-sm text-gray-600">{course.description ?? course.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <CourseStatus status={course.status} />
          <Button
            className="gap-2"
            isProcessing={isPending}
            onClick={handlePublish}
            processingLabel="Publishing..."
          >
            <BadgeCheck aria-hidden="true" className="size-4" />
            Publish
          </Button>
        </div>
      </header>

      {message ? (
        <div className="flex items-start gap-2 border border-[var(--border)] bg-white px-4 py-3 text-sm text-gray-700">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" />
          <span>{message}</span>
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)_300px]">
        <aside className="grid content-start gap-4">
          <CourseDetailsForm
            course={course}
            onSaved={(updatedCourse) => {
              setCourse(updatedCourse);
              setMessage("Course details saved");
            }}
          />

          <MediaForm
            courseId={course.id}
            onCreated={(asset) => {
              setMedia((current) => [asset, ...current]);
              setMessage("Media metadata saved");
            }}
          />
        </aside>

        <section className="grid content-start gap-4">
          <SectionForm
            courseId={course.id}
            position={sections.length}
            onCreated={(section) => {
              setSections((current) => [...current, section]);
              setSelectedSectionId(section.id);
              setMessage("Section added");
            }}
          />

          <div className="grid gap-3">
            {sections.map((section, index) => {
              const sectionLessons = lessons.filter((lesson) => lesson.section_id === section.id);

              return (
                <article className="border border-[var(--border)] bg-white" key={section.id}>
                  <button
                    className="flex w-full items-center justify-between gap-3 border-b border-[var(--border)] bg-gray-50 px-4 py-3 text-left"
                    onClick={() => setSelectedSectionId(section.id)}
                    type="button"
                  >
                    <span className="text-sm font-semibold">
                      {index + 1}. {section.title}
                    </span>
                    <Layers3 aria-hidden="true" className="size-4 text-gray-500" />
                  </button>
                  <div className="divide-y divide-[var(--border)]">
                    {sectionLessons.map((lesson) => (
                      <button
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50"
                        key={lesson.id}
                        onClick={() => setSelectedLessonId(lesson.id)}
                        type="button"
                      >
                        <span className="min-w-0 truncate text-sm">{lesson.title}</span>
                        <span className="text-xs text-gray-500">
                          {blocks.filter((block) => block.lesson_id === lesson.id).length} blocks
                        </span>
                      </button>
                    ))}
                    {sectionLessons.length === 0 ? (
                      <div className="px-4 py-4 text-sm text-gray-600">No lessons</div>
                    ) : null}
                  </div>
                </article>
              );
            })}
            {sections.length === 0 ? (
              <div className="border border-[var(--border)] bg-white px-4 py-10 text-center text-sm text-gray-600">
                No sections
              </div>
            ) : null}
          </div>
        </section>

        <aside className="grid content-start gap-4">
          <LessonForm
            courseId={course.id}
            disabled={sections.length === 0}
            lessons={lessons}
            onCreated={(lesson) => {
              setLessons((current) => [...current, lesson]);
              setSelectedLessonId(lesson.id);
              setMessage("Lesson added");
            }}
            onSectionChange={setSelectedSectionId}
            sections={sections}
            selectedSectionId={selectedSectionId}
          />

          <BlockForm
            blocks={blocks}
            courseId={course.id}
            disabled={lessons.length === 0}
            lessons={selectedSectionLessons}
            onCreated={(block) => {
              setBlocks((current) => [...current, block]);
              setMessage("Block added");
            }}
            onLessonChange={setSelectedLessonId}
            selectedLessonId={selectedLessonId}
          />

          <section className="border border-[var(--border)] bg-white">
            <div className="border-b border-[var(--border)] px-4 py-3">
              <h2 className="text-sm font-semibold">Assets</h2>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {media.map((asset) => (
                <article className="px-4 py-3" key={asset.id}>
                  <p className="truncate text-sm font-medium">{asset.file_name}</p>
                  <p className="mt-1 text-xs text-gray-500">{asset.content_type}</p>
                </article>
              ))}
              {media.length === 0 ? <div className="px-4 py-4 text-sm text-gray-600">No assets</div> : null}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function CourseStatus({ status }: { status: Course["status"] }) {
  const styles = {
    archived: "bg-gray-100 text-gray-700",
    draft: "bg-amber-100 text-amber-800",
    published: "bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)]",
  };

  return <span className={`px-2 py-1 text-xs font-medium ${styles[status]}`}>{status}</span>;
}

function CourseDetailsForm({
  course,
  onSaved,
}: {
  course: Course;
  onSaved: (course: Course) => void;
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<CourseDetailsFormInput>({
    defaultValues: { description: course.description ?? "", title: course.title },
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(courseDetailsFormSchema),
  });
  const { formError, isSubmitting, submit } = useFormSubmit({
    action: (input: CourseDetailsFormInput) =>
      updateCourse(course.id, {
        description: input.description === "" ? null : input.description,
        title: input.title,
      }),
    errorMessage: "Course details could not be saved.",
    onSuccess: (response) => onSaved(response.data),
    setError,
    successMessage: "Course details saved.",
  });
  const fieldError = formFieldError(errors);

  return (
    <form className="grid gap-3 border border-[var(--border)] bg-white p-4" noValidate onSubmit={handleSubmit(submit)}>
      <div className="flex items-center gap-2">
        <Pencil aria-hidden="true" className="size-4 text-gray-500" />
        <h2 className="text-sm font-semibold">Details</h2>
      </div>
      <FormError>{formError}</FormError>
      <fieldset className="grid gap-3" disabled={isSubmitting}>
        <Field error={fieldError("title")} label="Title" registration={register("title")} />
        <TextareaField
          error={fieldError("description")}
          label="Description"
          registration={register("description")}
        />
      </fieldset>
      <SubmitButton isSubmitting={isSubmitting} pendingLabel="Saving...">Save</SubmitButton>
    </form>
  );
}

function MediaForm({
  courseId,
  onCreated,
}: {
  courseId: string;
  onCreated: (asset: MediaAsset) => void;
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<MediaFormInput>({
    defaultValues: { byteSize: 0, contentType: "image/png", fileName: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(mediaFormSchema),
  });
  const { formError, isSubmitting, submit } = useFormSubmit({
    action: (input: MediaFormInput) =>
      createMediaAsset(courseId, {
        byte_size: input.byteSize,
        checksum_sha256: null,
        content_type: input.contentType,
        file_name: input.fileName,
        object_key: `tenants/current/courses/${courseId}/${input.fileName}`,
      }),
    errorMessage: "Media metadata could not be saved.",
    onSuccess: (response) => {
      onCreated(response.data);
      reset();
    },
    setError,
    successMessage: "Media metadata saved.",
  });
  const fieldError = formFieldError(errors);

  return (
    <form className="grid gap-3 border border-[var(--border)] bg-white p-4" noValidate onSubmit={handleSubmit(submit)}>
      <div className="flex items-center gap-2">
        <Upload aria-hidden="true" className="size-4 text-gray-500" />
        <h2 className="text-sm font-semibold">Media</h2>
      </div>
      <FormError>{formError}</FormError>
      <fieldset className="grid gap-3" disabled={isSubmitting}>
        <Field error={fieldError("fileName")} label="File" registration={register("fileName")} />
        <SelectField label="Content type" registration={register("contentType")}>
          <option value="image/png">image/png</option>
          <option value="image/jpeg">image/jpeg</option>
          <option value="video/mp4">video/mp4</option>
        </SelectField>
        <Field
          error={fieldError("byteSize")}
          label="Bytes"
          registration={register("byteSize", { valueAsNumber: true })}
          type="number"
        />
      </fieldset>
      <SubmitButton className="gap-2" isSubmitting={isSubmitting} pendingLabel="Saving...">
        <Upload aria-hidden="true" className="size-4" />
        Save
      </SubmitButton>
    </form>
  );
}

function SectionForm({
  courseId,
  onCreated,
  position,
}: {
  courseId: string;
  onCreated: (section: Section) => void;
  position: number;
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<SectionFormInput>({
    defaultValues: { title: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(sectionFormSchema),
  });
  const { formError, isSubmitting, submit } = useFormSubmit({
    action: (input: SectionFormInput) => createSection(courseId, { position, title: input.title }),
    errorMessage: "Section could not be added.",
    onSuccess: (response) => {
      onCreated(response.data);
      reset();
    },
    setError,
    successMessage: "Section added.",
  });
  const fieldError = formFieldError(errors);

  return (
    <form className="flex flex-wrap items-end gap-3 border border-[var(--border)] bg-white p-4" noValidate onSubmit={handleSubmit(submit)}>
      <div className="min-w-56 flex-1">
        <FormError>{formError}</FormError>
        <fieldset disabled={isSubmitting}>
          <Field error={fieldError("title")} label="Section" registration={register("title")} />
        </fieldset>
      </div>
      <SubmitButton className="w-auto gap-2" isSubmitting={isSubmitting} pendingLabel="Adding...">
        <Plus aria-hidden="true" className="size-4" />
        Add
      </SubmitButton>
    </form>
  );
}

function LessonForm({
  courseId,
  disabled,
  lessons,
  onCreated,
  onSectionChange,
  sections,
  selectedSectionId,
}: {
  courseId: string;
  disabled: boolean;
  lessons: Lesson[];
  onCreated: (lesson: Lesson) => void;
  onSectionChange: (sectionId: string) => void;
  sections: Section[];
  selectedSectionId: string;
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<LessonFormInput>({
    defaultValues: { sectionId: selectedSectionId, title: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(lessonFormSchema),
  });
  const { formError, isSubmitting, submit } = useFormSubmit({
    action: (input: LessonFormInput) =>
      createLesson(courseId, {
        position: lessons.filter((lesson) => lesson.section_id === input.sectionId).length,
        section_id: input.sectionId,
        title: input.title,
      }),
    errorMessage: "Lesson could not be added.",
    onSuccess: (response) => {
      onCreated(response.data);
      reset({ sectionId: selectedSectionId, title: "" });
    },
    setError,
    successMessage: "Lesson added.",
  });
  const fieldError = formFieldError(errors);

  return (
    <form className="grid gap-3 border border-[var(--border)] bg-white p-4" noValidate onSubmit={handleSubmit(submit)}>
      <div className="flex items-center gap-2">
        <BookIcon />
        <h2 className="text-sm font-semibold">Lesson</h2>
      </div>
      <FormError>{formError}</FormError>
      <fieldset className="grid gap-3" disabled={isSubmitting || disabled}>
        <SelectField
          error={fieldError("sectionId")}
          label="Section"
          registration={register("sectionId", {
            onChange: (event) => onSectionChange(event.target.value),
          })}
        >
          <option value="">Select section</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.title}
            </option>
          ))}
        </SelectField>
        <Field
          error={fieldError("title")}
          label="Lesson title"
          registration={register("title")}
        />
      </fieldset>
      <SubmitButton className="gap-2" disabled={disabled} isSubmitting={isSubmitting} pendingLabel="Adding...">
        <Plus aria-hidden="true" className="size-4" />
        Add
      </SubmitButton>
    </form>
  );
}

function BlockForm({
  blocks,
  courseId,
  disabled,
  lessons,
  onCreated,
  onLessonChange,
  selectedLessonId,
}: {
  blocks: Block[];
  courseId: string;
  disabled: boolean;
  lessons: Lesson[];
  onCreated: (block: Block) => void;
  onLessonChange: (lessonId: string) => void;
  selectedLessonId: string;
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
    watch,
  } = useForm<BlockFormInput>({
    defaultValues: { blockType: "content", body: "", lessonId: selectedLessonId },
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(blockFormSchema),
  });
  const selectedBlockType = watch("blockType");
  const selectedBlockOption =
    blockTypes.find((blockType) => blockType.value === selectedBlockType) ?? blockTypes[0];
  const { formError, isSubmitting, submit } = useFormSubmit({
    action: (input: BlockFormInput) =>
      createBlock(courseId, {
        block_type: backendBlockType(input.blockType),
        content: blockContent(input.blockType, input.body),
        lesson_id: input.lessonId,
        position: blocks.filter((block) => block.lesson_id === input.lessonId).length,
      }),
    errorMessage: "Content could not be added.",
    onSuccess: (response) => {
      onCreated(response.data);
      reset({ blockType: "content", body: "", lessonId: selectedLessonId });
    },
    setError,
    successMessage: "Content added.",
  });
  const fieldError = formFieldError(errors);

  return (
    <form className="grid gap-3 border border-[var(--border)] bg-white p-4" noValidate onSubmit={handleSubmit(submit)}>
      <div className="flex items-center gap-2">
        <Boxes aria-hidden="true" className="size-4 text-gray-500" />
        <h2 className="text-sm font-semibold">Add standard content</h2>
      </div>
      <p className="text-xs leading-5 text-slate-500">
        Choose the exact content type you want to add. OmniXtra does not group these behind
        separate course categories.
      </p>
      <FormError>{formError}</FormError>
      <fieldset className="grid gap-3" disabled={isSubmitting || disabled}>
        <SelectField
          error={fieldError("lessonId")}
          label="Lesson"
          registration={register("lessonId", {
            onChange: (event) => onLessonChange(event.target.value),
          })}
        >
          <option value="">Select lesson</option>
          {lessons.map((lesson) => (
            <option key={lesson.id} value={lesson.id}>
              {lesson.title}
            </option>
          ))}
        </SelectField>
        <fieldset className="grid gap-2">
          <legend className="text-xs font-medium text-slate-600">Content type</legend>
          {blockTypes.map((blockType) => {
            const Icon = blockType.icon;

            return (
              <label
                className="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-md border border-[var(--border)] bg-white px-3 py-3 text-sm hover:border-[var(--primary)] hover:bg-[var(--color-primary-lighter)]"
                key={blockType.value}
              >
                <input className="mt-1" {...register("blockType")} type="radio" value={blockType.value} />
                <span className="min-w-0">
                  <span className="flex items-center gap-2 font-medium text-[var(--foreground)]">
                    <Icon aria-hidden="true" className="size-4 text-[var(--primary)]" />
                    {blockType.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    {blockType.hint}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>
        {fieldError("blockType") ? <FieldError>{fieldError("blockType")}</FieldError> : null}
        <TextareaField
          error={fieldError("body")}
          label={contentBodyLabel(selectedBlockOption.value)}
          registration={register("body")}
        />
      </fieldset>
      <SubmitButton className="gap-2" disabled={disabled} isSubmitting={isSubmitting} pendingLabel="Adding...">
        <Plus aria-hidden="true" className="size-4" />
        Add content
      </SubmitButton>
    </form>
  );
}

function BookIcon() {
  return <FileText aria-hidden="true" className="size-4 text-gray-500" />;
}

type StandardContentType = BlockFormInput["blockType"];

function backendBlockType(blockType: StandardContentType) {
  if (blockType === "content" || blockType === "web_content") {
    return "text";
  }
  return blockType;
}

function contentBodyLabel(blockType: StandardContentType) {
  if (blockType === "web_content") {
    return "Web content URL";
  }
  if (blockType === "video") {
    return "Video URL";
  }
  if (blockType === "image") {
    return "Image URL or description";
  }
  if (blockType === "quiz") {
    return "Quiz question";
  }
  return "Content";
}

function blockContent(blockType: StandardContentType, body: string) {
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

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formFieldError<T extends Record<string, { message?: string } | undefined>>(errors: T) {
  return (field: keyof T & string) => {
    const message = errors[field]?.message;
    return message ? resolveMessage(field, message) : undefined;
  };
}
