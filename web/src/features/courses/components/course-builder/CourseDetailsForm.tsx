"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  Field,
  SelectField,
  TextareaField,
} from "@/components/ui/form-controls";
import { Input, Textarea } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";

import { updateCourse } from "../../api";
import {
  courseDetailsFormSchema,
  type Course,
  type CourseDetailsFormInput,
} from "../../schemas";
import { MediaUploadField, uploadedMediaFromReference } from "../MediaUploadField";

import { formFieldError } from "./mappers";
import { SaveStatus } from "./SaveStatus";
import { useAutosave, type SaveState } from "./useAutosave";

function initialDuration(course: Course) {
  const minutes = course.estimated_duration_minutes;
  if (minutes !== null && minutes >= 60 && minutes % 60 === 0) {
    return {
      durationUnit: "hours" as const,
      durationValue: String(minutes / 60),
    };
  }
  return {
    durationUnit: "minutes" as const,
    durationValue: minutes === null ? "" : String(minutes),
  };
}

export function CourseDetailsForm({
  course,
  onSaved,
  onStatusChange,
}: {
  course: Course;
  onSaved: (course: Course) => void;
  onStatusChange?: (key: string, state: SaveState) => void;
}) {
  const duration = initialDuration(course);
  const [tagDraft, setTagDraft] = useState("");
  const [outcomeDraft, setOutcomeDraft] = useState("");
  const defaults: CourseDetailsFormInput = {
    access: course.access, certificateOnCompletion: course.certificate_on_completion,
    category: course.category ?? "", completeInOrder: course.complete_in_order,
    deliveryFormat: course.delivery_format ?? "", description: course.description ?? "",
    difficulty: course.difficulty ?? "", durationUnit: duration.durationUnit,
    durationValue: duration.durationValue,
    language: ["en", "fr", "es", "de", "pt"].includes(course.language ?? "") ? course.language as CourseDetailsFormInput["language"] : "",
    learningOutcomes: course.learning_outcomes, tags: course.tags,
    targetAudience: course.target_audience ?? "", thumbnailUrl: course.thumbnail_url ?? "", title: course.title,
  };
  const {
    formState: { errors },
    getValues,
    register,
    setValue,
    watch,
  } = useForm<CourseDetailsFormInput>({
    defaultValues: defaults,
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(courseDetailsFormSchema),
  });
  const tags = watch("tags");
  const learningOutcomes = watch("learningOutcomes");
  const autosave = useAutosave({
    initialValue: defaults,
    onStatusChange: (state) => onStatusChange?.(`course:${course.id}:settings`, state),
    save: async (input) => {
      const response = await updateCourse(course.id, coursePayload(input));
      onSaved(response.data); return input;
    },
    validate: (input) => courseDetailsFormSchema.safeParse(input).success,
  });
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      const next = value as CourseDetailsFormInput;
      autosave.schedule(next, Boolean(name && immediateFields.has(name)));
    });
    return () => subscription.unsubscribe();
  }, [autosave, watch]);
  const fieldError = formFieldError(errors);

  function addTag() {
    const value = tagDraft.trim();
    if (!value || tags.includes(value) || tags.length >= 20) return;
    setValue("tags", [...tags, value], { shouldValidate: true });
    setTagDraft("");
  }

  function addOutcome() {
    const value = outcomeDraft.trim();
    if (!value || learningOutcomes.length >= 20) return;
    setValue("learningOutcomes", [...learningOutcomes, value], {
      shouldValidate: true,
    });
    setOutcomeDraft("");
  }

  return (
    <form
      className="grid gap-4 border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] p-4"
      noValidate
      onBlur={() => void autosave.flush()}
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="flex items-center gap-2">
        <Pencil
          aria-hidden="true"
          className="size-4 text-[var(--color-text-sub-500)]"
        />
        <h2 className="text-sm font-semibold">Course Setup</h2><button className="ml-auto" onClick={autosave.retry} type="button"><SaveStatus state={autosave.status} /></button>
      </div>
      <fieldset className="grid gap-4">
        <Field
          error={fieldError("title")}
          label="Course Title"
          registration={register("title")}
        />
        <TextareaField
          error={fieldError("description")}
          label="Course Description"
          registration={register("description")}
          rows={3}
        />
        <div className="grid gap-3 border border-[var(--color-stroke-soft-200)] p-4">
          <SelectField label="Course Access" registration={register("access")}><option value="enrolled_only">Enrolled learners only</option><option value="link">Anyone with the link</option></SelectField>
          <Toggle label="Complete lessons in order" {...register("completeInOrder")} />
          <Toggle label="Issue a certificate on completion" {...register("certificateOnCompletion")} />
          <p className="text-xs text-[var(--color-text-sub-500)]">These settings are saved now and take effect when learner delivery ships.</p>
        </div>
        <MediaUploadField courseId={course.id} kind="thumbnail" label="Course Thumbnail" onChange={(media) => { setValue("thumbnailUrl", media?.objectKey ?? "", { shouldDirty: true, shouldValidate: true }); queueMicrotask(() => autosave.schedule(getValues(), true)); }} value={uploadedMediaFromReference(watch("thumbnailUrl"), "Course thumbnail")} />
        <Field
          error={fieldError("category")}
          label="Category"
          registration={register("category")}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <SelectField
            error={fieldError("difficulty")}
            label="Difficulty"
            registration={register("difficulty")}
          >
            <option value="">Not set</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </SelectField>
          <SelectField
            error={fieldError("deliveryFormat")}
            label="Delivery Format"
            registration={register("deliveryFormat")}
          >
            <option value="">Not set</option>
            <option value="self_paced">Self-paced</option>
            <option value="instructor_led">Instructor-led</option>
            <option value="blended">Blended</option>
          </SelectField>
          <SelectField
            error={fieldError("language")}
            label="Language"
            registration={register("language")}
          >
            <option value="">Not set</option>
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="es">Spanish</option>
            <option value="de">German</option>
            <option value="pt">Portuguese</option>
          </SelectField>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_8rem] gap-2">
          <Field
            error={fieldError("durationValue")}
            label="Estimated Duration"
            registration={register("durationValue")}
            type="number"
          />
          <SelectField label="Unit" registration={register("durationUnit")}>
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
          </SelectField>
        </div>
        <TextareaField
          error={fieldError("targetAudience")}
          label="Target Audience"
          registration={register("targetAudience")}
          rows={3}
        />
        <div className="grid gap-2">
          <label
            className="text-xs font-medium text-[var(--color-text-main-900)]"
            htmlFor="tag-draft"
          >
            Tags
          </label>
          <div className="flex gap-2">
            <Input
              className="min-w-0 flex-1"
              id="tag-draft"
              maxLength={50}
              onChange={(event) => setTagDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTag();
                }
              }}
              placeholder="Add a tag"
              value={tagDraft}
            />
            <button
              aria-label="Add tag"
              className="grid size-10 shrink-0 place-items-center rounded-md border border-[var(--color-stroke-soft-200)] text-[var(--color-primary-base)] hover:bg-[var(--color-primary-lighter)]"
              onClick={addTag}
              type="button"
            >
              <Plus aria-hidden="true" className="size-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-lighter)] px-2.5 py-1 text-xs text-[var(--color-primary-base)]"
                key={tag}
              >
                {tag}
                <button
                  aria-label={`Remove ${tag}`}
                  onClick={() =>
                    setValue(
                      "tags",
                      tags.filter((item) => item !== tag),
                      { shouldValidate: true },
                    )
                  }
                  type="button"
                >
                  <X aria-hidden="true" className="size-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <label
            className="text-xs font-medium text-[var(--color-text-main-900)]"
            htmlFor="outcome-draft"
          >
            Learning outcomes
          </label>
          <Textarea
            id="outcome-draft"
            maxLength={500}
            onChange={(event) => setOutcomeDraft(event.target.value)}
            placeholder="What will learners be able to do?"
            rows={2}
            value={outcomeDraft}
          />
          <button
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--color-stroke-soft-200)] text-xs font-semibold text-[var(--color-primary-base)] hover:bg-[var(--color-primary-lighter)]"
            onClick={addOutcome}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" /> Add outcome
          </button>
          <ol className="grid gap-2">
            {learningOutcomes.map((outcome, index) => (
              <li
                className="flex items-start gap-2 bg-[var(--color-bg-weak-100)] p-2 text-xs text-[var(--color-text-sub-500)]"
                key={`${outcome}-${index}`}
              >
                <span className="min-w-0 flex-1">{outcome}</span>
                <button
                  aria-label={`Remove learning outcome ${index + 1}`}
                  className="shrink-0 text-[var(--color-text-sub-500)] hover:text-[var(--color-state-error)]"
                  onClick={() =>
                    setValue(
                      "learningOutcomes",
                      learningOutcomes.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                      { shouldValidate: true },
                    )
                  }
                  type="button"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </li>
            ))}
          </ol>
        </div>
      </fieldset>
    </form>
  );
}

const immediateFields = new Set(["access", "certificateOnCompletion", "completeInOrder", "deliveryFormat", "difficulty", "durationUnit", "language", "learningOutcomes", "tags", "thumbnailUrl"]);

function coursePayload(input: CourseDetailsFormInput) {
  const duration = input.durationValue === "" ? null : Number(input.durationValue);
  return {
    access: input.access, certificate_on_completion: input.certificateOnCompletion,
    category: input.category || null, complete_in_order: input.completeInOrder,
    delivery_format: input.deliveryFormat || null, description: input.description || null,
    difficulty: input.difficulty || null,
    estimated_duration_minutes: duration === null ? null : Math.round(duration * (input.durationUnit === "hours" ? 60 : 1)),
    language: input.language || null, learning_outcomes: input.learningOutcomes, tags: input.tags,
    target_audience: input.targetAudience || null, thumbnail_url: input.thumbnailUrl || null, title: input.title,
  };
}
