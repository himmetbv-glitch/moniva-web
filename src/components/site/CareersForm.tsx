"use client";

import { useRef, useState } from "react";

import { EXPERIENCES } from "@/lib/validation/job-application";

export function CareersForm({ positions }: { positions: string[] }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [cvName, setCvName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      const res = await fetch("/api/careers", { method: "POST", body: fd });
      if (res.ok) {
        setDone(true);
      } else {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "Başvuru gönderilemedi.");
      }
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="cf-card cf-done">
        <div className="cf-done__check">✓</div>
        <div className="cf-done__title">Başvurunuz alındı.</div>
        <p className="cf-done__body">
          İlginiz için teşekkürler. Her başvuruyu değerlendiriyor ve iki hafta
          içinde size dönüş yapıyoruz.
        </p>
      </div>
    );
  }

  return (
    <form className="cf-card" onSubmit={onSubmit}>
      <div className="cf-head">
        <div className="cf-head__title">Başvuru formu</div>
        <div className="cf-head__code">FORM · CRR-001</div>
      </div>
      <div className="cf-rule" />

      <div className="cf-grid2">
        <label className="cf-field">
          <span>Ad soyad <i>*</i></span>
          <input name="fullName" required placeholder="örn. Ayşe Yıldız" maxLength={120} />
        </label>
        <label className="cf-field">
          <span>E-posta <i>*</i></span>
          <input name="email" type="email" required placeholder="siz@ornek.com" maxLength={160} />
        </label>
      </div>

      <div className="cf-grid2">
        <label className="cf-field">
          <span>Telefon <i>*</i></span>
          <input name="phone" required placeholder="+90 …" maxLength={40} />
        </label>
        <label className="cf-field">
          <span>Konum</span>
          <input name="location" placeholder="Şehir, Ülke" maxLength={120} />
        </label>
      </div>

      <div className="cf-grid2">
        <label className="cf-field">
          <span>Başvurulan pozisyon <i>*</i></span>
          <select name="position" required defaultValue="" className="cf-select">
            <option value="" disabled>
              — Departman seçin —
            </option>
            {positions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="cf-field">
          <span>Deneyim süresi</span>
          <select name="experience" defaultValue="" className="cf-select">
            <option value="">— Seçin —</option>
            {EXPERIENCES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="cf-field">
        <span>LinkedIn veya portfolyo bağlantısı</span>
        <input name="linkedinUrl" placeholder="https://" maxLength={300} />
      </label>

      <label className="cf-field">
        <span>Ön yazı <i>*</i></span>
        <textarea
          name="coverNote"
          rows={5}
          required
          minLength={10}
          maxLength={4000}
          placeholder="Moniva'ya neden katılmak istediğinize dair kısa bir not…"
        />
      </label>

      <div className="cf-field">
        <span className="cf-label">CV / Özgeçmiş <i>*</i></span>
        <button
          type="button"
          className="cf-drop"
          onClick={() => fileRef.current?.click()}
        >
          <div className="cf-drop__icon">↑</div>
          <div className="cf-drop__title">
            {cvName ?? "CV'nizi seçmek için tıklayın"}
          </div>
          <div className="cf-drop__hint">PDF, DOC, DOCX · Maks. 5 MB</div>
        </button>
        <input
          ref={fileRef}
          name="cv"
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          hidden
          onChange={(e) => setCvName(e.target.files?.[0]?.name ?? null)}
        />
      </div>

      <label className="cf-consent">
        <input type="checkbox" name="kvkkConsent" value="true" required />
        <span>
          Kişisel verilerimin işe alım amacıyla <b>KVKK / gizlilik politikası</b>{" "}
          kapsamında işlenmesini kabul ediyorum.
        </span>
      </label>

      {error && <div className="cf-error">{error}</div>}

      <div className="cf-foot">
        <span className="cf-req">
          <i>*</i> ile işaretli alanlar zorunludur
        </span>
        <button type="submit" className="cf-submit" disabled={submitting}>
          {submitting ? "Gönderiliyor…" : "Başvuruyu gönder ▶"}
        </button>
      </div>
    </form>
  );
}
