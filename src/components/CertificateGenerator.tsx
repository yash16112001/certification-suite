import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import certificateTemplate from "@/assets/certificate-template.jpg";
import "./certificate.css";

export type CertificateData = {
  name: string;
  registration: string;
  course: string;
  duration: string;
  grade: string;
  centre: string;
  awarded: string;
};

export const SAMPLE: CertificateData = {
  name: "Priya Sharma",
  registration: "TG/2026/00845",
  course: "Full Stack Web Development",
  duration: "6 Months",
  grade: "A+",
  centre: "Ahmedabad Centre",
  awarded: "12 September 2026",
};

const bindings: Array<[keyof CertificateData, string]> = [
  ["name", "ov-name"],
  ["registration", "ov-reg"],
  ["course", "ov-course"],
  ["duration", "ov-duration"],
  ["grade", "ov-grade"],
  ["centre", "ov-centre"],
  ["awarded", "ov-awarded"],
];

function fitText(el: HTMLElement, baseSizeMm: number, minSizeMm: number) {
  el.style.fontSize = `${baseSizeMm}mm`;
  let size = baseSizeMm;
  let guard = 0;

  while (el.scrollWidth > el.clientWidth && size > minSizeMm && guard < 80) {
    size -= 0.25;
    el.style.fontSize = `${size.toFixed(2)}mm`;
    guard++;
  }
}

export default function CertificateGenerator({
  data,
  certificateId,
  verifyUrl,
}: {
  data: CertificateData;
  certificateId?: string | undefined;
  verifyUrl?: string | undefined;
}) {
  const pageWrapRef = useRef<HTMLDivElement>(null);
  const certificateRef = useRef<HTMLDivElement>(null);
  const [qr, setQr] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    if (!verifyUrl) {
      setQr("");
      return;
    }
    QRCode.toDataURL(verifyUrl, { margin: 0, width: 400 })
      .then((url) => {
        if (!cancelled) setQr(url);
      })
      .catch(() => {
        if (!cancelled) setQr("");
      });
    return () => {
      cancelled = true;
    };
  }, [verifyUrl]);

  useEffect(() => {
    bindings.forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = data[key];
    });

    const name = document.getElementById("ov-name");
    if (name) fitText(name, 11, 4.5);

    ["ov-reg", "ov-course", "ov-duration", "ov-grade", "ov-centre", "ov-awarded"].forEach(
      (id) => {
        const el = document.getElementById(id);
        if (el) fitText(el, 4.6, 2.6);
      },
    );
  }, [data]);

  useEffect(() => {
    const scaleStage = () => {
      const wrap = pageWrapRef.current;
      const cert = certificateRef.current;
      const stage = wrap?.parentElement;

      if (!wrap || !cert || !stage) return;

      wrap.style.transform = "none";

      const naturalWidth = cert.getBoundingClientRect().width;
      const naturalHeight = cert.getBoundingClientRect().height;
      const container = stage.parentElement;
      const containerWidth = container
        ? container.clientWidth -
          parseFloat(getComputedStyle(container).paddingLeft || "0") -
          parseFloat(getComputedStyle(container).paddingRight || "0")
        : window.innerWidth;
      const available = Math.min(Math.max(containerWidth, 240), 920);
      const scale = Math.min(1, available / naturalWidth);

      wrap.style.transform = `scale(${scale})`;
      wrap.style.width = `${naturalWidth}px`;
      wrap.style.height = `${naturalHeight}px`;
      stage.style.height = `${naturalHeight * scale}px`;
    };

    scaleStage();
    window.addEventListener("resize", scaleStage);
    const parent = pageWrapRef.current?.parentElement?.parentElement;
    const ro = parent ? new ResizeObserver(() => scaleStage()) : null;
    if (parent && ro) ro.observe(parent);

    return () => {
      window.removeEventListener("resize", scaleStage);
      ro?.disconnect();
    };
  }, []);

  return (
    <div className="stage">
      <div className="page-wrap" id="pageWrap" ref={pageWrapRef}>
        <div className="certificate" id="certificate" ref={certificateRef}>
          <img
            className="certificate-artwork"
            src={certificateTemplate}
            alt=""
            aria-hidden="true"
          />
          <div
            id="ov-name"
            style={{
              top: "103mm",
              left: "20mm",
              width: "170mm",
              height: "22mm",
              fontSize: "11mm",
            }}
          />

          <div
            className="val"
            id="ov-reg"
            style={{
              top: "120mm",
              left: "18.2mm",
              width: "79mm",
              height: "20mm",
              fontSize: "4.6mm",
              paddingBottom: "1.3mm",
            }}
          />

          <div
            className="val"
            id="ov-course"
            style={{
              top: "120mm",
              left: "120.2mm",
              width: "72mm",
              height: "20mm",
              fontSize: "4.6mm",
              paddingBottom: "1.3mm",
            }}
          />

          <div
            className="val"
            id="ov-duration"
            style={{
              top: "147.3mm",
              left: "18.2mm",
              width: "79mm",
              height: "11.4mm",
              fontSize: "4.6mm",
              paddingBottom: "1.3mm",
            }}
          />

          <div
            className="val"
            id="ov-grade"
            style={{
              top: "147.3mm",
              left: "120.2mm",
              width: "72mm",
              height: "11.4mm",
              fontSize: "4.6mm",
              paddingBottom: "1.3mm",
            }}
          />

          <div
            className="val"
            id="ov-centre"
            style={{
              top: "165.4mm",
              left: "18.2mm",
              width: "79mm",
              height: "11.3mm",
              fontSize: "4.6mm",
              paddingBottom: "1.3mm",
            }}
          />

          <div
            className="val"
            id="ov-awarded"
            style={{
              top: "165.4mm",
              left: "120.2mm",
              width: "72mm",
              height: "11.3mm",
              fontSize: "4.6mm",
              paddingBottom: "1.3mm",
            }}
          />

          {qr ? (
            <div
              className="cert-qr"
              style={{ top: "42mm", left: "161mm", width: "18mm" }}
            >
              <img src={qr} alt="Certificate verification QR code" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
