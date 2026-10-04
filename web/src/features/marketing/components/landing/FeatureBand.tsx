import { Check } from "lucide-react";
import Image from "next/image";

import { Eyebrow, Pattern, assetRoot } from "./shared";

import type { ReactNode } from "react";

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

export function FeatureBand({
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
