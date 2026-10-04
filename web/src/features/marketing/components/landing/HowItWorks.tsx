import { SectionIntro } from "./shared";

export function HowItWorks() {
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
