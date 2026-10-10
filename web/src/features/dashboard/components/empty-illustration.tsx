"use client";

import { CheckCircle2, GraduationCap } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type EmptyIllustrationProps = {
  kind: "activity" | "courses";
};

export function EmptyIllustration({ kind }: EmptyIllustrationProps) {
  const [failed, setFailed] = useState(false);
  const source = "/images/dashboard/empty-state.svg";

  if (failed) {
    const FallbackIcon = kind === "courses" ? GraduationCap : CheckCircle2;
    return (
      <span className="grid size-16 place-items-center rounded-full bg-white text-[var(--primary)]">
        <FallbackIcon aria-hidden="true" className="size-9" />
      </span>
    );
  }

  return (
    <Image
      alt=""
      aria-hidden="true"
      className="h-32 w-32 object-contain"
      height={148}
      onError={() => setFailed(true)}
      src={source}
      width={148}
    />
  );
}
