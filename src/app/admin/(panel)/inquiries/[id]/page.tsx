import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteStatus } from "@prisma/client";

import { getInquiryDetail } from "@/lib/admin/inquiries";
import { updateInquiryStatus, saveInquiryNote } from "@/lib/actions/admin-inquiry";
import { InquiryDangerActions } from "./InquiryDangerActions";
import { AdminTopbar } from "../../AdminTopbar";
import { STATUS_PILL, STATUS_FLOW } from "../status";
import { QuotePricing } from "@/components/admin/QuotePricing";

export const metadata: Metadata = { title: "Teklif Talebi" };

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = await getInquiryDetail(id);
  if (!d) notFound();

  const stepIdx = STATUS_FLOW.findIndex((s) => s.key === d.status);

  const customerRows: [string, string | null][] = [
    ["İletişim kişisi", d.fullName],
    ["E-posta", d.email],
    ["Telefon", d.phone],
    ["Ülke", d.country],
    ["Şehir", d.city],
    ["VKN", d.taxNumber],
    ["Vergi dairesi", d.taxOffice],
    ["Pazarlama izni", d.marketingConsent ? "Evet" : "Hayır"],
  ];

  return (
    <>
      <AdminTopbar title={d.ref} crumbs={["Moniva Yönetim", "Teklif Talepleri"]} />

      <div className="mv-page">
        {/* Header */}
        <div className="iq-head">
          <div>
            <div className="iq-head__crumb">
              <Link href="/admin/inquiries">TEKLİF TALEPLERİ</Link> / DETAY
            </div>
            <div className="iq-head__title">
              <span className="mv-mono">{d.ref}</span>
              <span className={`mv-pill mv-pill--${STATUS_PILL[d.status].kind}`}>
                {STATUS_PILL[d.status].label}
              </span>
              {d.isArchived && <span className="mv-pill mv-pill--mute">Arşiv</span>}
            </div>
            <div className="iq-head__meta">
              <b>{d.companyName}</b>
              <span>·</span>
              <span>{d.country}</span>
              <span>·</span>
              <span>{d.createdAtLabel}</span>
            </div>
          </div>
          <div className="iq-head__actions">
            {d.quotedAtLabel && (
              <span className="iq-head__quoted">Teklif verildi · {d.quotedAtLabel}</span>
            )}
            <InquiryDangerActions id={d.id} refLabel={d.ref} isArchived={d.isArchived} />
          </div>
        </div>

        {/* Durum akışı (stepper) */}
        <div className="mv-card iq-flow">
          {STATUS_FLOW.map((s, i) => {
            const done = i < stepIdx;
            const cur = i === stepIdx;
            return (
              <form action={updateInquiryStatus} key={s.key} className="iq-flow__cell">
                <input type="hidden" name="id" value={d.id} />
                <input type="hidden" name="status" value={s.key} />
                <button
                  type="submit"
                  className={
                    "iq-flow__btn" +
                    (cur ? " iq-flow__btn--cur" : "") +
                    (done ? " iq-flow__btn--done" : "")
                  }
                >
                  <span className="iq-flow__dot">{done ? "✓" : i + 1}</span>
                  <span className="iq-flow__label">{s.label}</span>
                </button>
              </form>
            );
          })}
        </div>

        <div className="iq-grid">
          {/* ── Ana sütun ── */}
          <div className="iq-main">
            {/* Müşteri sorgusu */}
            <div className="mv-card iq-pad">
              <div className="iq-cardhead">
                <span className="iq-cardhead__ttl">Müşteri mesajı</span>
                <span className="iq-cardhead__sub">Ürün Detay · Teklif Listesi üzerinden</span>
              </div>
              {d.notes ? (
                <blockquote className="iq-quote">{d.notes}</blockquote>
              ) : (
                <div className="iq-quote iq-quote--empty">Müşteri not bırakmamış.</div>
              )}
              <div className="iq-meta-row">
                <div>
                  <span>Kaynak:</span> <b>moniva.com.tr/teklif-listem</b>
                </div>
                <div>
                  <span>Para birimi:</span> {d.currency}
                </div>
                <div>
                  <span>Teslimat adresi:</span> {d.address}
                </div>
              </div>
            </div>

            {/* Talep edilen parçalar + fiyatlandırma */}
            <QuotePricing
              requestId={d.id}
              currency={d.currency}
              isQuoted={d.status === QuoteStatus.QUOTED}
              initialItems={d.items}
              initial={{
                discountPct: d.discountPct,
                shippingCost: d.shippingCost,
                shippingMode: d.shippingMode,
                vatRate: d.vatRate,
                validUntil: d.validUntilValue,
                paymentTerms: d.paymentTerms,
              }}
              pdfHref={`/admin/inquiries/${d.id}/pdf`}
            />

            {/* Dahili not */}
            <div className="mv-card iq-pad">
              <div className="iq-cardhead">
                <span className="iq-cardhead__ttl">Dahili not</span>
                <span className="iq-cardhead__sub">Müşteriye görünmez</span>
              </div>
              <form action={saveInquiryNote} className="iq-note">
                <input type="hidden" name="id" value={d.id} />
                <textarea
                  name="note"
                  rows={4}
                  defaultValue={d.adminNotes ?? ""}
                  placeholder="Ekip için not ekleyin…"
                />
                <div className="iq-note__actions">
                  <button type="submit" className="mv-btn mv-btn--primary">
                    Notu kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── Sağ sütun ── */}
          <div className="iq-side">
            <div className="mv-card iq-pad">
              <div className="iq-cardhead__ttl iq-side__ttl">Müşteri</div>
              <div className="iq-customer">
                <div className="iq-customer__avatar">{initialsOf(d.companyName)}</div>
                <div>
                  <div className="iq-customer__co">{d.companyName}</div>
                  <div className="iq-customer__sub">{d.country}</div>
                </div>
              </div>
              <div className="iq-rows">
                {customerRows.map(([k, v]) => (
                  <div className="iq-row" key={k}>
                    <span className="iq-row__k">{k}</span>
                    <span className="iq-row__v">{v ?? "—"}</span>
                  </div>
                ))}
              </div>
              <a href={`mailto:${d.email}`} className="mv-btn mv-btn--ghost iq-side__btn">
                E-posta gönder ↗
              </a>
            </div>

            <div className="mv-card iq-pad">
              <div className="iq-cardhead__ttl iq-side__ttl">Teslimat & lojistik</div>
              <div className="iq-ship">
                <b>{d.companyName}</b>
                <br />
                {d.address}
                {d.city && (
                  <>
                    <br />
                    {d.city}
                  </>
                )}
                <br />
                {d.country}
              </div>
            </div>

            <div className="mv-card iq-pad">
              <div className="iq-cardhead__ttl iq-side__ttl">Dosyalar</div>
              <div className="mv-empty iq-side__empty">
                Dosya ekleme yakında.
              </div>
            </div>

            <div className="mv-card iq-pad">
              <div className="iq-cardhead__ttl iq-side__ttl">Hareketler</div>
              <div className="iq-activity">
                <div className="iq-act">
                  <span className="iq-act__dot">—</span>
                  <div>
                    <div className="iq-act__body">Teklif talebi oluşturuldu</div>
                    <div className="iq-act__time">{d.timeLabel}</div>
                  </div>
                </div>
                {d.status !== QuoteStatus.NEW && (
                  <div className="iq-act">
                    <span className="iq-act__dot">—</span>
                    <div>
                      <div className="iq-act__body">
                        Durum → {STATUS_PILL[d.status].label}
                      </div>
                      <div className="iq-act__time">güncellendi</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
