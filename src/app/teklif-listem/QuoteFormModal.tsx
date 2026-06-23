"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
            <h2>Teklif talebiniz alındı.</h2>
            <p>
              Uzman satış ekibimiz, talebinizi inceleyip size özel fiyatlandırma
              ve stok durumu ile birlikte <b>24 saat içinde</b> dönüş yapacaktır.
            </p>
            <p className="ref">
              Talep referansınız: <b>{state.requestId}</b>
            </p>
            <button className="btn-primary" onClick={closeAfterSuccess}>
              Tamam
            </button>
          </div>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="locale" value="TR" />
            <input type="hidden" name="phoneCountryCode" value="+90" />

            <div className="modal-head">
              <div className="left">
                <div className="kicker">B2B Teklif Sistemi</div>
                <h2>Teklif Talebi Oluştur.</h2>
                <p>
                  Aşağıdaki bilgileri doldurun — uzman satış ekibimiz size özel
                  fiyatlandırma ve stok durumu ile birlikte 24 saat içinde dönüş
                  yapacaktır.
                </p>
              </div>
              <button
                type="button"
                className="close"
                onClick={onClose}
                disabled={isPending}
                aria-label="Kapat"
              >
                ✕
              </button>
            </div>

            <div className="steps">
              <div className="step done">
                <span className="n">✓</span>Sepet
              </div>
              <div className="step act">
                <span className="n">2</span>Bilgileriniz
              </div>
              <div className="step">
                <span className="n">3</span>Onay
              </div>
            </div>

            <div className="modal-body">
              <div className="summary">
                <CartIcon />
                <div className="text">
                  Teklif Listenizde <b>{totalQuantity} adet ürün</b> ·{" "}
                  <b>{lineCount} kalem</b> bulunmaktadır.
                </div>
              </div>

              <div className="form-grid">
                <div className={fieldClass("fullName")}>
                  <label>
                    Ad Soyad <span className="req">*</span>
                  </label>
                  <input name="fullName" placeholder="Ör. Mehmet Yılmaz" defaultValue={prefill?.fullName ?? ""} />
                  {err("fullName") && <span className="err">{err("fullName")}</span>}
                </div>

                <div className={fieldClass("companyName")}>
                  <label>
                    Şirket Adı <span className="req">*</span>
                  </label>
                  <input name="companyName" placeholder="Ör. ABC Lojistik A.Ş." defaultValue={prefill?.companyName ?? ""} />
                  {err("companyName") && (
                    <span className="err">{err("companyName")}</span>
                  )}
                </div>

                <div className={fieldClass("email")}>
                  <label>
                    E-posta <span className="req">*</span>
                  </label>
                  <input name="email" type="email" placeholder="ornek@sirket.com" defaultValue={prefill?.email ?? ""} />
                  {err("email") && <span className="err">{err("email")}</span>}
                </div>

                <div className={fieldClass("phone")}>
                  <label>
                    Telefon <span className="req">*</span>
                  </label>
                  <div className="with-flag">
                    <div className="ccode">
                      <span className="flag" />
                      +90
                    </div>
                    <input name="phone" placeholder="5XX XXX XX XX" defaultValue={prefill?.phone ?? ""} />
                  </div>
                  {err("phone") && <span className="err">{err("phone")}</span>}
                </div>

                <div className={fieldClass("country")}>
                  <label>
                    Ülke <span className="req">*</span>
                  </label>
                  <div className="select-wrap">
                    <select name="country" defaultValue="Türkiye">
                      <option>Türkiye</option>
                      <option>Almanya</option>
                      <option>Romanya</option>
                      <option>Rusya</option>
                      <option>Diğer</option>
                    </select>
                  </div>
                  {err("country") && <span className="err">{err("country")}</span>}
                </div>

                <div className={fieldClass("city")}>
                  <label>Şehir</label>
                  <input name="city" placeholder="Ör. İstanbul" />
                </div>

                <div className={fieldClass("taxNumber")}>
                  <label>
                    Vergi Numarası <span className="opt">(opsiyonel)</span>
                  </label>
                  <input name="taxNumber" placeholder="10 haneli VKN" defaultValue={prefill?.taxNumber ?? ""} />
                  {err("taxNumber") && (
                    <span className="err">{err("taxNumber")}</span>
                  )}
                </div>

                <div className={fieldClass("taxOffice")}>
                  <label>
                    Vergi Dairesi <span className="opt">(opsiyonel)</span>
                  </label>
                  <input name="taxOffice" placeholder="Ör. Kadıköy V.D." />
                </div>

                <div className={`${fieldClass("address")} span2`}>
                  <label>
                    Teslimat Adresi <span className="req">*</span>
                  </label>
                  <textarea
                    name="address"
                    placeholder="Sokak, no, mahalle, ilçe — fatura ve sevkiyat için kullanılacaktır."
                  />
                  {err("address") && <span className="err">{err("address")}</span>}
                </div>

                <div className={`${fieldClass("notes")} span2`}>
                  <label>
                    Ek Notlar / Özel Talepler{" "}
                    <span className="opt">(opsiyonel)</span>
                  </label>
                  <textarea
                    name="notes"
                    placeholder="Aciliyet durumu, sevkiyat tercihi, alternatif OEM numaraları, vb."
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
                    <a href="#">KVKK Aydınlatma Metni</a>&apos;ni okudum, kişisel
                    verilerimin işlenmesine onay veriyorum.{" "}
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
                    Moniva&apos;nın <b>yeni ürün ve toptan kampanya</b>{" "}
                    iletilerine açığım. (opsiyonel)
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
                Verileriniz <b>KVKK</b> kapsamında korunmaktadır.
              </div>
              <div className="actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={onClose}
                  disabled={isPending}
                >
                  Vazgeç
                </button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  <SendIcon />
                  {isPending ? "Gönderiliyor…" : "Teklifi Gönder"}
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
