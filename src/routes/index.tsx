import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
  ShieldCheck,
  MinusCircle,
  Circle,
  ListChecks,
} from "lucide-react";
import { reviewResume, type ReviewResult, type ReqStatus } from "@/lib/review.functions";
import { ApplicationTracker, addApplication } from "@/components/ApplicationTracker";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResumeRoast — Evidence-Based Resume to Job Matching" },
      {
        name: "description",
        content:
          "Paste your resume and a job description to see a job match score, requirement-by-requirement evidence from your resume, missing requirements and honest bullet rewrites.",
      },
      { property: "og:title", content: "ResumeRoast — Evidence-Based Resume to Job Matching" },
      {
        property: "og:description",
        content:
          "See exactly how well your resume matches the job — and where your resume lacks evidence.",
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
    title: "Add resume + job",
    body: "Paste or upload your resume, then paste the job description you're targeting.",
  },
  {
    icon: ScanLine,
    title: "Requirements matched",
    body: "Every requirement in the job post is checked against real evidence in your resume.",
  },
  {
    icon: Gauge,
    title: "Match score + fixes",
    body: "A job match score, missing requirements and honest bullet rewrites — no invented facts.",
  },
];

const LOADING_STEPS = [
  "Reading resume",
  "Extracting skills",
  "Analyzing job requirements",
  "Comparing resume evidence",
  "Finding missing requirements",
  "Generating improvements",
];

function ScoreRing({ score, size = "md" }: { score: number; size?: "md" | "lg" }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const outer = size === "lg" ? "h-40 w-40" : "h-32 w-32";
  const inner = size === "lg" ? "h-[132px] w-[132px]" : "h-[104px] w-[104px]";
  return (
    <div
      className={`relative flex ${outer} shrink-0 items-center justify-center rounded-full`}
      style={{
        background: `conic-gradient(var(--accent) ${clamped * 3.6}deg, var(--muted) 0deg)`,
      }}
    >
      <div
        className={`flex ${inner} flex-col items-center justify-center rounded-full bg-card`}
      >
        <span
          className={`font-display font-bold text-foreground ${size === "lg" ? "text-5xl" : "text-3xl"}`}
        >
          {clamped}
          <span className="text-xl">%</span>
        </span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {size === "lg" ? "Job match" : "/ 100"}
        </span>
      </div>
    </div>
  );
}

