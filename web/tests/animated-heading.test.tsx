import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AnimatedHeading } from "@/features/marketing/components/landing/animated-heading";

describe("AnimatedHeading", () => {
  it("preserves the heading tag and readable title text", () => {
    const markup = renderToStaticMarkup(
      <AnimatedHeading
        as="h1"
        className="hero-title"
        variant="reveal"
      >
        Launch your own learning academy.
      </AnimatedHeading>,
    );

    expect(markup).toContain('<h1 class="hero-title">');
    expect(markup).toContain("Launch");
    expect(markup).toContain("academy.");
    expect(markup.match(/data-heading-motion/g)).toHaveLength(5);
    expect(markup).not.toContain("aria-hidden");
  });

  it("uses one transform target for non-reveal headings", () => {
    const markup = renderToStaticMarkup(
      <AnimatedHeading variant="rise">
        Make learning feel like yours.
      </AnimatedHeading>,
    );

    expect(markup).toContain("<h2");
    expect(markup.match(/data-heading-motion/g)).toHaveLength(1);
  });
});
