import { ArrowRight, Check, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

const assetRoot = "/images/landing";

const platformCards = [
  {
    body: "Create a learning environment that looks and feels like your brand.",
    kind: "brand",
    title: "Branded academy",
  },
  {
    body: "See course completion, learner progress and academy activity from one place.",
    kind: "progress",
    title: "Learning progress",
  },
  {
    body: "Build structured courses with lessons, content, video, images, web content and quizzes.",
    kind: "content",
    title: "Practical course creation",
  },
  {
    body: "Give learners contextual help powered by the material inside each course.",
    kind: "tutor",
    title: "AI tutor",
  },
  {
    body: "Give admins, course owners, facilitators and learners the right level of access.",
    kind: "roles",
    title: "Flexible roles",
  },
  {
    body: "Invite your team and control academy access from one place.",
    kind: "members",
    title: "Simple member management",
  },
] as const;

const faqs = [
  [
    "Who is OmniXtra for?",
    "Teams and companies that want to deliver structured learning through their own branded academy, from internal training to customer and partner education.",
  ],
  [
    "Can I brand my academy?",
    "Yes. Your academy carries your name, logo, colour and subdomain, so learning feels like yours rather than a generic LMS.",
  ],
  [
    "Can one person have different roles across courses?",
    "Yes. Academy membership defines where someone belongs, while each course enrolment defines whether they own, facilitate or learn in that course.",
  ],
  [
    "Can I invite learners and course teams?",
    "Yes. Invite admins, course owners, facilitators and learners, then manage academy access from one place.",
  ],
  [
    "What can learners use the AI tutor for?",
    "The AI tutor helps learners understand course material and answer course-grounded questions, with citations back to the source lesson when available.",
  ],
] as const;

export function PublicLanding() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-bg-white-0)] text-[var(--color-text-main-900)]">
      <main>
        <Hero />
        <ProductWelcome />
        <Platform />
        <HowItWorks />
        <FeatureBand
          bullets={[
            "Academy overview",
            "Courses",
            "Members",
            "Billing",
            "Progress and activity",
          ]}
          eyebrow="Academy operations"
          frame="section_5_frame.jpg"
          image="section_5_image.png"
          imageAlt="OmniXtra academy course catalogue"
          imageCrop="wide"
          patterned
          title="Run your academy from one place."
        >
          Admins keep courses, people, progress and billing moving without
          switching tools.
        </FeatureBand>
        <FeatureBand
          bullets={[
            "Your identity across the learner experience",
            "A course catalogue your teams recognize",
            "A learning space that carries your brand",
          ]}
          eyebrow="Branded academy"
          frame="section_6_frame.jpg"
          image="section_2_image.png"
          imageAlt="A branded OmniXtra academy dashboard"
          imagePlacement="left-bottom"
          reverse
          title="Make learning feel like yours."
        >
          Give your academy its own identity with learning experiences designed
          around your brand.
        </FeatureBand>
        <FeatureBand
          bullets={["Content", "Web content", "Video", "Images", "Quizzes"]}
          eyebrow="Course creation"
          frame="section_5_frame.jpg"
          image="section_7_image.png"
          imageAlt="OmniXtra course creation form"
          imagePlacement="centered-modal"
          patterned
          title="Build practical courses without the complexity."
        >
          Create lessons and add the content your learners actually need.
        </FeatureBand>
        <FeatureBand
          bullets={[
            "Course outline and current lesson",
            "Progress towards completion",
            "Lesson content and quizzes",
            "AI tutor inside the course",
          ]}
          eyebrow="Learner experience"
          frame="section_2_background.jpg"
          image="section_8_image.png"
          imageAlt="OmniXtra learner course player"
          imagePlacement="learner-player"
          reverse
          title="Give learners a clearer way to learn."
        >
          From their first lesson to completion, learners always know where they
          are and what comes next.
        </FeatureBand>
        <AiTutor />
        <Faq />
        <ClosingCta />
      </main>
      <MarketingFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="pb-20 pt-20 sm:pb-28 sm:pt-28 lg:pb-32 lg:pt-36">
      <div className="landing-container grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Eyebrow>AI-native academies for modern teams</Eyebrow>
          <span className="sr-only">AI-native LMS for branded academies</span>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.08] sm:text-6xl lg:text-7xl">
            Launch your own learning academy.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-text-sub-500)]">
            Create a branded academy, build practical courses, invite your team,
            and give learners an AI tutor grounded in your content.
          </p>
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

