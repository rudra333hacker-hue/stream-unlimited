# Plan: AI recs, background playback, and "Downloaded" playlist

## 1. AI recommendations on Home

Two new sections on `src/routes/index.tsx`:

- **Made for you** — auto-generated from `liked` + `recent` tracks in the library store.
- **Mood picks** — a prompt input ("late-night lo-fi", "gym hype"); AI returns a curated tracklist.

How it works:
- New server function `src/lib/recommendations.functions.ts` calls the Lovable AI Gateway (`google/gemini-3-flash-preview`) using **tool calling** for structured JSON: `{ tracks: [{ title, artist }] }`.
- For each suggestion, reuse the existing `youtube-search` server function to resolve a `videoId` + thumbnail.
- Results cached client-side via TanStack Query (`['recs', mood|seedHash]`) so we don't re-hit the gateway on every nav.
- Empty-state fallback when the library is empty: ask AI for "popular starter songs across genres".

## 2. Background playback (PWA + Media Session)

- Install `vite-plugin-pwa` with the iframe-safe guard from the PWA knowledge: `devOptions.enabled: false`, registration skipped on Lovable preview hosts and inside iframes, `NetworkFirst` for navigations.
- `manifest.webmanifest`: name "Tunes", `display: "standalone"`, theme/background colors from design tokens, icons in `public/icons/` (192/512, maskable).
- New `src/lib/media-session.ts` hook wired in `BottomPlayer`: on track change, set `navigator.mediaSession.metadata` (title, artist, artwork from YouTube thumbnail) and register handlers for `play`, `pause`, `previoustrack`, `nexttrack`. This gives lock-screen / notification controls on Android + desktop.
- `YouTubePlayer` already keeps the iframe mounted in audio-only mode; we'll add `playsinline=1`, `enablejsapi=1` and re-issue `playVideo()` on `visibilitychange` to fight mobile auto-pause where allowed.
- **Honest caveat surfaced in the UI** (small note on the Downloaded page): iOS Safari still suspends background audio — this is a browser-level restriction nothing in JS can fully override.

## 3. "Downloaded" playlist (cache what's cacheable)

The hard truth, then the workaround:
- The YouTube IFrame Player **does not expose the audio stream** to JavaScript. The browser cannot read, save, or replay the audio bytes — Spotify can only do this because it ships its own DRM'd audio files.
- What *is* cacheable: track metadata, thumbnails, and the YouTube embed page itself so the UI is instant offline and playback resumes the moment connectivity returns.

Implementation:
- Add `downloaded: Track[]` + `downloadTrack` / `removeDownload` / `isDownloaded` to `LibraryProvider` (persisted in localStorage).
- New route `src/routes/downloaded.tsx` with a green "Downloaded" pill, a Download/Heart-style toggle on `TrackCard` and `BottomPlayer`.
- Service worker (via `vite-plugin-pwa` `runtimeCaching`):
  - `CacheFirst` for thumbnail hosts (`i.ytimg.com`) → cache name `tunes-artwork`, max 200 entries, 30-day expiry.
  - `StaleWhileRevalidate` for `youtube.com/embed/*` and `*.googlevideo.com` (best-effort — Google often sets `no-store`, so this may be a no-op; we don't pretend otherwise).
- **"Restrict from being deleted"**: browsers offer two real levers:
  1. Call `navigator.storage.persist()` when the user adds the first download — the browser then won't evict the cache under storage pressure (user can still clear site data manually; nothing in the web platform prevents that).
  2. Show storage usage via `navigator.storage.estimate()` on the Downloaded page so the user understands the budget.
- Downloaded playback path: same `YouTubePlayer` as online; if offline, show a banner "Audio playback requires connection — saved tracks will resume when online" rather than silently failing.

## 4. UI polish pass

- Home: section dividers, "Made for you" gets the same hover-pill treatment as playlists.
- Sidebar: add "Downloaded" entry with a download icon, badge showing count.
- BottomPlayer: download button beside the Like heart; spinner state while a track's artwork is being warmed into cache.

## Technical details

- **Files to add**
  - `src/lib/recommendations.functions.ts` — Lovable AI tool-calling wrapper.
  - `src/lib/media-session.ts` — `useMediaSession(current, controls)` hook.
  - `src/components/RecommendationsRow.tsx`, `src/components/MoodPrompt.tsx`.
  - `src/routes/downloaded.tsx`.
  - `public/manifest.webmanifest`, `public/icons/icon-192.png`, `public/icons/icon-512.png`.
- **Files to edit**
  - `src/lib/store.tsx` — add downloaded state + `persist()` call.
  - `src/components/YouTubePlayer.tsx` — `playsinline`, visibility re-kick.
  - `src/components/BottomPlayer.tsx` — Media Session wiring + download button.
  - `src/components/SidebarNav.tsx`, `src/components/TrackCard.tsx` — download affordance.
  - `src/routes/index.tsx` — recs sections.
  - `vite.config.ts` — register `vite-plugin-pwa` with the iframe-safe config from the PWA knowledge.
- **Dependencies**: `vite-plugin-pwa`, `workbox-window`.
- **No backend schema changes**; everything is client state + a stateless AI server function.

## Honest scope notes

- True Spotify-style offline audio is **not possible** with YouTube as the source from a browser. The plan caches everything the platform allows and is upfront about it in the UI.
- iOS Safari background audio with the YouTube IFrame is unreliable regardless of PWA install; Android Chrome + desktop will work well.
- If you ever want real offline audio, the only legit path is hosting your own audio files (Lovable Cloud Storage) — happy to plan that as a follow-up.
