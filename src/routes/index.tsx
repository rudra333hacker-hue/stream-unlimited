import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Search,
  Home,
  Library,
  Play,
  Plus,
  SkipForward,
  Music2,
  Video,
  ListMusic,
} from "lucide-react";
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
  const hasPlayer = current !== null;

  return (
    <div className="h-screen w-full flex flex-col bg-black text-foreground overflow-hidden">
      {/* Top: sidebar + main */}
      <div className="flex flex-1 min-h-0 gap-2 p-2">
        {/* Sidebar */}
        <aside
          className="hidden md:flex w-60 flex-col gap-2 rounded-lg p-2"
          style={{ background: "var(--sidebar-bg)" }}
        >
          <div className="px-3 py-4 flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary grid place-items-center">
              <Music2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">Tunes</span>
          </div>

          <nav className="flex flex-col gap-1 px-1">
            <NavItem icon={<Home className="h-5 w-5" />} label="Home" active />
            <NavItem icon={<Search className="h-5 w-5" />} label="Search" />
            <NavItem icon={<Library className="h-5 w-5" />} label="Your Library" />
          </nav>

          <div className="mt-4 flex-1 min-h-0 rounded-lg bg-card/60 p-3 flex flex-col">
            <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground px-1 pb-2">
              <span className="flex items-center gap-2">
                <ListMusic className="h-4 w-4" /> Queue
              </span>
              <span>{queue.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {queue.length === 0 && (
                <p className="text-xs text-muted-foreground px-1">
                  Your queue is empty.
                </p>
              )}
              {queue.map((t, i) => (
                <button
                  key={`${t.videoId}-${i}`}
                  onClick={() => setCurrentIdx(i)}
                  className={`w-full text-left px-2 py-1.5 rounded text-sm truncate hover:bg-secondary transition-colors ${
                    i === currentIdx
                      ? "text-primary"
                      : "text-foreground/90"
                  }`}
                  title={t.title}
                >
                  {i === currentIdx ? "▶ " : ""}
                  {t.title}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main
          className="flex-1 min-w-0 rounded-lg overflow-hidden flex flex-col"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.28 0.02 145 / 0.35) 0%, var(--color-background) 240px)",
          }}
        >
          {/* Header / search bar */}
          <div className="px-6 pt-5 pb-3 flex items-center gap-4 backdrop-blur">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (q.trim()) mut.mutate(q.trim());
              }}
              className="flex-1 max-w-md relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="What do you want to play?"
                className="w-full rounded-full bg-card pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </form>
            {mut.isPending && (
              <span className="text-xs text-muted-foreground">Searching…</span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {mut.isError && (
              <p className="text-destructive text-sm mb-4">
                Search failed: {(mut.error as Error).message}
              </p>
            )}

            {results.length === 0 && !mut.isPending && (
              <EmptyState />
            )}

            {results.length > 0 && (
              <>
                <h2 className="text-xl font-bold mb-3 mt-2">Results</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {results.map((r) => (
                    <TrackCard
                      key={r.videoId}
                      track={r}
                      onPlay={() => playNow(r)}
                      onQueue={() => addToQueue(r)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Bottom player */}
      <BottomPlayer
        current={current}
        audioOnly={audioOnly}
        onToggleAudio={() => setAudioOnly((v) => !v)}
        onNext={playNext}
        canNext={currentIdx + 1 < queue.length}
        hasPlayer={hasPlayer}
      />
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
        active
          ? "text-foreground bg-secondary/60"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-24">
      <div className="h-16 w-16 rounded-full bg-primary/20 grid place-items-center mb-4">
        <Music2 className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold">Search for music</h2>
      <p className="text-muted-foreground text-sm mt-1">
        Find any song, artist or video. Powered by YouTube.
      </p>
    </div>
  );
}

function TrackCard({
  track,
  onPlay,
  onQueue,
}: {
  track: YTResult;
  onPlay: () => void;
  onQueue: () => void;
}) {
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
          onClick={onPlay}
          className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105"
          aria-label="Play"
        >
          <Play className="h-5 w-5 fill-current ml-0.5" />
        </button>
      </div>
      <div className="min-w-0">
        <div
          className="font-semibold text-sm truncate"
          title={track.title}
        >
          {track.title}
        </div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">
          {track.author} {track.duration && `· ${track.duration}`}
        </div>
      </div>
      <button
        onClick={onQueue}
        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-foreground grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
        aria-label="Add to queue"
        title="Add to queue"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function BottomPlayer({
  current,
  audioOnly,
  onToggleAudio,
  onNext,
  canNext,
  hasPlayer,
}: {
  current: YTResult | null;
  audioOnly: boolean;
  onToggleAudio: () => void;
  onNext: () => void;
  canNext: boolean;
  hasPlayer: boolean;
}) {
  return (
    <footer
      className="border-t border-border px-4 py-3 flex items-center gap-4"
      style={{ background: "var(--player-bg)" }}
    >
      {/* Left: track info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {current ? (
          <>
            <img
              src={current.thumbnail}
              alt=""
              className="h-14 w-14 rounded object-cover"
            />
            <div className="min-w-0">
              <div
                className="text-sm font-semibold truncate"
                title={current.title}
              >
                {current.title}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {current.author}
              </div>
            </div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground">
            Nothing playing — search a song to start.
          </div>
        )}
      </div>

      {/* Center: video frame (only when video mode) */}
      <div className="flex-shrink-0">
        {hasPlayer && current && (
          <div
            className={
              audioOnly
                ? ""
                : "rounded overflow-hidden border border-border bg-black"
            }
            style={!audioOnly ? { width: 220, height: 124 } : undefined}
          >
            <YouTubePlayer
              videoId={current.videoId}
              onEnded={onNext}
              audioOnly={audioOnly}
            />
          </div>
        )}
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2 flex-1 justify-end">
        <button
          onClick={onToggleAudio}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            audioOnly
              ? "bg-secondary text-foreground hover:bg-secondary/70"
              : "bg-primary text-primary-foreground"
          }`}
          title={audioOnly ? "Show video" : "Audio only"}
        >
          {audioOnly ? (
            <>
              <Music2 className="h-3.5 w-3.5" /> Audio
            </>
          ) : (
            <>
              <Video className="h-3.5 w-3.5" /> Video
            </>
          )}
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          className="h-9 w-9 rounded-full grid place-items-center text-foreground hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          aria-label="Next"
          title="Next"
        >
          <SkipForward className="h-4 w-4" />
        </button>
      </div>
    </footer>
  );
}
