"use client";

import { File, FileSpreadsheet, FileText, Upload, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";

import { confirmMedia, deleteMedia, getMediaUrl, presignMedia } from "../api";

import type { MediaKind } from "../schemas";

const MAX_UPLOAD_BYTES = 52_428_800; // Mirrors the public demo cap; the API is authoritative.
const accepts: Record<MediaKind, string> = {
  audio: "audio/*", file: ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt", image: "image/*",
  thumbnail: "image/*", video: "video/*",
};

export type UploadedMedia = {
  assetId: string; contentType?: string; deliveryUrl: string; fileName: string;
  objectKey: string; sizeBytes?: number;
};

export function uploadedMediaFromReference(reference: string, fallbackName: string) {
  const match = /^tenants\/[^/]+\/courses\/[^/]+\/([0-9a-f-]{36})\/(.+)$/i.exec(reference);
  if (!match) return null;
  return { assetId: match[1], deliveryUrl: "", fileName: match[2] || fallbackName, objectKey: reference };
}

export function MediaUploadField({ courseId, kind, label, onChange, value }: {
  courseId: string; kind: MediaKind; label: string;
  onChange: (media: UploadedMedia | null) => void; value?: UploadedMedia | null;
}) {
  const id = useId();
  const [error, setError] = useState("");
  const [current, setCurrent] = useState(value ?? null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setCurrent(value ?? null);
    if (!value || value.deliveryUrl) return;
    let active = true;
    void getMediaUrl(courseId, value.assetId)
      .then((response) => {
        if (active) setCurrent({
          ...value, contentType: response.data.content_type, deliveryUrl: response.data.url,
          fileName: response.data.file_name ?? value.fileName,
          sizeBytes: response.data.byte_size,
        });
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Preview could not be loaded.");
      });
    return () => { active = false; };
  }, [courseId, value]);

  async function upload(file: File) {
    setError("");
    if (file.size > MAX_UPLOAD_BYTES) { setError("Maximum file size is 50MB."); return; }
    setUploading(true);
    try {
      const presigned = (await presignMedia(courseId, file, kind)).data;
      await uploadDirect(presigned.upload_url, file, presigned.headers, setProgress);
      const confirmed = (await confirmMedia(courseId, file, kind, presigned.object_key)).data;
      const media = {
        assetId: confirmed.id, contentType: confirmed.content_type,
        deliveryUrl: confirmed.delivery_url, fileName: confirmed.file_name,
        objectKey: confirmed.object_key, sizeBytes: confirmed.byte_size,
      };
      setCurrent(media); onChange(media);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed.");
    } finally { setUploading(false); }
  }

  async function remove() {
    if (current) await deleteMedia(courseId, current.assetId);
    setCurrent(null); onChange(null); setProgress(0);
  }

  return <div className="grid gap-2">
    <span className="text-xs font-medium text-[var(--color-text-main-900)]">{label}</span>
    <label className="grid min-h-24 cursor-pointer place-items-center rounded-[10px] border border-dashed border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] p-4 text-center shadow-[var(--shadow-x-small)] hover:border-[var(--color-primary-base)]" htmlFor={id}>
      <input accept={accepts[kind]} className="sr-only" disabled={uploading} id={id} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} type="file" />
      <span className="grid gap-1 text-xs text-[var(--color-text-sub-500)]"><Upload aria-hidden="true" className="mx-auto size-5 text-[var(--color-primary-base)]" /><strong className="text-[var(--color-text-main-900)]">{current?.fileName ?? "Choose file"}</strong><span>Maximum 50MB</span></span>
    </label>
    {uploading ? <progress aria-label="Upload progress" className="w-full accent-[var(--color-primary-base)]" max={100} value={progress} /> : null}
    {current ? <MediaCard kind={kind} media={current} /> : null}
    {error ? <p className="text-xs text-[var(--color-state-error)]" role="alert">{error}</p> : null}
    {current ? <Button className="gap-2 justify-self-start" onClick={() => void remove()} size="x-small" variant="secondary"><X aria-hidden="true" /> Remove</Button> : null}
  </div>;
}

function MediaCard({ kind, media }: { kind: MediaKind; media: UploadedMedia }) {
  const metadata = <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-text-sub-500)]">
    <strong className="max-w-full truncate text-[var(--color-text-main-900)]">{media.fileName}</strong>
    {media.sizeBytes ? <span>{formatBytes(media.sizeBytes)}</span> : null}
    {media.contentType ? <span>{shortType(media.contentType)}</span> : null}
  </div>;
  if (!media.deliveryUrl) return <div className="min-h-16 rounded-[10px] border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-weak-100)] p-3">{metadata}</div>;
  if (kind === "image" || kind === "thumbnail") return <div className="grid gap-2"><Image alt={`Preview of ${media.fileName}`} className="h-32 w-full rounded-[10px] object-cover" height={128} loading="lazy" src={media.deliveryUrl} unoptimized width={512} />{metadata}</div>;
  if (kind === "video") return <div className="grid gap-2"><video aria-label={`Preview of ${media.fileName}`} className="max-h-48 w-full rounded-[10px] bg-[var(--color-bg-weak-100)] object-contain" controls preload="metadata" src={media.deliveryUrl} />{metadata}</div>;
  if (kind === "audio") return <div className="grid gap-2"><audio aria-label={`Preview of ${media.fileName}`} className="w-full" controls preload="metadata" src={media.deliveryUrl} />{metadata}</div>;
  const Icon = fileIcon(media.contentType);
  return <div className="flex min-h-20 items-center gap-3 rounded-[10px] border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-weak-100)] p-3">
    <Icon aria-hidden="true" className="size-8 shrink-0 text-[var(--color-primary-base)]" />
    <div className="min-w-0 flex-1">{metadata}</div>
    <a aria-label={`View ${media.fileName}`} className="shrink-0 text-xs font-semibold text-[var(--color-primary-base)] hover:underline" href={media.deliveryUrl} rel="noopener noreferrer" target="_blank">View</a>
  </div>;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
}

function shortType(contentType: string) { return contentType.split("/").pop()?.toUpperCase() ?? contentType; }
function fileIcon(contentType?: string) {
  if (contentType?.includes("spreadsheet") || contentType?.includes("excel") || contentType?.includes("csv")) return FileSpreadsheet;
  if (contentType?.includes("pdf") || contentType?.includes("document") || contentType?.startsWith("text/")) return FileText;
  return File;
}

function uploadDirect(url: string, file: File, headers: Record<string, string>, onProgress: (value: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest(); request.open("PUT", url);
    for (const [name, value] of Object.entries(headers)) request.setRequestHeader(name, value);
    request.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100)); };
    request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error("Direct upload failed."));
    request.onerror = () => reject(new Error("Direct upload failed.")); request.send(file);
  });
}
