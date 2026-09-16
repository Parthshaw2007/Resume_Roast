import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  resume: z.string().min(30, "Resume text is too short"),
  role: z.string().default(""),
  jobDescription: z.string().default(""),
});

export type ReqStatus = "Strong Match" | "Partial Match" | "Missing";

export type ReviewResult = {
  score: number;
  match_score: number;
  match_summary: string;
  summary: string;
  subscores: {
    skills_match: number;
    keyword_match: number;
    experience_relevance: number;
    education_match: number;
    evidence_strength: number;
    resume_clarity: number;
  };
  score_breakdown: {
    category: string;
    weight: number;
    score: number;
    note: string;
  }[];
  requirements: {
    requirement: string;
    evidence: string;
    reason: string;
    critical: boolean;
    status: ReqStatus;
  }[];
  missing_requirements: {
    requirement: string;
    job_asks: string;
    finding: string;
    advice: string;
  }[];
  strengths: string[];
  weaknesses: string[];
  suggestions: { area: string; issue: string; fix: string }[];
  missing_keywords: string[];
  missing_skills: string[];
  evidence: { skill: string; section: string; quote: string; found: boolean }[];
  interview_questions: { question: string; why: string }[];
  rewritten_bullets: {
    before: string;
    after: string;
    reasons: string[];
    job_relevance: string;
  }[];
};

const schema = {
  type: "object",
  additionalProperties: false,
  required: [
    "score",
    "match_score",
    "match_summary",
    "summary",
    "subscores",
    "score_breakdown",
    "requirements",
    "missing_requirements",
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
    match_summary: {
      type: "string",
      description:
        "2 sentences explaining why the match is high or low, naming specific requirements that are or aren't supported by the resume. Empty string if no job description.",
    },
    summary: { type: "string" },
    subscores: {
      type: "object",
      additionalProperties: false,
      required: [
        "skills_match",
        "keyword_match",
        "experience_relevance",
        "evidence_strength",
        "resume_clarity",
      ],
      properties: {
        skills_match: { type: "number" },
        keyword_match: { type: "number" },
        experience_relevance: { type: "number" },
        evidence_strength: { type: "number" },
        resume_clarity: { type: "number" },
      },
    },
    requirements: {
      type: "array",
      description:
        "Every important requirement extracted from the job description, mapped to evidence found ONLY in the resume. Empty array if no job description was provided.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["requirement", "evidence", "status"],
        properties: {
          requirement: { type: "string" },
          evidence: {
            type: "string",
            description:
              "Exact or near-exact line from the resume proving it, or 'No relevant evidence found', or an explanation like 'Mentioned in skills but no project evidence'.",
          },
          status: { type: "string", enum: ["Strong Match", "Partial Match", "Missing"] },
        },
      },
    },
    missing_requirements: {
      type: "array",
      description: "Requirements with status Missing, explained honestly.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["requirement", "job_asks", "advice"],
        properties: {
          requirement: { type: "string" },
          job_asks: { type: "string", description: "What the job description asks for" },
          advice: {
            type: "string",
            description:
              "Conditional advice, e.g. 'If you have worked with REST APIs, add the relevant project'. Never tell the user to add something they may not have done.",
          },
        },
      },
    },
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
        required: ["before", "after", "reasons"],
        properties: {
          before: { type: "string" },
          after: {
            type: "string",
            description:
              "Improved bullet using ONLY facts present in the original. Never invent metrics. If a metric would help but none exists, end with '(Add a metric if you have one.)'",
          },
          reasons: {
            type: "array",
            description: "2-4 short reasons why the rewrite is better",
            items: { type: "string" },
          },
        },
      },
    },
  },
} as const;

const SYSTEM = `You are ResumeRoast, an evidence-based resume-to-job matching engine.

Hard rules:
- NEVER invent skills, experience, projects, achievements, companies, dates or metrics that are not in the resume.
- Every piece of "evidence" must be a quote or close paraphrase of text that actually appears in the resume. If there is none, say "No relevant evidence found".
- A skill listed only in a skills list, with no project or job backing it, is a Partial Match ("Mentioned in skills but no project evidence"), never a Strong Match.
- Rewritten bullets may only restate facts already in the original bullet. If a number would strengthen it and none exists, append "(Add a metric if you have one.)".
- Advice for missing requirements must be conditional: "If you have done X, add it." Never instruct the user to claim something.

If a job description is provided: extract every important requirement (skills, tools, responsibilities, experience level) and map each one to resume evidence with status Strong Match / Partial Match / Missing. Compute match_score from that mapping and explain it in match_summary.

If NO job description is provided: set match_score equal to score, match_summary to an empty string, and leave requirements and missing_requirements as empty arrays. Still deliver a full resume quality analysis.

Be blunt, specific and concrete. Never generic filler.`;

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
            content: [{ type: "input_text", text: SYSTEM }],
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
