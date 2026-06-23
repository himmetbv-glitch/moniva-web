"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { NewsStatus } from "@prisma/client";

import { saveManagedPage } from "@/lib/actions/admin-managed-page";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { DocUploadField } from "@/components/admin/DocUploadField";
import { isDynamicSection } from "@/lib/pages/home-sections";
import {
  SECTION_STATUS_LABELS,
  type EditorManagedPage,
  type EditorSection,
} from "@/lib/admin/managed-page-editor-types";

type AnyData = Record<string, unknown>;
type CategoryOption = { slug: string; name: string };

export function ManagedPageEditor({
  initial,
  categoryOptions,
}: {
  initial: EditorManagedPage;
  categoryOptions: CategoryOption[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [sections, setSections] = useState<EditorSection[]>(initial.sections);
  const [status, setStatus] = useState<NewsStatus>(initial.status);
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle ?? "");
  const [seoDesc, setSeoDesc] = useState(initial.seoDesc ?? "");
  const [canonical, setCanonical] = useState(initial.canonical ?? "");
  const [activeKey, setActiveKey] = useState(initial.sections[0]?.key ?? "");
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const active = sections.find((s) => s.key === activeKey) ?? null;

  function touch() {
    setDirty(true);
    setMsg(null);
  }

  function updateData(key: string, data: AnyData) {
    setSections((prev) => prev.map((s) => (s.key === key ? { ...s, data } : s)));
    touch();
  }

  function toggleVisible(key: string) {
    setSections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, visible: !s.visible } : s)),
    );
    touch();
  }

  function move(key: string, dir: -1 | 1) {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.key === key);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy.map((s, i) => ({ ...s, order: i + 1 }));
    });
    touch();
  }

  function save() {
    start(async () => {
      const payload = {
        key: initial.key,
        status,
        seoTitle: seoTitle.trim() || null,
        seoDesc: seoDesc.trim() || null,
        canonical: canonical.trim() || null,
        sections: sections.map((s) => ({
          key: s.key,
          order: s.order,
          visible: s.visible,
          data: s.data,
        })),
      };
      const res = await saveManagedPage(payload);
      if (res.ok) {
        setDirty(false);
        setMsg({ ok: true, text: "Kaydedildi." });
        router.refresh();
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  }

  return (
    <div className="mv-page">
      <div className="iq-head">
        <div>
          <div className="iq-head__crumb">PAGES / EDIT</div>
          <div className="iq-head__title">
            <span>{initial.title}</span>
            <span className={`mv-pill mv-pill--${status === "PUBLISHED" ? "ok" : status === "DRAFT" ? "warn" : "mute"}`}>
              {SECTION_STATUS_LABELS[status]}
            </span>
          </div>
          <div className="iq-head__meta">
            <span className="mv-mono">{initial.path}</span>
            <span className="mv-sep"> · </span>
            <span>{sections.length} bölüm</span>
          </div>
        </div>
        <div className="iq-head__actions mp-actions">
          <a href={initial.path} target="_blank" rel="noreferrer" className="mv-btn mv-btn--ghost">
            Önizle ↗
          </a>
          <select
            className="mp-statussel"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as NewsStatus);
              touch();
            }}
          >
            <option value="PUBLISHED">Yayında</option>
            <option value="DRAFT">Taslak</option>
            <option value="ARCHIVED">Arşiv</option>
          </select>
          <button
            type="button"
            className="mv-btn mv-btn--primary"
            disabled={pending || !dirty}
            onClick={save}
          >
            {pending ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`mp-msg mp-msg--${msg.ok ? "ok" : "err"}`}>{msg.text}</div>
      )}

      <div className="mp-grid">
        {/* Sol: bölüm listesi */}
        <div className="mv-card mp-seclist">
          <div className="mp-seclist__head">PAGE SECTIONS</div>
          {sections.map((s, i) => {
            const on = s.key === activeKey;
            return (
              <div
                key={s.key}
                className={"mp-secrow" + (on ? " mp-secrow--on" : "")}
                onClick={() => setActiveKey(s.key)}
              >
                <span className="mp-secrow__no">{String(i + 1).padStart(2, "0")}</span>
                <div className="mp-secrow__meta">
                  <div className="mp-secrow__name">{s.name}</div>
                  <div className="mp-secrow__kind">{s.kind}</div>
                </div>
                <div className="mp-secrow__tools" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="mp-iconbtn"
                    disabled={i === 0}
                    onClick={() => move(s.key, -1)}
                    aria-label="Yukarı"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="mp-iconbtn"
                    disabled={i === sections.length - 1}
                    onClick={() => move(s.key, 1)}
                    aria-label="Aşağı"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    className={"mp-eye" + (s.visible ? " mp-eye--on" : "")}
                    onClick={() => toggleVisible(s.key)}
                    aria-label={s.visible ? "Görünür" : "Gizli"}
                    title={s.visible ? "Görünür" : "Gizli"}
                  >
                    {s.visible ? "●" : "○"}
                  </button>
                </div>
              </div>
            );
          })}
          <div className="mp-seclist__foot">
            Bölüm ekleme/silme kapalı — anasayfa bölümleri sabit. Sıralama ve görünürlük düzenlenebilir.
          </div>
        </div>

        {/* Sağ: içerik alanları + SEO */}
        <div className="mp-secedit">
          {active && (
            <div className="mv-card iq-pad">
              <div className="mp-edhead">
                <div>
                  <div className="mp-edhead__kind">{active.kind}</div>
                  <div className="mp-edhead__name">{active.name}</div>
                  {active.sub && <div className="mp-edhead__sub">{active.sub}</div>}
                </div>
                <label className="mp-vis">
                  <span>Görünür</span>
                  <button
                    type="button"
                    className={"pe-toggle" + (active.visible ? " pe-toggle--on" : "")}
                    onClick={() => toggleVisible(active.key)}
                  />
                </label>
              </div>

              {isDynamicSection(active.type) && (
                <div className="mp-note">
                  Bu bölümün içeriği otomatik gelir (ilgili modülden). Burada yalnızca
                  başlık ve etiketleri düzenlersiniz.
                </div>
              )}

              <div className="mp-fields">
                <SectionFields
                  section={active}
                  pageKey={initial.key}
                  categoryOptions={categoryOptions}
                  onChange={(d) => updateData(active.key, d)}
                />
              </div>
            </div>
          )}

          <div className="mv-card iq-pad mp-seo">
            <div className="mp-edhead__kind">PAGE SEO</div>
            <Field label="SEO başlığı">
              <input value={seoTitle} onChange={(e) => { setSeoTitle(e.target.value); touch(); }} maxLength={200} />
            </Field>
            <Field label="Meta açıklama">
              <textarea rows={2} value={seoDesc} onChange={(e) => { setSeoDesc(e.target.value); touch(); }} maxLength={400} />
            </Field>
            <Field label="Canonical URL">
              <input value={canonical} onChange={(e) => { setCanonical(e.target.value); touch(); }} maxLength={300} placeholder="https://moniva.com.tr/" />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Ortak alan sarmalayıcı ───────────────────────────────── */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="pe-field">
      <span className="pe-label">
        {label}
        {hint && <em>{hint}</em>}
      </span>
      {children}
    </label>
  );
}

