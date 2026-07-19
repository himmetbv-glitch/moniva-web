"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { EXPERIENCES } from "@/lib/validation/job-application";

// DB'ye TR string yazılır (mevcut şema/enum). UI'da bu key ile locale-aware label alınır.
type ExpKey = "student" | "junior" | "mid" | "senior" | "expert";
const EXP_KEY: Record<string, ExpKey> = {
  "Öğrenci / Yeni mezun": "student",
  "0–2 yıl": "junior",
  "3–5 yıl": "mid",
  "6–10 yıl": "senior",
  "10+ yıl": "expert",
};

export function CareersForm({ positions }: { positions: string[] }) {
  const t = useTranslations();
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
        setError(j.error ?? t("careers.form.sendError"));
      }
    } catch {
      setError(t("form.connectionError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="cf-card cf-done">
        <div className="cf-done__check">✓</div>
        <div className="cf-done__title">{t("careers.done.title")}</div>
        <p className="cf-done__body">{t("careers.done.body")}</p>
      </div>
    );
  }

  return (
    <form className="cf-card" onSubmit={onSubmit}>
      <div className="cf-head">
        <div className="cf-head__title">{t("careers.form.title")}</div>
        <div className="cf-head__code">{t("careers.form.code")}</div>
      </div>
      <div className="cf-rule" />

      <div className="cf-grid2">
        <label className="cf-field">
          <span>
            {t("careers.form.fullName")} <i>{t("form.required")}</i>
          </span>
          <input
            name="fullName"
            required
            placeholder={t("careers.form.fullNamePlaceholder")}
            maxLength={120}
          />
        </label>
        <label className="cf-field">
          <span>
            {t("careers.form.email")} <i>{t("form.required")}</i>
          </span>
          <input
            name="email"
            type="email"
            required
            placeholder={t("careers.form.emailPlaceholder")}
            maxLength={160}
          />
        </label>
      </div>

      <div className="cf-grid2">
        <label className="cf-field">
          <span>
            {t("careers.form.phone")} <i>{t("form.required")}</i>
          </span>
          <input name="phone" required placeholder="+90 …" maxLength={40} />
        </label>
        <label className="cf-field">
          <span>{t("careers.form.location")}</span>
          <input
            name="location"
            placeholder={t("careers.form.locationPlaceholder")}
            maxLength={120}
          />
        </label>
      </div>

      <div className="cf-grid2">
        <label className="cf-field">
          <span>
            {t("careers.form.position")} <i>{t("form.required")}</i>
          </span>
          <select name="position" required defaultValue="" className="cf-select">
            <option value="" disabled>
              {t("careers.form.positionPlaceholder")}
            </option>
            {positions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="cf-field">
          <span>{t("careers.form.experience")}</span>
          <select name="experience" defaultValue="" className="cf-select">
            <option value="">{t("careers.form.experiencePlaceholder")}</option>
            {EXPERIENCES.map((x) => (
              <option key={x} value={x}>
                {t(`careers.form.experiences.${EXP_KEY[x] ?? "junior"}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="cf-field">
        <span>{t("careers.form.linkedin")}</span>
        <input name="linkedinUrl" placeholder="https://" maxLength={300} />
      </label>

      <label className="cf-field">
        <span>
          {t("careers.form.coverNote")} <i>{t("form.required")}</i>
        </span>
        <textarea
          name="coverNote"
          rows={5}
          required
          minLength={10}
          maxLength={4000}
          placeholder={t("careers.form.coverNotePlaceholder")}
        />
      </label>

      <div className="cf-field">
        <span className="cf-label">
          {t("careers.form.cv")} <i>{t("form.required")}</i>
        </span>
        <button
          type="button"
          className="cf-drop"
          onClick={() => fileRef.current?.click()}
        >
          <div className="cf-drop__icon">↑</div>
          <div className="cf-drop__title">{cvName ?? t("careers.form.cvSelect")}</div>
          <div className="cf-drop__hint">{t("careers.form.cvHint")}</div>
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
          {t.rich("careers.form.consent", {
            b: (chunks) => <b>{chunks}</b>,
          })}
        </span>
      </label>

      {error && <div className="cf-error">{error}</div>}

      <div className="cf-foot">
        <span className="cf-req">
          <i>{t("form.required")}</i> {t("form.requiredNote")}
        </span>
        <button type="submit" className="cf-submit" disabled={submitting}>
          {submitting ? t("careers.form.submitting") : t("careers.form.submit")}
        </button>
      </div>
    </form>
  );
}
