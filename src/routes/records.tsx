import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Search, Eye, Download, Printer, Ban } from "lucide-react";
import AppShell from "@/components/AppShell";
import { listCertificates, setCertificateStatus } from "@/lib/certificates";

export const Route = createFileRoute("/records")({
  head: () => ({
    meta: [
      { title: "Records — TechnoGlobe Certificate Suite" },
      {
        name: "description",
        content:
          "Search every certificate issued by TechnoGlobe, view verification pages, reprint copies and revoke certificates.",
      },
      { property: "og:title", content: "Records — TechnoGlobe Certificate Suite" },
      {
        property: "og:description",
        content:
          "Searchable archive of every TechnoGlobe certificate with view, print and revoke actions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RecordsPage,
});

function RecordsPage() {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["certificates"],
    queryFn: listCertificates,
  });

  const q = term.trim().toLowerCase();
  const rows = q
    ? data.filter((c) =>
        [
          c.certificate_id,
          c.student_name,
          c.student_id,
          c.course,
          c.grade,
          c.centre,
          c.awarded_on,
          c.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    : data;

  const revoke = async (id: string, label: string) => {
    try {
      await setCertificateStatus(id, "revoked");
      await queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast.success(`Certificate ${label} revoked.`);
    } catch {
      toast.error("Could not revoke this certificate.");
    }
  };

  const open = (certificateId: string) => {
    navigate({ to: "/certificate", search: { cert: certificateId } });
  };

  return (
    <AppShell title="Records" description="Every certificate generated is stored here.">
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <h2 className="text-base font-semibold">
            Certificate Records{" "}
            <span className="text-sm font-normal text-muted-foreground">({rows.length})</span>
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search name, ID, course…"
              className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {[
                  "Certificate ID",
                  "Student Name",
                  "Student ID",
                  "Course",
                  "Grade",
                  "Training Centre",
                  "Awarded On",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                    Loading records…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                    No certificates found.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/40">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                      {c.certificate_id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">{c.student_name}</td>
                    <td className="whitespace-nowrap px-4 py-3">{c.student_id}</td>
                    <td className="px-4 py-3">{c.course}</td>
                    <td className="px-4 py-3">{c.grade}</td>
                    <td className="whitespace-nowrap px-4 py-3">{c.centre}</td>
                    <td className="whitespace-nowrap px-4 py-3">{c.awarded_on}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          c.status === "valid"
                            ? "bg-primary/10 text-primary"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {c.status === "valid" ? "Valid" : "Revoked"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-1">
                        <a
                          href={`/verify/${c.certificate_id}`}
                          target="_blank"
                          rel="noreferrer"
                          title="View verification page"
                          className="rounded-md p-1.5 hover:bg-accent"
                        >
                          <Eye className="size-4" />
                        </a>
                        <button
                          title="Download PDF"
                          onClick={() => open(c.certificate_id)}
                          className="rounded-md p-1.5 hover:bg-accent"
                        >
                          <Download className="size-4" />
                        </button>
                        <button
                          title="Print certificate"
                          onClick={() => open(c.certificate_id)}
                          className="rounded-md p-1.5 hover:bg-accent"
                        >
                          <Printer className="size-4" />
                        </button>
                        <button
                          title="Revoke certificate"
                          disabled={c.status !== "valid"}
                          onClick={() => revoke(c.id, c.certificate_id)}
                          className="rounded-md p-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-40 disabled:hover:bg-transparent"
                        >
                          <Ban className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