/* ── Tip-bazlı içerik alanları ────────────────────────────── */
function SectionFields({
  section,
  pageKey,
  categoryOptions,
  onChange,
}: {
  section: EditorSection;
  pageKey: string;
  categoryOptions: CategoryOption[];
  onChange: (d: AnyData) => void;
}) {
  const d = section.data;
  const set = (patch: AnyData) => onChange({ ...d, ...patch });

  switch (section.type) {
    case "HERO":
      return <HeroFields d={d} set={set} onChange={onChange} pageKey={pageKey} />;
    case "CATEGORY_GRID":
      return <CategoryGridFields d={d} set={set} onChange={onChange} pageKey={pageKey} categoryOptions={categoryOptions} />;
    case "FEATURED_PRODUCTS":
      return (
        <>
          <Field label="Bölüm başlığı"><input value={str(d.title)} onChange={(e) => set({ title: e.target.value })} /></Field>
          <div className="mp-2col">
            <Field label="Bağlantı etiketi"><input value={str(d.ctaLabel)} onChange={(e) => set({ ctaLabel: e.target.value })} /></Field>
            <Field label="Bağlantı yolu"><input value={str(d.ctaHref)} onChange={(e) => set({ ctaHref: e.target.value })} /></Field>
          </div>
          <Field label="Çizgi genişliği (px)"><input type="number" value={num(d.ruleWidth)} onChange={(e) => set({ ruleWidth: Number(e.target.value) })} /></Field>
        </>
      );
    case "FEATURE_COLUMNS":
      return <PillarsFields d={d} set={set} onChange={onChange} pageKey={pageKey} />;
    case "REGION_GRID":
      return <RegionFields d={d} set={set} onChange={onChange} pageKey={pageKey} />;
    case "NEWSROOM":
      return (
        <>
          <div className="mp-2col">
            <Field label="Ana başlık"><input value={str(d.title)} onChange={(e) => set({ title: e.target.value })} /></Field>
            <Field label="Yan başlık"><input value={str(d.sideTitle)} onChange={(e) => set({ sideTitle: e.target.value })} /></Field>
          </div>
          <div className="mp-2col">
            <Field label="Ana çizgi (px)"><input type="number" value={num(d.ruleWidth)} onChange={(e) => set({ ruleWidth: Number(e.target.value) })} /></Field>
            <Field label="Yan çizgi (px)"><input type="number" value={num(d.sideRuleWidth)} onChange={(e) => set({ sideRuleWidth: Number(e.target.value) })} /></Field>
          </div>
        </>
      );
    case "PARTNER_MARQUEE":
      return <BrandsFields d={d} onChange={onChange} />;
    case "CONTACT_CTA":
      return <ContactCtaFields d={d} set={set} onChange={onChange} pageKey={pageKey} />;
    case "ABOUT_HERO":
      return <AboutHeroFields d={d} set={set} onChange={onChange} pageKey={pageKey} />;
    case "ABOUT_FACILITY":
      return <AboutFacilityFields d={d} set={set} onChange={onChange} pageKey={pageKey} />;
    case "ABOUT_MV":
      return <AboutMvFields d={d} onChange={onChange} />;
    case "ABOUT_TIMELINE":
      return <AboutTimelineFields d={d} set={set} onChange={onChange} pageKey={pageKey} />;
    case "ABOUT_CERTS":
      return <AboutCertsFields d={d} set={set} onChange={onChange} pageKey={pageKey} />;
    case "ABOUT_CTA":
      return <AboutCtaFields d={d} set={set} onChange={onChange} pageKey={pageKey} />;
    case "QUALITY_BANNER":
      return <QualityBannerFields d={d} set={set} onChange={onChange} pageKey={pageKey} />;
    case "QUALITY_MISSION":
      return <QualityMissionFields d={d} set={set} onChange={onChange} pageKey={pageKey} />;
    case "QUALITY_STANDARDS":
      return <QualityStandardsFields d={d} set={set} onChange={onChange} pageKey={pageKey} />;
    case "QUALITY_DOCS":
      return <QualityDocsFields d={d} set={set} onChange={onChange} pageKey={pageKey} />;
    case "CAREERS_INFO":
      return <CareersInfoFields d={d} set={set} onChange={onChange} pageKey={pageKey} />;
    case "CONTACT_HERO":
      return <ContactHeroFields d={d} set={set} onChange={onChange} pageKey={pageKey} />;
    case "CONTACT_INFO":
      return <ContactInfoFields d={d} set={set} onChange={onChange} pageKey={pageKey} />;
    case "CONTACT_QUICK":
      return <ContactQuickFields d={d} set={set} onChange={onChange} pageKey={pageKey} />;
    case "CONTACT_LOC":
      return <ContactLocFields d={d} set={set} onChange={onChange} pageKey={pageKey} />;
    case "CONTACT_DEPTS":
      return <ContactDeptsFields d={d} set={set} onChange={onChange} pageKey={pageKey} />;
    case "CATALOG_BANNER":
      return <CatalogBannerFields d={d} set={set} onChange={onChange} pageKey={pageKey} />;
    case "CATALOG_CARD":
      return <CatalogCardFields d={d} set={set} onChange={onChange} pageKey={pageKey} />;
    case "PRODUCT_DETAIL":
      return <ProductDetailFields d={d} set={set} onChange={onChange} pageKey={pageKey} />;
    default:
      return null;
  }
}

/* ── Katalog alanları ─────────────────────────────────────── */
function CatalogBannerFields({ d, set }: FieldsProps) {
  return (
    <>
      <div className="mp-note">İstatistik <b>sayıları</b> otomatik (ürün/aile/marka adedi); burada yalnızca etiketler.</div>
      <div className="mp-2col">
        <Field label="Breadcrumb etiketi"><input value={str(d.crumbLabel)} onChange={(e) => set({ crumbLabel: e.target.value })} /></Field>
        <Field label="Üst etiket (kicker)"><input value={str(d.kicker)} onChange={(e) => set({ kicker: e.target.value })} /></Field>
      </div>
      <Field label="Başlık"><input value={str(d.title)} onChange={(e) => set({ title: e.target.value })} /></Field>
      <Field label="Alt metin"><textarea rows={3} value={str(d.subtitle)} onChange={(e) => set({ subtitle: e.target.value })} /></Field>
      <div className="mp-3col">
        <Field label="İstatistik 1 etiketi"><input value={str(d.statProduct)} onChange={(e) => set({ statProduct: e.target.value })} /></Field>
        <Field label="İstatistik 2 etiketi"><input value={str(d.statFamily)} onChange={(e) => set({ statFamily: e.target.value })} /></Field>
        <Field label="İstatistik 3 etiketi"><input value={str(d.statBrand)} onChange={(e) => set({ statBrand: e.target.value })} /></Field>
      </div>
    </>
  );
}

