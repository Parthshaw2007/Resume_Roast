import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  resume: z.string().min(30, "Resume text is too short"),
  role: z.string().default(""),
});

export type ReviewResult = {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: { area: string; issue: string; fix: string }[];
  missing_keywords: string[];
  rewritten_bullets: { before: string; after: string }[];
};

const schema = {
  type: "object",
  additionalProperties: false,
  required: [
    "score",
    "summary",
    "strengths",
    "weaknesses",
    "suggestions",
    "missing_keywords",
    "rewritten_bullets",
  ],
  properties: {
    score: { type: "number", description: "0-100 overall resume score" },
    summary: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
    suggestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["area", "issue", "fix"],
        properties: {
          area: { type: "string" },
          issue: { type: "string" },
          fix: { type: "string" },
        },
      },
    },
    missing_keywords: { type: "array", items: { type: "string" } },
    rewritten_bullets: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["before", "after"],
        properties: { before: { type: "string" }, after: { type: "string" } },
      },
    },
  },
} as const;

export const reviewResume = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<ReviewResult> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        stream: true,
        reasoning: { effort: "low", summary: "auto" },
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: "You are a blunt, expert technical recruiter and resume coach. Review the resume critically for ATS-friendliness, impact metrics, clarity and relevance. Be specific, never generic.",
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Target role: ${data.role || "not specified"}\n\nResume:\n${data.resume}`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "resume_review",
            strict: true,
            schema,
          },
        },
      }),
    });

    if (!res.ok || !res.body) {
      const msg = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Rate limited — try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits.");
      throw new Error(`AI request failed (${res.status}): ${msg.slice(0, 300)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let text = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
            text += evt.delta;
          }
        } catch {
          /* ignore partial */
        }
      }
    }

    if (!text.trim()) throw new Error("The model returned an empty review. Please retry.");
    return JSON.parse(text) as ReviewResult;
  });
