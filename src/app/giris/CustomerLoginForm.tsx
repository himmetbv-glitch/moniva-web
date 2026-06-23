"use client";

import Link from "next/link";
import { useActionState } from "react";

import { customerLoginAction } from "@/lib/actions/customer-auth";
import type { AuthFormState } from "@/lib/actions/customer-auth-types";

const initial: AuthFormState = { ok: false };

export function CustomerLoginForm({ next }: { next: string }) {
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
        <span className="au-label">E-posta</span>
        <input
          type="email"
          name="email"
          placeholder="ornek@firma.com"
          autoComplete="username"
          className={state.fieldErrors?.email ? "au-input--err" : ""}
          required
        />
        {state.fieldErrors?.email && (
          <em className="au-errtext">{state.fieldErrors.email[0]}</em>
        )}
      </label>

      <label className="au-field">
        <span className="au-label">Şifre</span>
        <input
          type="password"
          name="password"
          placeholder="••••••••"
          autoComplete="current-password"
          className={state.fieldErrors?.password ? "au-input--err" : ""}
          required
        />
        {state.fieldErrors?.password && (
          <em className="au-errtext">{state.fieldErrors.password[0]}</em>
        )}
      </label>

      <button type="submit" className="au-btn" disabled={pending}>
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>

      <div className="au-foot">
        Hesabınız yok mu? <Link href={registerHref}>Üye olun</Link>
      </div>
    </form>
  );
}
