import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { HeroKnowledgeAnimationGate } from "@/features/landing/components/hero-knowledge-animation-gate";

import { AnimatedFade, AnimatedHeading } from "./animated-heading";
import { Eyebrow } from "./shared";

export function Hero() {
  return (
    <section className="pb-20 pt-0 sm:pb-28 lg:pb-24">
      <div className="landing-container grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <div>
          <AnimatedFade className="inline-block">
            <Eyebrow>AI-native academies for modern teams</Eyebrow>
          </AnimatedFade>
          <span className="sr-only">AI-native LMS for branded academies</span>
          <AnimatedHeading
            as="h1"
            className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.08] sm:text-6xl lg:text-7xl"
            variant="reveal"
          >
            Launch your own learning academy.
          </AnimatedHeading>
          <AnimatedFade
            as="p"
            className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-text-sub-500)]"
            delay={250}
          >
            Create a branded academy, build practical courses, invite your team,
            and give learners an AI tutor grounded in your content.
          </AnimatedFade>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              className="landing-button landing-button-primary"
              href="/get-started"
            >
              Create your academy <ArrowRight aria-hidden="true" />
            </Link>
            <Link className="landing-button landing-button-soft" href="/join">
              Join with invite <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="hidden h-[500px] w-full lg:block">
          <HeroKnowledgeAnimationGate />
        </div>
      </div>
    </section>
  );
}
