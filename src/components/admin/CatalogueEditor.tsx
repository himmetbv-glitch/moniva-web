"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { NewsStatus } from "@prisma/client";

import { upsertCatalogue } from "@/lib/actions/admin-catalogue";
import {
  CATALOGUE_LANG_OPTIONS,
  CAT_STATUSES,
  CAT_STATUS_LABELS,
  formatFileSize,
  type CatalogueTypeOption,
  type EditorCatalogue,
} from "@/lib/admin/catalogue-editor-types";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/&/g, " ve ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CatalogueEditor({
  mode,
  initial,
  types,
}: {
  mode: "new" | "edit";
  initial: EditorCatalogue;
  types: CatalogueTypeOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [c, setC] = useState<EditorCatalogue>(() => ({
    ...initial,
    typeId: initial.typeId || types[0]?.id || "",
  }));
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [fileBusy, setFileBusy] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof EditorCatalogue>(k: K, v: EditorCatalogue[K]) =>
    setC((p) => ({ ...p, [k]: v }));

  const setTitle = (value: string) =>
    setC((p) => ({ ...p, title: value, slug: slugTouched ? p.slug : slugify(value) }));

  const toggleLang = (lang: string) =>
    setC((p) => ({
      ...p,
      languages: p.languages.includes(lang)
        ? p.languages.filter((l) => l !== lang)
        : [...p.languages, lang],
    }));

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await upsertCatalogue({
        id: c.id || undefined,
        slug: c.slug,
        title: c.title,
        typeId: c.typeId,
        description: c.description,
        version: c.version,
        languages: c.languages,
        pageCount: c.pageCount,
        status: c.status,
        featured: c.featured,
      });
      if (res.ok) {
        if (mode === "new") {
          // Yeni kayıt: düzenleme moduna geç ki dosya/kapak yüklenebilsin.
          router.push(`/admin/catalogues/${res.id}`);
          router.refresh();
        } else {
          router.push("/admin/catalogues");
          router.refresh();
        }
      } else setError(res.error);
    });
  };

  async function uploadFile(file: File | undefined) {
    if (!file || !c.id) return;
    setError(null);
    setFileBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/admin/catalogues/${c.id}/file`, { method: "POST", body: fd });
      if (res.ok) {
        const j = (await res.json()) as { fileUrl: string; fileName: string; fileSize: number };
        setC((p) => ({ ...p, fileUrl: j.fileUrl, fileName: j.fileName, fileSize: j.fileSize }));
      } else {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "PDF yüklenemedi.");
      }
    } finally {
      setFileBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function uploadCover(file: File | undefined) {
    if (!file || !c.id) return;
    setError(null);
    setCoverBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/admin/catalogues/${c.id}/cover`, { method: "POST", body: fd });
      if (res.ok) {
        const j = (await res.json()) as { coverImage: string };
        set("coverImage", j.coverImage);
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
            <Link href="/admin/catalogues">KATALOGLAR</Link> / {mode === "new" ? "YENİ" : "DÜZENLE"}
          </div>
          <div className="iq-head__title">
            <span>{mode === "new" ? "Yeni katalog" : c.title || "Katalog"}</span>
          </div>
          <div className="iq-head__meta">
            <span className="ad-mono ad-ref">{c.slug ? `/kataloglar#${c.slug}` : "/kataloglar"}</span>
            <span>·</span>
            <span className={"ad-pill ad-pill--" + (c.status === "PUBLISHED" ? "ok" : c.status === "DRAFT" ? "warn" : "mute")}>
              {CAT_STATUS_LABELS[c.status]}
            </span>
          </div>
        </div>
        <div className="iq-head__actions">
          <Link href="/admin/catalogues" className="ad-btn ad-btn--ghost">İptal</Link>
          <button className="ad-btn ad-btn--primary" onClick={submit} disabled={pending}>
            {pending ? "Kaydediliyor…" : mode === "new" ? "Oluştur" : "Kaydet"}
          </button>
        </div>
      </div>

      {error && <div className="pe-error">{error}</div>}

      <div className="pe-grid">
        <div className="pe-main">
          <div className="ad-card iq-pad">
            <div className="pe-sectitle">Katalog bilgileri</div>
            <label className="pe-field">
              <span className="pe-label">Başlık</span>
              <input value={c.title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Master Catalogue 2026" />
            </label>
            <label className="pe-field">
              <span className="pe-label">Açıklama</span>
              <textarea
                rows={4}
                value={c.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Katalog kartında görünen kısa tanıtım…"
              />
            </label>
          </div>

          <div className="ad-card iq-pad">
            <div className="pe-sectitle">Katalog dosyası (PDF)</div>
            {mode === "edit" && c.id ? (
              <>
                {c.fileUrl ? (
                  <div className="ce-file">
                    <span className="ce-file__ico">PDF</span>
                    <div className="ce-file__meta">
                      <b>{c.fileName || "Katalog.pdf"}</b>
                      <small>{formatFileSize(c.fileSize)}</small>
                    </div>
                    <a className="ad-linkbtn" href={c.fileUrl} target="_blank" rel="noreferrer">Görüntüle ↗</a>
                  </div>
                ) : (
                  <div className="pe-ph">Henüz PDF yüklenmedi. Yayınlamak için gerekli.</div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={(e) => uploadFile(e.target.files?.[0])}
                />
                <button
                  type="button"
                  className="ad-btn ad-btn--ghost ad-btn--sm"
                  style={{ marginTop: 12 }}
                  disabled={fileBusy}
                  onClick={() => fileRef.current?.click()}
                >
                  {fileBusy ? "Yükleniyor…" : c.fileUrl ? "PDF'i değiştir" : "PDF yükle"}
                </button>
                <div className="pe-hint" style={{ marginTop: 8 }}>Maksimum 50 MB.</div>
              </>
            ) : (
              <div className="pe-ph">PDF eklemek için önce kataloğu kaydedin.</div>
            )}
          </div>
        </div>

        <div className="pe-side">
          <div className="ad-card iq-pad">
            <div className="iq-cardhead__ttl iq-side__ttl">Yayın</div>
            <label className="pe-field">
              <span className="pe-label">Durum</span>
              <select value={c.status} onChange={(e) => set("status", e.target.value as NewsStatus)}>
                {CAT_STATUSES.map((s) => (
                  <option key={s} value={s}>{CAT_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </label>
            <label className="pe-check">
              <input type="checkbox" checked={c.featured} onChange={(e) => set("featured", e.target.checked)} />
              <span>Öne çıkar (sayfanın üstüne sabitle)</span>
            </label>
            <label className="pe-field">
              <span className="pe-label">Slug</span>
              <input
                className="ad-mono"
                value={c.slug}
                onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }}
                placeholder="master-catalogue-2026"
              />
            </label>
          </div>

          <div className="ad-card iq-pad">
            <div className="iq-cardhead__ttl iq-side__ttl">Özellikler</div>
            <label className="pe-field">
              <span className="pe-label">
                Tip
                <Link href="/admin/catalogues/turler" className="ad-linkbtn" style={{ marginLeft: 8, fontSize: 11 }}>
                  Türleri yönet
                </Link>
              </span>
              <select value={c.typeId} onChange={(e) => set("typeId", e.target.value)}>
                {types.length === 0 && <option value="">— tür yok —</option>}
                {types.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
            <div className="pe-field">
              <span className="pe-label">Diller</span>
              <div className="ce-langs">
                {CATALOGUE_LANG_OPTIONS.map((l) => (
                  <label key={l} className={"ce-lang" + (c.languages.includes(l) ? " ce-lang--on" : "")}>
                    <input type="checkbox" checked={c.languages.includes(l)} onChange={() => toggleLang(l)} hidden />
                    {l}
                  </label>
                ))}
              </div>
            </div>
            <label className="pe-field">
              <span className="pe-label">Sürüm</span>
              <input value={c.version} onChange={(e) => set("version", e.target.value)} placeholder="v2026.1" />
            </label>
            <label className="pe-field">
              <span className="pe-label">Sayfa sayısı</span>
              <input
                inputMode="numeric"
                value={c.pageCount}
                onChange={(e) => set("pageCount", e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="480"
              />
            </label>
          </div>

          <div className="ad-card iq-pad">
            <div className="iq-cardhead__ttl iq-side__ttl">Kapak görseli</div>
            {mode === "edit" && c.id ? (
              <>
                {c.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.coverImage} alt="" className="ce-cover" />
                ) : (
                  <div className="pe-ph">
                    Kapak yok — yayında başlık ve tip rengiyle otomatik markalı kapak gösterilir.
                  </div>
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
                  className="ad-btn ad-btn--ghost ad-btn--sm"
                  style={{ marginTop: 12 }}
                  disabled={coverBusy}
                  onClick={() => coverRef.current?.click()}
                >
                  {coverBusy ? "Yükleniyor…" : c.coverImage ? "Kapağı değiştir" : "Kapak yükle"}
                </button>
                <div className="pe-hint" style={{ marginTop: 8 }}>3:4 dikey önerilir. Maks 8 MB.</div>
              </>
            ) : (
              <div className="pe-ph">Kapak eklemek için önce kataloğu kaydedin.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
