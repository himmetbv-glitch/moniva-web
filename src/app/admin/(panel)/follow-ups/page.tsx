import type { Metadata } from "next";
import Link from "next/link";

import { getFollowUps, type FollowUp } from "@/lib/admin/follow-ups";
import { AdminTopbar } from "../AdminTopbar";
import { CopyLinkButton } from "../inquiries/CopyLinkButton";
import { WhatsAppButton } from "../WhatsAppButton";

export const metadata: Metadata = { title: "Takip Gerekenler" };

function Row({ f }: { f: FollowUp }) {
  return (
    <tr>
      <td>
        <Link href={`/admin/inquiries/${f.id}`} className="mv-mono mv-ref">
          {f.ref}
        </Link>
      </td>
      <td>
        <div className="mv-co">{f.companyName}</div>
        <div className="mv-co__sub">
          {f.fullName}
          {f.phone ? ` · ${f.phone}` : ""}
        </div>
      </td>
      <td>
        {f.kind === "revision" ? (
          <span className="fu-what">
            {f.note ? (
              <span className="fu-note">“{f.note}”</span>
            ) : (
              <span className="mv-dim">Not eklenmedi</span>
            )}
          </span>
        ) : (
          <span className="fu-what">{f.whatHappened}</span>
        )}
      </td>
      <td className="mv-dim">{f.lastActivityLabel}</td>
      <td>
        <div className="fu-actions">
          <WhatsAppButton
            phone={f.phone}
            token={f.publicToken}
            scenario={f.kind === "revision" ? "revision" : "viewed"}
            greetName={f.fullName || f.companyName}
            refLabel={f.ref}
          />
          {f.publicToken && <CopyLinkButton token={f.publicToken} />}
        </div>
      </td>
      <td>
        <Link href={`/admin/inquiries/${f.id}`} className="iq-open">
          Aç ▶
        </Link>
      </td>
    </tr>
  );
}

function Section({
  title,
  sub,
  headWhat,
  tone,
  rows,
  emptyText,
}: {
  title: string;
  sub: string;
  headWhat: string;
  tone: "hot" | "revision";
  rows: FollowUp[];
  emptyText: string;
}) {
  return (
    <div className="mv-card mv-card--flush fu-card">
      <div className="mv-card__head">
        <div>
          <div className="mv-card__title">
            <span className={`fu-dot fu-dot--${tone}`} /> {title}
            <span className="fu-badge">{rows.length}</span>
          </div>
          <div className="mv-card__sub">{sub}</div>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="mv-empty">{emptyText}</div>
      ) : (
        <table className="mv-table iq-table">
          <thead>
            <tr>
              <th>Referans</th>
              <th>Firma / Kişi</th>
              <th>{headWhat}</th>
              <th>Son Hareket</th>
              <th>Aksiyon</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => (
              <Row key={f.id} f={f} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default async function FollowUpsPage() {
  const { hot, revision, total } = await getFollowUps();

  return (
    <>
      <AdminTopbar title="Takip Gerekenler" crumbs={["Moniva Yönetim", "Satış"]} />

      <div className="mv-page">
        <div className="mv-welcome">
          <div>
            <h1 className="mv-welcome__hi">Takip Gerekenler</h1>
            <div className="mv-welcome__sub">
              {total > 0 ? (
                <>
                  <b>{total} teklif</b> aksiyon bekliyor: müşteri açtı ama karar
                  vermedi ya da revizyon istedi.
                </>
              ) : (
                <>Şu an takip gerektiren teklif yok. Tümü güncel.</>
              )}
            </div>
          </div>
          <div className="mv-welcome__actions">
            <Link className="mv-btn mv-btn--ghost" href="/admin/inquiries">
              Tüm teklifler ▶
            </Link>
          </div>
        </div>

        <Section
          title="Sıcak — cevap bekleyenler"
          sub="Müşteri teklifi açtı, henüz karar vermedi. Bir hatırlatma çevirmenin tam zamanı."
          headWhat="Ne oldu"
          tone="hot"
          rows={hot}
          emptyText="Açılıp cevapsız kalan teklif yok."
        />

        <Section
          title="Revizyon istenenler"
          sub="Müşteri fiyat/şart güncellemesi istedi. Teklifi düzenleyip yeniden gönderin."
          headWhat="Müşteri notu"
          tone="revision"
          rows={revision}
          emptyText="Bekleyen revizyon talebi yok."
        />
      </div>
    </>
  );
}
