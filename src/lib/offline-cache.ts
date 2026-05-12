// Cache thumbnails + embed pages so saved tracks load instantly.
// The actual YouTube audio stream is NOT cacheable from JS — see Downloaded page banner.
const CACHE_NAME = "tunes-downloaded-v1";

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist)
    return false;
  try {
    const already = await navigator.storage.persisted();
    if (already) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function getStorageEstimate() {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate)
    return null;
  try {
    return await navigator.storage.estimate();
  } catch {
    return null;
  }
}

export async function cacheTrackAssets(opts: {
  videoId: string;
  thumbnail: string;
}): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    const cache = await caches.open(CACHE_NAME);
    const urls = [
      opts.thumbnail,
      `https://www.youtube.com/embed/${opts.videoId}?enablejsapi=1`,
    ];
    await Promise.all(
      urls.map(async (u) => {
        try {
          const res = await fetch(u, { mode: "no-cors" });
          await cache.put(u, res);
        } catch {}
      }),
    );
  } catch {}
}

export async function uncacheTrackAssets(opts: {
  videoId: string;
  thumbnail: string;
}): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(opts.thumbnail);
    await cache.delete(`https://www.youtube.com/embed/${opts.videoId}?enablejsapi=1`);
  } catch {}
}