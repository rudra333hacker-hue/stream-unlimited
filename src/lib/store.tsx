import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { YTResult } from "./youtube-search.functions";

export type Track = YTResult;

export type Playlist = {
  id: string;
  name: string;
  description?: string;
  gradient: string;
  tracks: Track[];
  createdAt: number;
};

type LibraryState = {
  playlists: Playlist[];
  liked: Track[];
  recent: Track[];
  downloaded: Track[];
};

const STORAGE_KEY = "tunes-library-v1";

const GRADIENTS = [
  "from-rose-600 to-orange-400",
  "from-violet-700 to-fuchsia-500",
  "from-emerald-700 to-teal-400",
  "from-sky-700 to-cyan-400",
  "from-amber-600 to-yellow-400",
  "from-indigo-700 to-blue-500",
  "from-pink-600 to-purple-500",
  "from-lime-700 to-emerald-400",
];

const defaultState: LibraryState = {
  playlists: [
    {
      id: "p-todays-hits",
      name: "Today's Top Hits",
      description: "The biggest tracks right now",
      gradient: "from-rose-600 to-orange-400",
      tracks: [],
      createdAt: Date.now(),
    },
    {
      id: "p-chill",
      name: "Chill Mix",
      description: "Laid-back tunes to unwind",
      gradient: "from-sky-700 to-cyan-400",
      tracks: [],
      createdAt: Date.now(),
    },
    {
      id: "p-focus",
      name: "Deep Focus",
      description: "Concentration soundscape",
      gradient: "from-emerald-700 to-teal-400",
      tracks: [],
      createdAt: Date.now(),
    },
    {
      id: "p-workout",
      name: "Workout Beats",
      description: "High-energy fuel",
      gradient: "from-amber-600 to-yellow-400",
      tracks: [],
      createdAt: Date.now(),
    },
  ],
  liked: [],
  recent: [],
  downloaded: [],
};

function loadState(): LibraryState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as LibraryState;
    return {
      playlists: parsed.playlists ?? defaultState.playlists,
      liked: parsed.liked ?? [],
      recent: parsed.recent ?? [],
      downloaded: (parsed as any).downloaded ?? [],
    };
  } catch {
    return defaultState;
  }
}

type LibraryContextValue = LibraryState & {
  createPlaylist: (name: string) => Playlist;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (id: string, track: Track) => void;
  removeFromPlaylist: (id: string, videoId: string) => void;
  toggleLike: (track: Track) => void;
  isLiked: (videoId: string) => boolean;
  pushRecent: (track: Track) => void;
  downloadTrack: (track: Track) => Promise<void>;
  removeDownload: (videoId: string) => Promise<void>;
  isDownloaded: (videoId: string) => boolean;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LibraryState>(defaultState);
  const hydrated = useRef(false);

  useEffect(() => {
    setState(loadState());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const createPlaylist = useCallback((name: string) => {
    const playlist: Playlist = {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || "New Playlist",
      gradient: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
      tracks: [],
      createdAt: Date.now(),
    };
    setState((s) => ({ ...s, playlists: [playlist, ...s.playlists] }));
    return playlist;
  }, []);

  const renamePlaylist = useCallback((id: string, name: string) => {
    setState((s) => ({
      ...s,
      playlists: s.playlists.map((p) =>
        p.id === id ? { ...p, name: name.trim() || p.name } : p,
      ),
    }));
  }, []);

  const deletePlaylist = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      playlists: s.playlists.filter((p) => p.id !== id),
    }));
  }, []);

  const addToPlaylist = useCallback((id: string, track: Track) => {
    setState((s) => ({
      ...s,
      playlists: s.playlists.map((p) =>
        p.id === id && !p.tracks.some((t) => t.videoId === track.videoId)
          ? { ...p, tracks: [...p.tracks, track] }
          : p,
      ),
    }));
  }, []);

  const removeFromPlaylist = useCallback((id: string, videoId: string) => {
    setState((s) => ({
      ...s,
      playlists: s.playlists.map((p) =>
        p.id === id
          ? { ...p, tracks: p.tracks.filter((t) => t.videoId !== videoId) }
          : p,
      ),
    }));
  }, []);

  const toggleLike = useCallback((track: Track) => {
    setState((s) => {
      const exists = s.liked.some((t) => t.videoId === track.videoId);
      return {
        ...s,
        liked: exists
          ? s.liked.filter((t) => t.videoId !== track.videoId)
          : [track, ...s.liked],
      };
    });
  }, []);

  const isLiked = useCallback(
    (videoId: string) => state.liked.some((t) => t.videoId === videoId),
    [state.liked],
  );

  const pushRecent = useCallback((track: Track) => {
    setState((s) => ({
      ...s,
      recent: [
        track,
        ...s.recent.filter((t) => t.videoId !== track.videoId),
      ].slice(0, 12),
    }));
  }, []);

  const downloadTrack = useCallback(async (track: Track) => {
    const { cacheTrackAssets, requestPersistentStorage } = await import(
      "./offline-cache"
    );
    await requestPersistentStorage();
    await cacheTrackAssets({
      videoId: track.videoId,
      thumbnail: track.thumbnail,
    });
    setState((s) =>
      s.downloaded.some((t) => t.videoId === track.videoId)
        ? s
        : { ...s, downloaded: [track, ...s.downloaded] },
    );
  }, []);

  const removeDownload = useCallback(async (videoId: string) => {
    setState((s) => {
      const t = s.downloaded.find((x) => x.videoId === videoId);
      if (t) {
        import("./offline-cache").then(({ uncacheTrackAssets }) =>
          uncacheTrackAssets({ videoId: t.videoId, thumbnail: t.thumbnail }),
        );
      }
      return {
        ...s,
        downloaded: s.downloaded.filter((x) => x.videoId !== videoId),
      };
    });
  }, []);

  const isDownloaded = useCallback(
    (videoId: string) => state.downloaded.some((t) => t.videoId === videoId),
    [state.downloaded],
  );

  const value = useMemo(
    () => ({
      ...state,
      createPlaylist,
      renamePlaylist,
      deletePlaylist,
      addToPlaylist,
      removeFromPlaylist,
      toggleLike,
      isLiked,
      pushRecent,
      downloadTrack,
      removeDownload,
      isDownloaded,
    }),
    [
      state,
      createPlaylist,
      renamePlaylist,
      deletePlaylist,
      addToPlaylist,
      removeFromPlaylist,
      toggleLike,
      isLiked,
      pushRecent,
      downloadTrack,
      removeDownload,
      isDownloaded,
    ],
  );

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
}

