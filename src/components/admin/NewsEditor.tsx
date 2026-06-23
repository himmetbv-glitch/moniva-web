"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { Locale, NewsStatus } from "@prisma/client";

import { upsertNews } from "@/lib/actions/admin-news";
import { EDITOR_LOCALES } from "@/lib/admin/product-editor-types";
import {
  NEWS_STATUSES,
  NEWS_STATUS_LABELS,
  type EditorNews,
} from "@/lib/admin/news-editor-types";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function NewsEditor({
  mode,
  initial,
}: {
  mode: "new" | "edit";
  initial: EditorNews;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [n, setN] = useState<EditorNews>(initial);
  const [lang, setLang] = useState<Locale>("TR");
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [coverBusy, setCoverBusy] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  const cur = n.translations[lang];
  const rtl = EDITOR_LOCALES.find((l) => l.code === lang)?.rtl;

  const setField = <K extends keyof EditorNews>(k: K, v: EditorNews[K]) =>
    setN((p) => ({ ...p, [k]: v }));

  const setTr = (field: keyof typeof cur, value: string) =>
    setN((p) => {
      const next = {
        ...p,
        translations: { ...p.translations, [lang]: { ...p.translations[lang], [field]: value } },
      };
      if (field === "title" && lang === "TR" && !slugTouched) {
        next.slug = slugify(value);
      }
      return next;
    });

  const localeStatus = (code: Locale) =>
    n.translations[code].title.trim() ? "full" : "empty";

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await upsertNews({
        id: n.id || undefined,
        slug: n.slug,
        status: n.status,
        publishedAt: n.publishedAt,
        translations: n.translations,
      });
      if (res.ok) {
        router.push("/admin/news");
        router.refresh();
      } else setError(res.error);
    });
  };

  async function uploadCover(file: File | undefined) {
    if (!file || !n.id) return;
    setError(null);
    setCoverBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/admin/news/${n.id}/cover`, { method: "POST", body: fd });
      if (res.ok) {
        const j = (await res.json()) as { coverImage: string };
        setField("coverImage", j.coverImage);
      } else {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "Kapak yüklenemedi.");
      }
    } finally {
      setCoverBusy(false);
      if (coverRef.current) coverRef.current.value = "";
    }
  }

  return (
    <div className="ad-page">
      <div className="iq-head">
        <div>
          <div className="iq-head__crumb">
            <Link href="/admin/news">NEWSROOM</Link> / {mode === "new" ? "YENİ" : "DÜZENLE"}
          </div>
          <div className="iq-head__title">
            <span>{mode === "new" ? "Yeni haber" : n.translations.TR.title || "Haber"}</span>
          </div>
          <div className="iq-head__meta">
            <span className="ad-mono ad-ref">{n.slug ? `/haberler/${n.slug}` : "/haberler/..."}</span>
            <span>·</span>
            <span className={"ad-pill ad-pill--" + (n.status === "PUBLISHED" ? "ok" : n.status === "DRAFT" ? "warn" : "mute")}>
              {NEWS_STATUS_LABELS[n.status]}
            </span>
          </div>
        </div>
        <div className="iq-head__actions">
          <Link href="/admin/news" className="ad-btn ad-btn--ghost">İptal</Link>
          <button className="ad-btn ad-btn--primary" onClick={submit} disabled={pending}>
            {pending ? "Kaydediliyor…" : mode === "new" ? "Oluştur" : "Kaydet"}
          </button>
        </div>
      </div>

      {error && <div className="pe-error">{error}</div>}

      <div className="pe-grid">
        <div className="pe-main">
          <div className="ad-card ad-card--flush">
            <div className="pe-langs">
              {EDITOR_LOCALES.map((L) => (
                <button
                  key={L.code}
                  className={"pe-lang" + (lang === L.code ? " pe-lang--on" : "")}
                  onClick={() => setLang(L.code)}
                >
                  <span className="pe-lang__code">{L.code} <em>· {L.label}</em></span>
                  <span className={"pe-lang__st pe-lang__st--" + localeStatus(L.code)} />
                </button>
              ))}
            </div>
            <div className="pe-body">
              <div className="pe-sectitle">Haber içeriği · <b>{lang}</b></div>
              <label className="pe-field">
                <span className="pe-label">Başlık <i>{lang}</i></span>
                <input value={cur.title} onChange={(e) => setTr("title", e.target.value)} dir={rtl ? "rtl" : "ltr"} placeholder="Haber başlığı…" />
              </label>
              <label className="pe-field">
                <span className="pe-label">Özet <i>{lang}</i></span>
                <textarea rows={2} value={cur.excerpt} onChange={(e) => setTr("excerpt", e.target.value)} dir={rtl ? "rtl" : "ltr"} placeholder="Kart ve listede görünen kısa özet…" />
              </label>
              <label className="pe-field">
                <span className="pe-label">İçerik <i>{lang}</i></span>
                <textarea rows={14} value={cur.body} onChange={(e) => setTr("body", e.target.value)} dir={rtl ? "rtl" : "ltr"} placeholder="Haber metni. Paragrafları boş satırla ayırın." />
              </label>
            </div>
          </div>

          <div className="ad-card iq-pad">
            <div className="pe-sectitle">SEO · <b>{lang}</b></div>
            <label className="pe-field">
              <span className="pe-label">Meta başlık <i>{lang}</i></span>
              <input value={cur.metaTitle} onChange={(e) => setTr("metaTitle", e.target.value)} dir={rtl ? "rtl" : "ltr"} />
            </label>
            <label className="pe-field">
              <span className="pe-label">Meta açıklama <i>{lang}</i></span>
              <textarea rows={2} value={cur.metaDesc} onChange={(e) => setTr("metaDesc", e.target.value)} dir={rtl ? "rtl" : "ltr"} />
            </label>
          </div>
        </div>

        <div className="pe-side">
          <div className="ad-card iq-pad">
            <div className="iq-cardhead__ttl iq-side__ttl">Yayın</div>
            <label className="pe-field">
              <span className="pe-label">Durum</span>
              <select value={n.status} onChange={(e) => setField("status", e.target.value as NewsStatus)}>
                {NEWS_STATUSES.map((s) => (
                  <option key={s} value={s}>{NEWS_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </label>
            <label className="pe-field">
              <span className="pe-label">Yayın tarihi</span>
              <input type="date" value={n.publishedAt} onChange={(e) => setField("publishedAt", e.target.value)} />
            </label>
            <label className="pe-field">
              <span className="pe-label">Slug</span>
              <input
                className="ad-mono"
                value={n.slug}
                onChange={(e) => { setSlugTouched(true); setField("slug", e.target.value); }}
                placeholder="haber-basligi"
              />
            </label>
          </div>

          <div className="ad-card iq-pad">
            <div className="iq-cardhead__ttl iq-side__ttl">Kapak görseli</div>
            {mode === "edit" && n.id ? (
              <>
                {n.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.coverImage} alt="" className="ne-cover" />
                ) : (
                  <div className="pe-ph">Henüz kapak yok.</div>
                )}
                <input
                  ref={coverRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(e) => uploadCover(e.target.files?.[0])}
                />
                <button
                  type="button"
                  className="ad-btn ad-btn--ghost ad-btn--sm ne-coverbtn"
                  disabled={coverBusy}
                  onClick={() => coverRef.current?.click()}
                >
                  {coverBusy ? "Yükleniyor…" : n.coverImage ? "Kapağı değiştir" : "Kapak yükle"}
                </button>
              </>
            ) : (
              <div className="pe-ph">Kapak eklemek için önce haberi kaydedin.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