function MeterCard({
  label,
  value,
  primary = false,
}: {
  label: string;
  value: number;
  primary?: boolean;
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={`rounded-xl border p-4 ${
        primary ? "border-accent/50 bg-accent/10" : "border-border bg-muted/40"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-bold">{v}%</p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full ${primary ? "bg-accent" : "bg-primary"}`}
          style={{ width: `${v}%` }}
        />
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
      {done ? (
        <ClipboardCheck className="h-3.5 w-3.5 text-success" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {done ? "Copied" : label}
    </button>
  );
}

const STATUS_STYLE: Record<ReqStatus, { chip: string; icon: React.ReactNode }> = {
  "Strong Match": {
    chip: "border-success/40 bg-success/15 text-success",
    icon: <CheckCircle2 className="h-4 w-4 text-success" />,
  },
  "Partial Match": {
    chip: "border-warning/40 bg-warning/15 text-warning",
    icon: <MinusCircle className="h-4 w-4 text-warning" />,
  },
  Missing: {
    chip: "border-destructive/30 bg-destructive/10 text-destructive",
    icon: <XCircle className="h-4 w-4 text-destructive" />,
  },
};

function StatusChip({ status }: { status: ReqStatus }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE["Partial Match"];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${s.chip}`}
    >
      {s.icon}
      {status}
    </span>
  );
}

function LoadingSteps() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)),
      3500,
    );
    return () => clearInterval(id);
  }, []);
  return (
    <div className="mt-6 rounded-xl border border-border bg-muted/40 p-5">
      <ul className="space-y-2.5">
        {LOADING_STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2.5 text-sm">
            {i < step ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : i === step ? (
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/40" />
            )}
            <span className={i <= step ? "text-foreground" : "text-muted-foreground"}>
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SafetyNote() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-4">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          AI safety check
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          ResumeRoast bases its suggestions on information found in your resume. It does not invent
          skills, experience, projects, achievements, or metrics.
        </p>
      </div>
    </div>
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
  const hasJd = jd.trim().length > 0;
  const reqs = result?.requirements ?? [];
  const strong = reqs.filter((r) => r.status === "Strong Match").length;
  const partial = reqs.filter((r) => r.status === "Partial Match").length;
  const missing = reqs.filter((r) => r.status === "Missing").length;

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
            Analyze now
          </a>
        </div>
      </header>

      <div className="hero-gradient">
        <div className="grid-veil">
          <div className="mx-auto max-w-5xl px-6 py-20 text-primary-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 px-3 py-1 text-xs font-medium uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5" /> Evidence-based matching
            </span>
            <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
              Get your resume roasted, then fixed.
            </h1>
            <p className="mt-4 max-w-xl text-base text-primary-foreground/80">
              See exactly how well your resume matches the job—and where your resume lacks evidence.
            </p>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-primary-foreground/20 pt-6">
              {[
                ["~20s", "Average analysis"],
                ["6", "Scores per resume"],
                ["0", "Invented facts"],
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
              Target role
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

          <div className="mt-6">
            <label
              htmlFor="company"
              className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Company (optional)
            </label>
            <input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. PayNest"
              className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/40"
            />
          </div>

          <div className="mt-6 rounded-xl border border-accent/40 bg-accent/5 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="jd"
                className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Job description
              </label>
              <span className="rounded-full border border-accent/50 bg-accent/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent-foreground">
                Recommended
              </span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Job match and requirement-level evidence analysis only work with a job description.
            </p>
            <textarea
              id="jd"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              rows={6}
              placeholder="Paste the full job description here to compare your resume against it…"
              className="mt-3 w-full resize-y rounded-lg border border-input bg-background px-4 py-3 text-sm leading-relaxed outline-none transition-shadow focus:ring-2 focus:ring-ring/40"
            />
          </div>

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
          {pdfError && <p className="mt-2 text-xs text-destructive">{pdfError}</p>}

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || resume.trim().length < 30}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  <Target className="h-4 w-4" /> Analyze My Resume
                </>
              )}
            </button>
            <span className="text-xs text-muted-foreground">
              {resume.trim().length < 30
                ? "Paste at least a few lines to start."
                : `${words} words ready`}
            </span>
          </div>

          {mutation.isPending && <LoadingSteps />}

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
            <div className="mt-8">
              <SafetyNote />
            </div>
          </section>
        )}

        {result && (
          <div className="mt-10 space-y-6">
            {hasJd ? (
              <section
                className="surface-card p-6 sm:p-8"
                style={{ boxShadow: "var(--shadow-lift)" }}
              >
                <div className="flex flex-col items-center gap-7 sm:flex-row sm:items-start">
                  <div className="text-center">
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Job match
                    </p>
                    <ScoreRing score={result.match_score} size="lg" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-xl font-bold">
                      {company.trim() ? `${company.trim()} — ` : ""}
                      {role.trim() || "Target role"}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {result.match_summary || result.summary}
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        ["Strong matches", strong, "text-success"],
                        ["Partial matches", partial, "text-warning"],
                        ["Missing", missing, "text-destructive"],
                        [
                          "Evidence strength",
                          `${Math.round(result.subscores?.evidence_strength ?? 0)}%`,
                          "text-foreground",
                        ],
                      ].map(([label, value, color]) => (
                        <div
                          key={String(label)}
                          className="rounded-lg border border-border bg-muted/40 p-3"
                        >
                          <p className={`font-display text-xl font-bold ${color as string}`}>
                            {value as string | number}
                          </p>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            {label as string}
                          </p>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={saved}
                      onClick={() => {
                        addApplication({
                          company: company.trim() || "Untitled company",
                          role: role.trim(),
                          status: "Applied",
                          matchScore: result.match_score,
                        });
                        setSaved(true);
                      }}
                      className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:bg-secondary disabled:opacity-60"
                    >
                      <BookmarkPlus className="h-4 w-4" />
                      {saved ? "Saved to tracker" : "Save to tracker"}
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              <section className="surface-card flex flex-col items-center gap-6 p-6 sm:flex-row sm:p-8">
                <ScoreRing score={result.score} />
                <div>
                  <h2 className="text-xl font-bold">Resume quality</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {result.summary}
                  </p>
                  <p className="mt-4 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
                    Add a Job Description to unlock Job Match and requirement-level evidence
                    analysis.
                  </p>
                </div>
              </section>
            )}

            <Section icon={<Gauge className="h-4 w-4" />} title="Score dashboard">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {hasJd && <MeterCard label="Job match" value={result.match_score} primary />}
                <MeterCard label="Skills match" value={result.subscores?.skills_match ?? 0} />
                <MeterCard label="Keyword match" value={result.subscores?.keyword_match ?? 0} />
                <MeterCard
                  label="Experience relevance"
                  value={result.subscores?.experience_relevance ?? 0}
                />
                <MeterCard label="Education" value={result.subscores?.education_match ?? 0} />
                <MeterCard
                  label="Evidence strength"
                  value={result.subscores?.evidence_strength ?? 0}
                />
                <MeterCard label="Resume clarity" value={result.subscores?.resume_clarity ?? 0} />
                {!hasJd && <MeterCard label="Resume quality" value={result.score} primary />}
              </div>
              {hasJd && (
                <ScoreBreakdown
                  breakdown={result.score_breakdown ?? []}
                  matchScore={result.match_score}
                />
              )}
            </Section>

            {reqs.length > 0 && (
              <Section
                icon={<ListChecks className="h-4 w-4" />}
                title="Job requirements vs resume evidence"
              >
                <p className="-mt-2 mb-3 text-xs text-muted-foreground">
                  Tap a requirement to see the resume evidence and why it was classified this way.
                </p>
                <div className="space-y-2">
                  {reqs.map((r, i) => (
                    <RequirementCard key={i} req={r} />
                  ))}
                </div>
              </Section>
            )}

            {result.missing_requirements?.length > 0 && (
              <Section
                icon={<XCircle className="h-4 w-4 text-destructive" />}
                title="Missing from your resume"
              >
                <div className="space-y-3">
                  {result.missing_requirements.map((m, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-destructive/25 bg-destructive/5 p-4"
                    >
                      <p className="text-sm font-semibold">{m.requirement}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">The job asks for: </span>
                        {m.job_asks}
                      </p>
                      {m.finding && (
                        <p className="mt-1.5 text-sm italic text-muted-foreground">{m.finding}</p>
                      )}
                      <p className="mt-2 flex gap-2 text-sm">
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        {m.advice}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {result.evidence.length > 0 && (
              <Section icon={<Search className="h-4 w-4" />} title="Skill evidence">
                <div className="space-y-3">
                  {result.evidence.map((e, i) => (
                    <div
                      key={i}
                      className="flex gap-3 rounded-lg border border-border bg-muted/40 p-4"
                    >
                      {e.found ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      ) : (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                      )}
                      <div>
                        <p className="text-sm font-semibold">{e.skill}</p>
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">
                          {e.section}
                        </p>
                        {e.quote && (
                          <p className="mt-2 border-l-2 border-accent/50 pl-3 text-sm italic text-muted-foreground">
                            “{e.quote}”
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

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
              <Section icon={<Sparkles className="h-4 w-4" />} title="Bullet improvements">
                <div className="space-y-5">
                  {result.rewritten_bullets.map((b, i) => (
                    <div key={i} className="rounded-lg border border-border p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Before
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{b.before}</p>
                      <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-accent-foreground">
                        After
                      </p>
                      <div className="mt-1 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
                        <p>{b.after}</p>
                        <div className="mt-2">
                          <CopyButton text={b.after} />
                        </div>
                      </div>
                      {b.reasons?.length > 0 && (
                        <>
                          <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Writing quality — why this is better
                          </p>
                          <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                            {b.reasons.map((r, j) => (
                              <li key={j} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      {b.job_relevance?.trim() && (
                        <div className="mt-4 flex gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              Job relevance
                            </p>
                            <p className="mt-0.5 text-sm">{b.job_relevance}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {result.interview_questions.length > 0 && (
              <Section
                icon={<MessageSquare className="h-4 w-4" />}
                title="Interview questions to expect"
              >
                <ol className="space-y-3">
                  {result.interview_questions.map((q, i) => (
                    <li key={i} className="rounded-lg border border-border bg-muted/40 p-4">
                      <p className="text-sm font-semibold">
                        {i + 1}. {q.question}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{q.why}</p>
                    </li>
                  ))}
                </ol>
                <div className="mt-4">
                  <CopyButton
                    text={result.interview_questions
                      .map((q, i) => `${i + 1}. ${q.question}`)
                      .join("\n")}
                    label="Copy all questions"
                  />
                </div>
              </Section>
            )}

            <SafetyNote />

            <div className="flex justify-center pt-2">
              <button
                onClick={() => mutation.reset()}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary"
              >
                <RotateCcw className="h-4 w-4" /> Analyze another resume
              </button>
            </div>
          </div>
        )}

        <div className="mt-14">
          <ApplicationTracker />
        </div>
      </div>

      <footer className="border-t border-border bg-secondary/40">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 py-8 text-xs text-muted-foreground sm:flex-row">
          <p>ResumeRoast — proof, not guesswork.</p>
          <p>Your resume text is never stored.</p>
        </div>
      </footer>
    </main>
  );
}
