import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, ShieldX, SearchX, Award } from "lucide-react";
import { getCertificateByCertId } from "@/lib/certificates";

export const Route = createFileRoute("/verify/$certificateId")({
  head: () => ({
    meta: [
      { title: "Certificate Verification — TechnoGlobe" },
      {
        name: "description",
        content:
          "Check the authenticity of a TechnoGlobe certificate. Scan or enter a certificate ID to see its status and details.",
      },
      { property: "og:title", content: "Certificate Verification — TechnoGlobe" },
      {
        property: "og:description",
        content: "Public verification of TechnoGlobe certificates of completion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerifyPage,
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function VerifyPage() {
  const { certificateId } = Route.useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["verify", certificateId],
    queryFn: () => getCertificateByCertId(certificateId),
  });

  const status = isLoading || isError ? null : data ? data.status : "missing";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Award className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight">TechnoGlobe</p>
            <p className="text-[11px] text-muted-foreground">Certificate Verification</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          {isLoading ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              Checking certificate…
            </p>
          ) : (
            <>
              <div
                className={`flex items-center gap-3 px-6 py-5 ${
                  status === "valid"
                    ? "bg-primary/10 text-primary"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {status === "valid" ? (
                  <ShieldCheck className="size-7" />
                ) : status === "revoked" ? (
                  <ShieldX className="size-7" />
                ) : (
                  <SearchX className="size-7" />
                )}
                <div>
                  <p className="text-lg font-bold tracking-tight">
                    {status === "valid"
                      ? "CERTIFICATE VERIFIED"
                      : status === "revoked"
                        ? "CERTIFICATE REVOKED"
                        : "CERTIFICATE NOT FOUND"}
                  </p>
                  <p className="text-xs opacity-80">
                    {status === "valid"
                      ? "This certificate is authentic and currently valid."
                      : status === "revoked"
                        ? "This certificate has been revoked by TechnoGlobe."
                        : `No certificate matches the ID ${certificateId}.`}
                  </p>
                </div>
              </div>

              {data ? (
                <div className="px-6 py-2">
                  <Row label="Certificate ID" value={data.certificate_id} />
                  <Row label="Student Name" value={data.student_name} />
                  <Row label="Course" value={data.course} />
                  <Row label="Course Duration" value={data.duration} />
                  <Row label="Grade" value={data.grade} />
                  <Row label="Training Centre" value={data.centre} />
                  <Row label="Awarded On" value={data.awarded_on} />
                  <Row
                    label="Certificate Status"
                    value={data.status === "valid" ? "Valid" : "Revoked"}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Verification is public — no sign-in required.
        </p>
      </div>
    </div>
  );
}
