"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ImageAdjustmentDialog } from "@/components/ui/image-adjustment-dialog";
import { imageDataUrl } from "@/lib/image-adjustment";
import { settingsImageError } from "@/lib/image-upload";

// Leaves submission with the existing native form and authenticated route.
export function SettingsImageField({ name, label, currentImage, square = false, disabled = false, urlName, accept = "image/*", onPreview }: {
  name: string;
  label: string;
  currentImage: string | null;
  square?: boolean;
  disabled?: boolean;
  urlName?: string;
  accept?: string;
  onPreview?: (source: string | null) => void;
}) {
  const acceptedFile = useRef<HTMLInputElement>(null);
  const urlInput = useRef<HTMLInputElement>(null);
  const [candidate, setCandidate] = useState<{ source: string; file?: File } | null>(null);
  const [preview, setPreview] = useState(currentImage);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [url, setUrl] = useState(currentImage ?? "");
  const [reviewedUrl, setReviewedUrl] = useState(currentImage ?? "");
  const [acceptedUrl, setAcceptedUrl] = useState(currentImage ?? "");
  const reading = useRef(0);
  useEffect(() => {
    const form = acceptedFile.current?.form;
    function reset() {
      reading.current++;
      setCandidate(null); setPreview(currentImage); setUrl(currentImage ?? ""); setReviewedUrl(currentImage ?? ""); setAcceptedUrl(currentImage ?? ""); setError(""); setStatus("");
      urlInput.current?.setCustomValidity("");
    }
    form?.addEventListener("reset", reset);
    function cleanup() { reading.current++; form?.removeEventListener("reset", reset); }
    return cleanup;
  }, [currentImage]);
  function installFile(file: File) {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    if (!acceptedFile.current) throw new Error("Choose this image again.");
    acceptedFile.current.files = transfer.files;
  }
  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const failure = settingsImageError(file);
    setError(failure ?? ""); setStatus("");
    if (failure) return;
    const generation = ++reading.current;
    try {
      const source = await imageDataUrl(file);
      if (reading.current === generation) setCandidate({ source, file });
    } catch (cause) { if (reading.current === generation) setError(cause instanceof Error ? cause.message : "Could not read this image."); }
  }
  async function prepare(blob: Blob) {
    const generation = reading.current;
    const source = await imageDataUrl(blob);
    if (generation !== reading.current) return;
    installFile(new File([blob], `${name}-adjusted.${blob.type === "image/webp" ? "webp" : "png"}`, { type: blob.type }));
    setPreview(source); onPreview?.(source); setCandidate(null); setStatus("Image ready. Save your settings to apply it.");
    setReviewedUrl(url); urlInput.current?.setCustomValidity("");
  }
  async function original() {
    if (!candidate) return;
    if (candidate.file) installFile(candidate.file);
    else if (acceptedFile.current) acceptedFile.current.value = "";
    setPreview(candidate.source); onPreview?.(candidate.source); setReviewedUrl(url); setAcceptedUrl(candidate.file ? acceptedUrl : candidate.source); setCandidate(null); setStatus("Original image ready. Save your settings to apply it.");
    urlInput.current?.setCustomValidity("");
  }
  function adjustUrl() {
    try {
      const imageUrl = url.trim();
      if (!imageUrl.startsWith("/uploads/groups/")) {
        const parsed = new URL(imageUrl);
        if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error();
      }
      setError(""); setCandidate({ source: imageUrl });
    } catch { setError("Enter a valid http or https image URL."); }
  }
  return <div className="grid min-w-0 gap-3">
    {urlName && <label className="grid gap-2 text-sm font-semibold">{label} URL
      <input ref={urlInput} type="text" value={url.startsWith("data:") ? "" : url} disabled={disabled} placeholder="https://… or /uploads/groups/…" className="h-12 w-full min-w-0 px-3 font-normal" onChange={event => {
        const value = event.target.value;
        setUrl(value); setStatus("");
        if (!value.trim()) { setAcceptedUrl(""); setPreview(null); }
        if (acceptedFile.current) acceptedFile.current.value = "";
        event.target.setCustomValidity(value && value !== reviewedUrl ? "Adjust or review this image URL before saving." : "");
      }} />
      <button type="button" disabled={disabled || !url.trim()} className="app-button-secondary min-h-11 w-fit px-3 text-sm" onClick={adjustUrl}>Adjust image URL</button>
    </label>}
    {urlName && <input type="hidden" name={urlName} value={acceptedUrl} disabled={disabled} />}
    <label className="val-upload-field block min-w-0 rounded-lg border border-white/10 p-3">
      <span className="text-sm font-semibold">Upload {label.toLowerCase()}</span>
      <input type="file" accept={accept} disabled={disabled} onChange={event => void choose(event)} className="mt-2 block w-full min-w-0 text-sm file:mr-2 file:border-0 file:px-3 file:py-2" />
      <span className="mt-2 block text-xs text-slate-500">Max 2 MB. Adjust the image before saving.</span>
    </label>
    <input ref={acceptedFile} type="file" name={name} hidden aria-hidden="true" disabled={disabled} />
    {preview && <div className="val-settings-image-preview">
      {/* Local previews do not use the image optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={preview} alt={`${label} preview`} referrerPolicy="no-referrer" className={square ? "h-24 w-24 object-cover" : "h-28 w-full object-cover"} />
    </div>}
    {status && <p role="status" className="text-xs text-slate-500">{status}</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {candidate && <ImageAdjustmentDialog source={candidate.source} title={label.toLowerCase()} square={square} onApply={prepare} onOriginal={original} onCancel={() => { reading.current++; setCandidate(null); }} />}
  </div>;
}
