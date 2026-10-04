import Image from "next/image";

import { Card } from "@/components/ui/card";

import { SectionIntro, assetRoot } from "./shared";

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

export function Platform() {
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
