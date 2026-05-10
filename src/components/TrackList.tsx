import { Play, Heart, Trash2, Clock } from "lucide-react";
import { useLibrary, usePlayer, type Track } from "@/lib/store";
import { AddToPlaylistMenu } from "./AddToPlaylistMenu";

type Props = {
  tracks: Track[];
  onPlayIndex?: (idx: number) => void;
  onRemove?: (track: Track, idx: number) => void;
  showIndex?: boolean;
};

export function TrackList({
  tracks,
  onPlayIndex,
  onRemove,
  showIndex = true,
}: Props) {
  const { playNow, current } = usePlayer();
  const { toggleLike, isLiked, pushRecent } = useLibrary();

  if (!tracks.length) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        No tracks here yet.
      </p>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="grid grid-cols-[40px_1fr_120px_40px] sm:grid-cols-[40px_1fr_180px_120px_40px] gap-3 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
        {showIndex ? <span>#</span> : <span />}
        <span>Title</span>
        <span className="hidden sm:block">Artist</span>
        <span className="text-right pr-2">
          <Clock className="h-4 w-4 inline" />
        </span>
        <span />
      </div>

      {tracks.map((t, i) => {
        const isCurrent = current?.videoId === t.videoId;
        const liked = isLiked(t.videoId);
        return (
          <div
            key={`${t.videoId}-${i}`}
            className="group grid grid-cols-[40px_1fr_120px_40px] sm:grid-cols-[40px_1fr_180px_120px_40px] gap-3 items-center px-3 py-2 rounded hover:bg-secondary/60 transition-colors"
            onDoubleClick={() => {
              if (onPlayIndex) onPlayIndex(i);
              else playNow(t);
              pushRecent(t);
            }}
          >
            <div className="relative grid place-items-center">
              <span
                className={`text-sm tabular-nums group-hover:opacity-0 transition-opacity ${
                  isCurrent ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <button
                onClick={() => {
                  if (onPlayIndex) onPlayIndex(i);
                  else playNow(t);
                  pushRecent(t);
                }}
                className="absolute opacity-0 group-hover:opacity-100 text-foreground"
                aria-label="Play"
              >
                <Play className="h-4 w-4 fill-current" />
              </button>
            </div>
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={t.thumbnail}
                alt=""
                className="h-10 w-10 rounded object-cover shrink-0"
              />
              <div className="min-w-0">
                <div
                  className={`text-sm truncate font-medium ${
                    isCurrent ? "text-primary" : ""
                  }`}
                  title={t.title}
                >
                  {t.title}
                </div>
                <div className="text-xs text-muted-foreground truncate sm:hidden">
                  {t.author}
                </div>
              </div>
            </div>
            <div className="hidden sm:block text-sm text-muted-foreground truncate">
              {t.author}
            </div>
            <div className="text-right text-sm text-muted-foreground tabular-nums pr-2 flex items-center justify-end gap-2">
              <button
                onClick={() => toggleLike(t)}
                className={`opacity-0 group-hover:opacity-100 transition ${
                  liked ? "opacity-100 text-primary" : ""
                }`}
                aria-label="Like"
              >
                <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              </button>
              <span>{t.duration || "—"}</span>
            </div>
            <div className="flex items-center justify-end">
              {onRemove ? (
                <button
                  onClick={() => onRemove(t, i)}
                  className="opacity-0 group-hover:opacity-100 h-8 w-8 grid place-items-center rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : (
                <div className="opacity-0 group-hover:opacity-100">
                  <AddToPlaylistMenu track={t} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
