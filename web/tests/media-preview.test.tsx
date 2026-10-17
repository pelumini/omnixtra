import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MediaUploadField, formatBytes } from "@/features/courses/components/MediaUploadField";

const media = {
  assetId: "00000000-0000-0000-0000-000000000099",
  contentType: "application/pdf",
  deliveryUrl: "https://storage.example.test/guide.pdf",
  fileName: "guide.pdf",
  objectKey: "tenants/t/courses/c/asset/guide.pdf",
  sizeBytes: 4_200_000,
};

describe("media previews", () => {
  it("formats byte sizes for readable metadata", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(4_200_000)).toBe("4.0 MB");
  });

  it.each([
    ["video", "<video"],
    ["audio", "<audio"],
    ["file", ">View</a>"],
  ] as const)("renders the %s preview with metadata", (kind, marker) => {
    const html = renderToStaticMarkup(
      <MediaUploadField courseId="course" kind={kind} label="Media" onChange={() => undefined} value={{ ...media, contentType: kind === "file" ? "application/pdf" : `${kind}/mpeg` }} />,
    );

    expect(html).toContain(marker);
    expect(html).toContain("guide.pdf");
    expect(html).toContain("4.0 MB");
  });
});
