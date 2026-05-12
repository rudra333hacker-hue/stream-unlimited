import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Play, Trash2, WifiOff } from "lucide-react";
import { useLibrary, usePlayer } from "@/lib/store";
import { TrackList } from "@/components/TrackList";
import { getStorageEstimate } from "@/lib/offline-cache";

export const Route = createFileRoute("/downloaded")({
  component: DownloadedPage,
});

function DownloadedPage() {
  const { downloaded, removeDownload } = useLibrary();
  const { playList } = usePlayer();
  const [estimate, setEstimate] = useState<{
    usage?: number;
    quota?: number;
  } | null>(null);
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    getStorageEstimate().then((e) => e && setEstimate(e));
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [downloaded.length]);

  const usedMb =
    estimate?.usage != null ? (estimate.usage / 1_048_576).toFixed(1) : null;

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="px-6 pt-8 pb-6 bg-gradient-to-b from-emerald-700/60 to-transparent">
        <div className="flex items-end gap-5">
          <div className="h-44 w-44 rounded shadow-2xl bg-gradient-to-br from-emerald-600 to-teal-300 grid place-items-center">
            <Download className="h-20 w-20 text-white" />
          </div>
          <div className="space-y-2 pb-2">
            <p className="text-xs uppercase font-bold tracking-wider">
              Saved on this device
            </p>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
              Downloaded
            </h1>
            <p className="text-sm text-muted-foreground">
              {downloaded.length} track{downloaded.length === 1 ? "" : "s"}
              {usedMb && ` · ${usedMb} MB cached`}
            </p>
          </div>
        </div>
      </header>

      <div className="px-6 pb-6 space-y-4">
        {!online && (
          <div className="flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-200 px-4 py-3 text-sm">
            <WifiOff className="h-4 w-4 shrink-0" />
            You are offline. Saved metadata and artwork load from cache, but
            audio playback resumes when you reconnect.
          </div>
        )}

        <div className="rounded-md bg-card/60 border border-border/40 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">How "Downloaded" works:</strong>{" "}
          Tunes streams audio from YouTube, which does not allow JavaScript to
          read or save the raw audio file. Saving a track caches its artwork
          and embed page so the UI is instant, and asks the browser for
          persistent storage so the cache won't be auto-evicted. Audio still
          requires an internet connection.
        </div>

        {downloaded.length > 0 && (
          <div className="py-2">
            <button
              onClick={() => playList(downloaded, 0)}
              className="h-14 w-14 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-xl hover:scale-105 transition"
              aria-label="Play"
            >
              <Play className="h-6 w-6 fill-current ml-1" />
            </button>
          </div>
        )}

        {downloaded.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing saved yet. Hit the download icon next to any track.
          </p>
        ) : (
          <div className="space-y-1">
            <TrackList
              tracks={downloaded}
              onPlayIndex={(i) => playList(downloaded, i)}
            />
            <details className="text-xs text-muted-foreground pt-4">
              <summary className="cursor-pointer">Manage saved tracks</summary>
              <div className="mt-2 space-y-1">
                {downloaded.map((t) => (
                  <div
                    key={t.videoId}
                    className="flex items-center justify-between gap-2 px-2 py-1 rounded hover:bg-secondary/40"
                  >
                    <span className="truncate">
                      {t.title} — {t.author}
                    </span>
                    <button
                      onClick={() => removeDownload(t.videoId)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}