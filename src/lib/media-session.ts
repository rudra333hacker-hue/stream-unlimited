import { useEffect } from "react";
import type { Track } from "./store";

type Controls = {
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
};

export function useMediaSession(track: Track | null, controls: Controls) {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator))
      return;
    if (!track) {
      navigator.mediaSession.metadata = null;
      return;
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.author,
      album: "Tunes",
      artwork: [
        { src: track.thumbnail, sizes: "512x512", type: "image/jpeg" },
      ],
    });
    const handlers: Array<[MediaSessionAction, () => void]> = [
      ["play", controls.play],
      ["pause", controls.pause],
      ["nexttrack", controls.next],
      ["previoustrack", controls.prev],
    ];
    for (const [action, fn] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, fn);
      } catch {}
    }
    return () => {
      for (const [action] of handlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {}
      }
    };
  }, [track, controls]);
}