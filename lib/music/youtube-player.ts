export type YouTubePlayer = {
  destroy(): void;
  playVideo(): void;
  pauseVideo(): void;
  cueVideoById(options: { videoId: string; startSeconds?: number }): void;
  seekTo(position: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  getVideoUrl(): string;
  getIframe(): HTMLIFrameElement;
  setVolume(volume: number): void;
  getVolume(): number;
  isMuted(): boolean;
  mute(): void;
  unMute(): void;
};
export type YouTubeAPI = {
  Player: new (element: HTMLElement, options: {
    width: string; height: string;
    playerVars: { origin: string; playsinline: number; controls: number; autoplay: number; rel: number };
    events: {
      onReady: (event: { target: YouTubePlayer }) => void;
      onStateChange: (event: { target: YouTubePlayer; data: number }) => void;
      onError: (event: { data: number }) => void;
      onAutoplayBlocked: () => void;
    };
  }) => YouTubePlayer;
};

declare global { interface Window { YT?: YouTubeAPI; onYouTubeIframeAPIReady?: () => void } }
let loading: Promise<YouTubeAPI> | null = null;

export function loadYouTubePlayer(): Promise<YouTubeAPI> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (loading) return loading;
  loading = new Promise<YouTubeAPI>((resolve, reject) => {
    let finished = false;
    const previous = window.onYouTubeIframeAPIReady;
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    const finish = (error?: Error) => {
      if (finished) return;
      finished = true; clearTimeout(timer);
      window.onYouTubeIframeAPIReady = previous;
      if (error || !window.YT?.Player) { loading = null; script.remove(); reject(error ?? new Error("YouTube player is unavailable.")); }
      else resolve(window.YT);
    };
    const timer = window.setTimeout(() => finish(new Error("YouTube player could not load. Check your connection.")), 15000);
    window.onYouTubeIframeAPIReady = () => { finish(); previous?.(); };
    script.onerror = () => finish(new Error("YouTube player could not load. Check your connection."));
    document.head.appendChild(script);
  });
  return loading;
}
