import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  mode: z.enum(["mood", "made-for-you"]),
  mood: z.string().max(200).optional(),
  seeds: z
    .array(z.object({ title: z.string(), author: z.string() }))
    .max(20)
    .optional(),
});

export type Suggestion = { title: string; artist: string };

export const getRecommendations = createServerFn({ method: "POST" })
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<Suggestion[]> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    let userPrompt = "";
    if (data.mode === "mood") {
      userPrompt = `Suggest 8 songs that fit this vibe: "${data.mood ?? "fresh discovery"}". Mix well-known and lesser-known tracks.`;
    } else {
      const seedList = (data.seeds ?? [])
        .slice(0, 12)
        .map((s) => `- ${s.title} — ${s.author}`)
        .join("\n");
      userPrompt = seedList
        ? `Based on these tracks the user likes, suggest 8 similar but new songs they probably haven't heard:\n${seedList}`
        : "Suggest 8 popular starter songs across pop, rock, hip-hop, electronic, and indie for someone with no listening history yet.";
    }

    const res = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "You are a music recommendation engine. Always return suggestions through the provided tool. Use real song titles and real artist names. Avoid duplicates of the seed list.",
            },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_suggestions",
                description: "Return a list of song suggestions",
                parameters: {
                  type: "object",
                  properties: {
                    tracks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          artist: { type: "string" },
                        },
                        required: ["title", "artist"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["tracks"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_suggestions" },
          },
        }),
      },
    );

    if (res.status === 429)
      throw new Error("Rate limit reached — try again in a moment.");
    if (res.status === 402)
      throw new Error("AI credits exhausted. Add credits in Settings.");
    if (!res.ok) {
      const t = await res.text();
      console.error("AI gateway error:", res.status, t);
      throw new Error(`AI gateway error (${res.status})`);
    }

    const json = await res.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) return [];
    try {
      const parsed = JSON.parse(call.function.arguments) as {
        tracks: Suggestion[];
      };
      return parsed.tracks ?? [];
    } catch {
      return [];
    }
  });