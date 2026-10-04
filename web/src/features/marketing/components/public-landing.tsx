import { AiTutor } from "./landing/AiTutor";
import { ClosingCta } from "./landing/ClosingCta";
import { Faq } from "./landing/Faq";
import { FeatureBand } from "./landing/FeatureBand";
import { Hero } from "./landing/Hero";
import { HowItWorks } from "./landing/HowItWorks";
import { MarketingFooter } from "./landing/MarketingFooter";
import { Platform } from "./landing/Platform";
import { ProductWelcome } from "./landing/ProductWelcome";

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
