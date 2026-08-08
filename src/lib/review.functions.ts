import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  resume: z.string().min(30, "Resume text is too short"),
  role: z.string().default(""),
  jobDescription: z.string().default(""),
});

export type ReviewResult = {
  score: number;
  match_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: { area: string; issue: string; fix: string }[];
  missing_keywords: string[];
  missing_skills: string[];
  evidence: { skill: string; section: string; quote: string; found: boolean }[];
  interview_questions: { question: string; why: string }[];
  rewritten_bullets: { before: string; after: string }[];
};

const schema = {
  type: "object",
  additionalProperties: false,
  required: [
    "score",
    "match_score",
    "summary",
    "strengths",
    "weaknesses",
    "suggestions",
    "missing_keywords",
    "missing_skills",
    "evidence",
    "interview_questions",
    "rewritten_bullets",
  ],
  properties: {
    score: { type: "number", description: "0-100 overall resume quality score" },
    match_score: {
      type: "number",
      description:
        "0-100 match between resume and the job description. If no job description was given, repeat the overall score.",
    },
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
    missing_skills: {
      type: "array",
      items: { type: "string" },
      description: "Required skills from the job description absent from the resume",
    },
    evidence: {
      type: "array",
      description:
        "For each key skill required by the job description, where it appears in the resume",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["skill", "section", "quote", "found"],
        properties: {
          skill: { type: "string" },
          section: { type: "string", description: "Resume section, or 'Not found'" },
          quote: { type: "string", description: "Exact supporting line, or empty" },
          found: { type: "boolean" },
        },
      },
    },
    interview_questions: {
      type: "array",
      description: "Exactly 10 tailored interview questions",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "why"],
        properties: {
          question: { type: "string" },
          why: { type: "string", description: "Why an interviewer would ask this" },
        },
      },
    },
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
                text: "You are a blunt, expert technical recruiter and job application copilot. Compare the resume against the job description: compute a match score, cite exact evidence lines for required skills, list missing skills/keywords, give concrete fixes, rewrite weak bullets, and write exactly 10 tailored interview questions. Be specific, never generic.",
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Target role: ${data.role || "not specified"}\n\nJob description:\n${
                  data.jobDescription || "not provided"
                }\n\nResume:\n${data.resume}`,
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
