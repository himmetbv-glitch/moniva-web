"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerAction } from "@/lib/actions/customer-auth";
import type { AuthFormState } from "@/lib/actions/customer-auth-types";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/components/site/country-items";

const initial: AuthFormState = { ok: false };

export function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(registerAction, initial);
  const fe = state.fieldErrors;

  const loginHref =
    next && next !== "/hesabim" ? `/giris?next=${encodeURIComponent(next)}` : "/giris";

  return (
    <form className="au-form" action={action} noValidate>
      <input type="hidden" name="next" value={next} />

      {state.formError && (
        <p className="au-alert" role="alert">{state.formError}</p>
      )}

      <label className="au-field">
        <span className="au-label">Firma adı</span>
        <input
          name="companyName"
          placeholder="Örn. Yılmaz Lojistik A.Ş."
          autoComplete="organization"
          className={fe?.companyName ? "au-input--err" : ""}
          required
        />
        {fe?.companyName && <em className="au-errtext">{fe.companyName[0]}</em>}
      </label>

      <div className="au-grid2">
        <label className="au-field">
          <span className="au-label">Ad soyad</span>
          <input
            name="fullName"
            placeholder="Yetkili kişi"
            autoComplete="name"
            className={fe?.fullName ? "au-input--err" : ""}
            required
          />
          {fe?.fullName && <em className="au-errtext">{fe.fullName[0]}</em>}
        </label>
        <label className="au-field">
          <span className="au-label">Telefon</span>
          <input
            name="phone"
            placeholder="+90 5xx xxx xx xx"
            autoComplete="tel"
            className={fe?.phone ? "au-input--err" : ""}
            required
          />
          {fe?.phone && <em className="au-errtext">{fe.phone[0]}</em>}
        </label>
      </div>

      <label className="au-field">
        <span className="au-label">E-posta</span>
        <input
          type="email"
          name="email"
          placeholder="ornek@firma.com"
          autoComplete="username"
          className={fe?.email ? "au-input--err" : ""}
          required
        />
        {fe?.email && <em className="au-errtext">{fe.email[0]}</em>}
      </label>

      <label className="au-field">
        <span className="au-label">Firma adresi</span>
        <textarea
          name="address"
          placeholder="Cadde, sokak, no, ilçe…"
          autoComplete="street-address"
          rows={2}
          className={fe?.address ? "au-input--err" : ""}
          required
        />
        {fe?.address && <em className="au-errtext">{fe.address[0]}</em>}
      </label>

      <div className="au-grid2">
        <label className="au-field">
          <span className="au-label">Ülke</span>
          <select
            name="country"
            defaultValue={DEFAULT_COUNTRY}
            autoComplete="country-name"
            className={fe?.country ? "au-input--err" : ""}
            required
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {fe?.country && <em className="au-errtext">{fe.country[0]}</em>}
        </label>
        <label className="au-field">
          <span className="au-label">İl / Şehir</span>
          <input
            name="city"
            placeholder="Örn. Konya"
            autoComplete="address-level1"
            className={fe?.city ? "au-input--err" : ""}
            required
          />
          {fe?.city && <em className="au-errtext">{fe.city[0]}</em>}
        </label>
      </div>

      <div className="au-grid2">
        <label className="au-field">
          <span className="au-label">VKN <i>(opsiyonel)</i></span>
          <input
            name="taxNumber"
            inputMode="numeric"
            placeholder="10 haneli"
            className={fe?.taxNumber ? "au-input--err" : ""}
          />
          {fe?.taxNumber && <em className="au-errtext">{fe.taxNumber[0]}</em>}
        </label>
        <label className="au-field">
          <span className="au-label">Şifre</span>
          <input
            type="password"
            name="password"
            placeholder="En az 8 karakter"
            autoComplete="new-password"
            className={fe?.password ? "au-input--err" : ""}
            required
          />
          {fe?.password && <em className="au-errtext">{fe.password[0]}</em>}
        </label>
      </div>

      <div className="au-note">
        Hesabınız oluşturulduktan sonra ekibimiz firmanızı doğrular. Doğrulanmış B2B
        hesaplar özel koşullardan yararlanır.
      </div>

      <label className="au-check">
        <input type="checkbox" name="kvkkConsent" required />
        <span>
          <Link href="/sayfa/kvkk">KVKK Aydınlatma Metni</Link>’ni okudum, kişisel
          verilerimin işlenmesini onaylıyorum.
        </span>
      </label>
      {fe?.kvkkConsent && <em className="au-errtext">{fe.kvkkConsent[0]}</em>}

      <button type="submit" className="au-btn" disabled={pending}>
        {pending ? "Hesap oluşturuluyor…" : "Üye ol"}
      </button>

      <div className="au-foot">
        Zaten hesabınız var mı? <Link href={loginHref}>Giriş yapın</Link>
      </div>
    </form>
  );
}
