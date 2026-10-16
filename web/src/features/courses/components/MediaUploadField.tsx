"use client";

import { Upload, X } from "lucide-react";
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

export type UploadedMedia = { assetId: string; deliveryUrl: string; fileName: string; objectKey: string };

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
        if (active) setCurrent({ ...value, deliveryUrl: response.data.url });
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
      const media = { assetId: confirmed.id, deliveryUrl: confirmed.delivery_url, fileName: confirmed.file_name, objectKey: confirmed.object_key };
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
    {current?.deliveryUrl && (kind === "image" || kind === "thumbnail") ? <Image alt="Uploaded preview" className="h-32 w-full rounded-[10px] object-cover" height={128} src={current.deliveryUrl} unoptimized width={512} /> : null}
    {error ? <p className="text-xs text-[var(--color-state-error)]" role="alert">{error}</p> : null}
    {current ? <Button className="gap-2 justify-self-start" onClick={() => void remove()} size="x-small" variant="secondary"><X aria-hidden="true" /> Remove</Button> : null}
  </div>;
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
