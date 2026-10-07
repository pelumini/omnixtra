import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backend = process.env.API_INTERNAL_URL ?? "http://localhost:8000";
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
  images: {
    // The marketing logos (OmniXtra_logo.svg / OmniXtra_logo_brand.svg) are
    // first-party, trusted assets rendered through next/image. Next refuses to
    // serve SVG through the optimizer unless this is enabled, so without it the
    // header and footer wordmarks 400 and render as broken images. The CSP +
    // attachment disposition below keep the allowance safe for untrusted SVG.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
