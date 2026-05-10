import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search as SearchIcon, Music2 } from "lucide-react";
import { searchYouTube, type YTResult } from "@/lib/youtube-search.functions";
import { TrackCard } from "@/components/TrackCard";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<YTResult[]>([]);
  const search = useServerFn(searchYouTube);

  const mut = useMutation({
    mutationFn: (query: string) => search({ data: { q: query } }),
    onSuccess: (data) => setResults(data),
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 pt-5 pb-3 sticky top-0 z-10 backdrop-blur bg-background/40">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) mut.mutate(q.trim());
          }}
          className="max-w-md relative"
        >
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
            placeholder="What do you want to play?"
            className="w-full rounded-full bg-card pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </form>
      </div>

      <div className="px-6 pb-6">
        {mut.isError && (
          <p className="text-destructive text-sm mb-4">
            Search failed: {(mut.error as Error).message}
          </p>
        )}
        {mut.isPending && (
          <p className="text-sm text-muted-foreground">Searching…</p>
        )}
        {!mut.isPending && results.length === 0 && (
          <div className="flex flex-col items-center text-center py-24">
            <div className="h-16 w-16 rounded-full bg-primary/20 grid place-items-center mb-4">
              <Music2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Search for music</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Find any song, artist or video. Powered by YouTube.
            </p>
          </div>
        )}
        {results.length > 0 && (
          <>
            <h2 className="text-xl font-bold mb-3">Results</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {results.map((r) => (
                <TrackCard key={r.videoId} track={r} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
