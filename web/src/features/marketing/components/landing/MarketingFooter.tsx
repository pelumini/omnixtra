import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Pattern, assetRoot } from "./shared";

export function MarketingFooter() {
  return (
    <footer className="relative overflow-hidden bg-[var(--color-bg-white-0)] py-14">
      <Pattern />
      <div className="landing-container relative">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <div className="max-w-sm">
            <Image
              alt="OmniXtra"
              className="h-auto w-48"
              height={48}
              src={`${assetRoot}/OmniXtra_logo_brand.svg`}
              width={208}
            />
            <p className="mt-5 leading-7 text-[var(--color-text-sub-500)]">
              Launch a branded learning academy with courses, members, progress
              and an AI tutor grounded in your content.
            </p>
          </div>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-3 text-sm font-semibold"
          >
            <a className="landing-footer-link" href="#platform">
              Platform <ArrowRight />
            </a>
            <a className="landing-footer-link" href="#ai-tutor">
              AI tutor <ArrowRight />
            </a>
            <a className="landing-footer-link" href="#how-it-works">
              How it works <ArrowRight />
            </a>
            <a className="landing-footer-link" href="#faq">
              FAQ <ArrowRight />
            </a>
          </nav>
        </div>
        <div className="mt-14 flex flex-col justify-between gap-3 border-t border-[var(--color-stroke-soft-200)] pt-6 text-sm text-[var(--color-text-sub-500)] sm:flex-row">
          <span>{"\u00A9"} 2026 OmniXtra. All rights reserved.</span>
          <Link
            className="font-semibold text-[var(--primary)] hover:text-[var(--color-primary-dark)]"
            href="/join"
          >
            Have an invitation? Join
          </Link>
        </div>
      </div>
    </footer>
  );
}
