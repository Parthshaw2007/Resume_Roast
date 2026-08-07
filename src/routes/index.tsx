import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Tags,
  ArrowRight,
} from "lucide-react";
import { reviewResume, type ReviewResult } from "@/lib/review.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Resume Reviewer — Instant Score & Fixes" },
      {
        name: "description",
        content:
          "Paste your resume and get an instant AI review: ATS score, strengths, weaknesses, missing keywords and rewritten bullet points.",
      },
      { property: "og:title", content: "AI Resume Reviewer — Instant Score & Fixes" },
      {
        property: "og:description",
        content:
          "Get an instant AI resume score with specific fixes, missing keywords and rewritten bullets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function ScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div
      className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(var(--accent) ${clamped * 3.6}deg, var(--muted) 0deg)`,
      }}
    >
      <div className="flex h-[86px] w-[86px] flex-col items-center justify-center rounded-full bg-card">
        <span className="font-display text-2xl font-bold text-foreground">{clamped}</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card p-6">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function Index() {
  const [resume, setResume] = useState("");
  const [role, setRole] = useState("");
  const call = useServerFn(reviewResume);

  const mutation = useMutation<ReviewResult, Error>({
    mutationFn: () => call({ data: { resume, role } }),
  });

  const result = mutation.data;

  return (
    <main className="min-h-screen bg-background">
      <div className="hero-gradient">
        <div className="mx-auto max-w-5xl px-6 py-16 text-primary-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 px-3 py-1 text-xs font-medium uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" /> AI powered
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Get your resume roasted, then fixed.
          </h1>
          <p className="mt-4 max-w-xl text-base text-primary-foreground/80">
            Paste your resume, pick a target role, and get an honest score with concrete rewrites in
            seconds.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-24">
        <div className="-mt-10 surface-card p-6 sm:p-8" style={{ boxShadow: "var(--shadow-lift)" }}>
          <label
            htmlFor="role"
            className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Target role (optional)
          </label>
          <input
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Backend Engineer at a fintech startup"
            className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/40"
          />

          <label
            htmlFor="resume"
            className="mt-6 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Your resume text
          </label>
          <textarea
            id="resume"
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            rows={12}
            placeholder="Paste the full text of your resume here…"
            className="mt-2 w-full resize-y rounded-lg border border-input bg-background px-4 py-3 font-mono text-sm leading-relaxed outline-none transition-shadow focus:ring-2 focus:ring-ring/40"
          />

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || resume.trim().length < 30}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Reviewing…
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" /> Review my resume
                </>
              )}
            </button>
            <span className="text-xs text-muted-foreground">
              {resume.trim().length < 30
                ? "Paste at least a few lines to start."
                : `${resume.trim().split(/\s+/).length} words ready`}
            </span>
          </div>

          {mutation.isError && (
            <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {mutation.error.message}
            </p>
          )}
        </div>

        {result && (
          <div className="mt-10 space-y-6">
            <section className="surface-card flex flex-col items-center gap-6 p-6 sm:flex-row sm:p-8">
              <ScoreRing score={result.score} />
              <div>
                <h2 className="text-xl font-bold">Overall review</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {result.summary}
                </p>
              </div>
            </section>

            <div className="grid gap-6 md:grid-cols-2">
              <Section
                icon={<CheckCircle2 className="h-4 w-4 text-success" />}
                title="What works"
              >
                <ul className="space-y-2 text-sm leading-relaxed">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                      {s}
                    </li>
                  ))}
                </ul>
              </Section>

              <Section
                icon={<AlertTriangle className="h-4 w-4 text-warning" />}
                title="What hurts you"
              >
                <ul className="space-y-2 text-sm leading-relaxed">
                  {result.weaknesses.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                      {s}
                    </li>
                  ))}
                </ul>
              </Section>
            </div>

            <Section icon={<Wrench className="h-4 w-4" />} title="Fix list">
              <div className="space-y-4">
                {result.suggestions.map((s, i) => (
                  <div key={i} className="rounded-lg border border-border bg-muted/40 p-4">
                    <p className="font-display text-sm font-semibold">{s.area}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{s.issue}</p>
                    <p className="mt-2 flex gap-2 text-sm">
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {s.fix}
                    </p>
                  </div>
                ))}
              </div>
            </Section>

            {result.missing_keywords.length > 0 && (
              <Section icon={<Tags className="h-4 w-4" />} title="Missing keywords">
                <div className="flex flex-wrap gap-2">
                  {result.missing_keywords.map((k, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {result.rewritten_bullets.length > 0 && (
              <Section icon={<Sparkles className="h-4 w-4" />} title="Rewritten bullets">
                <div className="space-y-4">
                  {result.rewritten_bullets.map((b, i) => (
                    <div key={i} className="grid gap-3 sm:grid-cols-2">
                      <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground line-through decoration-destructive/50">
                        {b.before}
                      </p>
                      <p className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
                        {b.after}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
