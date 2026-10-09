"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DialogSurface } from "@/components/ui/dialog-surface";
import { imageCrop, loadAdjustmentImage, renderAdjustedImage, type ImagePosition } from "@/lib/image-adjustment";
import { maxSettingsImageBytes } from "@/lib/image-upload";

export function ImageAdjustmentDialog({ source, title, square = false, maxBytes = maxSettingsImageBytes, onApply, onCancel, onOriginal }: {
  source: string;
  title: string;
  square?: boolean;
  maxBytes?: number;
  onApply: (image: Blob) => Promise<void>;
  onCancel: () => void;
  onOriginal?: () => Promise<void>;
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const controlId = useId();
  const [position, setPosition] = useState<ImagePosition>({ zoom: 1, x: 50, y: 50 });
  const [shape, setShape] = useState(square ? "square" : "wide");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    void loadAdjustmentImage(source).then(value => { if (active.current) setImage(value); }).catch(cause => { if (active.current) setError(cause.message); });
    return () => { active.current = false; };
  }, [source]);
  const ratio = square || shape === "square" ? 1 : shape === "original" && image ? image.naturalWidth / image.naturalHeight : 16 / 9;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!image || !canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const crop = imageCrop(image.naturalWidth, image.naturalHeight, ratio, position);
    const scale = 480 / Math.max(crop.width, crop.height);
    canvas.width = Math.max(1, Math.round(crop.width * scale));
    canvas.height = Math.max(1, Math.round(crop.height * scale));
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
  }, [image, ratio, position]);

  async function apply(original = false) {
    if (busy || (!original && !image)) return;
    setBusy(true);
    setError("");
    try {
      if (original && onOriginal) await onOriginal();
      else if (image) {
        const blob = await renderAdjustedImage(image, ratio, position, maxBytes, square ? 640 : 1280);
        if (active.current) await onApply(blob);
      }
    } catch (cause) {
      if (active.current) setError(cause instanceof Error ? cause.message : "Could not prepare this image.");
    } finally { if (active.current) setBusy(false); }
  }
  function cancel() { active.current = false; onCancel(); }
  return <DialogSurface title={`Adjust ${title}`} onClose={cancel} className="val-image-adjustment-dialog">
    <div className="grid min-w-0 gap-4" aria-busy={busy}>
      <div className="val-image-crop-preview" style={{ aspectRatio: ratio }}>
        <canvas ref={canvasRef} role="img" aria-label={`${title} crop preview`} />
        {!image && <p role="status">{error ? "Preview unavailable" : "Loading image…"}</p>}
      </div>
      {!square && <label className="grid gap-1 text-sm">Crop shape<select value={shape} onChange={event => setShape(event.target.value)} disabled={busy} className="h-11 px-3"><option value="wide">Wide</option><option value="square">Square</option><option value="original">Original proportions</option></select></label>}
      {([
        { key: "zoom", label: "Zoom", min: 1, max: 3, step: 0.01 },
        { key: "x", label: "Horizontal position", min: 0, max: 100, step: 1 },
        { key: "y", label: "Vertical position", min: 0, max: 100, step: 1 },
      ] as const).map(control => <label htmlFor={`${controlId}-${control.key}`} className="grid gap-1 text-sm" key={control.key}>
        <span className="flex justify-between gap-3">{control.label}<output>{control.key === "zoom" ? `${position.zoom.toFixed(2)}×` : `${position[control.key]}%`}</output></span>
        <input id={`${controlId}-${control.key}`} type="range" min={control.min} max={control.max} step={control.step} value={position[control.key]} disabled={busy || !image} onChange={event => setPosition(current => ({ ...current, [control.key]: Number(event.target.value) }))} className="w-full" />
      </label>)}
      <p className="text-xs text-slate-500">Adjust with the sliders or arrow keys. Adjusted GIFs become still images.</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="app-button-primary min-h-11 px-4 text-sm font-semibold" disabled={busy || !image} onClick={() => void apply()}>{busy ? "Preparing…" : "Use adjusted image"}</button>
        {onOriginal && <button type="button" disabled={busy} className="app-button-secondary min-h-11 px-4 text-sm" onClick={() => void apply(true)}>Use original</button>}
        <button type="button" className="app-button-secondary min-h-11 px-4 text-sm" onClick={cancel}>Cancel</button>
        <button type="button" className="app-button-secondary min-h-11 px-4 text-sm" disabled={busy} onClick={() => setPosition({ zoom: 1, x: 50, y: 50 })}>Reset position</button>
      </div>
    </div>
  </DialogSurface>;
}
