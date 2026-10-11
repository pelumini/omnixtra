import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AnimatedFade, AnimatedHeading } from "./animated-heading";
import { assetRoot } from "./shared";

export function ClosingCta() {
  return (
    <section className="relative isolate min-h-[560px] overflow-hidden py-20 text-[var(--color-text-white-0)] sm:py-24 lg:py-0">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 10%, black 86%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 10%, black 86%, transparent 100%)",
        }}
      >
        <Image
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          fill
          loading="lazy"
          sizes="100vw"
          src={`${assetRoot}/section_2_background.jpg`}
        />
        <div className="absolute inset-0 bg-[var(--color-light-indigo-900)]/70" />
      </div>
      <div className="landing-container relative grid items-center gap-12 lg:min-h-[560px] lg:grid-cols-2">
        <div className="relative z-10 mx-auto w-full max-w-md py-12 text-center sm:py-16 lg:mx-0 lg:py-0 lg:text-left">
          <AnimatedHeading
            className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl"
            variant="emphasis"
          >
            Your academy can start here.
          </AnimatedHeading>
          <AnimatedFade
            as="p"
            className="mt-5 text-lg leading-8 text-[var(--color-primary-lighter)]"
            delay={250}
          >
            Create a branded learning academy and start building your first
            course.
          </AnimatedFade>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link
              className="landing-button bg-[var(--color-bg-white-0)] text-[var(--primary)] hover:bg-[var(--color-primary-lighter)]"
              href="/get-started"
            >
              Create your academy <ArrowRight aria-hidden="true" />
            </Link>
            <Link
              className="landing-button bg-[var(--color-red-lighter)] text-[var(--color-red-base)] hover:bg-[var(--color-bg-white-0)]"
              href="/join"
            >
              Join with invite <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
        {/* Decorative dashboard mockup: floats on the purple, bleeds off the
            right edge (clipped by the section), fades at the bottom. Hidden
            below lg so the mobile CTA stays a clean, centred purple panel. */}
        <div
          aria-hidden="true"
          className="pointer-events-none relative hidden lg:block lg:h-[560px]"
        >
          <Image
            alt=""
            className="absolute bottom-0 left-6 w-[150%] max-w-none rounded-tl-2xl shadow-[var(--shadow-2x-large)]"
            height={760}
            loading="lazy"
            sizes="60vw"
            src={`${assetRoot}/section_2_image.png`}
            style={{
              maskImage:
                "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
            }}
            width={1200}
          />
        </div>
      </div>
    </section>
  );
}
