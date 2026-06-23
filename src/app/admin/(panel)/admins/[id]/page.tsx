import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";

import { verifyAdmin } from "@/lib/admin/dal";
import { getUserDetail } from "@/lib/admin/users";
import { AdminTopbar } from "../../AdminTopbar";
import { UserRowActions } from "../UserRowActions";

export const metadata: Metadata = { title: "Kullanıcı Detayı" };

function initialsOf(name: string | null, email: string): string {
  const base = name?.trim() || email;
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

const STATUS_LABEL: Record<string, { label: string; kind: string }> = {
  NEW: { label: "Yeni", kind: "info" },
  QUOTED: { label: "Teklif verildi", kind: "ok" },
  CLOSED: { label: "Kapandı", kind: "mute" },
};

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [admin, u] = await Promise.all([verifyAdmin(), getUserDetail(id)]);
  if (!u) notFound();

  const isSelf = u.id === admin.id;
  const profileRows: [string, string | null][] = [
    ["Firma", u.companyName],
    ["VKN", u.taxNumber],
    ["Vergi dairesi", u.taxOffice],
    ["Telefon", u.phone],
    ["Şehir", u.city],
    ["Adres", u.address],
    ["Son giriş", u.lastLoginLabel],
    ["Kayıt tarihi", u.createdAtLabel],
  ];

  return (
    <>
      <AdminTopbar title={u.name ?? u.email} crumbs={["Moniva Yönetim", "Sistem"]} />

      <div className="ad-page">
        <div className="iq-head">
          <div>
            <div className="iq-head__crumb">
              <Link href="/admin/admins">KULLANICILAR</Link> / DETAY
            </div>
            <div className="iq-head__title">
              <span>{u.name ?? "—"}</span>
              <span className={`ad-pill ad-pill--${u.role === Role.ADMIN ? "info" : "mute"}`}>
                {u.role === Role.ADMIN ? "Yönetici" : "Müşteri"}
              </span>
              {!u.isActive && <span className="ad-pill ad-pill--mute">Pasif</span>}
              {u.role === Role.CUSTOMER &&
                (u.isVerified ? (
                  <span className="ad-pill ad-pill--ok">Doğrulandı</span>
                ) : (
                  <span className="ad-pill ad-pill--warn">Bekliyor</span>
                ))}
              {isSelf && <span className="usr-self">siz</span>}
            </div>
            <div className="iq-head__meta">
              <span>{u.email}</span>
            </div>
          </div>
          <div className="iq-head__actions">
            <UserRowActions
              id={u.id}
              name={u.name ?? u.email}
              role={u.role}
              isVerified={u.isVerified}
              isActive={u.isActive}
              isSelf={isSelf}
            />
          </div>
        </div>

        <div className="iq-grid">
          <div className="iq-main">
            <div className="ad-card iq-pad">
              <div className="iq-cardhead">
                <span className="iq-cardhead__ttl">Teklif talepleri</span>
                <span className="iq-cardhead__sub">{u.quotes.length} kayıt</span>
              </div>
              {u.quotes.length === 0 ? (
                <div className="ad-empty">Bu kullanıcının teklif talebi yok.</div>
              ) : (
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Referans</th>
                      <th>Tarih</th>
                      <th className="ad-num">Kalem</th>
                      <th>Durum</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {u.quotes.map((q) => {
                      const st = STATUS_LABEL[q.status] ?? { label: q.status, kind: "mute" };
                      return (
                        <tr key={q.id}>
                          <td>
                            <Link href={`/admin/inquiries/${q.id}`} className="ad-ref ad-mono">
                              {q.ref}
                            </Link>
                          </td>
                          <td className="ad-dim">{q.createdAtLabel}</td>
                          <td className="ad-num ad-muted">{q.itemCount}</td>
                          <td>
                            <span className={`ad-pill ad-pill--${st.kind}`}>{st.label}</span>
                          </td>
                          <td>
                            <Link href={`/admin/inquiries/${q.id}`} className="iq-open">
                              Aç ▶
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="iq-side">
            <div className="ad-card iq-pad">
              <div className="iq-cardhead__ttl iq-side__ttl">Hesap bilgileri</div>
              <div className="iq-customer">
                <div className="iq-customer__avatar">{initialsOf(u.name, u.email)}</div>
                <div>
                  <div className="iq-customer__co">{u.name ?? "—"}</div>
                  <div className="iq-customer__sub">{u.email}</div>
                </div>
              </div>
              <div className="iq-rows">
                {profileRows.map(([k, v]) => (
                  <div className="iq-row" key={k}>
                    <span className="iq-row__k">{k}</span>
                    <span className="iq-row__v">{v ?? "—"}</span>
                  </div>
                ))}
              </div>
              <a href={`mailto:${u.email}`} className="ad-btn ad-btn--ghost iq-side__btn">
                E-posta gönder ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
