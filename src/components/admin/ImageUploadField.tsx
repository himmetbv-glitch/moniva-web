"use client";

import { useRef, useState } from "react";

export function ImageUploadField({
  label,
  value,
  uploadUrl,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  uploadUrl: string;
  onChange: (url: string) => void;
  hint?: string;
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
      const j = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !j.url) {
        setErr(j.error ?? "Yükleme başarısız.");
        return;
      }
      onChange(j.url);
    } catch {
      setErr("Yükleme başarısız.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="pe-field mp-imgfield">
      <span className="pe-label">
        {label}
        {hint && <em>{hint}</em>}
      </span>

      <div className="mp-imgrow">
        <div className="mp-imgthumb">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" />
          ) : (
            <span className="mp-imgthumb__ph">Görsel yok</span>
          )}
        </div>

        <div className="mp-imgctrl">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
          <div className="mp-imgbtns">
            <button
              type="button"
              className="mv-btn mv-btn--ghost mv-btn--sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? "Yükleniyor…" : value ? "Değiştir" : "Görsel yükle"}
            </button>
            {value && (
              <button
                type="button"
                className="mv-linkbtn mv-linkbtn--danger"
                disabled={uploading}
                onClick={() => onChange("")}
              >
                Kaldır
              </button>
            )}
            <button
              type="button"
              className="mv-linkbtn"
              onClick={() => setManual((m) => !m)}
            >
              {manual ? "Gizle" : "URL gir"}
            </button>
          </div>
          {manual && (
            <input
              className="mp-imgurl"
              value={value}
              placeholder="/home/hero.jpg veya /api/r2/pages/…"
              onChange={(e) => onChange(e.target.value)}
            />
          )}
          {err && <div className="mp-imgerr">{err}</div>}
          <div className="mp-imghint">JPEG / PNG / WebP · maks. 8 MB</div>
        </div>
      </div>
    </div>
  );
}
