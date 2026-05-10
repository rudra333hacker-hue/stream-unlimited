import { useState, useRef, useEffect } from "react";
import { Plus, Check } from "lucide-react";
import { useLibrary, type Track } from "@/lib/store";

export function AddToPlaylistMenu({ track }: { track: Track }) {
  const { playlists, addToPlaylist, createPlaylist } = useLibrary();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="h-8 w-8 rounded-full bg-black/60 grid place-items-center hover:bg-black/80 transition"
        title="Add to playlist"
        aria-label="Add to playlist"
      >
        <Plus className="h-4 w-4" />
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-md shadow-xl z-50 p-1 max-h-72 overflow-y-auto"
        >
          <button
            onClick={() => {
              const p = createPlaylist(`Playlist #${playlists.length + 1}`);
              addToPlaylist(p.id, track);
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-secondary text-left"
          >
            <Plus className="h-4 w-4" /> New playlist
          </button>
          <div className="h-px bg-border my-1" />
          {playlists.map((p) => {
            const has = p.tracks.some((t) => t.videoId === track.videoId);
            return (
              <button
                key={p.id}
                onClick={() => {
                  if (!has) addToPlaylist(p.id, track);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm rounded hover:bg-secondary text-left"
              >
                <span className="truncate">{p.name}</span>
                {has && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
