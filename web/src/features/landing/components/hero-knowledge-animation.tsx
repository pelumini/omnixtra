"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import euclidTome from "../../../../public/images/landing/tomes/01-euclid.webp";
import avicennaTome from "../../../../public/images/landing/tomes/02-avicenna.webp";
import newtonTome from "../../../../public/images/landing/tomes/03-newton.webp";
import smithTome from "../../../../public/images/landing/tomes/04-smith.webp";
import darwinTome from "../../../../public/images/landing/tomes/05-darwin.webp";
import freudTome from "../../../../public/images/landing/tomes/06-freud.webp";

const tomes = [
  { duration: 1350, easing: "cubic-bezier(.16,.72,.2,1)", restX: -10, restY: 0, rotate: -5, settle: 7, src: euclidTome, startRotate: -14, startX: -36, width: 142 },
  { duration: 1050, easing: "cubic-bezier(.22,.68,.3,1)", restX: 8, restY: 56, rotate: 4, settle: 11, src: avicennaTome, startRotate: 23, startX: 42, width: 132 },
  { duration: 1250, easing: "cubic-bezier(.12,.76,.24,1)", restX: -7, restY: 112, rotate: -3, settle: 8, src: newtonTome, startRotate: -21, startX: 24, width: 138 },
  { duration: 950, easing: "cubic-bezier(.25,.66,.3,1)", restX: 10, restY: 168, rotate: 5, settle: 5, src: smithTome, startRotate: 9, startX: -28, width: 126 },
  { duration: 1380, easing: "cubic-bezier(.14,.7,.18,1)", restX: -5, restY: 224, rotate: -4, settle: 12, src: darwinTome, startRotate: 18, startX: -46, width: 134 },
  { duration: 1120, easing: "cubic-bezier(.2,.74,.24,1)", restX: 6, restY: 280, rotate: 3, settle: 6, src: freudTome, startRotate: -24, startX: 38, width: 122 },
] as const;

const tomeDelays = [1750, 2230, 2760, 3200, 3750, 4230] as const;

export function HeroKnowledgeAnimation() {
  const rootRef = useRef<HTMLDivElement>(null);
  const handsRef = useRef<HTMLDivElement>(null);
  const tomeRefs = useRef<Array<HTMLDivElement | null>>([]);
  const symbolRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const hands = handsRef.current;
    const symbol = symbolRef.current;
    const books = tomeRefs.current.filter((book): book is HTMLDivElement => Boolean(book));
    if (!root || !hands || !symbol || books.length !== tomes.length) return;

    const finalFrame = () => {
      hands.style.opacity = "1";
      hands.style.transform = "translateY(0)";
      books.forEach((book, index) => {
        const tome = tomes[index];
        book.style.opacity = "1";
        book.style.transform = `translate(calc(-50% + ${tome.restX}px), ${-tome.restY}px) rotate(${tome.rotate}deg)`;
      });
      symbol.style.opacity = "1";
      symbol.style.transform = "translate(-50%, 0) scale(1)";
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finalFrame();
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      hands.animate(
        [
          { opacity: 0, transform: "translateY(72px)" },
          { opacity: 1, offset: 0.84, transform: "translateY(-6px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 1500, easing: "cubic-bezier(.16,.78,.2,1)", fill: "forwards" },
      );
      books.forEach((book, index) => {
        const tome = tomes[index];
        book.animate(
          [
            { opacity: 0, transform: `translate(calc(-50% + ${tome.restX + tome.startX}px), ${-520 - tome.restY}px) rotate(${tome.startRotate}deg)` },
            { opacity: 1, offset: 0.84, transform: `translate(calc(-50% + ${tome.restX}px), ${-tome.restY + tome.settle}px) rotate(${tome.rotate + (index % 2 ? -2 : 2)}deg)` },
            { opacity: 1, transform: `translate(calc(-50% + ${tome.restX}px), ${-tome.restY}px) rotate(${tome.rotate}deg)` },
          ],
          {
            delay: tomeDelays[index],
            duration: tome.duration,
            easing: tome.easing,
            fill: "forwards",
          },
        );
      });
      symbol.animate(
        [
          { opacity: 0, transform: "translate(-50%, -360px) scale(.85)" },
          { opacity: 1, offset: 0.78, transform: "translate(-50%, 6px) scale(1.08)" },
          { opacity: 1, transform: "translate(-50%, 0) scale(1)" },
        ],
        { delay: 5650, duration: 800, easing: "cubic-bezier(.16,.8,.2,1)", fill: "forwards" },
      );
    }, { threshold: 0.25 });

    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <div aria-hidden="true" className="relative h-full w-full overflow-visible bg-white" ref={rootRef}>
      <div className="absolute inset-x-0 bottom-0 h-[78%] opacity-0" ref={handsRef}>
        <Image alt="" className="object-contain object-bottom" fill priority={false} sizes="(min-width: 1024px) 44vw, 0px" src="/images/landing/hero-hands.png" />
      </div>
      {tomes.map((tome, index) => (
        <div
          className="absolute z-10 opacity-0"
          key={tome.src.src}
          ref={(node) => { tomeRefs.current[index] = node; }}
          style={{ bottom: "17%", left: "50%", width: tome.width, zIndex: 10 + index }}
        >
          <Image alt="" className="h-auto w-full drop-shadow-[0_7px_8px_rgba(16,17,37,.2)]" src={tome.src} />
        </div>
      ))}
      <div className="absolute bottom-[27%] left-1/2 z-30 h-16 w-24 -translate-x-1/2 overflow-hidden rounded-2xl bg-white/95 opacity-0 shadow-[0_0_0_1px_rgba(88,76,225,.18),0_0_28px_rgba(202,72,165,.45)]" ref={symbolRef}>
        <Image alt="" className="absolute h-[220px] max-w-none w-[220px] -translate-x-[68px] -translate-y-[57px]" height={220} src="/images/landing/OmniXtra_logo.svg" width={220} />
      </div>
    </div>
  );
}
