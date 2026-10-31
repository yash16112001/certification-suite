import { supabase } from "@/integrations/supabase/client";

export type CertificateRecord = {
  id: string;
  certificate_id: string;
  student_name: string;
  student_id: string;
  course: string;
  duration: string;
  grade: string;
  centre: string;
  awarded_on: string;
  status: string;
  created_at: string;
  _savedLocallyOnly?: boolean;
  _localReason?: string;
};

export type CertificateInput = {
  student_name: string;
  student_id: string;
  course: string;
  duration: string;
  grade: string;
  centre: string;
  awarded_on: string;
};


// ---- Offline fallback -------------------------------------------------------
// If the Supabase backend is unreachable ("Failed to fetch"), certificates are kept
// in this browser's localStorage so generation, preview and PDF download still work.
const LOCAL_KEY = "certificates:local";

function readLocal(): CertificateRecord[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]") as CertificateRecord[];
  } catch {
    return [];
  }
}

function writeLocal(list: CertificateRecord[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable */
  }
}

export function makeCertificateId() {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TG-${year}-${rand}`;
}

export async function listCertificates() {
  let remote: CertificateRecord[] = [];
  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    remote = (data ?? []) as CertificateRecord[];
  } catch (e) {
    console.warn("Supabase unreachable, showing local certificates only:", e);
  }
  const seen = new Set(remote.map((r) => r.certificate_id));
  const local = readLocal().filter((r) => !seen.has(r.certificate_id));
  return [...local, ...remote].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createCertificate(input: CertificateInput) {
  const certificate_id = makeCertificateId();
  try {
    const { data, error } = await supabase
      .from("certificates")
      .insert({ ...input, certificate_id, status: "valid" })
      .select()
      .single();
    if (error) throw error;
    return { ...(data as CertificateRecord), _savedLocallyOnly: false };
  } catch (e) {
    console.warn("Supabase save failed, saving locally instead:", e);
    const record: CertificateRecord = {
      id: crypto.randomUUID(),
      certificate_id,
      ...input,
      status: "valid",
      created_at: new Date().toISOString(),
    };
    writeLocal([record, ...readLocal()]);
    // Flag this so the UI can warn the user their certificate is NOT in the
    // shared database and its QR code will not verify on other devices.
    const err = e as { message?: string; code?: string; details?: string; hint?: string } | null;
    const reason =
      [err?.message, err?.code && `code ${err.code}`, err?.details, err?.hint]
        .filter(Boolean)
        .join(" | ") || String(e);
    return { ...record, _savedLocallyOnly: true, _localReason: reason };
  }
}

export async function setCertificateStatus(id: string, status: string) {
  const local = readLocal();
  if (local.some((r) => r.id === id)) {
    writeLocal(local.map((r) => (r.id === id ? { ...r, status } : r)));
    return;
  }
  const { error } = await supabase
    .from("certificates")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export async function getCertificateByCertId(certificateId: string) {
  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("certificate_id", certificateId)
      .maybeSingle();
    if (error) throw error;
    if (data) return data as CertificateRecord;
  } catch (e) {
    console.warn("Supabase lookup failed, checking local certificates:", e);
  }
  return readLocal().find((r) => r.certificate_id === certificateId) ?? null;
}
