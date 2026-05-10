import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Library, Music2, Plus, Heart, ListMusic } from "lucide-react";
import { useLibrary, usePlayer } from "@/lib/store";

export function SidebarNav() {
  const { playlists, liked, createPlaylist } = useLibrary();
  const { queue, currentIdx, jumpTo } = usePlayer();
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <aside
      className="hidden md:flex w-64 flex-col gap-2 rounded-lg p-2 shrink-0"
      style={{ background: "var(--sidebar-bg)" }}
    >
      <div className="px-3 py-3 flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary grid place-items-center">
          <Music2 className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight">Tunes</span>
      </div>

      <nav className="flex flex-col gap-1 px-1">
        <NavLink to="/" icon={<Home className="h-5 w-5" />} label="Home" active={path === "/"} />
        <NavLink to="/search" icon={<Search className="h-5 w-5" />} label="Search" active={path === "/search"} />
        <NavLink to="/library" icon={<Library className="h-5 w-5" />} label="Your Library" active={path === "/library"} />
      </nav>

      <div className="mt-2 rounded-lg bg-card/60 p-3 flex flex-col gap-1">
        <button
          onClick={() => createPlaylist(`Playlist #${playlists.length + 1}`)}
          className="flex items-center gap-2 px-2 py-2 rounded text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition"
        >
          <Plus className="h-4 w-4" /> Create playlist
        </button>
        <Link
          to="/liked"
          className={`flex items-center gap-2 px-2 py-2 rounded text-sm font-semibold transition ${
            path === "/liked" ? "bg-secondary/80 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          }`}
        >
          <span className="h-7 w-7 rounded bg-gradient-to-br from-purple-600 to-fuchsia-300 grid place-items-center">
            <Heart className="h-3.5 w-3.5 fill-white text-white" />
          </span>
          <span className="flex-1 truncate">Liked Songs</span>
          <span className="text-xs">{liked.length}</span>
        </Link>
      </div>

      {/* Playlists list */}
      <div className="flex-1 min-h-0 mt-2 rounded-lg bg-card/60 p-2 overflow-y-auto">
        <div className="text-xs uppercase tracking-wider text-muted-foreground px-2 py-1">
          Playlists
        </div>
        {playlists.length === 0 ? (
          <p className="text-xs text-muted-foreground px-2 py-2">No playlists yet.</p>
        ) : (
          playlists.map((p) => {
            const isActive = path === `/playlist/${p.id}`;
            return (
              <Link
                key={p.id}
                to="/playlist/$playlistId"
                params={{ playlistId: p.id }}
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition ${
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <span
                  className={`h-7 w-7 rounded bg-gradient-to-br ${p.gradient} shrink-0`}
                />
                <span className="truncate">{p.name}</span>
              </Link>
            );
          })
        )}
      </div>

      {/* Queue */}
      <div className="rounded-lg bg-card/60 p-2 max-h-48 flex flex-col">
        <div className="text-xs uppercase tracking-wider text-muted-foreground px-2 py-1 flex items-center gap-2">
          <ListMusic className="h-3.5 w-3.5" /> Queue · {queue.length}
        </div>
        <div className="overflow-y-auto">
          {queue.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-1">Empty</p>
          )}
          {queue.map((t, i) => (
            <button
              key={`${t.videoId}-${i}`}
              onClick={() => jumpTo(i)}
              className={`w-full text-left px-2 py-1 rounded text-xs truncate transition ${
                i === currentIdx
                  ? "text-primary"
                  : "text-foreground/80 hover:bg-secondary"
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
  );
}

function NavLink({
  to,
  icon,
  label,
  active,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
        active
          ? "text-foreground bg-secondary/60"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
