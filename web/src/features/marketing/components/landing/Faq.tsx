import { ChevronLeft, ChevronRight } from "lucide-react";

import { Eyebrow } from "./shared";

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

export function Faq() {
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
