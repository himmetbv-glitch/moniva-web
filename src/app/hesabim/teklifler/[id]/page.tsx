import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/customer/dal";
import { getMyQuoteDetail } from "@/lib/customer/quotes";
import { MY_QUOTE_STATUS } from "@/lib/customer/quote-status";

export default async function MyQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/hesabim/teklifler/${id}`);
  const q = await getMyQuoteDetail(user.id, id);
  if (!q) notFound();

  const st = MY_QUOTE_STATUS[q.status];

  return (
    <div className="ac-inner">
      <div className="ac-crumb">
        <Link href="/hesabim">Hesabım</Link> <span>/</span> Teklif {q.ref}
      </div>

      <div className="ac-head">
        <div>
          <h1 className="ac-title">Teklif {q.ref}</h1>
          <p className="ac-sub">
            {q.createdAtLabel} tarihinde oluşturuldu · {q.totalQty} adet
          </p>
        </div>
        <span className={`ac-pill ac-pill--${st.kind}`}>{st.label}</span>
      </div>

      {!q.priced && (
        <div className="ac-note">
          Teklifiniz ekibimizce inceleniyor. Fiyatlandırma tamamlandığında bu sayfada
          görüntüleyebilir ve PDF olarak indirebilirsiniz.
        </div>
      )}

      <div className="ac-section">
        <h2 className="ac-section__title">Talep edilen parçalar</h2>
        <div className="ac-card">
          <table className="ac-table">
            <thead>
              <tr>
                <th>Parça</th>
                <th className="ac-num">Adet</th>
                {q.priced && <th className="ac-num">Birim</th>}
                {q.priced && <th className="ac-num">Tutar</th>}
              </tr>
            </thead>
            <tbody>
              {q.items.map((it) => (
                <tr key={it.id}>
                  <td>
                    <div className="ac-pname">{it.name}</div>
                    <div className="ac-mono ac-dim">{it.sku}</div>
                  </td>
                  <td className="ac-num">{it.quantity}</td>
                  {q.priced && <td className="ac-num">{it.unitPriceLabel ?? "—"}</td>}
                  {q.priced && <td className="ac-num">{it.lineTotalLabel ?? "—"}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {q.priced && (
        <div className="ac-grid2">
          <div className="ac-section">
            <h2 className="ac-section__title">Teklif özeti</h2>
            <div className="ac-card ac-pad">
              <div className="ac-trow">
                <span>Ara toplam</span>
                <b>{q.totalsLabels.subtotal}</b>
              </div>
              {q.discountPct > 0 && (
                <div className="ac-trow ac-trow--minus">
                  <span>İskonto (%{q.discountPct})</span>
                  <b>− {q.totalsLabels.discount}</b>
                </div>
              )}
              <div className="ac-trow">
                <span>Navlun{q.shippingMode ? ` · ${q.shippingMode}` : ""}</span>
                <b>{q.totalsLabels.shipping}</b>
              </div>
              <div className="ac-trow">
                <span>KDV (%{q.vatRate})</span>
                <b>{q.totalsLabels.vat}</b>
              </div>
              <div className="ac-trow ac-trow--total">
                <span>Genel toplam</span>
                <b>{q.totalsLabels.total}</b>
              </div>
              <a
                href={`/hesabim/teklifler/${q.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="ac-btn ac-btn--block"
              >
                Teklifi PDF indir ↓
              </a>
            </div>
          </div>

          <div className="ac-section">
            <h2 className="ac-section__title">Koşullar</h2>
            <div className="ac-card ac-pad">
              <div className="ac-row">
                <span className="ac-row__k">Para birimi</span>
                <span>{q.currency}</span>
              </div>
              <div className="ac-row">
                <span className="ac-row__k">Geçerlilik</span>
                <span>{q.validUntilLabel ?? "—"}</span>
              </div>
              <div className="ac-row">
                <span className="ac-row__k">Ödeme</span>
                <span>{q.paymentTerms ?? "—"}</span>
              </div>
              <div className="ac-row">
                <span className="ac-row__k">Teklif tarihi</span>
                <span>{q.quotedAtLabel ?? "—"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="ac-section">
        <h2 className="ac-section__title">Teslimat</h2>
        <div className="ac-card ac-pad">
          <div className="ac-ship">
            <b>{q.companyName}</b>
            <br />
            {q.address}
            {q.city && (
              <>
                <br />
                {q.city}
              </>
            )}
            <br />
            {q.country}
          </div>
          {q.notes && <p className="ac-notes">“{q.notes}”</p>}
        </div>
      </div>
    </div>
  );
}
