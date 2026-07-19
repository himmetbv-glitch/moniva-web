"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { TOPICS, COUNTRIES } from "@/lib/validation/contact-message";

// DB'ye TR string yazılır (mevcut şema/enum). UI'da bu key ile locale-aware label alınır.
type TopicKey = "sales" | "support" | "distributor" | "press" | "career";
const TOPIC_KEY: Record<string, TopicKey> = {
  "Satış talebi": "sales",
  "Teknik destek": "support",
  "Distribütör olmak": "distributor",
  "Basın / Medya": "press",
  "Kariyer": "career",
};

export function ContactForm() {
  const t = useTranslations();
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      const payload = {
        firstName: String(fd.get("firstName") ?? ""),
        lastName: String(fd.get("lastName") ?? ""),
        company: String(fd.get("company") ?? ""),
        country: String(fd.get("country") ?? ""),
        email: String(fd.get("email") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        topic,
        oemRefs: String(fd.get("oemRefs") ?? ""),
        message: String(fd.get("message") ?? ""),
        kvkkConsent: fd.get("kvkkConsent") === "true",
      };
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? t("contact.form.sendError"));
      }
    } catch {
      setError(t("form.connectionError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="ct-form ct-done">
        <div className="ct-done__check">✓</div>
        <div className="ct-done__title">{t("contact.done.title")}</div>
        <p className="ct-done__body">{t("contact.done.body")}</p>
      </div>
    );
  }

  return (
    <form className="ct-form" onSubmit={onSubmit}>
      <h2 className="ct-form__title">{t("contact.form.title")}</h2>
      <p className="ct-form__sub">{t("contact.form.sub")}</p>

      <div className="ct-field">
        <span className="ct-label">
          {t("contact.form.topicLabel")} <i>{t("form.required")}</i>
        </span>
        <div className="ct-chips">
          {TOPICS.map((tv) => (
            <button
              type="button"
              key={tv}
              className={"ct-chip" + (topic === tv ? " ct-chip--on" : "")}
              onClick={() => setTopic(tv)}
            >
              {t(`contact.form.topics.${TOPIC_KEY[tv] ?? "sales"}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="ct-row">
        <label className="ct-field">
          <span className="ct-label">
            {t("contact.form.firstName")} <i>{t("form.required")}</i>
          </span>
          <input name="firstName" required placeholder="Mehmet" maxLength={80} />
        </label>
        <label className="ct-field">
          <span className="ct-label">
            {t("contact.form.lastName")} <i>{t("form.required")}</i>
          </span>
          <input name="lastName" required placeholder="Yılmaz" maxLength={80} />
        </label>
      </div>

      <div className="ct-row">
        <label className="ct-field">
          <span className="ct-label">{t("contact.form.company")}</span>
          <input
            name="company"
            placeholder={t("contact.form.companyPlaceholder")}
            maxLength={120}
          />
        </label>
        <label className="ct-field">
          <span className="ct-label">
            {t("contact.form.country")} <i>{t("form.required")}</i>
          </span>
          <select name="country" defaultValue="Türkiye" className="ct-select">
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="ct-row">
        <label className="ct-field">
          <span className="ct-label">
            {t("contact.form.email")} <i>{t("form.required")}</i>
          </span>
          <input
            name="email"
            type="email"
            required
            placeholder={t("contact.form.emailPlaceholder")}
            maxLength={160}
          />
        </label>
        <label className="ct-field">
          <span className="ct-label">{t("contact.form.phone")}</span>
          <input name="phone" type="tel" placeholder="+90 …" maxLength={40} />
        </label>
      </div>

      <label className="ct-field">
        <span className="ct-label">{t("contact.form.oemRefs")}</span>
        <input
          name="oemRefs"
          placeholder={t("contact.form.oemRefsPlaceholder")}
          maxLength={400}
        />
      </label>

      <label className="ct-field">
        <span className="ct-label">
          {t("contact.form.message")} <i>{t("form.required")}</i>
        </span>
        <textarea
          name="message"
          rows={5}
          required
          minLength={10}
          maxLength={4000}
          placeholder={t("contact.form.messagePlaceholder")}
        />
      </label>

      <label className="ct-consent">
        <input type="checkbox" name="kvkkConsent" value="true" required />
        <span>
          {t.rich("contact.form.consent", {
            b: (chunks) => <b>{chunks}</b>,
          })}
        </span>
      </label>

      {error && <div className="ct-error">{error}</div>}

      <div className="ct-foot">
        <button type="submit" className="ct-submit" disabled={submitting}>
          {submitting ? t("contact.form.submitting") : t("contact.form.submit")}
        </button>
        <span className="ct-resp">
          {t.rich("contact.form.response", {
            hours: 4,
            b: (chunks) => <b>{chunks}</b>,
          })}
        </span>
      </div>
    </form>
  );
}
