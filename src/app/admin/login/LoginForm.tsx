"use client";

import { useActionState, useState } from "react";

import { loginAction } from "@/lib/actions/auth";
import type { LoginFormState } from "@/lib/actions/auth-types";

const initialState: LoginFormState = { ok: false };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [showPw, setShowPw] = useState(false);

  return (
    <form className="al-form" action={action} noValidate>
      {state.formError && (
        <p className="al-alert" role="alert">
          {state.formError}
        </p>
      )}

      <div className="al-field">
        <div className="al-field__label">
          <span className="al-field__lbl">Kurumsal e-posta</span>
        </div>
        <div
          className={
            "al-input" + (state.fieldErrors?.email ? " al-input--err" : "")
          }
        >
          <span className="al-input__ico">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="3.5" width="14" height="11" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 4.5L9 10L16 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </span>
          <input
            type="email"
            name="email"
            placeholder="ad@moniva.com.tr"
            autoComplete="username"
            required
          />
        </div>
        {state.fieldErrors?.email && (
          <em className="al-err-text">{state.fieldErrors.email[0]}</em>
        )}
      </div>

      <div className="al-field">
        <div className="al-field__label">
          <span className="al-field__lbl">Şifre</span>
          <a className="al-field__hint" href="#">
            Şifremi unuttum
          </a>
        </div>
        <div
          className={
            "al-input" + (state.fieldErrors?.password ? " al-input--err" : "")
          }
        >
          <span className="al-input__ico">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <rect x="3" y="8" width="12" height="8" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5.5 8V5.5C5.5 3.6 7 2 9 2C11 2 12.5 3.6 12.5 5.5V8" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="9" cy="12" r="1.2" fill="currentColor" />
            </svg>
          </span>
          <input
            type={showPw ? "text" : "password"}
            name="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="al-input__toggle"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Şifreyi gizle" : "Şifreyi göster"}
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M1 9C2.5 5.5 5.5 4 9 4C12.5 4 15.5 5.5 17 9C15.5 12.5 12.5 14 9 14C5.5 14 2.5 12.5 1 9Z" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
        {state.fieldErrors?.password && (
          <em className="al-err-text">{state.fieldErrors.password[0]}</em>
        )}
      </div>

      <div className="al-row-opts">
        <label className="al-check">
          <input type="checkbox" name="remember" defaultChecked />
          <span className="al-check__box">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 5L4 8L9 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="al-check__lbl">Bu cihazda oturumumu açık tut</span>
        </label>
      </div>

      <button type="submit" className="al-btn-primary" disabled={pending}>
        {pending ? "Giriş yapılıyor…" : "Yönetime giriş yap"}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>

      <div className="al-divider">
        <span className="al-divider__line" />
        <span className="al-divider__text">veya şununla devam et</span>
        <span className="al-divider__line" />
      </div>

      <button type="button" className="al-sso" disabled title="Google ile giriş yakında">
        <svg viewBox="0 0 18 18" fill="none">
          <path d="M9 7.5V10.5H13.2C12.9 11.7 12.2 12.7 11.2 13.3L13.6 15.2C15 13.9 15.9 12 15.9 9.7C15.9 9.2 15.85 8.65 15.75 8.2H9V7.5Z" fill="#4285F4" />
          <path d="M9 16C11.05 16 12.75 15.3 14 14.1L11.6 12.2C10.95 12.65 10.1 12.9 9 12.9C7 12.9 5.3 11.6 4.7 9.85H2.2V11.8C3.45 14.25 5.95 16 9 16Z" fill="#34A853" />
          <path d="M4.7 9.85C4.55 9.4 4.45 8.9 4.45 8.4C4.45 7.9 4.55 7.4 4.7 6.95V5H2.2C1.65 6.05 1.35 7.2 1.35 8.4C1.35 9.6 1.65 10.75 2.2 11.8L4.7 9.85Z" fill="#FBBC05" />
          <path d="M9 3.9C10.2 3.9 11.25 4.3 12.1 5.1L14.25 2.95C12.95 1.75 11.25 1 9 1C5.95 1 3.45 2.75 2.2 5.2L4.7 7.15C5.3 5.4 7 4.1 9 4.1V3.9Z" fill="#EA4335" />
        </svg>
        Google Workspace ile devam et
        <span className="al-sso__soon">yakında</span>
      </button>

      <div className="al-security">
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <path d="M9 2L3 4.5V9.5C3 13 5.5 15.5 9 16.5C12.5 15.5 15 13 15 9.5V4.5L9 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M6.5 9L8 10.5L11.5 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="al-security__body">
          <b>Güvenli bağlantı</b> · Oturumunuz 60 dakika işlem yapılmazsa sona
          erer.
        </div>
      </div>
    </form>
  );
}
