import Link from "next/link";

import { requireUser } from "@/lib/customer/dal";
import { getMyQuotes } from "@/lib/customer/quotes";
import { MY_QUOTE_STATUS } from "@/lib/customer/quote-status";
import { LogoutButton } from "./LogoutButton";

export default async function AccountHomePage() {
  const user = await requireUser("/hesabim");
  const quotes = await getMyQuotes(user.id);

  const firstName = (user.name ?? "").trim().split(/\s+/)[0] || "Merhaba";

  return (
    <div className="ac-inner">
      <div className="ac-head">
        <div>
          <h1 className="ac-title">Merhaba, {firstName}</h1>
          <p className="ac-sub">Teklif taleplerinizi buradan takip edin.</p>
        </div>
        <div className="ac-head__right">
          {user.isVerified ? (
            <span className="ac-badge ac-badge--ok">✓ Doğrulanmış B2B hesabı</span>
          ) : (
            <span className="ac-badge ac-badge--wait">Doğrulama bekleniyor</span>
          )}
          <Link href="/hesabim/profil" className="ac-logout">Profil</Link>
          <LogoutButton />
        </div>
      </div>

      {!user.isVerified && (
        <div className="ac-note">
          Hesabınız ekibimizce inceleniyor. Doğrulandığında özel B2B koşullarından
          yararlanmaya başlarsınız.
        </div>
      )}

      <div className="ac-section">
        <div className="ac-section__head">
          <h2 className="ac-section__title">Tekliflerim</h2>
          <Link href="/urunler" className="ac-link">+ Yeni teklif oluştur</Link>
        </div>

        {quotes.length === 0 ? (
          <div className="ac-empty">
            <p>Henüz teklif talebiniz yok.</p>
            <Link href="/urunler" className="ac-btn">Ürünlere göz atın</Link>
          </div>
        ) : (
          <div className="ac-card">
            <table className="ac-table">
              <thead>
                <tr>
                  <th>Referans</th>
                  <th>Tarih</th>
                  <th className="ac-num">Kalem</th>
                  <th>Durum</th>
                  <th className="ac-num">Tutar</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => {
                  const st = MY_QUOTE_STATUS[q.status];
                  return (
                    <tr key={q.id}>
                      <td>
                        <Link href={`/hesabim/teklifler/${q.id}`} className="ac-ref">
                          {q.ref}
                        </Link>
                      </td>
                      <td className="ac-dim">{q.createdAtLabel}</td>
                      <td className="ac-num ac-dim">{q.itemCount}</td>
                      <td>
                        <span className={`ac-pill ac-pill--${st.kind}`}>{st.label}</span>
                      </td>
                      <td className="ac-num">{q.totalLabel ?? "—"}</td>
                      <td>
                        <Link href={`/hesabim/teklifler/${q.id}`} className="ac-open">
                          Detay ▶
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
