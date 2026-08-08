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
  ClipboardCheck,
  Copy,
  Gauge,
  ScanLine,
  PenLine,
  RotateCcw,
  Upload,
  Target,
  Search,
  MessageSquare,
  XCircle,
  BookmarkPlus,
} from "lucide-react";
import { reviewResume, type ReviewResult } from "@/lib/review.functions";
import { ApplicationTracker, addApplication } from "@/components/ApplicationTracker";


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

const SAMPLE = `Aarav Sharma — Software Engineer
Bengaluru, India | aarav.sharma@email.com | github.com/aaravsh

EXPERIENCE
Software Engineer, PayNest (2022 - Present)
- Worked on the payments backend and fixed many bugs.
- Helped the team migrate services to a new architecture.
- Responsible for writing APIs used by the mobile app.

Junior Developer, Cloudwing (2020 - 2022)
- Built internal dashboards using React.
- Assisted senior developers with code reviews and testing.

SKILLS
Java, Spring Boot, React, MySQL, Git, Docker

EDUCATION
B.Tech Computer Science, VIT Vellore, 2020`;

const STEPS = [
  {
    icon: PenLine,
    title: "Paste it in",
    body: "Add your resume text and target role — no signup, no upload required.",
  },
  {
    icon: ScanLine,
    title: "AI scans it",
    body: "ATS keywords, impact metrics, clarity and relevance are checked line by line.",
  },
  {
    icon: Gauge,
    title: "Score + fixes",
    body: "An honest score, a list of weak spots and ready-to-paste rewritten bullets.",
  },
];

function ScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div
      className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(var(--accent) ${clamped * 3.6}deg, var(--muted) 0deg)`,
      }}
    >
      <div className="flex h-[104px] w-[104px] flex-col items-center justify-center rounded-full bg-card">
        <span className="font-display text-3xl font-bold text-foreground">{clamped}</span>
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
    <section className="surface-card rise-in p-6">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {done ? <ClipboardCheck className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
      {done ? "Copied" : label}
    </button>
  );
}

function Index() {
  const [resume, setResume] = useState("");
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");
  const [company, setCompany] = useState("");
  const [saved, setSaved] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const call = useServerFn(reviewResume);

  const mutation = useMutation<ReviewResult, Error>({
    mutationFn: () => call({ data: { resume, role, jobDescription: jd } }),
    onMutate: () => setSaved(false),
  });


  const result = mutation.data;
  const words = resume.trim() ? resume.trim().split(/\s+/).length : 0;

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <a href="/" className="flex items-center gap-2 font-display text-sm font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <FileText className="h-4 w-4" />
            </span>
            ResumeRoast
          </a>
          <a
            href="#review"
            className="text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            Review now
          </a>
        </div>
      </header>

      <div className="hero-gradient">
        <div className="grid-veil">
          <div className="mx-auto max-w-5xl px-6 py-20 text-primary-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 px-3 py-1 text-xs font-medium uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5" /> AI powered
            </span>
            <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
              Get your resume roasted, then fixed.
            </h1>
            <p className="mt-4 max-w-xl text-base text-primary-foreground/80">
              Paste your resume, pick a target role, and get an honest score with concrete rewrites
              in seconds.
            </p>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-primary-foreground/20 pt-6">
              {[
                ["~20s", "Average review"],
                ["7", "Checks per resume"],
                ["0", "Signups needed"],
              ].map(([v, k]) => (
                <div key={k}>
                  <dt className="font-display text-2xl font-bold">{v}</dt>
                  <dd className="text-xs uppercase tracking-widest text-primary-foreground/70">
                    {k}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-24">
        <div
          id="review"
          className="-mt-10 surface-card scroll-mt-20 p-6 sm:p-8"
          style={{ boxShadow: "var(--shadow-lift)" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label
              htmlFor="role"
              className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Target role (optional)
            </label>
            <button
              type="button"
              onClick={() => {
                setResume(SAMPLE);
                setRole("Backend Engineer at a fintech startup");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline-offset-4 hover:underline"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Try a sample resume
            </button>
          </div>
          <input
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Backend Engineer at a fintech startup"
            className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/40"
          />

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <label
              htmlFor="resume"
              className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Your resume text
            </label>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-secondary">
              {pdfLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {pdfLoading ? "Reading PDF…" : "Upload PDF"}
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  setPdfError(null);
                  setPdfLoading(true);
                  try {
                    const { extractPdfText } = await import("@/lib/pdf-text");
                    const text = await extractPdfText(file);
                    if (text.length < 30) {
                      setPdfError(
                        "No text found in this PDF (it may be a scanned image). Please paste the text instead.",
                      );
                    } else {
                      setResume(text);
                      setPdfName(file.name);
                    }
                  } catch {
                    setPdfError("Could not read the PDF. Try another file or paste the text.");
                  } finally {
                    setPdfLoading(false);
                  }
                }}
              />
            </label>
          </div>
          <textarea
            id="resume"
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            rows={12}
            placeholder="Paste the full text of your resume here… or upload a PDF above"
            className="mt-2 w-full resize-y rounded-lg border border-input bg-background px-4 py-3 font-mono text-sm leading-relaxed outline-none transition-shadow focus:ring-2 focus:ring-ring/40"
          />
          {pdfName && !pdfError && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" /> Imported from {pdfName}
            </p>
          )}
          {pdfError && (
            <p className="mt-2 text-xs text-destructive">{pdfError}</p>
          )}


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
                : `${words} words ready`}
            </span>
          </div>

          {mutation.isPending && (
            <div className="mt-6 space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-3 animate-pulse rounded-full bg-muted"
                  style={{ width: `${90 - i * 18}%` }}
                />
              ))}
              <p className="text-xs text-muted-foreground">
                AI is reading your resume line by line…
              </p>
            </div>
          )}

          {mutation.isError && (
            <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {mutation.error.message}
            </p>
          )}
        </div>

        {!result && !mutation.isPending && (
          <section className="mt-14">
            <h2 className="text-center font-display text-2xl font-bold">How it works</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <div key={s.title} className="surface-card p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                      <s.icon className="h-4 w-4" />
                    </span>
                    <span className="font-display text-3xl font-bold text-muted-foreground/25">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {result && (
          <div className="mt-10 space-y-6">
            <section className="surface-card rise-in flex flex-col items-center gap-6 p-6 sm:flex-row sm:p-8">
              <ScoreRing score={result.score} />
              <div>
                <h2 className="text-xl font-bold">Overall review</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {result.summary}
                </p>
              </div>
            </section>

            <div className="grid gap-6 md:grid-cols-2">
              <Section icon={<CheckCircle2 className="h-4 w-4 text-success" />} title="What works">
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
                <div className="flex flex-wrap items-center gap-2">
                  {result.missing_keywords.map((k, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                    >
                      {k}
                    </span>
                  ))}
                  <CopyButton text={result.missing_keywords.join(", ")} label="Copy all" />
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
                      <div className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
                        <p>{b.after}</p>
                        <div className="mt-2">
                          <CopyButton text={b.after} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <div className="flex justify-center pt-2">
              <button
                onClick={() => mutation.reset()}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary"
              >
                <RotateCcw className="h-4 w-4" /> Review another resume
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-border bg-secondary/40">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 py-8 text-xs text-muted-foreground sm:flex-row">
          <p>ResumeRoast — honest feedback, zero fluff.</p>
          <p>Your resume text is never stored.</p>
        </div>
      </footer>
    </main>
  );
}
