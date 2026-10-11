import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AnimatedFade, AnimatedHeading } from "./animated-heading";
import { Eyebrow, assetRoot } from "./shared";

export function Hero() {
  return (
    <section className="pb-20 pt-20 sm:pb-28 sm:pt-28 lg:pb-32 lg:pt-36">
      <div className="landing-container grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
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
        <div className="mx-auto w-full max-w-lg lg:max-w-xl">
          <Image
            alt="An illustration of learning and new ideas"
            className="h-auto w-full"
            height={610}
            priority
            sizes="(max-width: 1024px) 80vw, 42vw"
            src={`${assetRoot}/hero-right.png`}
            width={640}
          />
        </div>
      </div>
    </section>
  );
}
