type NativeFullscreenVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
};

export async function enterMediaFullscreen(container: HTMLElement, video: HTMLVideoElement | null) {
  if (container.requestFullscreen && document.fullscreenEnabled) {
    await container.requestFullscreen();
    return;
  }
  const nativeVideo = video as NativeFullscreenVideo | null;
  if (nativeVideo?.webkitEnterFullscreen) {
    nativeVideo.webkitEnterFullscreen();
    return;
  }
  throw new Error("Fullscreen is unavailable in this browser. The enlarged view is still available.");
}

export async function exitMediaFullscreen(container: HTMLElement) {
  if (document.fullscreenElement === container) await document.exitFullscreen();
}
