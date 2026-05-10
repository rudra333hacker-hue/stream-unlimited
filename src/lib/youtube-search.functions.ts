import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type YTResult = {
  videoId: string;
  title: string;
  author: string;
  duration: string;
  thumbnail: string;
};

const inputSchema = z.object({ q: z.string().min(1).max(200) });

export const searchYouTube = createServerFn({ method: "GET" })
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<YTResult[]> => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      data.q,
    )}&sp=EgIQAQ%253D%253D`; // sp filter = videos only

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) throw new Error(`YouTube fetch failed: ${res.status}`);
    const html = await res.text();

    // Extract ytInitialData JSON
    const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
    if (!m) return [];
    let data2: any;
    try {
      data2 = JSON.parse(m[1]);
    } catch {
      return [];
    }

    const results: YTResult[] = [];
    const sections =
      data2?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents ?? [];

    for (const section of sections) {
      const items = section?.itemSectionRenderer?.contents ?? [];
      for (const item of items) {
        const v = item?.videoRenderer;
        if (!v?.videoId) continue;
        const title = v.title?.runs?.[0]?.text ?? "";
        const author =
          v.ownerText?.runs?.[0]?.text ??
          v.longBylineText?.runs?.[0]?.text ??
          "";
        const duration = v.lengthText?.simpleText ?? "";
        const thumbnail =
          v.thumbnail?.thumbnails?.[v.thumbnail.thumbnails.length - 1]?.url ??
          `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;
        results.push({ videoId: v.videoId, title, author, duration, thumbnail });
        if (results.length >= 25) break;
      }
      if (results.length >= 25) break;
    }

    return results;
  });