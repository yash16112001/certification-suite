import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Printer, Eye, Sparkles } from "lucide-react";
import AppShell from "@/components/AppShell";
import CertificateGenerator, { type CertificateData } from "@/components/CertificateGenerator";
import {
  createCertificate,
  getCertificateByCertId,
  type CertificateRecord,
} from "@/lib/certificates";

type Search = { cert?: string | undefined };

type PdfExportStage = "assets" | "capture" | "document" | "download";

class PdfExportError extends Error {
  stage: PdfExportStage;

  constructor(stage: PdfExportStage, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "PdfExportError";
    this.stage = stage;
  }
}

const nextPaint = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

async function waitForCertificateAssets(certificate: HTMLElement) {
  try {
    await document.fonts.ready;
    const images = Array.from(certificate.querySelectorAll("img"));
    await Promise.all(
      images.map(
        (image) =>
          new Promise<void>((resolve, reject) => {
            if (image.complete) {
              if (image.naturalWidth > 0) resolve();
              else reject(new Error(`Image did not load: ${image.alt || "certificate artwork"}`));
              return;
            }

            const timeout = window.setTimeout(
              () => reject(new Error(`Timed out loading: ${image.alt || "certificate artwork"}`)),
              10_000,
            );
            image.addEventListener(
              "load",
              () => {
                window.clearTimeout(timeout);
                resolve();
              },
              { once: true },
            );
            image.addEventListener(
              "error",
              () => {
                window.clearTimeout(timeout);
                reject(new Error(`Image did not load: ${image.alt || "certificate artwork"}`));
              },
              { once: true },
            );
          }),
      ),
    );
    await nextPaint();
  } catch (error) {
    throw new PdfExportError("assets", "Certificate artwork or fonts did not finish loading.", error);
  }
}

