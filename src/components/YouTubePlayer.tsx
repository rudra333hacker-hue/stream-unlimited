import { useEffect, useRef } from "react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

let apiPromise: Promise<void> | null = null;
function loadYouTubeAPI(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<void>((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
  });
  return apiPromise;
}

type Props = {
  videoId: string | null;
  onEnded?: () => void;
  audioOnly?: boolean;
};

export function YouTubePlayer({ videoId, onEnded, audioOnly = false }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  useEffect(() => {
    let cancelled = false;
    loadYouTubeAPI().then(() => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: "225",
        width: "400",
        playerVars: { autoplay: 1, playsinline: 1 },
        events: {
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.ENDED) onEndedRef.current?.();
          },
        },
      });
    });
    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy?.();
      } catch {}
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!videoId) return;
    const interval = setInterval(() => {
      const p = playerRef.current;
      if (p && typeof p.loadVideoById === "function") {
        p.loadVideoById(videoId);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [videoId]);

  // In audio-only mode, keep the iframe mounted (so audio keeps playing)
  // but hide it visually off-screen.
  return (
    <div
      ref={wrapperRef}
      style={
        audioOnly
          ? {
              position: "absolute",
              width: 1,
              height: 1,
              overflow: "hidden",
              opacity: 0,
              pointerEvents: "none",
              left: -9999,
            }
          : undefined
      }
    >
      <div ref={containerRef} />
    </div>
  );
}