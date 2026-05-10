import { Play, Heart } from "lucide-react";
import { useLibrary, usePlayer, type Track } from "@/lib/store";
import { AddToPlaylistMenu } from "./AddToPlaylistMenu";

export function TrackCard({ track }: { track: Track }) {
  const { playNow, pushRecent } = usePlayerWithRecent();
  const { isLiked, toggleLike } = useLibrary();
  const liked = isLiked(track.videoId);

  return (
    <div className="group relative bg-card hover:bg-secondary transition-colors rounded-lg p-3 cursor-pointer">
      <div className="relative mb-3">
        <div className="aspect-square w-full overflow-hidden rounded-md bg-black/40">
          <img
            src={track.thumbnail}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <button
          onClick={() => {
            playNow(track);
            pushRecent(track);
          }}
          className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105"
          aria-label="Play"
        >
          <Play className="h-5 w-5 fill-current ml-0.5" />
        </button>
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-sm truncate" title={track.title}>
          {track.title}
        </div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">
          {track.author} {track.duration && `· ${track.duration}`}
        </div>
      </div>
      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(track);
          }}
          className={`h-8 w-8 rounded-full grid place-items-center transition ${
            liked
              ? "bg-primary text-primary-foreground"
              : "bg-black/60 hover:bg-black/80 text-foreground"
          }`}
          title={liked ? "Unlike" : "Like"}
          aria-label="Like"
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
        </button>
        <AddToPlaylistMenu track={track} />
      </div>
    </div>
  );
}

// helper to combine player + recent
function usePlayerWithRecent() {
  const player = usePlayer();
  const lib = useLibrary();
  return { ...player, pushRecent: lib.pushRecent };
}
