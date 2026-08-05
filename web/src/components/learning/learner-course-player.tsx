"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Award,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Download,
  ListChecks,
  Play,
  RotateCcw,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FormError, SubmitButton } from "@/components/ui/form-controls";
import { TutorPanel } from "@/components/learning/tutor-panel";
import {
  certificateDownloadUrl,
  completeCourse,
  enrolInCourse,
  issueCertificate,
  submitQuizAttempt,
  updateLessonProgress,
} from "@/lib/api";
import { resolveMessage } from "@/lib/forms/messages";
import { useFormSubmit } from "@/lib/forms/use-form-submit";
import type { Certificate, CourseCompletion, CoursePlayer, LessonProgress } from "@/lib/schemas";
import { quizAttemptFormSchema, type QuizAttemptFormInput } from "@/lib/schemas/learning-forms";

type LearnerCoursePlayerProps = {
  courseId: string;
  initialPlayer: CoursePlayer | null;
  loadError: string | null;
};

export function LearnerCoursePlayer({
  courseId,
  initialPlayer,
  loadError,
}: LearnerCoursePlayerProps) {
  const [player, setPlayer] = useState(initialPlayer);
  const [message, setMessage] = useState(loadError);
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [completion, setCompletion] = useState<CourseCompletion | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isPending, startTransition] = useTransition();

  const lessons = useMemo(() => player?.sections.flatMap((section) => section.lessons) ?? [], [player]);
  const totalProgress = useMemo(() => {
    if (lessons.length === 0) {
      return 0;
    }
    const sum = lessons.reduce((total, lesson) => total + lesson.percent_complete, 0);
    return Math.round(sum / lessons.length);
  }, [lessons]);

  function handleEnrol() {
    startTransition(async () => {
      try {
        await enrolInCourse(courseId, `enrol-${crypto.randomUUID()}`);
        setMessage("Enrolment active. Refresh the player to load enrolled content.");
      } catch (error) {
        setMessage(errorMessage(error, "Enrolment could not be completed"));
      }
    });
  }

  function handleProgress(lessonId: string, percentComplete: number) {
    startTransition(async () => {
      try {
        const response = await updateLessonProgress(courseId, lessonId, {
          last_position: percentComplete,
          percent_complete: percentComplete,
        });
        setProgress((current) => ({ ...current, [lessonId]: response.data }));
        setPlayer((current) => updatePlayerProgress(current, lessonId, response.data.percent_complete));
        setMessage(percentComplete === 100 ? "Lesson marked complete" : "Progress saved");
      } catch (error) {
        setMessage(errorMessage(error, "Progress could not be saved"));
      }
    });
  }

  function handleCompletion() {
    startTransition(async () => {
      try {
        const response = await completeCourse(courseId, `complete-${crypto.randomUUID()}`);
        setCompletion(response.data);
        setMessage("Course completed");
      } catch (error) {
        setMessage(errorMessage(error, "Course could not be completed"));
      }
    });
  }

  function handleCertificate() {
    startTransition(async () => {
      try {
        const response = await issueCertificate(courseId, `certificate-${crypto.randomUUID()}`);
        setCertificate(response.data);
        setMessage("Certificate issued");
      } catch (error) {
        setMessage(errorMessage(error, "Certificate could not be issued"));
      }
    });
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl content-start gap-5 px-5 py-5">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center bg-[var(--primary)] text-white">
            <BookOpen aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">{player?.title ?? "Course Player"}</h1>
            <p className="text-sm text-gray-600">Learner</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2 bg-white text-[var(--foreground)] ring-1 ring-[var(--border)] hover:bg-gray-100" onClick={handleEnrol}>
            <RotateCcw aria-hidden="true" className="size-4" />
            Enrol
          </Button>
          <Button className="gap-2" disabled={isPending || lessons.length === 0} onClick={handleCompletion}>
            <BadgeCheck aria-hidden="true" className="size-4" />
            Complete
          </Button>
        </div>
      </header>

      {message ? (
        <div className="flex items-start gap-2 border border-[var(--border)] bg-white px-4 py-3 text-sm text-gray-700">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" />
          <span>{message}</span>
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="grid content-start gap-4">
          <div className="border border-[var(--border)] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Progress</h2>
              <span className="text-sm text-gray-600">{totalProgress}%</span>
            </div>
            <div className="mt-3 h-2 bg-gray-100">
              <div className="h-2 bg-[var(--primary)]" style={{ width: `${totalProgress}%` }} />
            </div>
          </div>

          {player?.sections.map((section) => (
            <article className="border border-[var(--border)] bg-white" key={section.id}>
              <div className="border-b border-[var(--border)] bg-gray-50 px-4 py-3">
                <h2 className="text-sm font-semibold">{section.title}</h2>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {section.lessons.map((lesson) => (
                  <div className="grid gap-3 px-4 py-4" key={lesson.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{lesson.title}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {progress[lesson.id]?.percent_complete ?? lesson.percent_complete}% complete
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button className="gap-2 bg-white text-[var(--foreground)] ring-1 ring-[var(--border)] hover:bg-gray-100" onClick={() => handleProgress(lesson.id, 50)}>
                          <Play aria-hidden="true" className="size-4" />
                          Resume
                        </Button>
                        <Button className="gap-2" onClick={() => handleProgress(lesson.id, 100)}>
                          <CheckCircle2 aria-hidden="true" className="size-4" />
                          Done
                        </Button>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100">
                      <div
                        className="h-2 bg-[var(--primary)]"
                        style={{
                          width: `${progress[lesson.id]?.percent_complete ?? lesson.percent_complete}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}

          {!player ? (
            <div className="border border-[var(--border)] bg-white px-4 py-10 text-center text-sm text-gray-600">
              Player content unavailable
            </div>
          ) : null}
        </section>

        <aside className="grid content-start gap-4">
          <TutorPanel courseId={courseId} />

          <QuizAttemptForm
            courseId={courseId}
            onSubmitted={(passed) => setMessage(passed ? "Quiz passed" : "Quiz submitted")}
          />

          <section className="grid gap-3 border border-[var(--border)] bg-white p-4">
            <div className="flex items-center gap-2">
              <Award aria-hidden="true" className="size-4 text-gray-500" />
              <h2 className="text-sm font-semibold">Certificate</h2>
            </div>
            <p className="text-sm text-gray-600">
              {completion ? `Completed ${new Date(completion.completed_at).toLocaleDateString()}` : "Complete every lesson first"}
            </p>
            <Button className="gap-2" disabled={isPending} onClick={handleCertificate}>
              <Award aria-hidden="true" className="size-4" />
              Issue
            </Button>
            {certificate ? (
              <a
                className="inline-flex h-10 items-center justify-center gap-2 bg-white px-4 text-sm font-medium text-[var(--foreground)] ring-1 ring-[var(--border)] hover:bg-gray-100"
                href={certificateDownloadUrl(courseId)}
              >
                <Download aria-hidden="true" className="size-4" />
                Download PDF
              </a>
            ) : null}
          </section>
        </aside>
      </section>
    </main>
  );
}

function updatePlayerProgress(
  player: CoursePlayer | null,
  lessonId: string,
  percentComplete: number,
) {
  if (player === null) {
    return player;
  }
  return {
    ...player,
    sections: player.sections.map((section) => ({
      ...section,
      lessons: section.lessons.map((lesson) =>
        lesson.id === lessonId ? { ...lesson, percent_complete: percentComplete } : lesson,
      ),
    })),
  };
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function QuizAttemptForm({
  courseId,
  onSubmitted,
}: {
  courseId: string;
  onSubmitted: (passed: boolean) => void;
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<QuizAttemptFormInput>({
    defaultValues: { blockId: "", selectedOptionId: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(quizAttemptFormSchema),
  });
  const { formError, isSubmitting, submit } = useFormSubmit({
    action: (input: QuizAttemptFormInput) =>
      submitQuizAttempt(courseId, input.blockId, input.selectedOptionId),
    onSuccess: (response) => {
      onSubmitted(response.data.passed);
      reset();
    },
    setError,
  });
  const fieldError = (field: keyof QuizAttemptFormInput) => {
    const message = errors[field]?.message;
    return message ? resolveMessage(field, message) : undefined;
  };

  return (
    <form className="grid gap-3 border border-[var(--border)] bg-white p-4" noValidate onSubmit={handleSubmit(submit)}>
      <div className="flex items-center gap-2">
        <ListChecks aria-hidden="true" className="size-4 text-gray-500" />
        <h2 className="text-sm font-semibold">Quiz</h2>
      </div>
      <FormError>{formError}</FormError>
      <Field
        error={fieldError("blockId")}
        label="Quiz block ID"
        registration={register("blockId")}
      />
      <Field
        error={fieldError("selectedOptionId")}
        label="Selected option ID"
        registration={register("selectedOptionId")}
      />
      <SubmitButton className="gap-2" isSubmitting={isSubmitting}>
        <ListChecks aria-hidden="true" className="size-4" />
        Submit
      </SubmitButton>
    </form>
  );
}
