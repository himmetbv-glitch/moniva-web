"use client";

import { useState } from "react";

import { TOPICS, COUNTRIES } from "@/lib/validation/contact-message";

export function ContactForm() {
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
        setError(j.error ?? "Mesaj gönderilemedi.");
      }
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="ct-form ct-done">
        <div className="ct-done__check">✓</div>
        <div className="ct-done__title">Mesajınız iletildi.</div>
        <p className="ct-done__body">
          Talebinizi ilgili ekibe yönlendirdik. Çalışma saatleri içinde ortalama 4 saat
          içinde size dönüş yapacağız.
        </p>
      </div>
    );
  }

  return (
    <form className="ct-form" onSubmit={onSubmit}>
      <h2 className="ct-form__title">Bize ihtiyacınızı anlatın.</h2>
      <p className="ct-form__sub">
        Formu doldurun, mesajınızı doğru ekibe yönlendirelim. Acil teklifler için
        doğrudan arayın.
      </p>

      <div className="ct-field">
        <span className="ct-label">
          Konu nedir? <i>*</i>
        </span>
        <div className="ct-chips">
          {TOPICS.map((t) => (
            <button
              type="button"
              key={t}
              className={"ct-chip" + (topic === t ? " ct-chip--on" : "")}
              onClick={() => setTopic(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="ct-row">
        <label className="ct-field">
          <span className="ct-label">Ad <i>*</i></span>
          <input name="firstName" required placeholder="Mehmet" maxLength={80} />
        </label>
        <label className="ct-field">
          <span className="ct-label">Soyad <i>*</i></span>
          <input name="lastName" required placeholder="Yılmaz" maxLength={80} />
        </label>
      </div>

      <div className="ct-row">
        <label className="ct-field">
          <span className="ct-label">Firma</span>
          <input name="company" placeholder="Firma adı" maxLength={120} />
        </label>
        <label className="ct-field">
          <span className="ct-label">Ülke <i>*</i></span>
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
          <span className="ct-label">İş e-postası <i>*</i></span>
          <input name="email" type="email" required placeholder="siz@firma.com" maxLength={160} />
        </label>
        <label className="ct-field">
          <span className="ct-label">Telefon</span>
          <input name="phone" type="tel" placeholder="+90 …" maxLength={40} />
        </label>
      </div>

      <label className="ct-field">
        <span className="ct-label">OEM referans numaraları (opsiyonel)</span>
        <input name="oemRefs" placeholder="örn. 1234567, A1234567890 — virgülle ayırın" maxLength={400} />
      </label>

      <label className="ct-field">
        <span className="ct-label">Mesajınız <i>*</i></span>
        <textarea
          name="message"
          rows={5}
          required
          minLength={10}
          maxLength={4000}
          placeholder="Filonuz, ihtiyaç duyduğunuz adet, zaman çizelgesi…"
        />
      </label>

      <label className="ct-consent">
        <input type="checkbox" name="kvkkConsent" value="true" required />
        <span>
          Moniva&apos;nın <b>gizlilik politikası</b>nı kabul ediyor ve talebimle ilgili
          benimle iletişime geçilmesine onay veriyorum.
        </span>
      </label>

      {error && <div className="ct-error">{error}</div>}

      <div className="ct-foot">
        <button type="submit" className="ct-submit" disabled={submitting}>
          {submitting ? "Gönderiliyor…" : "Mesaj gönder ▶"}
        </button>
        <span className="ct-resp">
          Ort. yanıt: <b>4 iş saati</b>
        </span>
      </div>
    </form>
  );
}