function CatalogCardFields({ d, set }: FieldsProps) {
  return (
    <>
      <Field label="Teklif metni" hint="kartta nokta yanında"><input value={str(d.quoteText)} onChange={(e) => set({ quoteText: e.target.value })} /></Field>
      <div className="mp-2col">
        <Field label="Ekle butonu"><input value={str(d.addLabel)} onChange={(e) => set({ addLabel: e.target.value })} /></Field>
        <Field label="Eklendi metni"><input value={str(d.addedLabel)} onChange={(e) => set({ addedLabel: e.target.value })} /></Field>
      </div>
    </>
  );
}

function ProductDetailFields({ d, set, onChange }: FieldsProps) {
  const rows = arr(d.rows);
  const setR = (i: number, patch: AnyData) => onChange({ ...d, rows: rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  const add = () => onChange({ ...d, rows: [...rows, { label: "", value: "" }] });
  const del = (i: number) => onChange({ ...d, rows: rows.filter((_, j) => j !== i) });
  return (
    <>
      <Field label="Hızlı Bilgi başlığı"><input value={str(d.quickHeading)} onChange={(e) => set({ quickHeading: e.target.value })} /></Field>
      <div className="mp-group__ttl mp-sub">Hızlı Bilgi satırları</div>
      {rows.map((r, i) => (
        <div className="mp-group" key={i}>
          <div className="mp-group__ttl">
            <span>{i + 1}</span>
            <button type="button" className="mp-del" onClick={() => del(i)}>Sil</button>
          </div>
          <div className="mp-2col">
            <Field label="Etiket"><input value={str(r.label)} onChange={(e) => setR(i, { label: e.target.value })} /></Field>
            <Field label="Değer"><input value={str(r.value)} onChange={(e) => setR(i, { value: e.target.value })} /></Field>
          </div>
        </div>
      ))}
      <button type="button" className="mp-add" onClick={add}>+ Satır ekle</button>
      <div className="mp-group__ttl mp-sub">Bölüm başlıkları</div>
      <div className="mp-3col">
        <Field label="Teknik özellikler"><input value={str(d.specsHeading)} onChange={(e) => set({ specsHeading: e.target.value })} /></Field>
        <Field label="Dokümanlar"><input value={str(d.docsHeading)} onChange={(e) => set({ docsHeading: e.target.value })} /></Field>
        <Field label="Benzer ürünler"><input value={str(d.relatedHeading)} onChange={(e) => set({ relatedHeading: e.target.value })} /></Field>
      </div>
      <div className="mp-2col">
        <Field label="Ekle butonu"><input value={str(d.addLabel)} onChange={(e) => set({ addLabel: e.target.value })} /></Field>
        <Field label="Eklendi metni"><input value={str(d.addedLabel)} onChange={(e) => set({ addedLabel: e.target.value })} /></Field>
      </div>
    </>
  );
}

/* ── İletişim alanları ────────────────────────────────────── */
function LineListField({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <Field label={label} hint="her satır bir öğe">
      <textarea
        rows={3}
        value={value.join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n").map((l) => l.trim()).filter(Boolean))}
      />
    </Field>
  );
}

function ContactHeroFields({ d, set, onChange }: FieldsProps) {
  return (
    <>
      <div className="mp-2col">
        <Field label="Breadcrumb etiketi"><input value={str(d.crumbLabel)} onChange={(e) => set({ crumbLabel: e.target.value })} /></Field>
        <Field label="Üst etiket (eyebrow)"><input value={str(d.eyebrow)} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
      </div>
      <Field label="Başlık"><input value={str(d.title)} onChange={(e) => set({ title: e.target.value })} /></Field>
      <Field label="Giriş metni"><textarea rows={3} value={str(d.lead)} onChange={(e) => set({ lead: e.target.value })} /></Field>
      <StatRows d={d} onChange={onChange} label="İstatistikler" />
    </>
  );
}

function ContactInfoFields({ d, set, onChange }: FieldsProps) {
  return (
    <>
      <div className="mp-note">Telefon ve e-posta <b>değerleri</b> Ayarlar&apos;dan gelir; burada yalnızca etiketler düzenlenir.</div>
      <Field label="Üst etiket (eyebrow)"><input value={str(d.eyebrow)} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
      <Field label="Firma adı" hint="satır için Enter"><textarea rows={2} value={str(d.companyName)} onChange={(e) => set({ companyName: e.target.value })} /></Field>
      <Field label="Adres etiketi"><input value={str(d.addressLabel)} onChange={(e) => set({ addressLabel: e.target.value })} /></Field>
      <LineListField label="Adres satırları" value={arr(d.addressLines).map(String)} onChange={(v) => onChange({ ...d, addressLines: v })} />
      <div className="mp-2col">
        <Field label="Telefon etiketi"><input value={str(d.phoneLabel)} onChange={(e) => set({ phoneLabel: e.target.value })} /></Field>
        <Field label="E-posta etiketi"><input value={str(d.emailLabel)} onChange={(e) => set({ emailLabel: e.target.value })} /></Field>
      </div>
      <Field label="Çalışma saatleri etiketi"><input value={str(d.hoursLabel)} onChange={(e) => set({ hoursLabel: e.target.value })} /></Field>
      <LineListField label="Çalışma saatleri satırları" value={arr(d.hoursLines).map(String)} onChange={(v) => onChange({ ...d, hoursLines: v })} />
    </>
  );
}

function ContactQuickFields({ d, onChange }: FieldsProps) {
  const tiles = arr(d.tiles);
  const setT = (i: number, patch: AnyData) => onChange({ ...d, tiles: tiles.map((t, j) => (j === i ? { ...t, ...patch } : t)) });
  const add = () => onChange({ ...d, tiles: [...tiles, { icon: "✉", label: "", valueType: "custom", valueCustom: "", sub: "" }] });
  const del = (i: number) => onChange({ ...d, tiles: tiles.filter((_, j) => j !== i) });
  return (
    <>
      {tiles.map((t, i) => (
        <div className="mp-group" key={i}>
          <div className="mp-group__ttl">
            <span>Kart {i + 1}</span>
            <button type="button" className="mp-del" onClick={() => del(i)}>Sil</button>
          </div>
          <div className="mp-3col">
            <Field label="İkon"><input value={str(t.icon)} onChange={(e) => setT(i, { icon: e.target.value })} /></Field>
            <Field label="Başlık"><input value={str(t.label)} onChange={(e) => setT(i, { label: e.target.value })} /></Field>
            <Field label="Alt metin"><input value={str(t.sub)} onChange={(e) => setT(i, { sub: e.target.value })} /></Field>
          </div>
          <div className="mp-2col">
            <Field label="Değer kaynağı">
              <select value={str(t.valueType)} onChange={(e) => setT(i, { valueType: e.target.value })}>
                <option value="email">Ayarlar — E-posta</option>
                <option value="phone">Ayarlar — Telefon</option>
                <option value="custom">Özel metin</option>
              </select>
            </Field>
            <Field label="Özel değer" hint="kaynak: Özel">
              <input value={str(t.valueCustom)} disabled={str(t.valueType) !== "custom"} onChange={(e) => setT(i, { valueCustom: e.target.value })} />
            </Field>
          </div>
        </div>
      ))}
      <button type="button" className="mp-add" onClick={add}>+ Kart ekle</button>
    </>
  );
}

function ContactLocFields({ d, set, onChange }: FieldsProps) {
  return (
    <>
      <Field label="Üst etiket (eyebrow)"><input value={str(d.eyebrow)} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
      <Field label="Başlık"><input value={str(d.title)} onChange={(e) => set({ title: e.target.value })} /></Field>
      <Field label="Metin"><textarea rows={3} value={str(d.body)} onChange={(e) => set({ body: e.target.value })} /></Field>
      <Field label="Yol tarifi bağlantısı"><input value={str(d.directionsHref)} onChange={(e) => set({ directionsHref: e.target.value })} /></Field>
      <Field label="Harita bağlantısı"><input value={str(d.mapHref)} onChange={(e) => set({ mapHref: e.target.value })} /></Field>
      <Field label="Harita gömme (iframe src)"><input value={str(d.mapSrc)} onChange={(e) => set({ mapSrc: e.target.value })} /></Field>
      <div className="mp-group__ttl mp-sub">Adres kartı</div>
      <div className="mp-2col">
        <Field label="Kart başlığı"><input value={str(d.cardTitle)} onChange={(e) => set({ cardTitle: e.target.value })} /></Field>
        <Field label="Kart konumu"><input value={str(d.cardLocation)} onChange={(e) => set({ cardLocation: e.target.value })} /></Field>
      </div>
      <LineListField label="Kart adres satırları" value={arr(d.cardAddressLines).map(String)} onChange={(v) => onChange({ ...d, cardAddressLines: v })} />
      <div className="mp-2col">
        <Field label="Enlem"><input value={str(d.coordLat)} onChange={(e) => set({ coordLat: e.target.value })} /></Field>
        <Field label="Boylam"><input value={str(d.coordLng)} onChange={(e) => set({ coordLng: e.target.value })} /></Field>
      </div>
    </>
  );
}

function ContactDeptsFields({ d, set, onChange }: FieldsProps) {
  const depts = arr(d.depts);
  const setDept = (i: number, patch: AnyData) => onChange({ ...d, depts: depts.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const add = () => onChange({ ...d, depts: [...depts, { name: "", contact: "", hours: "" }] });
  const del = (i: number) => onChange({ ...d, depts: depts.filter((_, j) => j !== i) });
  return (
    <>
      <Field label="Üst etiket (eyebrow)"><input value={str(d.eyebrow)} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
      <Field label="Başlık"><input value={str(d.title)} onChange={(e) => set({ title: e.target.value })} /></Field>
      <div className="mp-note">Her departmanda telefon ve e-posta Ayarlar&apos;dan gösterilir.</div>
      {depts.map((c, i) => (
        <div className="mp-group" key={i}>
          <div className="mp-group__ttl">
            <span>{i + 1}</span>
            <button type="button" className="mp-del" onClick={() => del(i)}>Sil</button>
          </div>
          <Field label="Departman adı"><input value={str(c.name)} onChange={(e) => setDept(i, { name: e.target.value })} /></Field>
          <div className="mp-2col">
            <Field label="İlgili ekip"><input value={str(c.contact)} onChange={(e) => setDept(i, { contact: e.target.value })} /></Field>
            <Field label="Saatler"><input value={str(c.hours)} onChange={(e) => setDept(i, { hours: e.target.value })} /></Field>
          </div>
        </div>
      ))}
      <button type="button" className="mp-add" onClick={add}>+ Departman ekle</button>
    </>
  );
}

/* ── Kariyer alanları ─────────────────────────────────────── */
function CareersInfoFields({ d, set, onChange, pageKey }: FieldsProps) {
  return (
    <>
      <Field label="Breadcrumb etiketi"><input value={str(d.crumbLabel)} onChange={(e) => set({ crumbLabel: e.target.value })} /></Field>
      <ImageUploadField
        label="Görsel"
        value={str(d.image)}
        uploadUrl={`/api/admin/pages/${pageKey}/images`}
        onChange={(url) => set({ image: url })}
      />
      <div className="mp-2col">
        <Field label="Başlık — vurgu"><input value={str(d.titleAccent)} onChange={(e) => set({ titleAccent: e.target.value })} /></Field>
        <Field label="Başlık — devamı"><input value={str(d.titleRest)} onChange={(e) => set({ titleRest: e.target.value })} /></Field>
      </div>
      <Field label="Giriş metni"><textarea rows={3} value={str(d.lead)} onChange={(e) => set({ lead: e.target.value })} /></Field>
      <StatRows d={d} onChange={onChange} label="İstatistikler" />
      <div className="mp-group__ttl mp-sub">E-posta kutusu</div>
      <Field label="Başlık"><input value={str(d.emailLabel)} onChange={(e) => set({ emailLabel: e.target.value })} /></Field>
      <div className="mp-3col">
        <Field label="Öncesi"><input value={str(d.emailPre)} onChange={(e) => set({ emailPre: e.target.value })} /></Field>
        <Field label="E-posta"><input value={str(d.emailAddr)} onChange={(e) => set({ emailAddr: e.target.value })} /></Field>
        <Field label="Sonrası"><input value={str(d.emailPost)} onChange={(e) => set({ emailPost: e.target.value })} /></Field>
      </div>
    </>
  );
}

/* ── Kalite alanları ──────────────────────────────────────── */
function QualityBannerFields({ d, set, onChange }: FieldsProps) {
  return (
    <>
      <div className="mp-2col">
        <Field label="Breadcrumb etiketi"><input value={str(d.crumbLabel)} onChange={(e) => set({ crumbLabel: e.target.value })} /></Field>
        <Field label="Üst etiket (eyebrow)"><input value={str(d.eyebrow)} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
      </div>
      <Field label="Başlık"><input value={str(d.title)} onChange={(e) => set({ title: e.target.value })} /></Field>
      <Field label="Alt metin"><textarea rows={3} value={str(d.sub)} onChange={(e) => set({ sub: e.target.value })} /></Field>
      <StatRows d={d} onChange={onChange} label="İstatistikler" />
    </>
  );
}

function QualityMissionFields({ d, set, pageKey }: FieldsProps) {
  return (
    <>
      <Field label="Başlık"><input value={str(d.title)} onChange={(e) => set({ title: e.target.value })} /></Field>
      <Field label="Çizgi genişliği (px)"><input type="number" value={num(d.ruleWidth)} onChange={(e) => set({ ruleWidth: Number(e.target.value) })} /></Field>
      <Field label="Giriş paragrafı"><textarea rows={4} value={str(d.lead)} onChange={(e) => set({ lead: e.target.value })} /></Field>
      <Field label="İkinci paragraf"><textarea rows={4} value={str(d.body)} onChange={(e) => set({ body: e.target.value })} /></Field>
      <ImageUploadField
        label="Görsel"
        value={str(d.image)}
        uploadUrl={`/api/admin/pages/${pageKey}/images`}
        onChange={(url) => set({ image: url })}
      />
    </>
  );
}

function QualityStandardsFields({ d, set, onChange }: FieldsProps) {
  const std = arr(d.standards);
  const setS = (i: number, patch: AnyData) => onChange({ ...d, standards: std.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const add = () => onChange({ ...d, standards: [...std, { code: "", year: "", org: "", scope: "" }] });
  const del = (i: number) => onChange({ ...d, standards: std.filter((_, j) => j !== i) });
  return (
    <>
      <Field label="Başlık"><input value={str(d.title)} onChange={(e) => set({ title: e.target.value })} /></Field>
      <Field label="Çizgi genişliği (px)"><input type="number" value={num(d.ruleWidth)} onChange={(e) => set({ ruleWidth: Number(e.target.value) })} /></Field>
      <Field label="Alt açıklama"><textarea rows={2} value={str(d.sub)} onChange={(e) => set({ sub: e.target.value })} /></Field>
      <div className="mp-group__ttl mp-sub">Standartlar</div>
      {std.map((s, i) => (
        <div className="mp-group" key={i}>
          <div className="mp-group__ttl">
            <span>{i + 1}</span>
            <button type="button" className="mp-del" onClick={() => del(i)} disabled={std.length <= 1}>Sil</button>
          </div>
          <div className="mp-2col">
            <Field label="Kod"><input value={str(s.code)} onChange={(e) => setS(i, { code: e.target.value })} /></Field>
            <Field label="Yıl/Sürüm"><input value={str(s.year)} onChange={(e) => setS(i, { year: e.target.value })} /></Field>
          </div>
          <Field label="Kuruluş"><input value={str(s.org)} onChange={(e) => setS(i, { org: e.target.value })} /></Field>
          <Field label="Kapsam"><input value={str(s.scope)} onChange={(e) => setS(i, { scope: e.target.value })} /></Field>
        </div>
      ))}
      <button type="button" className="mp-add" onClick={add}>+ Standart ekle</button>
    </>
  );
}

function QualityDocsFields({ d, set, onChange, pageKey }: FieldsProps) {
  const docs = arr(d.docs);
  const setDoc = (i: number, patch: AnyData) => onChange({ ...d, docs: docs.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const add = () => onChange({ ...d, docs: [...docs, { name: "", lang: "", type: "pdf", size: "", flag: "🌐", fileUrl: "" }] });
  const del = (i: number) => onChange({ ...d, docs: docs.filter((_, j) => j !== i) });
  return (
    <>
      <Field label="Başlık"><input value={str(d.title)} onChange={(e) => set({ title: e.target.value })} /></Field>
      <Field label="Çizgi genişliği (px)"><input type="number" value={num(d.ruleWidth)} onChange={(e) => set({ ruleWidth: Number(e.target.value) })} /></Field>
      <Field label="Alt açıklama"><textarea rows={2} value={str(d.sub)} onChange={(e) => set({ sub: e.target.value })} /></Field>
      <div className="mp-group__ttl mp-sub">Belgeler</div>
      {docs.map((c, i) => (
        <div className="mp-group" key={i}>
          <div className="mp-group__ttl">
            <span>{i + 1}</span>
            <button type="button" className="mp-del" onClick={() => del(i)}>Sil</button>
          </div>
          <Field label="Ad"><input value={str(c.name)} onChange={(e) => setDoc(i, { name: e.target.value })} /></Field>
          <div className="mp-3col">
            <Field label="Tür">
              <select value={str(c.type)} onChange={(e) => setDoc(i, { type: e.target.value })}>
                <option value="pdf">PDF</option>
                <option value="img">IMG</option>
              </select>
            </Field>
            <Field label="Boyut"><input value={str(c.size)} onChange={(e) => setDoc(i, { size: e.target.value })} /></Field>
            <Field label="Bayrak"><input value={str(c.flag)} onChange={(e) => setDoc(i, { flag: e.target.value })} /></Field>
          </div>
          <Field label="Dil/Açıklama"><input value={str(c.lang)} onChange={(e) => setDoc(i, { lang: e.target.value })} /></Field>
          <DocUploadField
            label="Dosya (PDF / görsel)"
            value={str(c.fileUrl)}
            uploadUrl={`/api/admin/pages/${pageKey}/docs`}
            onUploaded={(r) => setDoc(i, { fileUrl: r.url, type: r.kind, size: r.size })}
            onUrlChange={(url) => setDoc(i, { fileUrl: url })}
            onClear={() => setDoc(i, { fileUrl: "" })}
          />
        </div>
      ))}
      <button type="button" className="mp-add" onClick={add}>+ Belge ekle</button>
    </>
  );
}

/* ── Hakkımızda alanları ──────────────────────────────────── */
function StatRows({ d, onChange, label }: { d: AnyData; onChange: (d: AnyData) => void; label: string }) {
  const stats = arr(d.stats);
  const setS = (i: number, patch: AnyData) => onChange({ ...d, stats: stats.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const add = () => onChange({ ...d, stats: [...stats, { v: "", l: "" }] });
  const del = (i: number) => onChange({ ...d, stats: stats.filter((_, j) => j !== i) });
  return (
    <>
      <div className="mp-group__ttl mp-sub">{label}</div>
      {stats.map((s, i) => (
        <div className="mp-group" key={i}>
          <div className="mp-group__ttl">
            <span>{i + 1}</span>
            <button type="button" className="mp-del" onClick={() => del(i)}>Sil</button>
          </div>
          <div className="mp-2col">
            <Field label="Değer"><input value={str(s.v)} onChange={(e) => setS(i, { v: e.target.value })} /></Field>
            <Field label="Etiket"><input value={str(s.l)} onChange={(e) => setS(i, { l: e.target.value })} /></Field>
          </div>
        </div>
      ))}
      <button type="button" className="mp-add" onClick={add}>+ İstatistik ekle</button>
    </>
  );
}

function AboutHeroFields({ d, set }: FieldsProps) {
  return (
    <Field label="Breadcrumb etiketi"><input value={str(d.crumbLabel)} onChange={(e) => set({ crumbLabel: e.target.value })} /></Field>
  );
}

function AboutFacilityFields({ d, set, onChange, pageKey }: FieldsProps) {
  return (
    <>
      <ImageUploadField
        label="Tesis görseli"
        value={str(d.image)}
        uploadUrl={`/api/admin/pages/${pageKey}/images`}
        onChange={(url) => set({ image: url })}
      />
      <Field label="Görsel altyazısı"><input value={str(d.caption)} onChange={(e) => set({ caption: e.target.value })} /></Field>
      <Field label="Üst etiket (eyebrow)"><input value={str(d.eyebrow)} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
      <Field label="Başlık"><input value={str(d.title)} onChange={(e) => set({ title: e.target.value })} /></Field>
      <Field label="Metin"><textarea rows={4} value={str(d.body)} onChange={(e) => set({ body: e.target.value })} /></Field>
      <StatRows d={d} onChange={onChange} label="İstatistikler" />
    </>
  );
}

function AboutMvFields({ d, onChange }: { d: AnyData; onChange: (d: AnyData) => void }) {
  const cols = arr(d.columns);
  const setC = (i: number, patch: AnyData) => onChange({ ...d, columns: cols.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const add = () => onChange({ ...d, columns: [...cols, { tag: "", title: "", body: "" }] });
  const del = (i: number) => onChange({ ...d, columns: cols.filter((_, j) => j !== i) });
  return (
    <>
      {cols.map((c, i) => (
        <div className="mp-group" key={i}>
          <div className="mp-group__ttl">
            <span>Sütun {i + 1}</span>
            <button type="button" className="mp-del" onClick={() => del(i)} disabled={cols.length <= 1}>Sil</button>
          </div>
          <Field label="Etiket (tag)"><input value={str(c.tag)} onChange={(e) => setC(i, { tag: e.target.value })} /></Field>
          <Field label="Başlık"><input value={str(c.title)} onChange={(e) => setC(i, { title: e.target.value })} /></Field>
          <Field label="Metin"><textarea rows={3} value={str(c.body)} onChange={(e) => setC(i, { body: e.target.value })} /></Field>
        </div>
      ))}
      <button type="button" className="mp-add" onClick={add} disabled={cols.length >= 4}>+ Sütun ekle</button>
    </>
  );
}

function AboutTimelineFields({ d, set, onChange }: FieldsProps) {
  const entries = arr(d.entries);
  const setE = (i: number, patch: AnyData) => onChange({ ...d, entries: entries.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
  const add = () => onChange({ ...d, entries: [...entries, { year: "", title: "", body: "" }] });
  const del = (i: number) => onChange({ ...d, entries: entries.filter((_, j) => j !== i) });
  return (
    <>
      <Field label="Üst etiket (eyebrow)"><input value={str(d.eyebrow)} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
      <Field label="Başlık"><input value={str(d.title)} onChange={(e) => set({ title: e.target.value })} /></Field>
      <div className="mp-group__ttl mp-sub">Kilometre taşları</div>
      {entries.map((e, i) => (
        <div className="mp-group" key={i}>
          <div className="mp-group__ttl">
            <span>{i + 1}</span>
            <button type="button" className="mp-del" onClick={() => del(i)} disabled={entries.length <= 1}>Sil</button>
          </div>
          <div className="mp-2col">
            <Field label="Yıl"><input value={str(e.year)} onChange={(ev) => setE(i, { year: ev.target.value })} /></Field>
            <Field label="Başlık"><input value={str(e.title)} onChange={(ev) => setE(i, { title: ev.target.value })} /></Field>
          </div>
          <Field label="Metin"><textarea rows={2} value={str(e.body)} onChange={(ev) => setE(i, { body: ev.target.value })} /></Field>
        </div>
      ))}
      <button type="button" className="mp-add" onClick={add}>+ Kilometre taşı ekle</button>
    </>
  );
}

function AboutCertsFields({ d, set, onChange }: FieldsProps) {
  const certs = arr(d.certs);
  const setC = (i: number, patch: AnyData) => onChange({ ...d, certs: certs.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const add = () => onChange({ ...d, certs: [...certs, { code: "", body: "" }] });
  const del = (i: number) => onChange({ ...d, certs: certs.filter((_, j) => j !== i) });
  return (
    <>
      <Field label="Üst etiket (eyebrow)"><input value={str(d.eyebrow)} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
      <Field label="Başlık"><input value={str(d.title)} onChange={(e) => set({ title: e.target.value })} /></Field>
      <div className="mp-group__ttl mp-sub">Sertifikalar</div>
      {certs.map((c, i) => (
        <div className="mp-group" key={i}>
          <div className="mp-group__ttl">
            <span>{i + 1}</span>
            <button type="button" className="mp-del" onClick={() => del(i)} disabled={certs.length <= 1}>Sil</button>
          </div>
          <Field label="Kod"><input value={str(c.code)} onChange={(e) => setC(i, { code: e.target.value })} /></Field>
          <Field label="Açıklama"><textarea rows={2} value={str(c.body)} onChange={(e) => setC(i, { body: e.target.value })} /></Field>
        </div>
      ))}
      <button type="button" className="mp-add" onClick={add}>+ Sertifika ekle</button>
    </>
  );
}

function AboutCtaFields({ d, set, onChange }: FieldsProps) {
  const contacts = arr(d.contacts);
  const setC = (i: number, patch: AnyData) => onChange({ ...d, contacts: contacts.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  return (
    <>
      <Field label="Üst etiket (eyebrow)"><input value={str(d.eyebrow)} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
      <Field label="Başlık"><textarea rows={2} value={str(d.title)} onChange={(e) => set({ title: e.target.value })} /></Field>
      <Field label="Metin"><textarea rows={2} value={str(d.body)} onChange={(e) => set({ body: e.target.value })} /></Field>
      <div className="mp-2col">
        <Field label="Birincil buton"><input value={str(d.primaryLabel)} onChange={(e) => set({ primaryLabel: e.target.value })} /></Field>
        <Field label="Birincil yol"><input value={str(d.primaryHref)} onChange={(e) => set({ primaryHref: e.target.value })} /></Field>
      </div>
      <div className="mp-2col">
        <Field label="İkincil buton"><input value={str(d.secondaryLabel)} onChange={(e) => set({ secondaryLabel: e.target.value })} /></Field>
        <Field label="İkincil yol"><input value={str(d.secondaryHref)} onChange={(e) => set({ secondaryHref: e.target.value })} /></Field>
      </div>
      <div className="mp-group__ttl mp-sub">İletişim kutuları</div>
      {contacts.map((c, i) => (
        <div className="mp-group" key={i}>
          <div className="mp-group__ttl">Kutu {i + 1}</div>
          <div className="mp-3col">
            <Field label="İkon"><input value={str(c.icon)} onChange={(e) => setC(i, { icon: e.target.value })} /></Field>
            <Field label="Etiket"><input value={str(c.label)} onChange={(e) => setC(i, { label: e.target.value })} /></Field>
            <Field label="Değer"><input value={str(c.value)} onChange={(e) => setC(i, { value: e.target.value })} /></Field>
          </div>
        </div>
      ))}
    </>
  );
}

function HeroFields({ d, set, onChange, pageKey }: FieldsProps) {
  const slides = arr(d.slides);
  const setSlide = (i: number, patch: AnyData) => {
    const next = slides.map((s, j) => (j === i ? { ...s, ...patch } : s));
    onChange({ ...d, slides: next });
  };
  const cta = (k: "ctaPrimary" | "ctaSecondary") => obj(d[k]);
  const setCta = (k: "ctaPrimary" | "ctaSecondary", patch: AnyData) => set({ [k]: { ...cta(k), ...patch } });

  return (
    <>
      {slides.map((s, i) => (
        <div className="mp-group" key={i}>
          <div className="mp-group__ttl">Slayt {i + 1}</div>
          <Field label="Başlık"><input value={str(s.head)} onChange={(e) => setSlide(i, { head: e.target.value })} /></Field>
          <Field label="Alt başlık"><textarea rows={2} value={str(s.sub)} onChange={(e) => setSlide(i, { sub: e.target.value })} /></Field>
          <ImageUploadField
            label="Görsel"
            value={str(s.img)}
            uploadUrl={`/api/admin/pages/${pageKey}/images`}
            onChange={(url) => setSlide(i, { img: url })}
          />
        </div>
      ))}
      <div className="mp-group">
        <div className="mp-group__ttl">Butonlar</div>
        <div className="mp-2col">
          <Field label="Birincil etiket"><input value={str(cta("ctaPrimary").label)} onChange={(e) => setCta("ctaPrimary", { label: e.target.value })} /></Field>
          <Field label="Birincil yol"><input value={str(cta("ctaPrimary").href)} onChange={(e) => setCta("ctaPrimary", { href: e.target.value })} /></Field>
        </div>
        <div className="mp-2col">
          <Field label="İkincil etiket"><input value={str(cta("ctaSecondary").label)} onChange={(e) => setCta("ctaSecondary", { label: e.target.value })} /></Field>
          <Field label="İkincil yol"><input value={str(cta("ctaSecondary").href)} onChange={(e) => setCta("ctaSecondary", { href: e.target.value })} /></Field>
        </div>
      </div>
    </>
  );
}

function CategoryGridFields({
  d,
  set,
  onChange,
  pageKey,
  categoryOptions,
}: FieldsProps & { categoryOptions: CategoryOption[] }) {
  const tiles = arr(d.tiles);
  const setTile = (i: number, patch: AnyData) =>
    onChange({ ...d, tiles: tiles.map((t, j) => (j === i ? { ...t, ...patch } : t)) });
  const add = () => onChange({ ...d, tiles: [...tiles, { categorySlug: "", image: "" }] });
  const remove = (i: number) => onChange({ ...d, tiles: tiles.filter((_, j) => j !== i) });
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= tiles.length) return;
    const copy = [...tiles];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange({ ...d, tiles: copy });
  };

  return (
    <>
      <Field label="Bölüm başlığı"><input value={str(d.title)} onChange={(e) => set({ title: e.target.value })} /></Field>
      <div className="mp-2col">
        <Field label="Bağlantı etiketi"><input value={str(d.ctaLabel)} onChange={(e) => set({ ctaLabel: e.target.value })} /></Field>
        <Field label="Bağlantı yolu"><input value={str(d.ctaHref)} onChange={(e) => set({ ctaHref: e.target.value })} /></Field>
      </div>
      <Field label="Çizgi genişliği (px)"><input type="number" value={num(d.ruleWidth)} onChange={(e) => set({ ruleWidth: Number(e.target.value) })} /></Field>

      <div className="mp-group__ttl mp-sub">Kategori kartları</div>
      <div className="mp-note">
        Hangi kategorilerin kart olarak görüneceğini seçin. Boş bırakılırsa otomatik
        olarak ilk kategoriler gösterilir.
      </div>
      {tiles.map((t, i) => (
        <div className="mp-group" key={i}>
          <div className="mp-group__ttl">
            <span>Kart {i + 1}</span>
            <span className="mp-tileord">
              <button type="button" className="mp-iconbtn" disabled={i === 0} onClick={() => move(i, -1)}>▲</button>
              <button type="button" className="mp-iconbtn" disabled={i === tiles.length - 1} onClick={() => move(i, 1)}>▼</button>
              <button type="button" className="mp-del" onClick={() => remove(i)}>Sil</button>
            </span>
          </div>
          <Field label="Kategori">
            <select value={str(t.categorySlug)} onChange={(e) => setTile(i, { categorySlug: e.target.value })}>
              <option value="">— Kategori seçin —</option>
              {categoryOptions.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </Field>
          <ImageUploadField
            label="Kart görseli"
            value={str(t.image)}
            uploadUrl={`/api/admin/pages/${pageKey}/images`}
            onChange={(url) => setTile(i, { image: url })}
          />
        </div>
      ))}
      <button type="button" className="mp-add" onClick={add} disabled={tiles.length >= 12}>+ Kategori kartı ekle</button>
    </>
  );
}

function PillarsFields({ d, set, onChange }: FieldsProps) {
  const pillars = arr(d.pillars);
  const setP = (i: number, patch: AnyData) =>
    onChange({ ...d, pillars: pillars.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const add = () => onChange({ ...d, pillars: [...pillars, { num: String(pillars.length + 1).padStart(2, "0"), title: "", body: "" }] });
  const remove = (i: number) => onChange({ ...d, pillars: pillars.filter((_, j) => j !== i) });

  return (
    <>
      <Field label="Bölüm başlığı"><input value={str(d.title)} onChange={(e) => set({ title: e.target.value })} /></Field>
      <Field label="Çizgi genişliği (px)"><input type="number" value={num(d.ruleWidth)} onChange={(e) => set({ ruleWidth: Number(e.target.value) })} /></Field>
      {pillars.map((p, i) => (
        <div className="mp-group" key={i}>
          <div className="mp-group__ttl">
            Sütun {i + 1}
            <button type="button" className="mp-del" onClick={() => remove(i)} disabled={pillars.length <= 1}>Sil</button>
          </div>
          <div className="mp-2col">
            <Field label="No"><input value={str(p.num)} onChange={(e) => setP(i, { num: e.target.value })} /></Field>
            <Field label="Başlık"><input value={str(p.title)} onChange={(e) => setP(i, { title: e.target.value })} /></Field>
          </div>
          <Field label="Metin"><textarea rows={2} value={str(p.body)} onChange={(e) => setP(i, { body: e.target.value })} /></Field>
        </div>
      ))}
      <button type="button" className="mp-add" onClick={add}>+ Sütun ekle</button>
    </>
  );
}

function RegionFields({ d, set, onChange, pageKey }: FieldsProps) {
  const regions = arr(d.regions);
  const stats = arr(d.stats);
  const setR = (i: number, patch: AnyData) => onChange({ ...d, regions: regions.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  const addR = () => onChange({ ...d, regions: [...regions, { region: "", countries: "", count: 0 }] });
  const delR = (i: number) => onChange({ ...d, regions: regions.filter((_, j) => j !== i) });
  const setS = (i: number, patch: AnyData) => onChange({ ...d, stats: stats.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const addS = () => onChange({ ...d, stats: [...stats, { v: "", l: "" }] });
  const delS = (i: number) => onChange({ ...d, stats: stats.filter((_, j) => j !== i) });

  return (
    <>
      <Field label="Bölüm başlığı"><input value={str(d.title)} onChange={(e) => set({ title: e.target.value })} /></Field>
      <Field label="Çizgi genişliği (px)"><input type="number" value={num(d.ruleWidth)} onChange={(e) => set({ ruleWidth: Number(e.target.value) })} /></Field>

      <div className="mp-group__ttl mp-sub">Bölgeler</div>
      {regions.map((r, i) => (
        <div className="mp-group" key={i}>
          <div className="mp-group__ttl">
            Bölge {i + 1}
            <button type="button" className="mp-del" onClick={() => delR(i)} disabled={regions.length <= 1}>Sil</button>
          </div>
          <div className="mp-2col">
            <Field label="Ad"><input value={str(r.region)} onChange={(e) => setR(i, { region: e.target.value })} /></Field>
            <Field label="Sayı"><input type="number" value={num(r.count)} onChange={(e) => setR(i, { count: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Ülkeler"><input value={str(r.countries)} onChange={(e) => setR(i, { countries: e.target.value })} /></Field>
        </div>
      ))}
      <button type="button" className="mp-add" onClick={addR}>+ Bölge ekle</button>

      <div className="mp-group__ttl mp-sub">İstatistikler</div>
      {stats.map((s, i) => (
        <div className="mp-group" key={i}>
          <div className="mp-group__ttl">
            İstatistik {i + 1}
            <button type="button" className="mp-del" onClick={() => delS(i)} disabled={stats.length <= 1}>Sil</button>
          </div>
          <div className="mp-2col">
            <Field label="Değer"><input value={str(s.v)} onChange={(e) => setS(i, { v: e.target.value })} /></Field>
            <Field label="Etiket"><input value={str(s.l)} onChange={(e) => setS(i, { l: e.target.value })} /></Field>
          </div>
        </div>
      ))}
      <button type="button" className="mp-add" onClick={addS}>+ İstatistik ekle</button>

      <div className="mp-group">
        <div className="mp-group__ttl">Distribütör kartı</div>
        <ImageUploadField
          label="Harita görseli"
          value={str(d.mapImage)}
          uploadUrl={`/api/admin/pages/${pageKey}/images`}
          onChange={(url) => set({ mapImage: url })}
        />
        <Field label="Kart başlığı"><input value={str(d.cardHead)} onChange={(e) => set({ cardHead: e.target.value })} /></Field>
        <Field label="Kart metni"><textarea rows={2} value={str(d.cardSub)} onChange={(e) => set({ cardSub: e.target.value })} /></Field>
        <Field label="Kart bağlantısı"><input value={str(d.cardHref)} onChange={(e) => set({ cardHref: e.target.value })} /></Field>
      </div>
    </>
  );
}

function BrandsFields({ d, onChange }: { d: AnyData; onChange: (d: AnyData) => void }) {
  const brands = (Array.isArray(d.brands) ? d.brands : []).map(String);
  return (
    <Field label="Markalar" hint="her satır bir marka">
      <textarea
        rows={8}
        value={brands.join("\n")}
        onChange={(e) =>
          onChange({ ...d, brands: e.target.value.split("\n").map((b) => b.trim()).filter(Boolean) })
        }
      />
    </Field>
  );
}

function ContactCtaFields({ d, set, onChange }: FieldsProps) {
  const contacts = arr(d.contacts);
  const setC = (i: number, patch: AnyData) => onChange({ ...d, contacts: contacts.map((c, j) => (j === i ? { ...c, ...patch } : c)) });

  return (
    <>
      <Field label="Üst etiket (kicker)"><input value={str(d.kicker)} onChange={(e) => set({ kicker: e.target.value })} /></Field>
      <Field label="Başlık"><textarea rows={2} value={str(d.head)} onChange={(e) => set({ head: e.target.value })} /></Field>
      <Field label="Metin"><textarea rows={2} value={str(d.sub)} onChange={(e) => set({ sub: e.target.value })} /></Field>
      <div className="mp-2col">
        <Field label="Birincil buton"><input value={str(d.primaryLabel)} onChange={(e) => set({ primaryLabel: e.target.value })} /></Field>
        <Field label="Birincil yol"><input value={str(d.primaryHref)} onChange={(e) => set({ primaryHref: e.target.value })} /></Field>
      </div>
      <div className="mp-2col">
        <Field label="İkincil buton"><input value={str(d.secondaryLabel)} onChange={(e) => set({ secondaryLabel: e.target.value })} /></Field>
        <Field label="İkincil yol"><input value={str(d.secondaryHref)} onChange={(e) => set({ secondaryHref: e.target.value })} /></Field>
      </div>
      <div className="mp-group__ttl mp-sub">İletişim kutuları</div>
      {contacts.map((c, i) => (
        <div className="mp-group" key={i}>
          <div className="mp-group__ttl">Kutu {i + 1}</div>
          <div className="mp-3col">
            <Field label="İkon"><input value={str(c.icon)} onChange={(e) => setC(i, { icon: e.target.value })} /></Field>
            <Field label="Etiket"><input value={str(c.label)} onChange={(e) => setC(i, { label: e.target.value })} /></Field>
            <Field label="Değer"><input value={str(c.value)} onChange={(e) => setC(i, { value: e.target.value })} /></Field>
          </div>
        </div>
      ))}
    </>
  );
}

/* ── helpers ──────────────────────────────────────────────── */
type FieldsProps = { d: AnyData; set: (patch: AnyData) => void; onChange: (d: AnyData) => void; pageKey: string };
function str(v: unknown): string { return typeof v === "string" ? v : ""; }
function num(v: unknown): number { return typeof v === "number" ? v : Number(v) || 0; }
function arr(v: unknown): AnyData[] { return Array.isArray(v) ? (v as AnyData[]) : []; }
function obj(v: unknown): AnyData { return v && typeof v === "object" ? (v as AnyData) : {}; }
