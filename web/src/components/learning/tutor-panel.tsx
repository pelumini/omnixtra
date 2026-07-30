"use client";

import { Bot, CircleAlert, Send } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { createTutorJob, parseTutorEventMessage, tutorJobEventsUrl } from "@/lib/api";
import type { TutorJob } from "@/lib/schemas";

type TutorPanelProps = {
  courseId: string;
};

type TutorMessage = {
  id: string;
  role: "learner" | "assistant" | "system";
  text: string;
};

export function TutorPanel({ courseId }: TutorPanelProps) {
  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: "disclosure",
      role: "system",
      text: "AI-generated guidance uses this course as its source.",
    },
  ]);
  const [activeJob, setActiveJob] = useState<TutorJob | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (activeJob === null) {
      return undefined;
    }
    const source = new EventSource(tutorJobEventsUrl(courseId, activeJob.id), {
      withCredentials: true,
    });
    eventSourceRef.current = source;
    source.onmessage = (event) => {
      const tutorEvent = parseTutorEventMessage(event.data);
      setStatus(tutorEvent.event);
      const answer = tutorEvent.data.answer;
      if (tutorEvent.event === "completed" && typeof answer === "string") {
        setMessages((current) => [
          ...current,
          { id: crypto.randomUUID(), role: "assistant", text: answer },
        ]);
        source.close();
      }
      if (tutorEvent.event === "failed") {
        setMessages((current) => [
          ...current,
          { id: crypto.randomUUID(), role: "assistant", text: "The tutor could not answer right now." },
        ]);
        source.close();
      }
    };
    source.onerror = () => {
      setStatus("reconnecting");
    };
    return () => {
      source.close();
    };
  }, [activeJob, courseId]);

  function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const question = formString(form, "question");
    if (question === "") {
      return;
    }
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "learner", text: question },
    ]);
    setStatus("queued");

    startTransition(async () => {
      try {
        const response = await createTutorJob(courseId, question, `tutor-${crypto.randomUUID()}`);
        setActiveJob(response.data);
        event.currentTarget.reset();
      } catch (error) {
        setStatus("failed");
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: error instanceof Error ? error.message : "The tutor job could not be queued.",
          },
        ]);
      }
    });
  }

  return (
    <section className="grid gap-3 border border-[var(--border)] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bot aria-hidden="true" className="size-4 text-gray-500" />
          <h2 className="text-sm font-semibold">Tutor</h2>
        </div>
        {status ? <span className="text-xs text-gray-500">{status}</span> : null}
      </div>

      <div className="grid max-h-80 gap-2 overflow-y-auto">
        {messages.map((message) => (
          <article
            className={`border px-3 py-2 text-sm leading-6 ${
              message.role === "learner"
                ? "border-[var(--primary)] bg-emerald-50"
                : "border-[var(--border)] bg-gray-50"
            }`}
            key={message.id}
          >
            <p>{message.text}</p>
          </article>
        ))}
      </div>

      <form className="grid gap-2" onSubmit={handleAsk}>
        <label className="grid gap-1 text-sm font-medium">
          Question
          <textarea
            className="min-h-24 resize-y border border-[var(--border)] px-3 py-2 text-sm font-normal outline-none focus:border-[var(--primary)]"
            maxLength={2000}
            minLength={3}
            name="question"
            required
          />
        </label>
        <Button className="gap-2" disabled={isPending} type="submit">
          <Send aria-hidden="true" className="size-4" />
          Ask
        </Button>
      </form>

      <div className="flex items-start gap-2 text-xs leading-5 text-gray-600">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>AI answers are advisory and should cite course material.</span>
      </div>
    </section>
  );
}

function formString(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}
