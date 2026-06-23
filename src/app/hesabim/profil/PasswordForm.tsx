"use client";

import { useActionState, useRef, useEffect } from "react";

import { changePasswordAction } from "@/lib/actions/customer-profile";
import type { AuthFormState } from "@/lib/actions/customer-auth-types";

const initial: AuthFormState = { ok: false };

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const fe = state.fieldErrors;

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form className="ac-form" action={action} ref={formRef} noValidate>
      {state.ok && <p className="ac-ok-msg">Şifreniz güncellendi.</p>}
      {state.formError && <p className="ac-alert">{state.formError}</p>}

      <label className="ac-field">
        <span className="ac-flabel">Mevcut şifre</span>
        <input
          type="password"
          name="currentPassword"
          autoComplete="current-password"
          className={fe?.currentPassword ? "ac-input--err" : ""}
        />
        {fe?.currentPassword && <em className="ac-errtext">{fe.currentPassword[0]}</em>}
      </label>

      <div className="ac-grid2">
        <label className="ac-field">
          <span className="ac-flabel">Yeni şifre</span>
          <input
            type="password"
            name="newPassword"
            autoComplete="new-password"
            className={fe?.newPassword ? "ac-input--err" : ""}
          />
          {fe?.newPassword && <em className="ac-errtext">{fe.newPassword[0]}</em>}
        </label>
        <label className="ac-field">
          <span className="ac-flabel">Yeni şifre (tekrar)</span>
          <input
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            className={fe?.confirmPassword ? "ac-input--err" : ""}
          />
          {fe?.confirmPassword && <em className="ac-errtext">{fe.confirmPassword[0]}</em>}
        </label>
      </div>

      <div>
        <button type="submit" className="ac-btn ac-btn--ghost" disabled={pending}>
          {pending ? "Güncelleniyor…" : "Şifreyi değiştir"}
        </button>
      </div>
    </form>
  );
}
