"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useSidebarArtworkPreferences } from "@/components/profile/sidebar-artwork-preferences";
import { defaultSidebarArtworkImage, maxSidebarArtworkBytes, maxSidebarArtworkUploadBytes, normalizeSidebarArtworkImage, sidebarArtworkImageTypes, type SidebarArtworkSlot } from "@/lib/sidebar-artwork";

const slots: { id: SidebarArtworkSlot; label: string; description: string }[] = [
  { id: "navigation", label: "Navigation image", description: "At the bottom of the main sidebar." },
  { id: "people", label: "People panel image", description: "At the bottom of the friends and members panel." },
];

export function SidebarArtworkSettings() {
  const { images, ready, error, update } = useSidebarArtworkPreferences();
  return <div className="grid min-w-0 gap-4">
    <div>
      <h3 className="text-lg font-semibold">Sidebar images</h3>
      <p className="mt-1 text-sm text-slate-400">Personal to you, saved on this device. Change a shared Space picture in Space settings.</p>
    </div>
    {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
    {ready ? slots.map(slot => <ArtworkControl key={slot.id} {...slot} image={images[slot.id]} update={update} />)
      : <p role="status" className="text-sm text-slate-400">Loading appearance…</p>}
  </div>;
}

function ArtworkControl({ id, label, description, image, update }: {
  id: SidebarArtworkSlot;
  label: string;
  description: string;
  image: string | null;
  update: (slot: SidebarArtworkSlot, image: string | null) => string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [imageUrl, setImageUrl] = useState(image?.startsWith("data:") ? "" : image ?? "");

  async function saveImage(source: string) {
    setError(null);
    setStatus("Checking image…");
    setBusy(true);
    try {
      await checkImage(source);
      const saveError = update(id, source);
      if (saveError) throw new Error(saveError);
      setStatus("Image saved on this device.");
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this image.");
      setStatus("");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    setStatus("");
    if (!sidebarArtworkImageTypes.includes(file.type) || file.size > maxSidebarArtworkUploadBytes) {
      setError("Choose a PNG, JPG, WebP or GIF up to 2 MB.");
      return;
    }
    setBusy(true);
    try {
      const original = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Could not read this image. Choose it again."));
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read this image."));
        reader.readAsDataURL(file);
      });
      const source = file.size <= maxSidebarArtworkBytes ? original : await resizeUpload(original);
      if (!normalizeSidebarArtworkImage(source)) throw new Error("Could not prepare this image. Try another image.");
      if (await saveImage(source)) setImageUrl("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not read this image.");
      setBusy(false);
    }
  }

  function applyUrl(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const source = normalizeSidebarArtworkImage(new FormData(event.currentTarget).get("imageUrl"));
    if (!source) {
      setError("Enter a valid http or https image URL.");
      setStatus("");
      return;
    }
    void saveImage(source);
  }

  function restore() {
    const saveError = update(id, null);
    setError(saveError);
    setStatus(saveError ? "" : "Default image restored on this device.");
    if (!saveError) setImageUrl("");
  }

  return <section className="app-row grid min-w-0 gap-3 p-4" aria-busy={busy}>
    <div><h4 className="text-sm font-semibold">{label}</h4><p className="mt-1 text-xs text-slate-400">{description}</p></div>
    {/* Native images also support local uploads without an image-optimizer request. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={image ?? defaultSidebarArtworkImage} alt={`${label} preview`} className="h-28 w-full rounded-lg object-cover" referrerPolicy="no-referrer" />
    <label className="val-upload-field block min-w-0 rounded-lg border border-white/10 p-3">
      <span className="text-sm font-semibold">Upload {label.toLowerCase()}</span>
      <input type="file" accept={sidebarArtworkImageTypes.join(",")} disabled={busy} onChange={event => void upload(event)} className="mt-2 block w-full min-w-0 text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2" />
      <span className="mt-2 block text-xs text-slate-500">PNG, JPG, WebP or GIF. Up to 2 MB.</span>
    </label>
    <form onSubmit={applyUrl} className="grid min-w-0 gap-2">
      <label className="block min-w-0">
        <span className="text-sm font-semibold">{label} URL</span>
        <input name="imageUrl" type="text" placeholder="https://…" value={imageUrl} onChange={event => setImageUrl(event.target.value)} required maxLength={2048} disabled={busy} className="mt-2 h-11 w-full min-w-0 rounded-lg border border-white/10 bg-[#050505] px-3 text-base outline-none sm:text-sm" />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="app-button-primary min-h-11 rounded-lg px-3 text-sm font-semibold">Apply image URL</button>
        <button type="button" disabled={busy || !image} onClick={restore} className="app-button-secondary min-h-11 rounded-lg px-3 text-sm font-semibold">Restore default</button>
      </div>
    </form>
    <p role="status" aria-atomic="true" className="min-h-4 text-xs text-slate-400">{status}</p>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
  </section>;
}

function checkImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.referrerPolicy = "no-referrer";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This image could not be loaded. Choose another image."));
    image.src = source;
  });
}

async function resizeUpload(source: string) {
  const image = await checkImage(source);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare this image.");
  let scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
  for (let attempt = 0; attempt < 6; attempt++) {
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const result = canvas.toDataURL("image/webp", 0.85);
    if (normalizeSidebarArtworkImage(result)) return result;
    scale *= 0.75;
  }
  throw new Error("This image is too large to save on this device. Try a smaller image.");
}
