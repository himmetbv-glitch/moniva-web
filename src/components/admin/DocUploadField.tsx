"use client";

import { useRef, useState } from "react";

export type DocUploadResult = { url: string; kind: "pdf" | "img"; size: string };

export function DocUploadField({
  label,
  value,
  uploadUrl,
  onUploaded,
  onUrlChange,
  onClear,
}: {
  label: string;
  value: string;
  uploadUrl: string;
  onUploaded: (r: DocUploadResult) => void;
  onUrlChange: (url: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [manual, setManual] = useState(false);

  async function upload(file: File) {
    setErr(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(uploadUrl, { method: "POST", body: fd });
      const j = (await res.json().catch(() => ({}))) as Partial<DocUploadResult> & {
        error?: string;
      };
      if (!res.ok || !j.url) {
        setErr(j.error ?? "Yükleme başarısız.");
        return;
      }
      onUploaded({ url: j.url, kind: j.kind ?? "pdf", size: j.size ?? "" });
    } catch {
      setErr("Yükleme başarısız.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const fileName = value ? value.split("/").pop() ?? value : null;

  return (
    <div className="pe-field mp-docfield">
      <span className="pe-label">{label}</span>

      <div className="mp-docrow">
        <div className="mp-docstate">
          {value ? (
            <a href={value} target="_blank" rel="noreferrer" className="mp-doclink" title={value}>
              ↓ {fileName}
            </a>
          ) : (
            <span className="mp-docstate__ph">Dosya yok</span>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
        />
        <div className="mp-docbtns">
          <button
            type="button"
            className="ad-btn ad-btn--ghost ad-btn--sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Yükleniyor…" : value ? "Değiştir" : "Dosya yükle"}
          </button>
          {value && (
            <button
              type="button"
              className="ad-linkbtn ad-linkbtn--danger"
              disabled={uploading}
              onClick={onClear}
            >
              Kaldır
            </button>
          )}
          <button type="button" className="ad-linkbtn" onClick={() => setManual((m) => !m)}>
            {manual ? "Gizle" : "URL gir"}
          </button>
        </div>
      </div>

      {manual && (
        <input
          className="mp-imgurl"
          value={value}
          placeholder="/api/r2/pages/quality/docs/…"
          onChange={(e) => onUrlChange(e.target.value)}
        />
      )}
      {err && <div className="mp-imgerr">{err}</div>}
      <div className="mp-imghint">PDF / JPEG / PNG / WebP · maks. 20 MB</div>
    </div>
  );
}
