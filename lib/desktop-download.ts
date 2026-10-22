const repository = "S4DRA/Doshab";
const releaseApi = `https://api.github.com/repos/${repository}/releases/latest`;
export const windowsReleasesUrl = `https://github.com/${repository}/releases`;

export type WindowsRelease = { version: string; downloadUrl: string; size: number };

/** Only offer uploaded, stable installers belonging to this exact public repository. */
export function parseWindowsRelease(value: unknown): WindowsRelease | null {
  if (!value || typeof value !== "object") return null;
  const release = value as Record<string, unknown>;
  if (release.draft !== false || release.prerelease !== false || typeof release.tag_name !== "string") return null;
  const match = /^v?(\d+\.\d+\.\d+)$/.exec(release.tag_name);
  if (!match || !Array.isArray(release.assets)) return null;
  const version = match[1];
  const filename = `VAL-Setup-${version}.exe`;
  const expectedUrl = `https://github.com/${repository}/releases/download/${release.tag_name}/${filename}`;
  const installer = release.assets.find((asset: unknown) => {
    if (!asset || typeof asset !== "object") return false;
    const item = asset as Record<string, unknown>;
    return item.name === filename && item.state === "uploaded" && item.browser_download_url === expectedUrl &&
      typeof item.size === "number" && Number.isSafeInteger(item.size) && item.size > 0;
  }) as { size: number } | undefined;
  return installer ? { version, downloadUrl: expectedUrl, size: installer.size } : null;
}

export async function getWindowsRelease(): Promise<WindowsRelease | null> {
  try {
    // Public metadata only; cache lookups to stay within GitHub's public API quota.
    const options = { headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" }, signal: AbortSignal.timeout(4000), next: { revalidate: 300 } };
    const response = await fetch(releaseApi, options);
    if (!response.ok) return null;
    return parseWindowsRelease(await response.json());
  } catch {
    return null;
  }
}
