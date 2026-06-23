"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Locale } from "@prisma/client";

import { upsertCategory, copyCategorySchema } from "@/lib/actions/admin-category";
import { EDITOR_LOCALES } from "@/lib/admin/product-editor-types";
import {
  SPEC_TYPES,
  SPEC_TYPE_LABELS,
  SPEC_TYPE_PILL,
  type CategoryParentOption,
  type CategorySchemaSource,
  type EditorCategory,
  type EditorSpecAttr,
} from "@/lib/admin/category-editor-types";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

let newAttrSeq = 0;
const blankAttr = (): EditorSpecAttr => ({
  id: `new-${newAttrSeq++}`,
  name: "",
  type: "TEXT",
  unit: "",
  required: false,
});

export function CategoryEditor({
  mode,
  initial,
  parents,
  sources,
}: {
  mode: "new" | "edit";
  initial: EditorCategory;
  parents: CategoryParentOption[];
  sources: CategorySchemaSource[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copyPending, startCopy] = useTransition();
  const [c, setC] = useState<EditorCategory>(initial);
  const [lang, setLang] = useState<Locale>("TR");
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [copyFrom, setCopyFrom] = useState("");

  const cur = c.translations[lang];
  const rtl = EDITOR_LOCALES.find((l) => l.code === lang)?.rtl;

  const setField = <K extends keyof EditorCategory>(k: K, v: EditorCategory[K]) =>
    setC((p) => ({ ...p, [k]: v }));
  const setTr = (field: "name" | "metaTitle" | "metaDesc", value: string) =>
    setC((p) => {
      const next = {
        ...p,
        translations: { ...p.translations, [lang]: { ...p.translations[lang], [field]: value } },
      };
      if (field === "name" && lang === "TR" && !slugTouched) {
        next.slug = slugify(value);
      }
      return next;
    });

  // ── Spec attribute yönetimi ──
  const attrs = c.specAttributes;
  const setAttrs = (next: EditorSpecAttr[]) => setField("specAttributes", next);
  const addAttr = () => setAttrs([...attrs, blankAttr()]);
  const updateAttr = (i: number, patch: Partial<EditorSpecAttr>) =>
    setAttrs(attrs.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  const removeAttr = (i: number) => setAttrs(attrs.filter((_, idx) => idx !== i));
  const moveAttr = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= attrs.length) return;
    const next = [...attrs];
    [next[i], next[j]] = [next[j], next[i]];
    setAttrs(next);
  };

  const copySchema = () => {
    if (!copyFrom) return;
    startCopy(async () => {
      const copied = await copyCategorySchema(copyFrom);
      setAttrs(copied);
      setCopyFrom("");
    });
  };

  const requiredCount = attrs.filter((a) => a.required).length;
  const completeLangs = EDITOR_LOCALES.filter(
    (L) => c.translations[L.code].name.trim(),
  ).length;

  const localeStatus = (code: Locale) =>
    c.translations[code].name.trim() ? "full" : "empty";

  const submit = () => {
    setError(null);
    if (attrs.some((a) => !a.name.trim())) {
      setError("Tüm teknik özellik alanlarının adı dolu olmalı.");
      return;
    }
    startTransition(async () => {
      const res = await upsertCategory({
        id: c.id || undefined,
        code: c.code,
        slug: c.slug,
        parentId: c.parentId,
        order: c.order,
        isActive: c.isActive,
        showInMenu: c.showInMenu,
        isFeatured: c.isFeatured,
        translations: c.translations,
        specAttributes: attrs.map((a) => ({
          id: a.id.startsWith("new-") || a.id.startsWith("copy-") ? undefined : a.id,
          name: a.name,
          type: a.type,
          unit: a.unit,
          required: a.required,
        })),
      });
      if (res.ok) {
        router.push("/admin/categories");
        router.refresh();
      } else setError(res.error);
    });
  };

  return (
    <div className="mv-page">
      <div className="iq-head">
        <div>
          <div className="iq-head__crumb">
            <Link href="/admin/categories">KATEGORİLER</Link> / {mode === "new" ? "YENİ" : "DÜZENLE"}
          </div>
          <div className="iq-head__title">
            <span>{mode === "new" ? "Yeni kategori" : c.translations.TR.name || c.code}</span>
          </div>
          <div className="iq-head__meta">
            <span className="mv-mono mv-ref">{c.slug ? `/c/${c.slug}` : "/c/..."}</span>
            <span>·</span>
            <span className={"mv-pill mv-pill--" + (c.isActive ? "ok" : "mute")}>
              {c.isActive ? "Aktif" : "Pasif"}
            </span>
            <span>·</span>
            <span>{attrs.length} özellik ({requiredCount} zorunlu)</span>
          </div>
        </div>
        <div className="iq-head__actions">
          <Link href="/admin/categories" className="mv-btn mv-btn--ghost">İptal</Link>
          <button className="mv-btn mv-btn--primary" onClick={submit} disabled={pending}>
            {pending ? "Kaydediliyor…" : mode === "new" ? "Oluştur" : "Kaydet"}
          </button>
        </div>
      </div>

      {error && <div className="pe-error">{error}</div>}

      <div className="pe-grid">
        <div className="pe-main">
          {/* Temel bilgi (çok dilli) */}
          <div className="mv-card mv-card--flush">
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
              <div className="pe-sectitle">Kategori içeriği · <b>{lang}</b></div>
              <label className="pe-field">
                <span className="pe-label">Kategori adı <i>{lang}</i></span>
                <input value={cur.name} onChange={(e) => setTr("name", e.target.value)} dir={rtl ? "rtl" : "ltr"} placeholder="Kategori adı…" />
              </label>
              <label className="pe-field">
                <span className="pe-label">Meta başlık <i>{lang}</i></span>
                <input value={cur.metaTitle} onChange={(e) => setTr("metaTitle", e.target.value)} dir={rtl ? "rtl" : "ltr"} />
              </label>
              <label className="pe-field">
                <span className="pe-label">Meta açıklama <i>{lang}</i></span>
                <textarea rows={2} value={cur.metaDesc} onChange={(e) => setTr("metaDesc", e.target.value)} dir={rtl ? "rtl" : "ltr"} />
              </label>
              <div className="pe-langnote">
                {completeLangs}/4 dil dolu. Eksik çeviriler İngilizce&apos;ye düşer.
              </div>
            </div>
          </div>

          {/* Teknik Özellik Şeması */}
          <div className="mv-card iq-pad">
            <div className="cse-head">
              <div>
                <div className="pe-sectitle" style={{ marginBottom: 4 }}>Teknik Özellik Şeması</div>
                <div className="cse-hint">
                  Bu kategorideki <b>her üründe</b> görünecek alanlar. Sırala, ekle/sil — ürün
                  editöründe bu alanlara değer girilir.
                </div>
              </div>
              <div className="cse-headactions">
                {sources.length > 0 && (
                  <div className="cse-copy">
                    <select value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
                      <option value="">Başka kategoriden kopyala…</option>
                      {sources.map((s) => (
                        <option key={s.id} value={s.id}>{s.label} ({s.attrCount})</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="mv-btn mv-btn--ghost mv-btn--sm"
                      disabled={!copyFrom || copyPending}
                      onClick={copySchema}
                    >
                      {copyPending ? "…" : "Kopyala"}
                    </button>
                  </div>
                )}
                <button type="button" className="mv-btn mv-btn--primary mv-btn--sm" onClick={addAttr}>
                  + Özellik ekle
                </button>
              </div>
            </div>

            {attrs.length === 0 ? (
              <div className="cse-empty">
                <div className="cse-empty__t">Henüz teknik özellik tanımlı değil</div>
                <p>Bu kategorinin şemasını tanımlamak için ilk özelliği ekleyin.</p>
                <button type="button" className="mv-btn mv-btn--primary mv-btn--sm" onClick={addAttr}>
                  + İlk özelliği ekle
                </button>
              </div>
            ) : (
              <div className="cse-table">
                <div className="cse-row cse-row--head">
                  <span>#</span>
                  <span>Özellik adı</span>
                  <span>Tip</span>
                  <span>Birim</span>
                  <span>Zorunlu</span>
                  <span />
                </div>
                {attrs.map((a, i) => (
                  <div className="cse-row" key={a.id}>
                    <div className="cse-ord">
                      <button type="button" onClick={() => moveAttr(i, -1)} disabled={i === 0} aria-label="Yukarı">↑</button>
                      <span className="cse-num">{String(i + 1).padStart(2, "0")}</span>
                      <button type="button" onClick={() => moveAttr(i, 1)} disabled={i === attrs.length - 1} aria-label="Aşağı">↓</button>
                    </div>
                    <input
                      className="cse-name"
                      value={a.name}
                      onChange={(e) => updateAttr(i, { name: e.target.value })}
                      placeholder="Örn. Ağırlık"
                    />
                    <select
                      className={"cse-type mv-pill--" + SPEC_TYPE_PILL[a.type]}
                      value={a.type}
                      onChange={(e) => updateAttr(i, { type: e.target.value as EditorSpecAttr["type"] })}
                    >
                      {SPEC_TYPES.map((t) => (
                        <option key={t} value={t}>{SPEC_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                    <input
                      className="cse-unit"
                      value={a.unit}
                      onChange={(e) => updateAttr(i, { unit: e.target.value })}
                      placeholder="—"
                    />
                    <button
                      type="button"
                      className={"pe-toggle cse-req" + (a.required ? " pe-toggle--on" : "")}
                      onClick={() => updateAttr(i, { required: !a.required })}
                      aria-pressed={a.required}
                    >
                      <span className="pe-toggle__knob" />
                    </button>
                    <button type="button" className="pe-del" onClick={() => removeAttr(i)} aria-label="Sil">×</button>
                  </div>
                ))}
                <button type="button" className="cse-addrow" onClick={addAttr}>
                  + Yeni özellik
                </button>
              </div>
            )}
          </div>

          {/* Canlı önizleme */}
          {attrs.length > 0 && (
            <div className="mv-card iq-pad">
              <div className="pe-sectitle">Canlı önizleme</div>
              <div className="cse-hint" style={{ marginBottom: 12 }}>
                Bu kategorideki ürün sayfasında &quot;Teknik Özellikler&quot; bölümü böyle görünür.
              </div>
              <div className="cse-prev">
                {attrs.map((a) => (
                  <div className="cse-prev__row" key={a.id}>
                    <span className="cse-prev__k">
                      {a.name || "(adsız)"}
                      {a.required && <i className="cse-prev__req">•</i>}
                    </span>
                    <span className="cse-prev__v">
                      <i>(ürün başına)</i>
                      {a.unit && <em> {a.unit}</em>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pe-side">
          {/* Ayarlar */}
          <div className="mv-card iq-pad">
            <div className="iq-cardhead__ttl iq-side__ttl">Ayarlar</div>
            <label className="pe-field">
              <span className="pe-label">Kod <b className="pe-req">*</b></span>
              <input className="mv-mono" value={c.code} onChange={(e) => setField("code", e.target.value.toUpperCase())} placeholder="AS" />
            </label>
            <label className="pe-field">
              <span className="pe-label">Slug</span>
              <input
                className="mv-mono"
                value={c.slug}
                onChange={(e) => { setSlugTouched(true); setField("slug", e.target.value); }}
                placeholder="hava-suspansiyon"
              />
            </label>
            <label className="pe-field">
              <span className="pe-label">Üst kategori</span>
              <select value={c.parentId} onChange={(e) => setField("parentId", e.target.value)}>
                <option value="">— Üst kategori yok —</option>
                {parents.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="pe-field">
              <span className="pe-label">Sıra</span>
              <input
                type="number"
                value={c.order}
                onChange={(e) => setField("order", parseInt(e.target.value, 10) || 0)}
              />
            </label>
          </div>

          {/* Görünürlük */}
          <div className="mv-card iq-pad">
            <div className="iq-cardhead__ttl iq-side__ttl">Görünürlük</div>
            <div className="pe-statusrow">
              <span>Katalogda göster</span>
              <button type="button" className={"pe-toggle" + (c.isActive ? " pe-toggle--on" : "")} onClick={() => setField("isActive", !c.isActive)} aria-pressed={c.isActive}>
                <span className="pe-toggle__knob" />
              </button>
            </div>
            <div className="pe-statusrow">
              <span>Menüde göster</span>
              <button type="button" className={"pe-toggle" + (c.showInMenu ? " pe-toggle--on" : "")} onClick={() => setField("showInMenu", !c.showInMenu)} aria-pressed={c.showInMenu}>
                <span className="pe-toggle__knob" />
              </button>
            </div>
            <div className="pe-statusrow">
              <span>Öne çıkan</span>
              <button type="button" className={"pe-toggle" + (c.isFeatured ? " pe-toggle--on" : "")} onClick={() => setField("isFeatured", !c.isFeatured)} aria-pressed={c.isFeatured}>
                <span className="pe-toggle__knob" />
              </button>
            </div>
          </div>

          {/* Şema istatistiği */}
          <div className="mv-card iq-pad">
            <div className="iq-cardhead__ttl iq-side__ttl">Şema istatistiği</div>
            <div className="cse-stat">
              <span>Toplam özellik</span>
              <b>{attrs.length}</b>
            </div>
            <div className="cse-stat">
              <span>Zorunlu alan</span>
              <b>{requiredCount}</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
