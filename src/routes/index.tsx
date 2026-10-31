import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, Users, CalendarCheck, ShieldCheck, Plus } from "lucide-react";
import AppShell from "@/components/AppShell";
import { listCertificates } from "@/lib/certificates";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — TechnoGlobe Certificate Suite" },
      {
        name: "description",
        content:
          "Track total certificates issued, students enrolled and certificates generated today from the TechnoGlobe certificate dashboard.",
      },
      { property: "og:title", content: "Dashboard — TechnoGlobe Certificate Suite" },
      {
        property: "og:description",
        content:
          "Track certificates issued, students and today's activity from the TechnoGlobe certificate dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof Award;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4.5" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function DashboardPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["certificates"],
    queryFn: listCertificates,
  });

  const today = new Date().toDateString();
  const generatedToday = data.filter(
    (c) => new Date(c.created_at).toDateString() === today,
  ).length;
  const students = new Set(data.map((c) => c.student_id.trim().toLowerCase())).size;
  const valid = data.filter((c) => c.status === "valid").length;
  const recent = data.slice(0, 6);

  return (
    <AppShell
      title="Dashboard"
      description="Overview of all certificates issued by TechnoGlobe."
      actions={
        <Link
          to="/certificate"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" /> Generate Certificate
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Certificates" value={isLoading ? "—" : data.length} icon={Award} />
        <StatCard label="Total Students" value={isLoading ? "—" : students} icon={Users} />
        <StatCard
          label="Generated Today"
          value={isLoading ? "—" : generatedToday}
          icon={CalendarCheck}
        />
        <StatCard label="Active / Valid" value={isLoading ? "—" : valid} icon={ShieldCheck} />
      </div>

      <div className="mt-6 rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold">Recent Certificates</h2>
          <Link to="/records" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>

        {isLoading ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">Loading…</p>
        ) : recent.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">
            No certificates yet. Generate your first certificate to see it here.
          </p>
        ) : (
          <ul className="divide-y">
            {recent.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold">{c.student_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.course} · {c.certificate_id}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{c.awarded_on}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      c.status === "valid"
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {c.status === "valid" ? "Valid" : "Revoked"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