function ProductWelcome() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      {/* Purple backdrop feathered into white at the top and bottom edges,
          so the band blends out of the hero and into the next section. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)",
        }}
      >
        <Image
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          fill
          sizes="100vw"
          src={`${assetRoot}/section_2_background.jpg`}
        />
        <div className="absolute inset-0 bg-[var(--primary)]/25" />
      </div>
      <div className="landing-container relative rounded-2xl border border-[var(--color-stroke-white-0)]/40 bg-[var(--color-bg-white-0)]/10 py-3 shadow-[var(--shadow-2x-large)] backdrop-blur-sm sm:py-6">
        <Image
          alt="OmniXtra academy dashboard"
          className="h-auto w-full rounded-xl"
          height={840}
          sizes="(max-width: 1280px) 90vw, 1152px"
          src={`${assetRoot}/section_2_image.png`}
          width={1400}
        />
      </div>
    </section>
  );
}

function Platform() {
  return (
    <section className="py-20 sm:py-28 lg:min-h-[1137px]" id="platform">
      <div className="landing-container">
        <SectionIntro
          eyebrow="The platform"
          title="Everything you need to launch, manage and grow your academy."
        >
          OmniXtra gives teams the building blocks of a learning academy without
          assembling an LMS from scratch.
        </SectionIntro>
        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div className="grid gap-5">
            <PlatformCard {...platformCards[0]} tall />
            <PlatformCard {...platformCards[1]} />
          </div>
          <div className="grid gap-5">
            <PlatformCard {...platformCards[2]} />
            <PlatformCard {...platformCards[3]} tall />
          </div>
          <div className="grid gap-5 md:col-span-2 lg:col-span-1">
            <PlatformCard {...platformCards[4]} tall />
            <PlatformCard {...platformCards[5]} />
          </div>
        </div>
      </div>
    </section>
  );
}

type PlatformCardProps = (typeof platformCards)[number] & { tall?: boolean };

function PlatformCard({ body, kind, tall = false, title }: PlatformCardProps) {
  return (
    <Card className="overflow-hidden bg-[var(--color-bg-weak-100)] p-5 shadow-none">
      <PlatformVisual kind={kind} tall={tall} />
      <h3 className="mt-5 text-xl font-semibold">{title}</h3>
      <p className="mt-3 leading-7 text-[var(--color-text-sub-500)]">{body}</p>
    </Card>
  );
}

function PlatformVisual({
  kind,
  tall,
}: {
  kind: PlatformCardProps["kind"];
  tall: boolean;
}) {
  const height = tall ? "h-60" : "h-32";

  if (kind === "brand") {
    return (
      <div
        className={`${height} overflow-hidden rounded-lg bg-[var(--color-bg-white-0)] p-4`}
      >
        <div className="space-y-4">
          {[
            "Your brand, your academy",
            "Northwind Academy",
            "Learning that feels like you",
          ].map((label, index) => (
            <div
              className="relative rounded-md bg-[var(--color-light-indigo-900)] px-5 py-4 text-[var(--color-text-white-0)] shadow-[6px_7px_0_var(--color-light-indigo-500)]"
              key={label}
            >
              <span className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-[var(--color-bg-white-0)] font-bold text-[var(--primary)]">
                  {index === 1 ? "N" : "O"}
                </span>
                <span>{label}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === "progress") {
    return (
      <div className={`${height} rounded-lg bg-[var(--color-bg-white-0)] p-4`}>
        {[
          ["Onboarding essentials", "80%", "w-4/5"],
          ["Product foundations", "58%", "w-3/5"],
        ].map(([label, value, width]) => (
          <div className="mb-4" key={label}>
            <div className="flex justify-between text-xs text-[var(--color-text-sub-500)]">
              <span>{label}</span>
              <span>{value}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-[var(--color-bg-soft-200)]">
              <div
                className={`h-full rounded-full bg-[var(--primary)] ${width}`}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (kind === "content") {
    return (
      <div
        className={`${height} overflow-hidden rounded-lg bg-[var(--color-bg-white-0)] p-4`}
      >
        <div className="flex flex-wrap gap-2">
          {["CONTENT", "VIDEO", "IMAGE", "QUIZ", "WEB CONTENT", "AUDIO"].map(
            (item) => (
              <span
                className="rounded-full bg-[var(--color-bg-surface-700)] px-4 py-2 text-xs text-[var(--color-text-white-0)]"
                key={item}
              >
                {item}
              </span>
            ),
          )}
        </div>
      </div>
    );
  }

  if (kind === "tutor") {
    return (
      <div
        className={`${height} overflow-hidden rounded-lg bg-[var(--color-bg-white-0)] p-4`}
      >
        <div className="space-y-3 text-xs leading-5">
          <p className="ml-7 rounded-lg bg-[var(--primary)] px-4 py-2 text-[var(--color-text-white-0)]">
            What&apos;s the difference between enrolment and membership?
          </p>
          <p className="mr-7 rounded-lg bg-[var(--color-bg-surface-700)] px-4 py-2 text-[var(--color-text-white-0)]">
            Membership defines where you belong; enrolment defines what you can
            do in a course.
          </p>
          <p className="ml-7 rounded-lg bg-[var(--primary)] px-4 py-2 text-[var(--color-text-white-0)]">
            Can you show me the source lesson?
          </p>
        </div>
      </div>
    );
  }

  if (kind === "roles") {
    return (
      <div
        className={`${height} relative rounded-lg bg-[var(--color-bg-white-0)]`}
      >
        <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--primary)]/35" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-[var(--primary)]/35" />
        {[
          ["left-4 top-1/2 -translate-y-1/2", 1, "Owner"],
          ["right-4 top-1/2 -translate-y-1/2", 2, "Facilitator"],
          ["left-1/2 top-3 -translate-x-1/2", 3, "Owner"],
          ["bottom-3 left-1/2 -translate-x-1/2", 4, "Learner"],
          ["left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2", 5, "Learner"],
        ].map(([position, avatar, label]) => (
          <div
            className={`absolute z-10 text-center ${position}`}
            key={`${avatar}`}
          >
            <Image
              alt=""
              className="mx-auto size-9 rounded-full bg-[var(--color-primary-lighter)]"
              height={36}
              src={`${assetRoot}/memoji-${avatar}.png`}
              width={36}
            />
            <span className="mt-1 block text-[9px] text-[var(--color-text-sub-500)]">
              {label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${height} flex flex-col justify-center rounded-lg bg-[var(--color-bg-white-0)] p-4`}
    >
      <div className="flex items-center">
        <div className="flex -space-x-2">
          {[1, 2, 3, 4].map((avatar) => (
            <Image
              alt=""
              className="size-9 rounded-full border-2 border-[var(--color-stroke-white-0)] bg-[var(--color-primary-lighter)]"
              height={36}
              key={avatar}
              src={`${assetRoot}/memoji-${avatar}.png`}
              width={36}
            />
          ))}
        </div>
        <span className="ml-3 text-xs text-[var(--color-text-sub-500)]">
          +9 members invited
        </span>
      </div>
      <span className="mt-4 w-fit rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-[var(--color-text-white-0)]">
        + Invite members
      </span>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      body: "Set up your academy and establish your brand.",
      offset: "lg:pt-8",
      title: "Create your academy",
      tone: "text-[var(--primary)]",
    },
    {
      body: "Create structured learning content using simple course-building tools.",
      offset: "lg:pt-32",
      title: "Build your courses",
      tone: "text-[var(--color-blue-base)]",
    },
    {
      body: "Bring in admins, course teams and learners with controlled access.",
      offset: "lg:pt-56",
      title: "Invite your team",
      tone: "text-[var(--color-red-base)]",
    },
    {
      body: "Learners progress through courses while your team monitors activity and completion.",
      offset: "lg:pt-80",
      title: "Teach, learn and track",
      tone: "text-[var(--color-orange-base)]",
    },
  ];
  return (
    <section className="py-20 sm:py-28" id="how-it-works">
      <div className="landing-container">
        <SectionIntro
          eyebrow="How it works"
          title="From idea to learning academy in four steps."
        >
          A direct setup path from the first academy decision to measurable
          learning.
        </SectionIntro>
        <ol className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {steps.map(({ body, offset, title, tone }, index) => (
            <li
              className="min-h-48 border-l border-[var(--color-stroke-soft-200)] px-6 lg:min-h-[36rem]"
              key={title}
            >
              <div className={offset}>
                <span className={`text-xs font-semibold ${tone}`}>
                  [{String(index + 1).padStart(2, "0")}]
                </span>
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-3 max-w-64 leading-7 text-[var(--color-text-sub-500)]">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

type FeatureBandProps = {
  bullets?: string[];
  children: ReactNode;
  eyebrow: string;
  frame: string;
  image: string;
  imageAlt: string;
  imageCrop?: "natural" | "wide";
  imagePlacement?:
    "centered-modal" | "learner-player" | "left-bottom" | "right-bottom";
  patterned?: boolean;
  reverse?: boolean;
  title: string;
};

function FeatureBand({
  bullets,
  children,
  eyebrow,
  frame,
  image,
  imageAlt,
  imageCrop = "natural",
  imagePlacement = "right-bottom",
  patterned = false,
  reverse = false,
  title,
}: FeatureBandProps) {
  return (
    <section
      className={`relative overflow-hidden py-20 sm:py-24 lg:flex lg:min-h-[640px] lg:items-center lg:py-0 ${
        patterned
          ? "bg-[var(--color-primary-lighter)]"
          : "bg-[var(--color-bg-white-0)]"
      }`}
    >
      {patterned ? <Pattern /> : null}
      <div
        className={`landing-container relative grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] ${reverse ? "lg:grid-cols-[1.1fr_0.9fr] lg:[&>*:first-child]:order-2" : ""}`}
      >
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
            {title}
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--color-text-sub-500)]">
            {children}
          </p>
          {bullets && (
            <ul className="mt-7 flex max-w-xl flex-wrap gap-x-6 gap-y-3">
              {bullets.map((bullet) => (
                <li
                  className="flex items-center gap-2 text-sm text-[var(--color-text-sub-500)]"
                  key={bullet}
                >
                  <Check
                    aria-hidden="true"
                    className="size-4 text-[var(--primary)]"
                  />{" "}
                  {bullet}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div
          className={`relative mx-auto w-full max-w-xl overflow-hidden rounded-xl ${
            imagePlacement === "centered-modal"
              ? "aspect-[1.36]"
              : imagePlacement === "learner-player"
                ? "aspect-[1.36]"
                : "aspect-[1.28]"
          }`}
        >
          <Image
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fill
            loading="lazy"
            sizes="(max-width: 1024px) 90vw, 45vw"
            src={`${assetRoot}/${frame}`}
          />
          <div
            className={`absolute bottom-0 overflow-hidden ${
              imagePlacement === "centered-modal"
                ? "left-[6.5%] top-[3.5%] w-[87%]"
                : imagePlacement === "learner-player"
                  ? "left-0 top-[5.5%] w-[95%] rounded-bl-xl"
                  : imagePlacement === "left-bottom"
                    ? "left-0 top-[9%] w-[87%] rounded-xl border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] shadow-[var(--shadow-medium)]"
                    : "left-[6%] top-[9%] w-[94%] rounded-xl border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] shadow-[var(--shadow-medium)]"
            }`}
          >
            <Image
              alt={imageAlt}
              className={
                imagePlacement === "centered-modal"
                  ? "h-auto w-full max-w-none"
                  : imagePlacement === "learner-player"
                    ? "h-auto w-[220%] max-w-none -translate-x-[26%]"
                    : imageCrop === "wide"
                      ? "h-auto w-[150%] max-w-none"
                      : "h-full w-full object-cover object-top"
              }
              height={720}
              loading="lazy"
              sizes="(max-width: 1024px) 130vw, 68vw"
              src={`${assetRoot}/${image}`}
              width={1060}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function AiTutor() {
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
          <Eyebrow>AI tutor</Eyebrow>
          <span className="sr-only">Course-grounded AI</span>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
            Learning support, grounded in your content.
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--color-text-sub-500)]">
            OmniXtra&apos;s AI tutor helps learners understand course material,
            answer questions and move forward using knowledge from their course.
          </p>
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

function Faq() {
  return (
    <section className="relative py-20 sm:py-28 lg:min-h-[1137px]" id="faq">
      <div className="landing-container relative">
        <div className="text-center">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mx-auto mt-5 max-w-lg text-4xl font-semibold sm:text-5xl">
            Got questions? We&apos;ve got them answered.
          </h2>
        </div>
        <div className="mt-14 divide-y divide-[var(--color-stroke-soft-200)] border-y border-[var(--color-stroke-soft-200)]">
          {faqs.map(([question, answer], index) => (
            <div
              className="py-6 lg:grid lg:grid-cols-[0.8fr_1.2fr] lg:gap-14"
              id={`faq-question-${index + 1}`}
              key={question}
            >
              <div className="flex items-center gap-4 text-lg font-semibold">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#d648a5] text-sm text-white">
                  {index + 1}
                </span>
                {question}
              </div>
              <p className="mt-5 pl-13 leading-7 text-[var(--color-text-sub-500)] lg:mt-0 lg:pl-0">
                {answer}
              </p>
            </div>
          ))}
        </div>
        <nav
          aria-label="FAQ navigation"
          className="mt-3 flex justify-end gap-3"
        >
          <a
            aria-label="Go to the first FAQ"
            className="grid size-10 place-items-center rounded-full border border-[var(--color-stroke-soft-200)] bg-white text-[var(--color-text-sub-500)] shadow-[0_14px_30px_rgba(88,92,95,0.18)] transition-colors hover:bg-[var(--color-bg-weak-100)]"
            href="#faq-question-1"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </a>
          <a
            aria-label="Go to the last FAQ"
            className="grid size-10 place-items-center rounded-full border border-[var(--color-stroke-soft-200)] bg-white text-[var(--color-text-sub-500)] shadow-[0_14px_30px_rgba(88,92,95,0.18)] transition-colors hover:bg-[var(--color-bg-weak-100)]"
            href="#faq-question-5"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </a>
        </nav>
      </div>
      <span
        aria-hidden="true"
        className="absolute bottom-10 left-1/2 h-0.5 w-5 -translate-x-1/2 bg-[#ef3bab]"
      />
    </section>
  );
}

function ClosingCta() {
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
          <h2 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            Your academy can start here.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[var(--color-primary-lighter)]">
            Create a branded learning academy and start building your first
            course.
          </p>
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

function MarketingFooter() {
  return (
    <footer className="relative overflow-hidden bg-[var(--color-bg-white-0)] py-14">
      <Pattern />
      <div className="landing-container relative">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <div className="max-w-sm">
            <Image
              alt="OmniXtra"
              className="h-auto w-48"
              height={48}
              src={`${assetRoot}/OmniXtra_logo_brand.svg`}
              width={208}
            />
            <p className="mt-5 leading-7 text-[var(--color-text-sub-500)]">
              Launch a branded learning academy with courses, members, progress
              and an AI tutor grounded in your content.
            </p>
          </div>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-3 text-sm font-semibold"
          >
            <a className="landing-footer-link" href="#platform">
              Platform <ArrowRight />
            </a>
            <a className="landing-footer-link" href="#ai-tutor">
              AI tutor <ArrowRight />
            </a>
            <a className="landing-footer-link" href="#how-it-works">
              How it works <ArrowRight />
            </a>
            <a className="landing-footer-link" href="#faq">
              FAQ <ArrowRight />
            </a>
          </nav>
        </div>
        <div className="mt-14 flex flex-col justify-between gap-3 border-t border-[var(--color-stroke-soft-200)] pt-6 text-sm text-[var(--color-text-sub-500)] sm:flex-row">
          <span>© 2026 OmniXtra. All rights reserved.</span>
          <Link
            className="font-semibold text-[var(--primary)] hover:text-[var(--color-primary-dark)]"
            href="/join"
          >
            Have an invitation? Join
          </Link>
        </div>
      </div>
    </footer>
  );
}

function SectionIntro({
  children,
  eyebrow,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
          {title}
        </h2>
      </div>
      <p className="max-w-xl text-lg leading-8 text-[var(--color-text-sub-500)] lg:justify-self-end">
        {children}
      </p>
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-[var(--color-light-indigo-800)]">
      <span
        aria-hidden="true"
        className="size-2 rounded-full bg-[var(--primary)]"
      />
      {children}
    </p>
  );
}

function Pattern() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-repeat opacity-[0.035]"
      style={{
        backgroundImage: `url(${assetRoot}/omnixtra_pattern.png)`,
        backgroundSize: "640px 640px",
      }}
    />
  );
}
