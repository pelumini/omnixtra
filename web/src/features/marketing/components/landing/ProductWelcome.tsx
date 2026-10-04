import Image from "next/image";

import { assetRoot } from "./shared";

export function ProductWelcome() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      {/* Purple backdrop feathered into white at the top and bottom edges,
          so the band blends out of the hero and into the next section. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)",
        }}
      >
        <Image
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          fill
          sizes="100vw"
          src={`${assetRoot}/section_2_background.jpg`}
        />
        <div className="absolute inset-0 bg-[var(--primary)]/25" />
      </div>
      <div className="landing-container relative rounded-2xl border border-[var(--color-stroke-white-0)]/40 bg-[var(--color-bg-white-0)]/10 py-3 shadow-[var(--shadow-2x-large)] backdrop-blur-sm sm:py-6">
        <Image
          alt="OmniXtra academy dashboard"
          className="h-auto w-full rounded-xl"
          height={840}
          sizes="(max-width: 1280px) 90vw, 1152px"
          src={`${assetRoot}/section_2_image.png`}
          width={1400}
        />
      </div>
    </section>
  );
}
