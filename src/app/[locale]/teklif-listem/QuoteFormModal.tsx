"use client";

import { useActionState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { finalizeQuote, submitQuoteRequest } from "@/lib/actions/quote";
import type { QuoteFormState, QuotePrefill } from "@/lib/actions/quote-types";
import { CartIcon, CheckCircleIcon, SendIcon } from "./icons";

const initialState: QuoteFormState = { ok: false };

export function QuoteFormModal({
  totalQuantity,
  lineCount,
  prefill,
  onClose,
}: {
  totalQuantity: number;
  lineCount: number;
  prefill: QuotePrefill | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(
    submitQuoteRequest,
    initialState,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isPending, onClose]);

  const closeAfterSuccess = async () => {
    await finalizeQuote();
    onClose();
    router.refresh();
  };

  const err = (field: string) => state.fieldErrors?.[field]?.[0];
  const fieldClass = (field: string) =>
    `field${err(field) ? " has-error" : ""}`;

  return (
    <div
      className="qsys-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal">
        {state.ok ? (
          <div className="modal-success">
            <div className="ok">
              <CheckCircleIcon />
            </div>
            <h2>{t("quote.modal.success.title")}</h2>
            <p>
              {t.rich("quote.modal.success.body", {
                b: (chunks) => <b>{chunks}</b>,
              })}
            </p>
            <p className="ref">
              {t("quote.modal.success.refLabel")} <b>{state.requestId}</b>
            </p>
            <button className="btn-primary" onClick={closeAfterSuccess}>
              {t("quote.modal.success.ok")}
            </button>
          </div>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="locale" value={locale.toUpperCase()} />
            <input type="hidden" name="phoneCountryCode" value="+90" />

            <div className="modal-head">
              <div className="left">
                <div className="kicker">{t("quote.modal.kicker")}</div>
                <h2>{t("quote.modal.title")}</h2>
                <p>{t("quote.modal.sub")}</p>
              </div>
              <button
                type="button"
                className="close"
                onClick={onClose}
                disabled={isPending}
                aria-label={t("quote.modal.close")}
              >
                ✕
              </button>
            </div>

            <div className="steps">
              <div className="step done">
                <span className="n">✓</span>
                {t("quote.modal.steps.cart")}
              </div>
              <div className="step act">
                <span className="n">2</span>
                {t("quote.modal.steps.info")}
              </div>
              <div className="step">
                <span className="n">3</span>
                {t("quote.modal.steps.confirm")}
              </div>
            </div>

            <div className="modal-body">
              <div className="summary">
                <CartIcon />
                <div className="text">
                  {t.rich("quote.modal.summary", {
                    qty: totalQuantity,
                    lines: lineCount,
                    b: (chunks) => <b>{chunks}</b>,
                  })}
                </div>
              </div>

              <div className="form-grid">
                <div className={fieldClass("fullName")}>
                  <label>
                    {t("quote.modal.fields.fullName")}{" "}
                    <span className="req">*</span>
                  </label>
                  <input
                    name="fullName"
                    placeholder={t("quote.modal.fields.fullNamePlaceholder")}
                    defaultValue={prefill?.fullName ?? ""}
                  />
                  {err("fullName") && <span className="err">{err("fullName")}</span>}
                </div>

                <div className={fieldClass("companyName")}>
                  <label>
                    {t("quote.modal.fields.companyName")}{" "}
                    <span className="req">*</span>
                  </label>
                  <input
                    name="companyName"
                    placeholder={t("quote.modal.fields.companyNamePlaceholder")}
                    defaultValue={prefill?.companyName ?? ""}
                  />
                  {err("companyName") && (
                    <span className="err">{err("companyName")}</span>
                  )}
                </div>

                <div className={fieldClass("email")}>
                  <label>
                    {t("quote.modal.fields.email")}{" "}
                    <span className="req">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder={t("quote.modal.fields.emailPlaceholder")}
                    defaultValue={prefill?.email ?? ""}
                  />
                  {err("email") && <span className="err">{err("email")}</span>}
                </div>

                <div className={fieldClass("phone")}>
                  <label>
                    {t("quote.modal.fields.phone")}{" "}
                    <span className="req">*</span>
                  </label>
                  <div className="with-flag">
                    <div className="ccode">
                      <span className="flag" />
                      +90
                    </div>
                    <input
                      name="phone"
                      placeholder={t("quote.modal.fields.phonePlaceholder")}
                      defaultValue={prefill?.phone ?? ""}
                    />
                  </div>
                  {err("phone") && <span className="err">{err("phone")}</span>}
                </div>

                <div className={fieldClass("country")}>
                  <label>
                    {t("quote.modal.fields.country")}{" "}
                    <span className="req">*</span>
                  </label>
                  <div className="select-wrap">
                    <select name="country" defaultValue="Türkiye">
                      <option value="Türkiye">{t("quote.modal.countries.tr")}</option>
                      <option value="Almanya">{t("quote.modal.countries.de")}</option>
                      <option value="Romanya">{t("quote.modal.countries.ro")}</option>
                      <option value="Rusya">{t("quote.modal.countries.ru")}</option>
                      <option value="Diğer">{t("quote.modal.countries.other")}</option>
                    </select>
                  </div>
                  {err("country") && <span className="err">{err("country")}</span>}
                </div>

                <div className={fieldClass("city")}>
                  <label>{t("quote.modal.fields.city")}</label>
                  <input
                    name="city"
                    placeholder={t("quote.modal.fields.cityPlaceholder")}
                  />
                </div>

                <div className={fieldClass("taxNumber")}>
                  <label>
                    {t("quote.modal.fields.taxNumber")}{" "}
                    <span className="opt">{t("quote.modal.fields.optional")}</span>
                  </label>
                  <input
                    name="taxNumber"
                    placeholder={t("quote.modal.fields.taxNumberPlaceholder")}
                    defaultValue={prefill?.taxNumber ?? ""}
                  />
                  {err("taxNumber") && (
                    <span className="err">{err("taxNumber")}</span>
                  )}
                </div>

                <div className={fieldClass("taxOffice")}>
                  <label>
                    {t("quote.modal.fields.taxOffice")}{" "}
                    <span className="opt">{t("quote.modal.fields.optional")}</span>
                  </label>
                  <input
                    name="taxOffice"
                    placeholder={t("quote.modal.fields.taxOfficePlaceholder")}
                  />
                </div>

                <div className={`${fieldClass("address")} span2`}>
                  <label>
                    {t("quote.modal.fields.address")}{" "}
                    <span className="req">*</span>
                  </label>
                  <textarea
                    name="address"
                    placeholder={t("quote.modal.fields.addressPlaceholder")}
                  />
                  {err("address") && <span className="err">{err("address")}</span>}
                </div>

                <div className={`${fieldClass("notes")} span2`}>
                  <label>
                    {t("quote.modal.fields.notes")}{" "}
                    <span className="opt">{t("quote.modal.fields.optional")}</span>
                  </label>
                  <textarea
                    name="notes"
                    placeholder={t("quote.modal.fields.notesPlaceholder")}
                  />
                </div>
              </div>

              <div className="checks">
                <label className="check">
                  <input type="checkbox" name="kvkkConsent" value="on" />
                  <span className="box">
                    <CheckCircleIcon />
                  </span>
                  <span>
                    <a href="#">{t("quote.modal.consent.kvkkLink")}</a>
                    {t("quote.modal.consent.kvkkSuffix")}{" "}
                    <span className="req" style={{ color: "#c62828" }}>
                      *
                    </span>
                  </span>
                </label>
                <label className="check">
                  <input type="checkbox" name="marketingConsent" value="on" />
                  <span className="box">
                    <CheckCircleIcon />
                  </span>
                  <span>
                    {t.rich("quote.modal.consent.marketing", {
                      b: (chunks) => <b>{chunks}</b>,
                    })}
                  </span>
                </label>
              </div>

              {err("kvkkConsent") && (
                <div className="form-error">{err("kvkkConsent")}</div>
              )}
              {state.formError && (
                <div className="form-error">{state.formError}</div>
              )}
            </div>

            <div className="modal-foot">
              <div className="note">
                <ShieldSmall />
                {t.rich("quote.modal.footNote", {
                  b: (chunks) => <b>{chunks}</b>,
                })}
              </div>
              <div className="actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={onClose}
                  disabled={isPending}
                >
                  {t("quote.modal.cancel")}
                </button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  <SendIcon />
                  {isPending ? t("quote.modal.submitting") : t("quote.modal.submit")}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const ShieldSmall = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
    <path d="M12 2 L4 6 V12 C4 17 8 21 12 22 C16 21 20 17 20 12 V6 Z" />
  </svg>
);
