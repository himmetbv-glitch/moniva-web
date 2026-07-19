"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { customerLoginAction } from "@/lib/actions/customer-auth";
import type { AuthFormState } from "@/lib/actions/customer-auth-types";

const initial: AuthFormState = { ok: false };

export function CustomerLoginForm({ next }: { next: string }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(customerLoginAction, initial);

  const registerHref =
    next && next !== "/hesabim" ? `/kayit?next=${encodeURIComponent(next)}` : "/kayit";

  return (
    <form className="au-form" action={action} noValidate>
      <input type="hidden" name="next" value={next} />

      {state.formError && (
        <p className="au-alert" role="alert">{state.formError}</p>
      )}

      <label className="au-field">
        <span className="au-label">{t("auth.login.email")}</span>
        <input
          type="email"
          name="email"
          placeholder={t("auth.login.emailPlaceholder")}
          autoComplete="username"
          className={state.fieldErrors?.email ? "au-input--err" : ""}
          required
        />
        {state.fieldErrors?.email && (
          <em className="au-errtext">{state.fieldErrors.email[0]}</em>
        )}
      </label>

      <label className="au-field">
        <span className="au-label">{t("auth.login.password")}</span>
        <input
          type="password"
          name="password"
          placeholder={t("auth.login.passwordPlaceholder")}
          autoComplete="current-password"
          className={state.fieldErrors?.password ? "au-input--err" : ""}
          required
        />
        {state.fieldErrors?.password && (
          <em className="au-errtext">{state.fieldErrors.password[0]}</em>
        )}
      </label>

      <button type="submit" className="au-btn" disabled={pending}>
        {pending ? t("auth.login.submitting") : t("auth.login.submit")}
      </button>

      <div className="au-foot">
        {t("auth.login.noAccount")} <Link href={registerHref}>{t("auth.login.signUp")}</Link>
      </div>
    </form>
  );
}
