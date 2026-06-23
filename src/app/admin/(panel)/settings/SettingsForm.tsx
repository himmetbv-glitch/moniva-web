"use client";

import { useState, useTransition } from "react";

import { updateSettings } from "@/lib/actions/admin-settings";
import type { SiteSettings } from "@/lib/admin/settings-types";

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [s, setS] = useState<SiteSettings>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const f = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  const submit = () => {
    setMsg(null);
    start(async () => {
      const res = await updateSettings(s);
      setMsg(res.ok ? { ok: true, text: "Ayarlar kaydedildi." } : { ok: false, text: res.error });
    });
  };

  const field = (
    label: string,
    key: keyof SiteSettings,
    opts?: { placeholder?: string; full?: boolean },
  ) => (
    <label className={"pe-field" + (opts?.full ? " st-full" : "")}>
      <span className="pe-label">{label}</span>
      <input
        value={s[key]}
        onChange={(e) => f(key, e.target.value)}
        placeholder={opts?.placeholder}
      />
    </label>
  );

  return (
    <div className="mv-page">
      <div className="iq-head">
        <div>
          <div className="iq-head__title"><span>Ayarlar</span></div>
          <div className="iq-head__meta">Site geneli firma, iletişim, sosyal ve SEO ayarları.</div>
        </div>
        <div className="iq-head__actions">
          <button className="mv-btn mv-btn--primary" onClick={submit} disabled={pending}>
            {pending ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>

      {msg && (
        <div className={msg.ok ? "st-ok" : "pe-error"}>{msg.text}</div>
      )}

      <div className="st-grid">
        <div className="mv-card iq-pad">
          <div className="pe-sectitle">Firma & İletişim</div>
          <div className="st-fields">
            {field("Firma adı", "companyName", { full: true })}
            {field("Adres satırı", "addressLine", { full: true, placeholder: "Selçuklu / Konya, Türkiye" })}
            {field("Telefon", "phone", { placeholder: "+90 332 ..." })}
            {field("E-posta", "email", { placeholder: "export@moniva.com.tr" })}
            {field("WhatsApp", "whatsapp", { placeholder: "+90 5xx ... (opsiyonel)" })}
          </div>
        </div>

        <div className="mv-card iq-pad">
          <div className="pe-sectitle">Sosyal Medya</div>
          <div className="st-fields">
            {field("LinkedIn", "linkedinUrl", { full: true, placeholder: "https://linkedin.com/company/..." })}
            {field("X (Twitter)", "xUrl", { full: true, placeholder: "https://x.com/..." })}
            {field("YouTube", "youtubeUrl", { full: true, placeholder: "https://youtube.com/@..." })}
            {field("Instagram", "instagramUrl", { full: true, placeholder: "https://instagram.com/..." })}
          </div>
        </div>

        <div className="mv-card iq-pad">
          <div className="pe-sectitle">SEO Varsayılanları</div>
          <div className="st-fields">
            {field("Başlık tabanı", "metaTitleBase", { full: true, placeholder: "Moniva" })}
            <label className="pe-field st-full">
              <span className="pe-label">Varsayılan meta açıklama</span>
              <textarea
                rows={2}
                value={s.metaDescBase}
                onChange={(e) => f("metaDescBase", e.target.value)}
                placeholder="Arama motorları için varsayılan açıklama…"
              />
            </label>
          </div>
        </div>

        <div className="mv-card iq-pad">
          <div className="pe-sectitle">Kariyer Pozisyonları</div>
          <div className="st-fields">
            <label className="pe-field st-full">
              <span className="pe-label">Başvuru formu pozisyonları</span>
              <textarea
                rows={6}
                value={s.careerPositions.join("\n")}
                onChange={(e) => f("careerPositions", e.target.value.split("\n"))}
                placeholder={"Her satıra bir pozisyon yazın:\nSatış & İhracat\nOperasyon & Depo\nAçık başvuru"}
              />
            </label>
            <div className="cse-hint">
              Kariyer sayfasındaki “Başvurulan pozisyon” açılır menüsünde görünür. Her satır bir
              seçenek; en az bir pozisyon olmalı.
            </div>
          </div>
        </div>

        <div className="mv-card iq-pad">
          <div className="pe-sectitle">Bildirim</div>
          <div className="st-fields">
            {field("Bildirim e-postası", "notifyEmail", { full: true, placeholder: "Teklif/form bildirimleri buraya gider" })}
            <div className="cse-hint">
              Yeni teklif talebi ve iletişim/kariyer formları bu adrese e-posta ile bildirilir
              (e-posta entegrasyonu sonraki adımda).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
