"use client";

import { useLayoutEffect, useRef } from "react";

import type { ElementType, ReactNode } from "react";

export type HeadingMotionVariant =
  | "emphasis"
  | "reveal"
  | "rise"
  | "slide-left";

type AnimatedHeadingProps = {
  as?: "h1" | "h2";
  children: string;
  className?: string;
  variant: HeadingMotionVariant;
};

type AnimatedFadeProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  delay?: number;
};

const easing = "cubic-bezier(.16, 1, .3, 1)";

function observeOnce(element: HTMLElement, play: () => void) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      play();
    },
    { threshold: 0.2 },
  );

  observer.observe(element);
  return observer;
}

export function AnimatedHeading({
  as: Heading = "h2",
  children,
  className,
  variant,
}: AnimatedHeadingProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const heading = headingRef.current;
    if (!heading || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const targets = Array.from(
      heading.querySelectorAll<HTMLElement>("[data-heading-motion]"),
    );
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    const x = desktop ? -32 : -19;
    const y = desktop ? 26 : 16;

    targets.forEach((target) => {
      target.style.opacity = "0";
      target.style.transform =
        variant === "slide-left"
          ? `translateX(${x}px)`
          : variant === "emphasis"
            ? "scale(.96)"
            : `translateY(${variant === "reveal" ? "100%" : `${y}px`})`;
    });

    const animations: Animation[] = [];
    const observer = observeOnce(heading, () => {
      targets.forEach((target, index) => {
        const startTransform = target.style.transform;
        animations.push(
          target.animate(
            [
              { opacity: 0, transform: startTransform },
              { opacity: 1, transform: "none" },
            ],
            {
              delay: 100 + (variant === "reveal" ? index * 70 : 0),
              duration: variant === "reveal" ? 620 : 600,
              easing,
              fill: "forwards",
            },
          ),
        );
      });
    });

    return () => {
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
    };
  }, [variant]);

  const words = children.split(" ");

  return (
    <Heading className={className} ref={headingRef}>
      {variant === "reveal" ? (
        words.map((word, index) => (
          <span className="inline-block overflow-hidden align-bottom" key={`${word}-${index}`}>
            <span className="inline-block" data-heading-motion>
              {word}
            </span>
            {index < words.length - 1 ? "\u00a0" : null}
          </span>
        ))
      ) : (
        <span className="block" data-heading-motion>
          {children}
        </span>
      )}
    </Heading>
  );
}

export function AnimatedFade({
  as: Element = "div",
  children,
  className,
  delay = 0,
}: AnimatedFadeProps) {
  const elementRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    element.style.opacity = "0";
    const animations: Animation[] = [];
    const observer = observeOnce(element, () => {
      animations.push(
        element.animate([{ opacity: 0 }, { opacity: 1 }], {
          delay,
          duration: 420,
          easing,
          fill: "forwards",
        }),
      );
    });

    return () => {
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
    };
  }, [delay]);

  return (
    <Element className={className} ref={elementRef}>
      {children}
    </Element>
  );
}
