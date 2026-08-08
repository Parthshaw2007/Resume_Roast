import { useEffect, useState } from "react";
import { Briefcase, Plus, Trash2 } from "lucide-react";

export type AppStatus = "Applied" | "Interview" | "Rejected" | "Selected";

export type Application = {
  id: string;
  company: string;
  role: string;
  status: AppStatus;
  matchScore: number | null;
  createdAt: string;
};

const STATUSES: AppStatus[] = ["Applied", "Interview", "Rejected", "Selected"];
const KEY = "resumeroast.applications";

const statusClass: Record<AppStatus, string> = {
  Applied: "bg-secondary text-secondary-foreground border-border",
  Interview: "bg-warning/15 text-warning border-warning/40",
  Rejected: "bg-destructive/10 text-destructive border-destructive/30",
  Selected: "bg-success/15 text-success border-success/40",
};

export function loadApplications(): Application[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Application[]) : [];
  } catch {
    return [];
  }
}

export function saveApplications(apps: Application[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(apps));
  } catch {
    /* ignore */
  }
}

export function addApplication(app: Omit<Application, "id" | "createdAt">) {
  const apps = loadApplications();
  const next: Application[] = [
    { ...app, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
    ...apps,
  ];
  saveApplications(next);
  window.dispatchEvent(new Event("applications-updated"));
  return next;
}

export function ApplicationTracker() {
  const [apps, setApps] = useState<Application[]>([]);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    setApps(loadApplications());
    const sync = () => setApps(loadApplications());
    window.addEventListener("applications-updated", sync);
    return () => window.removeEventListener("applications-updated", sync);
  }, []);

  const update = (next: Application[]) => {
    setApps(next);
    saveApplications(next);
  };

  return (
    <section className="surface-card p-6">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        <Briefcase className="h-4 w-4" />
        Application tracker
      </h3>

      <div className="flex flex-wrap gap-2">
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company"
          className="min-w-[140px] flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Role"
          className="min-w-[140px] flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
        <button
          type="button"
          disabled={!company.trim()}
          onClick={() => {
            update([
              {
                id: crypto.randomUUID(),
                company: company.trim(),
                role: role.trim(),
                status: "Applied",
                matchScore: null,
                createdAt: new Date().toISOString(),
              },
              ...apps,
            ]);
            setCompany("");
            setRole("");
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {apps.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No applications tracked yet. Add one above, or save a review to the tracker.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {apps.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 p-3"
            >
              <div className="min-w-[120px] flex-1">
                <p className="text-sm font-semibold">{a.company}</p>
                <p className="text-xs text-muted-foreground">
                  {a.role || "Role not set"}
                  {a.matchScore !== null && ` · ${Math.round(a.matchScore)}% match`}
                </p>
              </div>
              <select
                value={a.status}
                onChange={(e) =>
                  update(
                    apps.map((x) =>
                      x.id === a.id ? { ...x, status: e.target.value as AppStatus } : x,
                    ),
                  )
                }
                className={`rounded-full border px-3 py-1 text-xs font-semibold outline-none ${statusClass[a.status]}`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => update(apps.filter((x) => x.id !== a.id))}
                className="text-muted-foreground transition-colors hover:text-destructive"
                aria-label={`Remove ${a.company}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
