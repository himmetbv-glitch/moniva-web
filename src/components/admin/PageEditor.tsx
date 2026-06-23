"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Locale, NewsStatus } from "@prisma/client";

import { upsertPage } from "@/lib/actions/admin-page";
import { EDITOR_LOCALES } from "@/lib/admin/product-editor-types";
import {
  PAGE_STATUSES,
  PAGE_STATUS_LABELS,
  type EditorPage,
} from "@/lib/admin/page-editor-types";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function PageEditor({
  mode,
  initial,
}: {
  mode: "new" | "edit";
  initial: EditorPage;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [n, setN] = useState<EditorPage>(initial);
  const [lang, setLang] = useState<Locale>("TR");
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  const cur = n.translations[lang];
  const rtl = EDITOR_LOCALES.find((l) => l.code === lang)?.rtl;

  const setField = <K extends keyof EditorPage>(k: K, v: EditorPage[K]) =>
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
      const res = await upsertPage({
        id: n.id || undefined,
        slug: n.slug,
        status: n.status,
        showInFooter: n.showInFooter,
        order: n.order,
        translations: n.translations,
      });
      if (res.ok) {
        router.push("/admin/pages");
        router.refresh();
      } else setError(res.error);
    });
  };

  return (
    <div className="ad-page">
      <div className="iq-head">
        <div>
          <div className="iq-head__crumb">
            <Link href="/admin/pages">SAYFALAR</Link> / {mode === "new" ? "YENİ" : "DÜZENLE"}
          </div>
          <div className="iq-head__title">
            <span>{mode === "new" ? "Yeni sayfa" : n.translations.TR.title || "Sayfa"}</span>
          </div>
          <div className="iq-head__meta">
            <span className="ad-mono ad-ref">{n.slug ? `/sayfa/${n.slug}` : "/sayfa/..."}</span>
            <span>·</span>
            <span className={"ad-pill ad-pill--" + (n.status === "PUBLISHED" ? "ok" : n.status === "DRAFT" ? "warn" : "mute")}>
              {PAGE_STATUS_LABELS[n.status]}
            </span>
          </div>
        </div>
        <div className="iq-head__actions">
          <Link href="/admin/pages" className="ad-btn ad-btn--ghost">İptal</Link>
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
              <div className="pe-sectitle">Sayfa içeriği · <b>{lang}</b></div>
              <label className="pe-field">
                <span className="pe-label">Başlık <i>{lang}</i></span>
                <input value={cur.title} onChange={(e) => setTr("title", e.target.value)} dir={rtl ? "rtl" : "ltr"} placeholder="Sayfa başlığı…" />
              </label>
              <label className="pe-field">
                <span className="pe-label">İçerik <i>{lang}</i></span>
                <textarea rows={18} value={cur.body} onChange={(e) => setTr("body", e.target.value)} dir={rtl ? "rtl" : "ltr"} placeholder="Sayfa metni. Paragrafları boş satırla ayırın." />
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
                {PAGE_STATUSES.map((s) => (
                  <option key={s} value={s}>{PAGE_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </label>
            <label className="pe-field">
              <span className="pe-label">Slug</span>
              <input
                className="ad-mono"
                value={n.slug}
                onChange={(e) => { setSlugTouched(true); setField("slug", e.target.value); }}
                placeholder="kvkk"
              />
            </label>
          </div>

          <div className="ad-card iq-pad">
            <div className="iq-cardhead__ttl iq-side__ttl">Footer</div>
            <label className="pe-check">
              <input
                type="checkbox"
                checked={n.showInFooter}
                onChange={(e) => setField("showInFooter", e.target.checked)}
              />
              <span>Footer’da göster</span>
            </label>
            <label className="pe-field">
              <span className="pe-label">Sıra</span>
              <input
                type="number"
                min={0}
                value={n.order}
                onChange={(e) => setField("order", parseInt(e.target.value, 10) || 0)}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
