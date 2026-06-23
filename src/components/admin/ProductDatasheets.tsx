"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@prisma/client";

import { EDITOR_LOCALES } from "@/lib/admin/product-editor-types";
import { deleteDatasheet } from "@/lib/actions/admin-product-datasheet";

export type EditorDatasheet = {
  id: string;
  locale: Locale;
  fileUrl: string;
  fileName: string | null;
  fileSize: number | null;
};

function formatBytes(n: number | null): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProductDatasheets({
  productId,
  datasheets,
}: {
  productId: string;
  datasheets: EditorDatasheet[];
}) {
  const router = useRouter();
  const [busyLocale, setBusyLocale] = useState<Locale | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const byLocale = new Map(datasheets.map((d) => [d.locale, d]));
  const busy = pending || busyLocale !== null;

  async function upload(locale: Locale, file: File | undefined) {
    if (!file) return;
    setErr(null);
    setBusyLocale(locale);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("locale", locale);
      const res = await fetch(`/api/admin/products/${productId}/datasheets`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(j.error ?? "Yükleme başarısız.");
      }
    } finally {
      setBusyLocale(null);
      const el = inputs.current[locale];
      if (el) el.value = "";
      router.refresh();
    }
  }

  function remove(id: string) {
    setErr(null);
    start(async () => {
      const r = await deleteDatasheet(id);
      if (!r.ok) setErr(r.error);
      router.refresh();
    });
  }

  return (
    <div className="ad-card iq-pad">
      <div className="pe-sectitle">Dokümanlar (Datasheet)</div>
      <div className="pe-ph pe-ph--info">
        Her dil için bir PDF datasheet yükleyebilirsiniz. Aynı dile yeni dosya
        yüklemek mevcut datasheet&apos;i değiştirir.
      </div>

      {err && <div className="pe-img-err">{err}</div>}

      <div className="pe-dslist">
        {EDITOR_LOCALES.map((L) => {
          const ds = byLocale.get(L.code);
          const thisBusy = busyLocale === L.code;
          return (
            <div className="pe-dsrow" key={L.code}>
              <div className="pe-dslocale">{L.code}</div>
              <div className="pe-dsmain">
                {ds ? (
                  <>
                    <a href={ds.fileUrl} target="_blank" rel="noopener noreferrer" className="pe-dsfile">
                      <span className="pe-dsicon">PDF</span>
                      <span className="pe-dsname">{ds.fileName ?? "datasheet.pdf"}</span>
                      <span className="pe-dssize">{formatBytes(ds.fileSize)}</span>
                    </a>
                  </>
                ) : (
                  <span className="pe-dsempty">{L.label} için datasheet yok</span>
                )}
              </div>
              <div className="pe-dsactions">
                <input
                  ref={(el) => {
                    inputs.current[L.code] = el;
                  }}
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={(e) => upload(L.code, e.target.files?.[0])}
                />
                <button
                  type="button"
                  className="ad-btn ad-btn--ghost ad-btn--sm"
                  disabled={busy}
                  onClick={() => inputs.current[L.code]?.click()}
                >
                  {thisBusy ? "Yükleniyor…" : ds ? "Değiştir" : "Yükle"}
                </button>
                {ds && (
                  <button
                    type="button"
                    className="ad-btn ad-btn--ghost ad-btn--sm pe-dsdel"
                    disabled={busy}
                    onClick={() => remove(ds.id)}
                  >
                    Sil
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
