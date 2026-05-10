import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { searchYouTube, type YTResult } from "@/lib/youtube-search.functions";
import { YouTubePlayer } from "@/components/YouTubePlayer";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<YTResult[]>([]);
  const [queue, setQueue] = useState<YTResult[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(-1);
  const [audioOnly, setAudioOnly] = useState<boolean>(true);
  const search = useServerFn(searchYouTube);

  const mut = useMutation({
    mutationFn: (query: string) => search({ data: { q: query } }),
    onSuccess: (data) => setResults(data),
  });

  const playNow = (track: YTResult) => {
    setQueue([track]);
    setCurrentIdx(0);
  };
  const addToQueue = (track: YTResult) => {
    setQueue((prev) => {
      const next = [...prev, track];
      if (currentIdx === -1) setCurrentIdx(0);
      return next;
    });
  };
  const playNext = () => {
    setCurrentIdx((i) => (i + 1 < queue.length ? i + 1 : i));
  };

  const current = currentIdx >= 0 ? queue[currentIdx] : null;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Music</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) mut.mutate(q.trim());
        }}
        className="flex gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search songs, artists..."
          className="flex-1 rounded border border-input bg-background px-3 py-2"
        />
        <button
          type="submit"
          disabled={mut.isPending}
          className="rounded bg-primary text-primary-foreground px-4 py-2 disabled:opacity-50"
        >
          {mut.isPending ? "Searching..." : "Search"}
        </button>
      </form>

      {mut.isError && (
        <p className="text-destructive text-sm">
          Search failed: {(mut.error as Error).message}
        </p>
      )}

      {current && (
        <div className="rounded border border-border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Now playing</div>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <span>{audioOnly ? "Audio only" : "Video"}</span>
              <button
                type="button"
                onClick={() => setAudioOnly((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  audioOnly ? "bg-muted" : "bg-primary"
                }`}
                aria-label="Toggle video"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform ${
                    audioOnly ? "translate-x-0.5" : "translate-x-5"
                  }`}
                />
              </button>
            </label>
          </div>
          <div className="font-medium">{current.title}</div>
          <div className="text-sm text-muted-foreground">{current.author}</div>
          <YouTubePlayer
            videoId={current.videoId}
            onEnded={playNext}
            audioOnly={audioOnly}
          />
          <div className="flex gap-2 text-sm">
            <button
              onClick={playNext}
              disabled={currentIdx + 1 >= queue.length}
              className="rounded border border-input px-3 py-1 disabled:opacity-50"
            >
              Next
            </button>
            <span className="text-muted-foreground self-center">
              {currentIdx + 1} / {queue.length}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {results.map((r) => (
          <div
            key={r.videoId}
            className="flex items-center gap-3 rounded border border-border p-2"
          >
            <img
              src={r.thumbnail}
              alt=""
              className="w-24 h-14 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <div className="truncate font-medium">{r.title}</div>
              <div className="truncate text-sm text-muted-foreground">
                {r.author} · {r.duration}
              </div>
            </div>
            <button
              onClick={() => playNow(r)}
              className="rounded bg-primary text-primary-foreground px-3 py-1 text-sm"
            >
              Play
            </button>
            <button
              onClick={() => addToQueue(r)}
              className="rounded border border-input px-3 py-1 text-sm"
            >
              Queue
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
