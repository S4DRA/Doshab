export type SidebarArtworkSlot = "navigation" | "people";
export type SidebarArtwork = Record<SidebarArtworkSlot, string | null>;

export const defaultSidebarArtwork: SidebarArtwork = { navigation: null, people: null };
export const defaultSidebarArtworkImage = "/brand/val-lunar.webp";
export const maxSidebarArtworkBytes = 256 * 1024;
export const maxSidebarArtworkUploadBytes = 2 * 1024 * 1024;
export const sidebarArtworkImageTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const maxEncodedImageLength = Math.ceil(maxSidebarArtworkBytes / 3) * 4 + 32;

export const sidebarArtworkKey = (userId: string) => `val:sidebar-artwork:v1:${userId}`;

/** Only image data, site paths and HTTP(S) URLs can become CSS image values. */
export function normalizeSidebarArtworkImage(value: unknown): string | null | undefined {
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const image = value.trim();
  if (!image) return null;
  if (/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)) {
    return image.length <= maxEncodedImageLength ? image : undefined;
  }
  if (image.length > 2048 || /[\u0000-\u001f\\]/.test(image)) return undefined;
  if (image.startsWith("/") && !image.startsWith("//")) return image;
  try {
    const url = new URL(image);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password
      ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function readSidebarArtwork(value: string | null): { images: SidebarArtwork; error: string | null } {
  if (!value) return { images: defaultSidebarArtwork, error: null };
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid preferences");
    const candidate = parsed as Record<string, unknown>;
    const navigation = normalizeSidebarArtworkImage(candidate.navigation ?? null);
    const people = normalizeSidebarArtworkImage(candidate.people ?? null);
    return {
      images: { navigation: navigation ?? null, people: people ?? null },
      error: navigation === undefined || people === undefined ? "Some saved images could not be read. Choose them again or restore the defaults." : null,
    };
  } catch {
    return { images: defaultSidebarArtwork, error: "Your saved images could not be read. Choose them again or restore the defaults." };
  }
}

export const sidebarArtworkCssImage = (image: string) => `url(${JSON.stringify(image)})`;
