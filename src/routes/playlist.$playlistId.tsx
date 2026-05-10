import { createFileRoute, useNavigate, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Play, Trash2, Pencil, Check, X } from "lucide-react";
import { useLibrary, usePlayer } from "@/lib/store";
import { TrackList } from "@/components/TrackList";

export const Route = createFileRoute("/playlist/$playlistId")({
  component: PlaylistPage,
  notFoundComponent: () => (
    <div className="flex-1 grid place-items-center text-muted-foreground">
      Playlist not found.
    </div>
  ),
});

function PlaylistPage() {
  const { playlistId } = Route.useParams();
  const { playlists, renamePlaylist, deletePlaylist, removeFromPlaylist } =
    useLibrary();
  const { playList } = usePlayer();
  const navigate = useNavigate();
  const playlist = playlists.find((p) => p.id === playlistId);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  if (!playlist) {
    throw notFound();
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <header
        className={`px-6 pt-8 pb-6 bg-gradient-to-b ${playlist.gradient} to-transparent`}
      >
        <div className="flex items-end gap-5">
          <div
            className={`h-44 w-44 rounded shadow-2xl bg-gradient-to-br ${playlist.gradient}`}
          />
          <div className="space-y-2 pb-2 min-w-0">
            <p className="text-xs uppercase font-bold tracking-wider">Playlist</p>
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      renamePlaylist(playlist.id, name);
                      setEditing(false);
                    }
                    if (e.key === "Escape") setEditing(false);
                  }}
                  className="text-3xl font-extrabold bg-black/30 rounded px-2 py-1 outline-none"
                />
                <button
                  onClick={() => {
                    renamePlaylist(playlist.id, name);
                    setEditing(false);
                  }}
                  className="h-9 w-9 grid place-items-center rounded bg-primary text-primary-foreground"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="h-9 w-9 grid place-items-center rounded bg-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight truncate">
                {playlist.name}
              </h1>
            )}
            {playlist.description && (
              <p className="text-sm text-muted-foreground">
                {playlist.description}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {playlist.tracks.length} song
              {playlist.tracks.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </header>

      <div className="px-6 pb-6">
        <div className="py-4 flex items-center gap-3">
          <button
            onClick={() =>
              playlist.tracks.length && playList(playlist.tracks, 0)
            }
            disabled={playlist.tracks.length === 0}
            className="h-14 w-14 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-xl hover:scale-105 transition disabled:opacity-50"
            aria-label="Play"
          >
            <Play className="h-6 w-6 fill-current ml-1" />
          </button>
          <button
            onClick={() => {
              setName(playlist.name);
              setEditing(true);
            }}
            className="h-10 w-10 grid place-items-center rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition"
            title="Rename"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete playlist "${playlist.name}"?`)) {
                deletePlaylist(playlist.id);
                navigate({ to: "/library" });
              }
            }}
            className="h-10 w-10 grid place-items-center rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <TrackList
          tracks={playlist.tracks}
          onPlayIndex={(i) => playList(playlist.tracks, i)}
          onRemove={(t) => removeFromPlaylist(playlist.id, t.videoId)}
        />
      </div>
    </div>
  );
}
