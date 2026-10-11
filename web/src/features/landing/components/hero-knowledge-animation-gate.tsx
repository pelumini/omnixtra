"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HeroKnowledgeAnimation = dynamic(
  () => import("./hero-knowledge-animation").then((module) => module.HeroKnowledgeAnimation),
  { ssr: false },
);

export function HeroKnowledgeAnimationGate() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const update = () => setEnabled(desktop.matches);
    update();
    desktop.addEventListener("change", update);
    return () => desktop.removeEventListener("change", update);
  }, []);

  return enabled ? <HeroKnowledgeAnimation /> : null;
}
