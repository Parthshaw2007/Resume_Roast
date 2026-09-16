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
        "education_match",
        "evidence_strength",
        "resume_clarity",
      ],
      properties: {
        skills_match: { type: "number" },
        keyword_match: { type: "number" },
        experience_relevance: { type: "number" },
        education_match: {
          type: "number",
          description:
            "0-100 how well the resume's education/certifications meet what the job requires. If the job states no education requirement, use 100.",
        },
        evidence_strength: { type: "number" },
        resume_clarity: { type: "number" },
      },
    },
    score_breakdown: {
      type: "array",
      description:
        "Exactly the 5 scoring categories with fixed weights: Skills match 30, Experience relevance 25, Evidence strength 20, Education 15, Keywords 10. score is that category's 0-100 value. Empty array if no job description.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "weight", "score", "note"],
        properties: {
          category: { type: "string" },
          weight: { type: "number", description: "Percentage weight, e.g. 30" },
          score: { type: "number", description: "0-100 score for this category" },
          note: { type: "string", description: "One short sentence justifying this category score" },
        },
      },
    },
    requirements: {
      type: "array",
      description:
        "Every important requirement extracted from the job description, mapped to evidence found ONLY in the resume. Empty array if no job description was provided.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["requirement", "evidence", "reason", "critical", "status"],
        properties: {
          requirement: { type: "string", description: "Short label, e.g. 'Python' or '3+ years backend experience'" },
          evidence: {
            type: "string",
            description:
              "Exact or near-exact line from the resume proving it, or 'No evidence found in the provided resume.'",
          },
          reason: {
            type: "string",
            description:
              "One or two sentences explaining why this was classified Strong Match / Partial Match / Missing.",
          },
          critical: {
            type: "boolean",
            description: "True if the job lists this as required/must-have rather than nice-to-have.",
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
        required: ["requirement", "job_asks", "finding", "advice"],
        properties: {
          requirement: { type: "string" },
          job_asks: { type: "string", description: "What the job description asks for" },
          finding: {
            type: "string",
            description:
              "Strictly a statement about the document, never about the person. E.g. 'No Python experience or evidence was found in the provided resume.' Never write 'You don't know Python'.",
          },
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
        required: ["before", "after", "reasons", "job_relevance"],
        properties: {
          before: { type: "string" },
          after: {
            type: "string",
            description:
              "Improved bullet using ONLY facts present in the original. Never change the domain of the work. Never invent metrics. If a metric would help but none exists, end with '(Add a metric if you have one.)'",
          },
          reasons: {
            type: "array",
            description: "2-4 short reasons why the rewrite is better (writing quality only)",
            items: { type: "string" },
          },
          job_relevance: {
            type: "string",
            description:
              "If the bullet does not provide evidence for the target role, state it plainly, e.g. 'This bullet does not provide evidence of software engineering experience.' Empty string if the bullet is relevant to the target role.",
          },
        },
      },
    },
  },
} as const;

const SYSTEM = `You are ResumeRoast, an evidence-based resume-to-job matching engine.

Hard rules:
- NEVER invent skills, experience, projects, achievements, companies, dates or metrics that are not in the resume.
- Every piece of "evidence" must be a quote or close paraphrase of text that actually appears in the resume. If there is none, write "No evidence found in the provided resume."
- A skill listed only in a skills list, with no project or job backing it, is a Partial Match ("Mentioned in skills but no project evidence"), never a Strong Match.
- Statements about gaps describe the DOCUMENT, never the person. Write "No Python experience or evidence was found in the provided resume." Never write "You don't know Python".
- Advice for missing requirements must be conditional: "If you have done X, add it." Never instruct the user to claim something.

BULLET REWRITES:
- Rewrites improve WRITING QUALITY only: clarity, stronger verbs, specificity of what is already stated. Facts, domain and scope must stay identical.
- NEVER transform healthcare into software, administrative into technical, or non-technical into programming work. Never introduce programming languages, tools, APIs, projects, metrics or engineering responsibilities.
- If the bullet is from a different domain than the target role, still improve the wording, and set job_relevance to a plain statement that the bullet does not provide evidence for the target role. Otherwise job_relevance is an empty string.
- If a number would strengthen the bullet and none exists, append "(Add a metric if you have one.)".

SCORING (with a job description):
Extract every important requirement (required skills, required education/certifications, relevant experience, required technical knowledge, job-specific keywords) and map each to resume evidence with status Strong Match / Partial Match / Missing, marking critical=true for must-haves.
Compute the weighted match_score using exactly these weights and report them in score_breakdown:
- Skills match 30%
- Experience relevance 25%
- Evidence strength 20%
- Education 15%
- Keywords 10%
match_score must equal the rounded weighted average of those five category scores (score_breakdown must be internally consistent with match_score, within 2 points).
Scoring discipline:
- Every critical requirement with status Missing must pull the relevant category scores down sharply; if most critical requirements are Missing, match_score must be below 30.
- A keyword or skill-list mention with no supporting evidence counts as Partial at best and contributes little.
- Overlapping generic soft skills, unrelated buzzwords or domain-irrelevant experience must NOT raise the score.
- Never inflate. A resume from a different field targeting this job should score low, and match_summary must say so plainly.

If NO job description is provided: set match_score equal to score, match_summary to an empty string, and leave requirements, missing_requirements and score_breakdown as empty arrays. Still deliver a full resume quality analysis.


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
