import { Card } from "@/components/ui/card";

import { AnimatedFade, AnimatedHeading } from "./animated-heading";
import { Eyebrow, Pattern } from "./shared";

export function AiTutor() {
  const benefits = [
    ["Course-grounded", "Answers come from material inside the course."],
    ["Context-aware", "Understands the lesson the learner is working through."],
    ["Advisory", "Guides understanding instead of doing the work."],
    ["Citations when available", "Points learners back to source lessons."],
  ];
  return (
    <section
      className="relative overflow-hidden bg-[var(--color-primary-lighter)] py-16 sm:py-20 lg:flex lg:min-h-[640px] lg:items-center lg:py-0"
      id="ai-tutor"
    >
      <Pattern />
      <div className="landing-container relative">
        <div className="mx-auto max-w-xl text-center">
          <AnimatedFade className="inline-block">
            <Eyebrow>AI tutor</Eyebrow>
          </AnimatedFade>
          <span className="sr-only">Course-grounded AI</span>
          <AnimatedHeading
            className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl"
            variant="slide-left"
          >
            Learning support, grounded in your content.
          </AnimatedHeading>
          <AnimatedFade
            as="p"
            className="mt-4 text-base leading-7 text-[var(--color-text-sub-500)]"
            delay={250}
          >
            OmniXtra&apos;s AI tutor helps learners understand course material,
            answer questions and move forward using knowledge from their course.
          </AnimatedFade>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map(([title, body]) => (
            <Card
              className="rounded-lg border-[var(--color-primary-lighter)] p-5 shadow-none"
              key={title}
            >
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-5 text-[var(--color-text-sub-500)]">
                {body}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
