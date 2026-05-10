import { Music2, Video, SkipForward, SkipBack, Heart } from "lucide-react";
import { useLibrary, usePlayer } from "@/lib/store";
import { YouTubePlayer } from "./YouTubePlayer";

export function BottomPlayer() {
  const { current, audioOnly, setAudioOnly, next, prev, queue, currentIdx } =
    usePlayer();
  const { isLiked, toggleLike } = useLibrary();
  const liked = current ? isLiked(current.videoId) : false;

  return (
    <footer
      className="border-t border-border px-4 py-3 flex items-center gap-4 shrink-0"
      style={{ background: "var(--player-bg)" }}
    >
      {/* Left: track info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {current ? (
          <>
            <img
              src={current.thumbnail}
              alt=""
              className="h-14 w-14 rounded object-cover"
            />
            <div className="min-w-0">
              <div
                className="text-sm font-semibold truncate"
                title={current.title}
              >
                {current.title}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {current.author}
              </div>
            </div>
            <button
              onClick={() => toggleLike(current)}
              className={`shrink-0 ml-1 ${
                liked ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Like"
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            </button>
          </>
        ) : (
          <div className="text-xs text-muted-foreground">
            Nothing playing — search a song to start.
          </div>
        )}
      </div>

      {/* Center: video frame */}
      <div className="flex-shrink-0">
        {current && (
          <div
            className={
              audioOnly
                ? ""
                : "rounded overflow-hidden border border-border bg-black"
            }
            style={!audioOnly ? { width: 220, height: 124 } : undefined}
          >
            <YouTubePlayer
              videoId={current.videoId}
              onEnded={next}
              audioOnly={audioOnly}
            />
          </div>
        )}
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2 flex-1 justify-end">
        <button
          onClick={() => setAudioOnly(!audioOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            audioOnly
              ? "bg-secondary text-foreground hover:bg-secondary/70"
              : "bg-primary text-primary-foreground"
          }`}
          title={audioOnly ? "Show video" : "Audio only"}
        >
          {audioOnly ? (
            <>
              <Music2 className="h-3.5 w-3.5" /> Audio
            </>
          ) : (
            <>
              <Video className="h-3.5 w-3.5" /> Video
            </>
          )}
        </button>
        <button
          onClick={prev}
          disabled={currentIdx <= 0}
          className="h-9 w-9 rounded-full grid place-items-center hover:bg-secondary disabled:opacity-30 transition"
          aria-label="Previous"
        >
          <SkipBack className="h-4 w-4" />
        </button>
        <button
          onClick={next}
          disabled={currentIdx + 1 >= queue.length}
          className="h-9 w-9 rounded-full grid place-items-center hover:bg-secondary disabled:opacity-30 transition"
          aria-label="Next"
        >
          <SkipForward className="h-4 w-4" />
        </button>
      </div>
    </footer>
  );
}