/* ---------------- Player ---------------- */

type PlayerState = {
  queue: Track[];
  currentIdx: number;
  audioOnly: boolean;
  isPlaying: boolean;
};

type PlayerContextValue = PlayerState & {
  current: Track | null;
  playNow: (track: Track) => void;
  playList: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (track: Track) => void;
  next: () => void;
  prev: () => void;
  setAudioOnly: (v: boolean) => void;
  jumpTo: (idx: number) => void;
  clear: () => void;
  setIsPlaying: (v: boolean) => void;
  registerControls: (c: { play: () => void; pause: () => void }) => void;
  play: () => void;
  pause: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [audioOnly, setAudioOnly] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const controlsRef = useRef<{ play: () => void; pause: () => void } | null>(
    null,
  );

  const registerControls = useCallback(
    (c: { play: () => void; pause: () => void }) => {
      controlsRef.current = c;
    },
    [],
  );
  const play = useCallback(() => controlsRef.current?.play(), []);
  const pause = useCallback(() => controlsRef.current?.pause(), []);

  const playNow = useCallback((track: Track) => {
    setQueue([track]);
    setCurrentIdx(0);
  }, []);

  const playList = useCallback((tracks: Track[], startIndex = 0) => {
    if (!tracks.length) return;
    setQueue(tracks);
    setCurrentIdx(Math.max(0, Math.min(startIndex, tracks.length - 1)));
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueue((q) => {
      const next = [...q, track];
      return next;
    });
    setCurrentIdx((i) => (i === -1 ? 0 : i));
  }, []);

  const next = useCallback(() => {
    setCurrentIdx((i) => (i + 1 < queue.length ? i + 1 : i));
  }, [queue.length]);

  const prev = useCallback(() => {
    setCurrentIdx((i) => (i > 0 ? i - 1 : 0));
  }, []);

  const jumpTo = useCallback(
    (idx: number) => {
      if (idx >= 0 && idx < queue.length) setCurrentIdx(idx);
    },
    [queue.length],
  );

  const clear = useCallback(() => {
    setQueue([]);
    setCurrentIdx(-1);
  }, []);

  const current = currentIdx >= 0 ? queue[currentIdx] ?? null : null;

  const value = useMemo(
    () => ({
      queue,
      currentIdx,
      audioOnly,
      isPlaying,
      current,
      playNow,
      playList,
      addToQueue,
      next,
      prev,
      setAudioOnly,
      jumpTo,
      clear,
      setIsPlaying,
      registerControls,
      play,
      pause,
    }),
    [
      queue,
      currentIdx,
      audioOnly,
      isPlaying,
      current,
      playNow,
      playList,
      addToQueue,
      next,
      prev,
      jumpTo,
      clear,
      registerControls,
      play,
      pause,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
