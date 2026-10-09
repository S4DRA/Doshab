export const maxSettingsImageBytes = 2 * 1024 * 1024;

export function settingsImageError(file: { size: number; type: string }) {
  if (!file.type.startsWith("image/")) return "Please choose a valid image file.";
  if (file.size > maxSettingsImageBytes) return "Image must be 2 MB or smaller.";
  if (!file.size) return "This image is empty. Choose another image.";
  return null;
}
