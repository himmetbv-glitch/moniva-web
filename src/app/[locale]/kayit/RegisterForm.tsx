"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { registerAction } from "@/lib/actions/customer-auth";
import type { AuthFormState } from "@/lib/actions/customer-auth-types";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/components/site/country-items";

const initial: AuthFormState = { ok: false };

export function RegisterForm({ next }: { next: string }) {
  const t = useTranslations();
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
        <span className="au-label">{t("auth.register.companyName")}</span>
        <input
          name="companyName"
          placeholder={t("auth.register.companyNamePlaceholder")}
          autoComplete="organization"
          className={fe?.companyName ? "au-input--err" : ""}
          required
        />
        {fe?.companyName && <em className="au-errtext">{fe.companyName[0]}</em>}
      </label>

      <div className="au-grid2">
        <label className="au-field">
          <span className="au-label">{t("auth.register.fullName")}</span>
          <input
            name="fullName"
            placeholder={t("auth.register.fullNamePlaceholder")}
            autoComplete="name"
            className={fe?.fullName ? "au-input--err" : ""}
            required
          />
          {fe?.fullName && <em className="au-errtext">{fe.fullName[0]}</em>}
        </label>
        <label className="au-field">
          <span className="au-label">{t("auth.register.phone")}</span>
          <input
            name="phone"
            placeholder={t("auth.register.phonePlaceholder")}
            autoComplete="tel"
            className={fe?.phone ? "au-input--err" : ""}
            required
          />
          {fe?.phone && <em className="au-errtext">{fe.phone[0]}</em>}
        </label>
      </div>

      <label className="au-field">
        <span className="au-label">{t("auth.register.email")}</span>
        <input
          type="email"
          name="email"
          placeholder={t("auth.register.emailPlaceholder")}
          autoComplete="username"
          className={fe?.email ? "au-input--err" : ""}
          required
        />
        {fe?.email && <em className="au-errtext">{fe.email[0]}</em>}
      </label>

      <label className="au-field">
        <span className="au-label">{t("auth.register.address")}</span>
        <textarea
          name="address"
          placeholder={t("auth.register.addressPlaceholder")}
          autoComplete="street-address"
          rows={2}
          className={fe?.address ? "au-input--err" : ""}
          required
        />
        {fe?.address && <em className="au-errtext">{fe.address[0]}</em>}
      </label>

      <div className="au-grid2">
        <label className="au-field">
          <span className="au-label">{t("auth.register.country")}</span>
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
          <span className="au-label">{t("auth.register.city")}</span>
          <input
            name="city"
            placeholder={t("auth.register.cityPlaceholder")}
            autoComplete="address-level1"
            className={fe?.city ? "au-input--err" : ""}
            required
          />
          {fe?.city && <em className="au-errtext">{fe.city[0]}</em>}
        </label>
      </div>

      <div className="au-grid2">
        <label className="au-field">
          <span className="au-label">
            {t("auth.register.taxNumber")}{" "}
            <i>{t("auth.register.taxNumberOptional")}</i>
          </span>
          <input
            name="taxNumber"
            inputMode="numeric"
            placeholder={t("auth.register.taxNumberPlaceholder")}
            className={fe?.taxNumber ? "au-input--err" : ""}
          />
          {fe?.taxNumber && <em className="au-errtext">{fe.taxNumber[0]}</em>}
        </label>
        <label className="au-field">
          <span className="au-label">{t("auth.register.password")}</span>
          <input
            type="password"
            name="password"
            placeholder={t("auth.register.passwordPlaceholder")}
            autoComplete="new-password"
            className={fe?.password ? "au-input--err" : ""}
            required
          />
          {fe?.password && <em className="au-errtext">{fe.password[0]}</em>}
        </label>
      </div>

      <div className="au-note">{t("auth.register.verifyNote")}</div>

      <label className="au-check">
        <input type="checkbox" name="kvkkConsent" required />
        <span>
          {t("auth.register.kvkkPrefix")}
          <Link href="/sayfa/kvkk">{t("auth.register.kvkkLink")}</Link>
          {t("auth.register.kvkkSuffix")}
        </span>
      </label>
      {fe?.kvkkConsent && <em className="au-errtext">{fe.kvkkConsent[0]}</em>}

      <button type="submit" className="au-btn" disabled={pending}>
        {pending ? t("auth.register.submitting") : t("auth.register.submit")}
      </button>

      <div className="au-foot">
        {t("auth.register.haveAccount")}{" "}
        <Link href={loginHref}>{t("auth.register.signIn")}</Link>
      </div>
    </form>
  );
}
