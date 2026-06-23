"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { Locale } from "@prisma/client";

import { upsertProduct } from "@/lib/actions/admin-product-upsert";
import {
  EDITOR_LOCALES,
  type EditorOptions,
  type EditorProduct,
  type EditorTranslation,
} from "@/lib/admin/product-editor-types";
import { ProductImages, type EditorImage } from "@/components/admin/ProductImages";
import {
  ProductDatasheets,
  type EditorDatasheet,
} from "@/components/admin/ProductDatasheets";

type Tab = "overview" | "specs" | "cross" | "media" | "docs" | "seo";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={"pe-toggle" + (on ? " pe-toggle--on" : "")}
      onClick={onClick}
      aria-pressed={on}
    >
      <span className="pe-toggle__knob" />
    </button>
  );
}

export function ProductEditor({
  mode,
  initial,
  options,
  images = [],
  datasheets = [],
}: {
  mode: "new" | "edit";
  initial: EditorProduct;
  options: EditorOptions;
  images?: EditorImage[];
  datasheets?: EditorDatasheet[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>("overview");
  const [lang, setLang] = useState<Locale>("TR");
  const [error, setError] = useState<string | null>(null);
  const [p, setP] = useState<EditorProduct>(initial);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  const set = <K extends keyof EditorProduct>(k: K, v: EditorProduct[K]) =>
    setP((prev) => ({ ...prev, [k]: v }));

  const setTr = (field: keyof EditorTranslation, value: string) =>
    setP((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [lang]: { ...prev.translations[lang], [field]: value },
      },
    }));

  const cur = p.translations[lang];
  const rtl = EDITOR_LOCALES.find((l) => l.code === lang)?.rtl;

  const localeStatus = (code: Locale): "full" | "partial" | "empty" => {
    const t = p.translations[code];
    const filled = [t.name, t.description].filter((x) => x.trim().length > 0).length;
    if (filled === 0) return "empty";
    if (filled < 2) return "partial";
    return "full";
  };
  const completeCount = useMemo(
    () => EDITOR_LOCALES.filter((l) => localeStatus(l.code) === "full").length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [p.translations],
  );

  // ── Teknik özellikler: kategori şeması sürücü ──
  const schema = options.schemas[p.categoryId] ?? [];
  const schemaIds = new Set(schema.map((a) => a.attributeId));
  // Şema dışı (eski/serbest) satırlar — orijinal index'leriyle.
  const legacyRows = p.specs
    .map((s, idx) => ({ s, idx }))
    .filter(({ s }) => !s.attributeId || !schemaIds.has(s.attributeId));

  const valueOf = (attributeId: string) =>
    p.specs.find((s) => s.attributeId === attributeId)?.value ?? "";

  const setSchemaValue = (
    attr: { attributeId: string; name: string; unit: string },
    value: string,
  ) =>
    setP((prev) => {
      const specs = [...prev.specs];
      const idx = specs.findIndex((s) => s.attributeId === attr.attributeId);
      const row = { attributeId: attr.attributeId, key: attr.name, value, unit: attr.unit };
      if (idx >= 0) specs[idx] = row;
      else specs.push(row);
      return { ...prev, specs };
    });

  // Eski serbest satırlar (yalnız şema yokken eklenir)
  const addSpec = () =>
    set("specs", [...p.specs, { attributeId: null, key: "", value: "", unit: "" }]);
  const setSpec = (i: number, k: "key" | "value" | "unit", v: string) =>
    set("specs", p.specs.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)));
  const delSpec = (i: number) => set("specs", p.specs.filter((_, idx) => idx !== i));

  const addOem = () => set("oem", [...p.oem, { manufacturer: "", oemNumber: "" }]);
  const setOem = (i: number, k: "manufacturer" | "oemNumber", v: string) =>
    set("oem", p.oem.map((o, idx) => (idx === i ? { ...o, [k]: v } : o)));
  const delOem = (i: number) => set("oem", p.oem.filter((_, idx) => idx !== i));

  const onSkuChange = (v: string) => {
    const sku = v.toUpperCase();
    set("sku", sku);
    if (!slugTouched) set("slug", slugify(sku));
  };

  const submit = () => {
    setError(null);
    // Spec'leri kategori şeması sırasına göre diz (detayda tutarlı sıra), sonra şema-dışı.
    const orderedSpecs = [
      ...schema
        .map((a) => p.specs.find((s) => s.attributeId === a.attributeId))
        .filter((s): s is EditorProduct["specs"][number] => Boolean(s)),
      ...legacyRows.map(({ s }) => s),
    ];
    startTransition(async () => {
      const res = await upsertProduct({
        id: p.id || undefined,
        sku: p.sku,
        slug: p.slug,
        material: p.material,
        partType: p.partType,
        categoryId: p.categoryId,
        brandId: p.brandId,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        translations: p.translations,
        specs: orderedSpecs,
        oem: p.oem,
      });
      if (res.ok) {
        router.push("/admin/products");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const tabs: { id: Tab; label: string; count: number | null }[] = [
    { id: "overview", label: "Temel", count: null },
    { id: "specs", label: "Teknik Özellikler", count: p.specs.length },
    { id: "cross", label: "OEM Çapraz Ref.", count: p.oem.length },
    { id: "media", label: "Görseller", count: images.length || null },
    { id: "docs", label: "Dokümanlar", count: datasheets.length || null },
    { id: "seo", label: "SEO", count: null },
  ];

  return (
    <div className="mv-page">
      {/* Header */}
      <div className="iq-head">
        <div>
          <div className="iq-head__crumb">
            <Link href="/admin/products">ÜRÜNLER</Link> / {mode === "new" ? "YENİ" : "DÜZENLE"}
          </div>
          <div className="iq-head__title">
            <span>{mode === "new" ? "Yeni ürün" : p.translations.TR.name || p.sku}</span>
            {mode === "new" && <span className="pe-tag">KAYDEDİLMEDİ</span>}
          </div>
          <div className="iq-head__meta">
            <span className="mv-mono mv-ref">{p.sku || "MNV-XX-0000"}</span>
            <span>·</span>
            <span className={"mv-pill mv-pill--" + (p.isActive ? "ok" : "warn")}>
              {p.isActive ? "Yayında" : "Taslak"}
            </span>
          </div>
        </div>
        <div className="iq-head__actions">
          <Link href="/admin/products" className="mv-btn mv-btn--ghost">
            İptal
          </Link>
          <button className="mv-btn mv-btn--primary" onClick={submit} disabled={pending}>
            {pending ? "Kaydediliyor…" : mode === "new" ? "Ürünü yayımla" : "Değişiklikleri kaydet"}
          </button>
        </div>
      </div>

      {error && (
        <div className="pe-error" role="alert">
          {error}
        </div>
      )}

      {/* Tab nav */}
      <div className="pe-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={"pe-tab" + (tab === t.id ? " pe-tab--on" : "")}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.count !== null && <span className="pe-tab__count">{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="pe-grid">
        <div className="pe-main">
          {/* ── TEMEL ── */}
          {tab === "overview" && (
            <>
              <div className="mv-card mv-card--flush">
                <div className="pe-langs">
                  {EDITOR_LOCALES.map((L) => {
                    const st = localeStatus(L.code);
                    return (
                      <button
                        key={L.code}
                        className={"pe-lang" + (lang === L.code ? " pe-lang--on" : "")}
                        onClick={() => setLang(L.code)}
                      >
                        <span className="pe-lang__code">
                          {L.code} <em>· {L.label}</em>
                        </span>
                        <span className={"pe-lang__st pe-lang__st--" + st} />
                      </button>
                    );
                  })}
                </div>
                <div className="pe-body">
                  <div className="pe-sectitle">
                    Temel bilgiler · <b>{lang}</b>
                  </div>
                  <label className="pe-field">
                    <span className="pe-label">
                      Ürün adı <i>{lang}</i>
                      <em>{cur.name.length} / 120</em>
                    </span>
                    <input
                      value={cur.name}
                      onChange={(e) => setTr("name", e.target.value)}
                      placeholder="Ürün adı…"
                      dir={rtl ? "rtl" : "ltr"}
                    />
                  </label>
                  <label className="pe-field">
                    <span className="pe-label">
                      Kısa açıklama <i>{lang}</i>
                      <em>{cur.shortDesc.length} / 400</em>
                    </span>
                    <textarea
                      rows={2}
                      value={cur.shortDesc}
                      onChange={(e) => setTr("shortDesc", e.target.value)}
                      dir={rtl ? "rtl" : "ltr"}
                    />
                  </label>
                  <label className="pe-field">
                    <span className="pe-label">
                      Açıklama <i>{lang}</i>
                    </span>
                    <textarea
                      rows={5}
                      value={cur.description}
                      onChange={(e) => setTr("description", e.target.value)}
                      dir={rtl ? "rtl" : "ltr"}
                    />
                  </label>
                  <div className="pe-i18n">
                    🌐 <b>{completeCount} / 4</b> dil tamamlandı — eksik çeviride site
                    İngilizce{"'"}ye düşer.
                  </div>
                </div>
              </div>

              <div className="mv-card iq-pad">
                <div className="pe-sectitle">Kimlik & sınıflandırma</div>
                <div className="pe-row3">
                  <label className="pe-field">
                    <span className="pe-label">MNV Referansı (SKU) <b className="pe-req">*</b></span>
                    <input
                      className="mv-mono"
                      value={p.sku}
                      onChange={(e) => onSkuChange(e.target.value)}
                      placeholder="MNV-XX-0000"
                    />
                  </label>
                  <label className="pe-field">
                    <span className="pe-label">Malzeme</span>
                    <input
                      value={p.material}
                      onChange={(e) => set("material", e.target.value)}
                      placeholder="Örn. Çelik"
                    />
                  </label>
                  <label className="pe-field">
                    <span className="pe-label">Kategori <b className="pe-req">*</b></span>
                    <select
                      value={p.categoryId}
                      onChange={(e) => set("categoryId", e.target.value)}
                    >
                      <option value="">— Kategori seçin —</option>
                      {options.categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="pe-field">
                    <span className="pe-label">Marka</span>
                    <select
                      value={p.brandId}
                      onChange={(e) => set("brandId", e.target.value)}
                    >
                      <option value="">— Marka yok —</option>
                      {options.brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="pe-field">
                    <span className="pe-label">Parça tipi</span>
                    <select
                      value={p.partType}
                      onChange={(e) => set("partType", e.target.value as "OEM" | "AFTERMARKET")}
                    >
                      <option value="AFTERMARKET">Aftermarket</option>
                      <option value="OEM">OEM</option>
                    </select>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* ── TEKNİK ÖZELLİKLER (kategori şeması sürücü) ── */}
          {tab === "specs" && (
            <div className="mv-card iq-pad">
              <div className="pe-sectitle">Teknik özellikler</div>

              {schema.length > 0 ? (
                <>
                  <div className="pe-schemanote">
                    Alanlar <b>{options.categories.find((c) => c.id === p.categoryId)?.label ?? "kategori"}</b> şemasından gelir.
                    Yalnız değerleri girin; alanları kategori editöründen yönetin.
                  </div>
                  <div className="pe-rows">
                    <div className="pe-rows__head pe-specrow">
                      <span>Özellik</span>
                      <span>Değer</span>
                      <span>Birim</span>
                      <span />
                    </div>
                    {schema.map((a) => (
                      <div className="pe-specrow" key={a.attributeId}>
                        <span className="pe-schemakey">
                          {a.name}
                          {a.required && <i className="pe-reqmark">*</i>}
                        </span>
                        <input
                          value={valueOf(a.attributeId)}
                          onChange={(e) => setSchemaValue(a, e.target.value)}
                          placeholder="Değer girin…"
                        />
                        <span className="pe-schemaunit">{a.unit || "—"}</span>
                        <span />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="pe-schemanote pe-schemanote--warn">
                    Bu kategoride teknik özellik şeması tanımlı değil. Tutarlı alanlar için
                    kategori editöründen şema ekleyin; ya da aşağıya serbest satır girin.
                  </div>
                  <div className="pe-rows">
                    <div className="pe-rows__head pe-specrow">
                      <span>Özellik</span>
                      <span>Değer</span>
                      <span>Birim</span>
                      <span />
                    </div>
                    {legacyRows.map(({ s, idx }) => (
                      <div className="pe-specrow" key={idx}>
                        <input value={s.key} onChange={(e) => setSpec(idx, "key", e.target.value)} placeholder="Örn. Çap" />
                        <input value={s.value} onChange={(e) => setSpec(idx, "value", e.target.value)} placeholder="Örn. 120" />
                        <input value={s.unit} onChange={(e) => setSpec(idx, "unit", e.target.value)} placeholder="mm" />
                        <button type="button" className="pe-del" onClick={() => delSpec(idx)} aria-label="Sil">×</button>
                      </div>
                    ))}
                    {legacyRows.length === 0 && <div className="pe-empty">Henüz özellik yok.</div>}
                  </div>
                  <button type="button" className="mv-btn mv-btn--ghost pe-add" onClick={addSpec}>
                    + Satır ekle
                  </button>
                </>
              )}

              {/* Şema mevcutken kalan eski/şema-dışı satırlar */}
              {schema.length > 0 && legacyRows.length > 0 && (
                <div className="pe-legacy">
                  <div className="pe-legacy__t">Şema dışı (eski) satırlar</div>
                  {legacyRows.map(({ s, idx }) => (
                    <div className="pe-specrow" key={idx}>
                      <input value={s.key} onChange={(e) => setSpec(idx, "key", e.target.value)} placeholder="Özellik" />
                      <input value={s.value} onChange={(e) => setSpec(idx, "value", e.target.value)} placeholder="Değer" />
                      <input value={s.unit} onChange={(e) => setSpec(idx, "unit", e.target.value)} placeholder="Birim" />
                      <button type="button" className="pe-del" onClick={() => delSpec(idx)} aria-label="Sil">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── OEM ── */}
          {tab === "cross" && (
            <div className="mv-card iq-pad">
              <div className="pe-sectitle">OEM çapraz referanslar</div>
              <div className="pe-rows">
                <div className="pe-rows__head pe-oemrow">
                  <span>Üretici (marka)</span>
                  <span>OEM numarası</span>
                  <span />
                </div>
                {p.oem.map((o, i) => (
                  <div className="pe-oemrow" key={i}>
                    <input value={o.manufacturer} onChange={(e) => setOem(i, "manufacturer", e.target.value)} placeholder="Örn. Mercedes-Benz" />
                    <input className="mv-mono" value={o.oemNumber} onChange={(e) => setOem(i, "oemNumber", e.target.value)} placeholder="0024297732" />
                    <button type="button" className="pe-del" onClick={() => delOem(i)} aria-label="Sil">×</button>
                  </div>
                ))}
                {p.oem.length === 0 && <div className="pe-empty">Henüz OEM referansı yok.</div>}
              </div>
              <button type="button" className="mv-btn mv-btn--ghost pe-add" onClick={addOem}>
                + Referans ekle
              </button>
            </div>
          )}

          {/* ── GÖRSELLER ── */}
          {tab === "media" &&
            (mode === "edit" && p.id ? (
              <ProductImages productId={p.id} images={images} />
            ) : (
              <div className="mv-card iq-pad">
                <div className="pe-sectitle">Görseller</div>
                <div className="pe-ph">
                  Görsel eklemek için önce ürünü kaydedin. Kaydettikten sonra bu
                  sekmede sürükle-bırak görsel yönetimi açılır.
                </div>
              </div>
            ))}
          {tab === "docs" &&
            (mode === "edit" && p.id ? (
              <ProductDatasheets productId={p.id} datasheets={datasheets} />
            ) : (
              <div className="mv-card iq-pad">
                <div className="pe-sectitle">Dokümanlar (Datasheet)</div>
                <div className="pe-ph">
                  Datasheet eklemek için önce ürünü kaydedin. Kaydettikten sonra bu
                  sekmede dil bazlı PDF yükleme açılır.
                </div>
              </div>
            ))}

          {/* ── SEO ── */}
          {tab === "seo" && (
            <div className="mv-card iq-pad">
              <div className="pe-sectitle">
                Arama & sosyal · <b>{lang}</b>
              </div>
              <div className="pe-langs pe-langs--inline">
                {EDITOR_LOCALES.map((L) => (
                  <button
                    key={L.code}
                    className={"pe-langmini" + (lang === L.code ? " pe-langmini--on" : "")}
                    onClick={() => setLang(L.code)}
                  >
                    {L.code}
                  </button>
                ))}
              </div>
              <label className="pe-field">
                <span className="pe-label">
                  Meta başlık <i>{lang}</i>
                  <em>{cur.metaTitle.length} / 70</em>
                </span>
                <input
                  value={cur.metaTitle}
                  onChange={(e) => setTr("metaTitle", e.target.value)}
                  placeholder={`MONIVA ${p.sku || ""} — ${cur.name || "Ürün"}`}
                  dir={rtl ? "rtl" : "ltr"}
                />
              </label>
              <label className="pe-field">
                <span className="pe-label">
                  Meta açıklama <i>{lang}</i>
                  <em>{cur.metaDesc.length} / 160</em>
                </span>
                <textarea
                  rows={2}
                  value={cur.metaDesc}
                  onChange={(e) => setTr("metaDesc", e.target.value)}
                  dir={rtl ? "rtl" : "ltr"}
                />
              </label>
              <div className="pe-serp">
                <div className="pe-serp__url">moniva.com.tr › urunler › {p.slug || "..."}</div>
                <div className="pe-serp__title">{cur.metaTitle || `MONIVA ${p.sku} — ${cur.name || "Ürün"}`}</div>
                <div className="pe-serp__desc">{cur.metaDesc || cur.shortDesc || "Meta açıklama önizlemesi."}</div>
              </div>
            </div>
          )}
        </div>

        {/* ── SIDEBAR ── */}
        <div className="pe-side">
          <div className="mv-card iq-pad">
            <div className="iq-cardhead__ttl iq-side__ttl">Durum</div>
            <div className="pe-statusrow">
              <span>Yayında (görünür)</span>
              <Toggle on={p.isActive} onClick={() => set("isActive", !p.isActive)} />
            </div>
            <div className="pe-statusrow">
              <span>Anasayfada öne çıkar</span>
              <Toggle on={p.isFeatured} onClick={() => set("isFeatured", !p.isFeatured)} />
            </div>
            {mode === "edit" && p.slug && (
              <div className="pe-liveurl">
                <div className="pe-liveurl__k">Canlı URL</div>
                <Link href={`/urunler/${p.slug}`} target="_blank" className="mv-mono">
                  /urunler/{p.slug}
                </Link>
              </div>
            )}
            <label className="pe-field pe-slugfield">
              <span className="pe-label">Slug</span>
              <input
                className="mv-mono"
                value={p.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value);
                }}
                placeholder="mnv-xx-0000"
              />
            </label>
          </div>

          {mode === "new" && (
            <div className="mv-card iq-pad">
              <div className="iq-cardhead__ttl iq-side__ttl">Oluşturma kontrol listesi</div>
              {[
                ["Temel bilgi (ad + kategori)", Boolean(p.translations.TR.name && p.categoryId)],
                ["Geçerli SKU", /^MNV-[A-Z0-9]{2}-\d{3,5}$/.test(p.sku)],
                ["En az 1 teknik özellik", p.specs.some((s) => s.key && s.value)],
                ["En az 1 OEM referansı", p.oem.some((o) => o.oemNumber)],
              ].map(([k, done]) => (
                <div className="pe-check" key={k as string}>
                  <span className={"pe-check__box" + (done ? " pe-check__box--on" : "")}>
                    {done ? "✓" : ""}
                  </span>
                  <span className={done ? "pe-check__done" : ""}>{k}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
