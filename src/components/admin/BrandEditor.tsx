"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { upsertBrand } from "@/lib/actions/admin-brand";
import type { EditorBrand } from "@/lib/admin/brand-editor-types";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function BrandEditor({
  mode,
  initial,
}: {
  mode: "new" | "edit";
  initial: EditorBrand;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [b, setB] = useState<EditorBrand>(initial);
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  const set = <K extends keyof EditorBrand>(k: K, v: EditorBrand[K]) =>
    setB((p) => ({ ...p, [k]: v }));

  const onName = (v: string) => {
    setB((p) => ({ ...p, name: v, slug: slugTouched ? p.slug : slugify(v) }));
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await upsertBrand({
        id: b.id || undefined,
        name: b.name,
        slug: b.slug,
        website: b.website,
        logoUrl: b.logoUrl,
        isActive: b.isActive,
      });
      if (res.ok) {
        router.push("/admin/brands");
        router.refresh();
      } else setError(res.error);
    });
  };

  return (
    <div className="ad-page">
      <div className="iq-head">
        <div>
          <div className="iq-head__crumb">
            <Link href="/admin/brands">MARKALAR</Link> / {mode === "new" ? "YENİ" : "DÜZENLE"}
          </div>
          <div className="iq-head__title">
            <span>{mode === "new" ? "Yeni marka" : b.name}</span>
          </div>
        </div>
        <div className="iq-head__actions">
          <Link href="/admin/brands" className="ad-btn ad-btn--ghost">İptal</Link>
          <button className="ad-btn ad-btn--primary" onClick={submit} disabled={pending}>
            {pending ? "Kaydediliyor…" : mode === "new" ? "Oluştur" : "Kaydet"}
          </button>
        </div>
      </div>

      {error && <div className="pe-error">{error}</div>}

      <div className="br-editgrid">
        <div className="ad-card iq-pad">
          <div className="pe-sectitle">Marka bilgileri</div>
          <label className="pe-field">
            <span className="pe-label">Marka adı <b className="pe-req">*</b></span>
            <input value={b.name} onChange={(e) => onName(e.target.value)} placeholder="Örn. KNORR-BREMSE" />
          </label>
          <label className="pe-field">
            <span className="pe-label">Slug</span>
            <input
              className="ad-mono"
              value={b.slug}
              onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }}
              placeholder="knorr-bremse"
            />
          </label>
          <label className="pe-field">
            <span className="pe-label">Web sitesi</span>
            <input value={b.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
          </label>
          <label className="pe-field">
            <span className="pe-label">Logo URL</span>
            <input value={b.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://… (R2 yükleme yakında)" />
          </label>
          <div className="pe-statusrow">
            <span>Aktif (görünür)</span>
            <button
              type="button"
              className={"pe-toggle" + (b.isActive ? " pe-toggle--on" : "")}
              onClick={() => set("isActive", !b.isActive)}
              aria-pressed={b.isActive}
            >
              <span className="pe-toggle__knob" />
            </button>
          </div>
        </div>

        <div className="ad-card iq-pad">
          <div className="pe-sectitle">Önizleme</div>
          <div className="br-preview">
            <div className="br-preview__head" style={{ background: "#4F3D8C" }}>
              {b.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.logoUrl} alt={b.name} />
              ) : (
                <span>{b.name || "MARKA"}</span>
              )}
            </div>
            <div className="br-preview__body">
              <b>{b.name || "Marka adı"}</b>
              <span className={"ad-pill ad-pill--" + (b.isActive ? "ok" : "mute")}>
                {b.isActive ? "Aktif" : "Pasif"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