async function captureCertificate(certificate: HTMLElement) {
  const { toJpeg } = await import("html-to-image");
  const width = certificate.offsetWidth;
  const height = certificate.offsetHeight;
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise<void>((resolve) => window.setTimeout(resolve, 250));
        await waitForCertificateAssets(certificate);
      }
      return await toJpeg(certificate, {
        backgroundColor: "#ffffff",
        cacheBust: true,
        height,
        pixelRatio: 2,
        quality: 0.98,
        width,
        style: {
          height: `${height}px`,
          transform: "none",
          width: `${width}px`,
        },
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw new PdfExportError("capture", "The complete certificate could not be captured.", lastError);
}

export const Route = createFileRoute("/certificate")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    cert: typeof search['cert'] === "string" ? (search['cert'] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Generate Certificate — TechnoGlobe Certificate Suite" },
      {
        name: "description",
        content:
          "Enter student details and generate a print-ready TechnoGlobe certificate of completion with a QR verification code.",
      },
      { property: "og:title", content: "Generate Certificate — TechnoGlobe" },
      {
        property: "og:description",
        content:
          "Create print-ready TechnoGlobe certificates with live preview, PDF download and QR verification.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CertificatePage,
});

const EMPTY = {
  student_name: "",
  student_id: "",
  course: "",
  duration: "",
  grade: "",
  centre: "",
  awarded_on: "",
};

const fields: Array<{ key: keyof typeof EMPTY; label: string; placeholder: string }> = [
  { key: "student_name", label: "Student Name", placeholder: "Full name of student" },
  { key: "student_id", label: "Student ID", placeholder: "e.g. TG/2026/00845" },
  { key: "course", label: "Course Title", placeholder: "e.g. Full Stack Web Development" },
  { key: "duration", label: "Course Duration", placeholder: "e.g. 6 Months" },
  { key: "grade", label: "Grade", placeholder: "e.g. A+" },
  { key: "centre", label: "Training Centre", placeholder: "e.g. Ahmedabad Centre" },
  { key: "awarded_on", label: "Awarded On", placeholder: "e.g. 12 September 2026" },
];

function toCertificateData(form: typeof EMPTY): CertificateData {
  return {
    name: form.student_name || "Student Name",
    registration: form.student_id || "—",
    course: form.course || "—",
    duration: form.duration || "—",
    grade: form.grade || "—",
    centre: form.centre || "—",
    awarded: form.awarded_on || "—",
  };
}

function CertificatePage() {
  const { cert } = Route.useSearch();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY });
  const [saved, setSaved] = useState<CertificateRecord | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    if (!cert) return;
    getCertificateByCertId(cert).then((record) => {
      if (!record) return;
      setSaved(record);
      setShowPreview(true);
      setForm({
        student_name: record.student_name,
        student_id: record.student_id,
        course: record.course,
        duration: record.duration,
        grade: record.grade,
        centre: record.centre,
        awarded_on: record.awarded_on,
      });
    });
  }, [cert]);

  const data = useMemo(() => toCertificateData(form), [form]);
  const verifyUrl = saved && origin ? `${origin}/verify/${saved.certificate_id}` : undefined;

  const update = (key: keyof typeof EMPTY, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(null);
  };

  const generate = async () => {
    const missing = fields.filter((f) => !form[f.key].trim());
    if (missing.length) {
      toast.error(`Please fill in: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }
    setSaving(true);
    try {
      const record = await createCertificate(form);
      setSaved(record);
      setShowPreview(true);
      await queryClient.invalidateQueries({ queryKey: ["certificates"] });
      if (record._savedLocallyOnly) {
        toast.warning(
          `Certificate ${record.certificate_id} was saved to THIS DEVICE ONLY. Reason: ${record._localReason ?? "unknown error"}`,
          { duration: 20000 },
        );
      } else {
        toast.success(`Certificate ${record.certificate_id} generated and saved to Records.`);
      }
    } catch (error) {
      console.error("Certificate generation failed:", error);
      // Supabase errors are plain objects (not Error instances), so read message/code/hint generically.
      const e = error as { message?: string; code?: string; details?: string; hint?: string } | null;
      const parts = [e?.message, e?.code && `code ${e.code}`, e?.details, e?.hint].filter(Boolean);
      const detail = parts.length ? ` (${parts.join(" | ")})` : "";
      toast.error(`Could not save the certificate. Please try again.${detail}`);
    } finally {
      setSaving(false);
    }
  };

  const print = () => {
    if (!showPreview) {
      toast.error("Generate or preview the certificate first.");
      return;
    }
    window.print();
  };

  const downloadPdf = async () => {
    if (!showPreview) {
      toast.error("Generate or preview the certificate first.");
      return;
    }

    const certificate = document.getElementById("certificate");
    if (!certificate) {
      toast.error("The certificate preview is not ready yet.");
      return;
    }

    setDownloading(true);
    try {
      await waitForCertificateAssets(certificate);
      const [{ jsPDF }, certificateImage] = await Promise.all([
        import("jspdf"),
        captureCertificate(certificate),
      ]);
      const pageWrap = document.getElementById("pageWrap");
      const previousTransform = pageWrap?.style.transform ?? "";
      if (pageWrap) pageWrap.style.transform = "none";
      try {
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        pdf.addImage(certificateImage, "JPEG", 0, 0, 210, 297, undefined, "FAST");
        const fileName = `${saved?.certificate_id ?? form.student_id ?? "certificate"}.pdf`;
        const pdfBuffer = pdf.output("arraybuffer");
        if (!pdfBuffer.byteLength) {
          throw new PdfExportError("document", "The PDF document was empty.");
        }

        const objectUrl = URL.createObjectURL(new Blob([pdfBuffer], { type: "application/pdf" }));
        try {
          const link = document.createElement("a");
          link.href = objectUrl;
          link.download = fileName;
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          link.remove();
        } catch (error) {
          throw new PdfExportError("download", "The browser could not start the PDF download.", error);
        } finally {
          window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
        }
      } finally {
        if (pageWrap) pageWrap.style.transform = previousTransform;
      }
    } catch (error) {
      console.error("Certificate PDF export failed", error);
      if (error instanceof PdfExportError) {
        const messages: Record<PdfExportStage, string> = {
          assets: "Certificate artwork or QR code did not finish loading. Please try again.",
          capture: "The complete certificate could not be captured after two attempts.",
          document: "The certificate was captured, but the PDF document could not be created.",
          download: "The PDF was created, but the browser could not start the download.",
        };
        toast.error(messages[error.stage]);
      } else {
        toast.error("PDF export failed unexpectedly. Please reload the page and try again.");
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AppShell
      title="Certificate"
      description="Fill in the student details and generate an official certificate."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(320px,420px)_1fr]">
        <div className="no-print rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">Student Details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            {fields.map((f) => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label
                  htmlFor={f.key}
                  className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
                >
                  {f.label}
                </label>
                <input
                  id={f.key}
                  value={form[f.key]}
                  placeholder={f.placeholder}
                  onChange={(e) => update(f.key, e.target.value)}
                  className="rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/15"
                />
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={generate}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              <Sparkles className="size-4" />
              {saving ? "Generating…" : "Generate Certificate"}
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition hover:bg-accent"
            >
              <Eye className="size-4" /> Preview Certificate
            </button>
            <button
              onClick={downloadPdf}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition hover:bg-accent"
            >
              <Download className="size-4" /> {downloading ? "Preparing PDF…" : "Download PDF"}
            </button>
            <button
              onClick={print}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition hover:bg-accent"
            >
              <Printer className="size-4" /> Print Certificate
            </button>
          </div>

          {saved ? (
            <p className="mt-4 rounded-lg bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground">
              Saved as <span className="font-semibold text-foreground">{saved.certificate_id}</span>.
              The QR code on the certificate opens{" "}
              <span className="font-medium">/verify/{saved.certificate_id}</span>.
            </p>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">
              Generate the certificate to store it in Records and add its QR verification code.
            </p>
          )}
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          {showPreview ? (
            <CertificateGenerator
              data={data}
              certificateId={saved?.certificate_id}
              verifyUrl={verifyUrl}
            />
          ) : (
            <p className="no-print py-20 text-center text-sm text-muted-foreground">
              Fill in the details and press Preview Certificate.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
