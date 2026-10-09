export type ImagePosition = { zoom: number; x: number; y: number };

export function imageCrop(width: number, height: number, ratio: number, position: ImagePosition) {
  const zoom = Math.max(1, Math.min(3, position.zoom));
  const cropWidth = Math.min(width, height * ratio) / zoom;
  const cropHeight = cropWidth / ratio;
  return {
    x: (width - cropWidth) * Math.max(0, Math.min(100, position.x)) / 100,
    y: (height - cropHeight) * Math.max(0, Math.min(100, position.y)) / 100,
    width: cropWidth,
    height: cropHeight,
  };
}

export function loadAdjustmentImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (/^https?:/i.test(source) && new URL(source).origin !== location.origin) image.crossOrigin = "anonymous";
    image.referrerPolicy = "no-referrer";
    image.onload = () => image.naturalWidth && image.naturalHeight ? resolve(image) : reject(new Error("This image has no usable size."));
    image.onerror = () => reject(new Error("Could not load this image for adjustment. For a remote URL, upload the image instead or use its original URL."));
    image.src = source;
  });
}

export async function renderAdjustedImage(image: HTMLImageElement, ratio: number, position: ImagePosition, maxBytes: number, maxDimension = 1280): Promise<Blob> {
  const crop = imageCrop(image.naturalWidth, image.naturalHeight, ratio, position);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare this image.");
  let scale = Math.min(1, maxDimension / Math.max(crop.width, crop.height));
  for (let attempt = 0; attempt < 8; attempt++) {
    canvas.width = Math.max(1, Math.round(crop.width * scale));
    canvas.height = Math.max(1, Math.round(crop.height * scale));
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      try { canvas.toBlob(resolve, "image/webp", 0.9); }
      catch { reject(new Error("This image host does not allow adjustment. Upload the image instead.")); }
    });
    if (blob && blob.size <= maxBytes) return blob;
    scale *= 0.75;
  }
  throw new Error("Could not prepare this image within the size limit. Try a smaller image.");
}

export function imageDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read this image. Choose it again."));
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read this image."));
    reader.readAsDataURL(blob);
  });
}
