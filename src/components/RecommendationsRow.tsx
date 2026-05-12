import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles, Play, Loader2, Wand2 } from "lucide-react";
import { getRecommendations } from "@/lib/recommendations.functions";
import { searchYouTube } from "@/lib/youtube-search.functions";
import { useLibrary, usePlayer, type Track } from "@/lib/store";

async function resolveTracks(
  search: (args: { data: { q: string } }) => Promise<Track[]>,
  suggestions: { title: string; artist: string }[],
): Promise<Track[]> {
  const results = await Promise.all(
    suggestions.map(async (s) => {
      try {
        const r = await search({
          data: { q: `${s.title} ${s.artist}` },
        });
        return r[0] ?? null;
      } catch {
        return null;
      }
    }),
  );
  const seen = new Set<string>();
  return results.filter((t): t is Track => {
    if (!t || seen.has(t.videoId)) return false;
    seen.add(t.videoId);
    return true;
  });
}

export function MadeForYouRow() {
  const { liked, recent } = useLibrary();
  const { playList, playNow } = usePlayer();
  const recs = useServerFn(getRecommendations);
  const search = useServerFn(searchYouTube);

  const seedKey = [...liked, ...recent]
    .slice(0, 12)
    .map((t) => t.videoId)
    .join(",");

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["made-for-you", seedKey],
    queryFn: async () => {
      const seeds = [...liked, ...recent]
        .slice(0, 12)
        .map((t) => ({ title: t.title, author: t.author }));
      const suggestions = await recs({
        data: { mode: "made-for-you", seeds },
      });
      return resolveTracks(search, suggestions);
    },
    staleTime: 1000 * 60 * 30,
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> Made for you
        </h2>
        <button
          onClick={() => refetch()}
          className="text-xs text-muted-foreground hover:text-foreground"
          disabled={isFetching}
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {isLoading ? (
        <SkeletonGrid />
      ) : isError ? (
        <p className="text-sm text-destructive">
          Couldn't load recommendations.
        </p>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No suggestions yet.</p>
      ) : (
        <RecGrid tracks={data} onPlayAll={() => playList(data, 0)} onPlay={playNow} />
      )}
    </section>
  );
}

export function MoodPrompt() {
  const [mood, setMood] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const recs = useServerFn(getRecommendations);
  const search = useServerFn(searchYouTube);
  const { playList, playNow } = usePlayer();

  const mutation = useMutation({
    mutationFn: async (m: string) => {
      const suggestions = await recs({ data: { mode: "mood", mood: m } });
      return resolveTracks(search, suggestions);
    },
    onSuccess: (t) => setTracks(t),
  });

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" /> Vibe picker
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Describe a mood, genre, activity — get a fresh AI-curated set.
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (mood.trim()) mutation.mutate(mood.trim());
        }}
        className="flex gap-2 mb-4"
      >
        <input
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          placeholder="e.g. late-night lo-fi, gym hype, melancholy indie…"
          className="flex-1 bg-card border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={mutation.isPending || !mood.trim()}
          className="bg-primary text-primary-foreground rounded-full px-5 py-2 text-sm font-semibold hover:scale-105 transition disabled:opacity-50 flex items-center gap-2"
        >
          {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Generate
        </button>
      </form>
      {mutation.isError && (
        <p className="text-sm text-destructive mb-2">
          {(mutation.error as Error).message}
        </p>
      )}
      {tracks.length > 0 && (
        <RecGrid
          tracks={tracks}
          onPlayAll={() => playList(tracks, 0)}
          onPlay={playNow}
        />
      )}
    </section>
  );
}

function RecGrid({
  tracks,
  onPlayAll,
  onPlay,
}: {
  tracks: Track[];
  onPlayAll: () => void;
  onPlay: (t: Track) => void;
}) {
  return (
    <>
      <button
        onClick={onPlayAll}
        className="mb-3 text-xs font-semibold text-primary hover:underline"
      >
        ▶ Play all
      </button>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {tracks.map((t) => (
          <button
            key={t.videoId}
            onClick={() => onPlay(t)}
            className="group bg-card hover:bg-secondary p-3 rounded-lg text-left transition relative"
          >
            <div className="aspect-square overflow-hidden rounded mb-2 bg-black/40 relative">
              <img
                src={t.thumbnail}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <span className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center opacity-0 group-hover:opacity-100 transition shadow-lg">
                <Play className="h-4 w-4 fill-current ml-0.5" />
              </span>
            </div>
            <div className="text-sm font-semibold truncate">{t.title}</div>
            <div className="text-xs text-muted-foreground truncate">
              {t.author}
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-card p-3 rounded-lg animate-pulse">
          <div className="aspect-square rounded bg-secondary/50 mb-2" />
          <div className="h-3 bg-secondary/50 rounded w-3/4 mb-1" />
          <div className="h-2 bg-secondary/40 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}