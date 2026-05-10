import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Plus } from "lucide-react";
import { useLibrary } from "@/lib/store";

export const Route = createFileRoute("/library")({
  component: LibraryPage,
});

function LibraryPage() {
  const { playlists, liked, createPlaylist } = useLibrary();

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">Your Library</h1>
        <button
          onClick={() => createPlaylist(`Playlist #${playlists.length + 1}`)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold hover:scale-105 transition"
        >
          <Plus className="h-4 w-4" /> New playlist
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Link
          to="/liked"
          className="group bg-card hover:bg-secondary p-3 rounded-lg transition"
        >
          <div className="aspect-square rounded mb-3 bg-gradient-to-br from-purple-600 to-fuchsia-300 grid place-items-center">
            <Heart className="h-10 w-10 fill-white text-white" />
          </div>
          <div className="text-sm font-semibold truncate">Liked Songs</div>
          <div className="text-xs text-muted-foreground truncate">
            {liked.length} song{liked.length === 1 ? "" : "s"}
          </div>
        </Link>
        {playlists.map((p) => (
          <Link
            key={p.id}
            to="/playlist/$playlistId"
            params={{ playlistId: p.id }}
            className="group bg-card hover:bg-secondary p-3 rounded-lg transition"
          >
            <div
              className={`aspect-square rounded mb-3 bg-gradient-to-br ${p.gradient} shadow-lg`}
            />
            <div className="text-sm font-semibold truncate">{p.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              Playlist · {p.tracks.length} song{p.tracks.length === 1 ? "" : "s"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
