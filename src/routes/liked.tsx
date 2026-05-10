import { createFileRoute } from "@tanstack/react-router";
import { Heart, Play } from "lucide-react";
import { useLibrary, usePlayer } from "@/lib/store";
import { TrackList } from "@/components/TrackList";

export const Route = createFileRoute("/liked")({
  component: LikedPage,
});

function LikedPage() {
  const { liked } = useLibrary();
  const { playList } = usePlayer();

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="px-6 pt-8 pb-6 bg-gradient-to-b from-purple-700/60 to-transparent">
        <div className="flex items-end gap-5">
          <div className="h-44 w-44 rounded shadow-2xl bg-gradient-to-br from-purple-600 to-fuchsia-300 grid place-items-center">
            <Heart className="h-20 w-20 fill-white text-white" />
          </div>
          <div className="space-y-2 pb-2">
            <p className="text-xs uppercase font-bold tracking-wider">Playlist</p>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
              Liked Songs
            </h1>
            <p className="text-sm text-muted-foreground">
              {liked.length} song{liked.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </header>

      <div className="px-6 pb-6">
        <div className="py-4">
          <button
            onClick={() => liked.length && playList(liked, 0)}
            disabled={liked.length === 0}
            className="h-14 w-14 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-xl hover:scale-105 transition disabled:opacity-50"
            aria-label="Play"
          >
            <Play className="h-6 w-6 fill-current ml-1" />
          </button>
        </div>
        <TrackList
          tracks={liked}
          onPlayIndex={(i) => playList(liked, i)}
        />
      </div>
    </div>
  );
}
