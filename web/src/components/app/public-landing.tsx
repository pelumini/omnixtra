import Link from "next/link";
import type { ReactNode } from "react";

export function PublicLanding() {
  return (
    <div className="min-h-screen bg-[#f6f8fb] text-[#0c1726]">
      <main>
        <section className="relative overflow-hidden bg-[#0b2f26] px-6 pb-10 pt-16 text-white sm:pb-16 lg:pt-20">
          <div className="absolute inset-x-0 top-0 h-20 bg-white" aria-hidden="true" />
          <div
            className="absolute inset-x-0 top-20 h-px bg-white/15"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto max-w-4xl pt-10 text-center sm:pt-16">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#bfecc4]">
                OmniXtra LMS
              </p>
              <h1 className="mt-5 text-5xl font-bold leading-none sm:text-6xl lg:text-7xl">
                AI-native LMS for branded academies
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#dce9e5] sm:text-xl">
                Create your academy, publish role-aware courses, invite every learning
                audience, and give them an AI tutor grounded in your own material.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  className="inline-flex h-12 min-w-48 items-center justify-center rounded-md bg-[#c9f38d] px-6 text-base font-semibold text-[#08251f] shadow-sm hover:bg-[#d8ffa6]"
                  href="/get-started"
                >
                  Create your academy
                </Link>
                <Link
                  className="inline-flex h-12 min-w-48 items-center justify-center rounded-md border border-white/30 px-6 text-base font-semibold text-white hover:border-white hover:bg-white/10"
                  href="/join"
                >
                  Join with invite
                </Link>
              </div>
              <p className="mt-4 text-sm text-[#b7cdc6]">
                Free to start. No credit card. First course live in days.
              </p>
            </div>

            <ProductShowcase />
          </div>
        </section>

        <section className="border-b border-[#d6dee8] bg-white px-6 py-7">
          <div className="mx-auto grid max-w-7xl gap-4 text-center text-sm font-semibold uppercase tracking-[0.16em] text-[#51647d] sm:grid-cols-2 lg:grid-cols-4">
            <span>Employee onboarding</span>
            <span>Customer education</span>
            <span>Partner enablement</span>
            <span>Compliance training</span>
          </div>
        </section>

        <section id="platform" className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr] md:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#116149]">
                  Built for launch speed
                </p>
                <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
                  From empty workspace to live academy without implementation drag.
                </h2>
              </div>
              <p className="text-base leading-7 text-[#52657a]">
                OmniXtra gives admins a clean setup path, course teams the right
                authoring surface, and learners a focused home for the courses they take.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <MarketCard
                kicker="01"
                title="Brand the academy"
                body="Set the academy name, subdomain, logo, colour, and workspace identity before inviting the team."
              />
              <MarketCard
                kicker="02"
                title="Publish role-aware courses"
                body="Give owners and facilitators course-level control while learners see only what is assigned to them."
              />
              <MarketCard
                kicker="03"
                title="Track learning outcomes"
                body="Measure progress, completions, and readiness from the same admin surface used to manage access."
              />
            </div>
          </div>
        </section>

        <section id="ai-tutor" className="bg-[#fffbef] px-6 py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a65311]">
                Course-grounded AI
              </p>
              <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
                A tutor that answers from the course, not from guesswork.
              </h2>
              <p className="mt-5 text-base leading-7 text-[#52657a]">
                Learners can ask for explanations, summaries, and practice help inside
                the course context while admins keep publishing and review controls.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Signal label="Grounded responses" value="Per course" />
              <Signal label="Access model" value="Role-aware" />
              <Signal label="Progress view" value="Admin ready" />
              <Signal label="Audience fit" value="Teams, customers, partners" />
            </div>
          </div>
        </section>

        <section id="pricing" className="px-6 py-16 sm:py-20">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 border-t border-[#d6dee8] pt-10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#116149]">
                Start now
              </p>
              <h2 className="mt-3 text-3xl font-bold leading-tight">
                Build the first academy before the next planning meeting.
              </h2>
            </div>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-md bg-[#116149] px-6 text-base font-semibold text-white hover:bg-[#0d4f3b] sm:min-w-56"
              href="/get-started"
            >
              Create your academy
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function ProductShowcase() {
  return (
    <div className="relative mx-auto mt-12 max-w-6xl sm:mt-16">
      <div className="absolute -left-2 top-16 hidden rounded-md border-2 border-[#ff8a3d] bg-white px-4 py-3 text-sm font-semibold text-[#0c1726] shadow-lg lg:block">
        AI: create a course outline
      </div>
      <div className="absolute -right-2 bottom-24 hidden rounded-md border-2 border-[#e4b622] bg-white px-4 py-3 text-sm font-semibold text-[#0c1726] shadow-lg lg:block">
        Quiz: check readiness
      </div>
      <div className="rounded-lg border border-white/15 bg-white p-3 shadow-2xl">
        <div className="overflow-hidden rounded-md border border-[#d6dee8] bg-[#f8fafc]">
          <div className="flex h-12 items-center justify-between border-b border-[#d6dee8] bg-white px-4">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-md bg-[#116149] text-sm font-bold text-white">
                O
              </span>
              <span className="text-sm font-bold text-[#0c1726]">OmniXtra Academy</span>
            </div>
            <div className="hidden h-8 w-56 rounded-md bg-[#eef3f7] sm:block" />
          </div>
          <div className="grid min-h-[360px] md:grid-cols-[72px_1fr]">
            <div className="hidden border-r border-[#d6dee8] bg-[#0f5f49] p-4 md:block">
              <div className="space-y-4">
                <RailDot active />
                <RailDot />
                <RailDot />
                <RailDot />
              </div>
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-5">
                <div className="rounded-md border border-[#d6dee8] bg-white p-5">
                  <p className="text-xs font-semibold uppercase text-[#116149]">
                    Course builder
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-[#0c1726]">
                    Safety onboarding
                  </h3>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <CourseTile title="Intro" tone="bg-[#e8f5ef]" />
                    <CourseTile title="Policy" tone="bg-[#fff2dc]" />
                    <CourseTile title="Quiz" tone="bg-[#eef3f7]" />
                  </div>
                </div>
                <div className="rounded-md border border-[#d6dee8] bg-white p-5">
                  <p className="text-sm font-semibold text-[#0c1726]">
                    What should learners know before assessment?
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-[#52657a]">
                    <CheckLine>Recognise unsafe conditions</CheckLine>
                    <CheckLine>Report incidents quickly</CheckLine>
                    <CheckLine>Pass the readiness quiz</CheckLine>
                  </div>
                </div>
              </div>
              <div className="space-y-5">
                <div className="rounded-md border border-[#d6dee8] bg-white p-5">
                  <p className="text-xs font-semibold uppercase text-[#51647d]">
                    Progress
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Metric value="84%" label="Completion" />
                    <Metric value="3.2k" label="Learners" />
                  </div>
                  <div className="mt-5 h-3 overflow-hidden rounded-md bg-[#e8eef4]">
                    <div className="h-full w-4/5 bg-[#116149]" />
                  </div>
                </div>
                <div className="rounded-md border border-[#d6dee8] bg-[#0c1726] p-5 text-white">
                  <p className="text-xs font-semibold uppercase text-[#c9f38d]">
                    AI tutor
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#dce9e5]">
                    Explain this lesson in simpler terms and give me a practice
                    question.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RailDot({ active = false }: { active?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`block size-8 rounded-md ${active ? "bg-white" : "bg-white/25"}`}
    />
  );
}

function CourseTile({ title, tone }: { title: string; tone: string }) {
  return (
    <div className={`min-h-24 rounded-md ${tone} p-3`}>
      <div className="h-10 rounded-md bg-white/80" />
      <p className="mt-3 text-sm font-semibold text-[#0c1726]">{title}</p>
    </div>
  );
}

function CheckLine({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2">
      <span aria-hidden="true" className="size-2 rounded-full bg-[#e4b622]" />
      <span>{children}</span>
    </p>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#f6f8fb] p-4">
      <p className="text-2xl font-bold text-[#0c1726]">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase text-[#51647d]">{label}</p>
    </div>
  );
}

function MarketCard({ body, kicker, title }: { body: string; kicker: string; title: string }) {
  return (
    <article className="rounded-lg border border-[#d6dee8] bg-white p-6">
      <p className="text-sm font-bold text-[#116149]">{kicker}</p>
      <h3 className="mt-4 text-xl font-bold text-[#0c1726]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[#52657a]">{body}</p>
    </article>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#eadfbc] bg-white p-6">
      <p className="text-sm font-semibold uppercase text-[#a65311]">{label}</p>
      <p className="mt-3 text-2xl font-bold text-[#0c1726]">{value}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#d6dee8] bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-[#52657a]">
        <span>(c) OmniXtra</span>
        <Link className="font-medium text-[#116149] hover:text-[#0d4f3b]" href="/join">
          Have an invitation? Join here
        </Link>
      </div>
    </footer>
  );
}
