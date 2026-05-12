import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, Clock } from "lucide-react";
import { useLibrary, usePlayer } from "@/lib/store";
import { MadeForYouRow, MoodPrompt } from "@/components/RecommendationsRow";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { playlists, recent, liked } = useLibrary();
  const { playList, playNow } = usePlayer();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-10">
      <h1 className="text-3xl font-extrabold tracking-tight">{greeting}</h1>

      {/* Quick picks */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Link
          to="/liked"
          className="group flex items-center gap-3 rounded-md bg-card hover:bg-secondary transition overflow-hidden"
        >
          <div className="h-16 w-16 bg-gradient-to-br from-purple-600 to-fuchsia-300 grid place-items-center shrink-0">
            <span className="text-xl">♥</span>
          </div>
          <span className="font-bold truncate flex-1">Liked Songs</span>
          <PlayPill
            onClick={(e) => {
              e.preventDefault();
              if (liked.length) playList(liked, 0);
            }}
            disabled={liked.length === 0}
          />
        </Link>
        {playlists.slice(0, 5).map((p) => (
          <Link
            key={p.id}
            to="/playlist/$playlistId"
            params={{ playlistId: p.id }}
            className="group flex items-center gap-3 rounded-md bg-card hover:bg-secondary transition overflow-hidden"
          >
            <div
              className={`h-16 w-16 bg-gradient-to-br ${p.gradient} shrink-0`}
            />
            <span className="font-bold truncate flex-1">{p.name}</span>
            <PlayPill
              onClick={(e) => {
                e.preventDefault();
                if (p.tracks.length) playList(p.tracks, 0);
              }}
              disabled={p.tracks.length === 0}
            />
          </Link>
        ))}
      </section>

      {/* AI: Made for you */}
      <MadeForYouRow />

      {/* AI: Mood picker */}
      <MoodPrompt />

      {/* Recently played */}
      {recent.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5" /> Recently played
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {recent.map((t) => (
              <button
                key={t.videoId}
                onClick={() => playNow(t)}
                className="group bg-card hover:bg-secondary p-3 rounded-lg text-left transition"
              >
                <div className="aspect-square overflow-hidden rounded mb-2 bg-black/40">
                  <img
                    src={t.thumbnail}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="text-sm font-semibold truncate">{t.title}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {t.author}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Your playlists */}
      <section>
        <h2 className="text-xl font-bold mb-3">Your playlists</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
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
                {p.tracks.length} song{p.tracks.length === 1 ? "" : "s"}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function PlayPill({
  onClick,
  disabled,
}: {
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mr-3 h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center opacity-0 group-hover:opacity-100 transition shadow-lg disabled:opacity-0"
      aria-label="Play"
    >
      <Play className="h-4 w-4 fill-current ml-0.5" />
    </button>
  );
}
