import type { Metadata } from "next";
import Link from "next/link";
import { Role } from "@prisma/client";

import { verifyAdmin } from "@/lib/admin/dal";
import { getAdminUsers, type AdminUserFilters } from "@/lib/admin/users";
import { AdminTopbar } from "../AdminTopbar";
import { Icons } from "../icons";
import { UserRowActions } from "./UserRowActions";

export const metadata: Metadata = { title: "Kullanıcılar & Roller" };

const TABS: { key: string; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "admin", label: "Yöneticiler" },
  { key: "customer", label: "Müşteriler" },
  { key: "pending", label: "Doğrulama Bekleyen" },
];

function hrefFor(tab?: string, q?: string): string {
  const p = new URLSearchParams();
  if (tab && tab !== "all") p.set("tab", tab);
  if (q) p.set("q", q);
  const s = p.toString();
  return s ? `/admin/admins?${s}` : "/admin/admins";
}

function initialsOf(name: string | null, email: string): string {
  const base = name?.trim() || email;
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const [admin, sp] = await Promise.all([verifyAdmin(), searchParams]);
  const tab =
    sp.tab === "admin" || sp.tab === "customer" || sp.tab === "pending"
      ? sp.tab
      : "all";
  const q = sp.q ?? "";

  const filters: AdminUserFilters = {
    q,
    role: tab === "admin" ? "ADMIN" : tab === "customer" ? "CUSTOMER" : undefined,
    pending: tab === "pending",
  };
  const { rows, summary } = await getAdminUsers(filters);

  const summaryCells = [
    { k: "Toplam", v: summary.total },
    { k: "Yönetici", v: summary.admins },
    { k: "Müşteri", v: summary.customers },
    { k: "Doğrulanmış", v: summary.verified },
    { k: "Bekleyen", v: summary.pending },
  ];

  return (
    <>
      <AdminTopbar title="Kullanıcılar & Roller" crumbs={["Moniva Yönetim", "Sistem"]} />

      <div className="mv-page">
        <div className="mv-welcome">
          <div>
            <h1 className="mv-welcome__hi">Kullanıcılar & Roller</h1>
            <div className="mv-welcome__sub">
              Yönetici ve B2B müşteri hesapları; rol ve doğrulama yönetimi.
            </div>
          </div>
          <div className="mv-welcome__actions">
            <Link href="/admin/admins/new" className="mv-btn mv-btn--primary">
              + Yeni kullanıcı
            </Link>
          </div>
        </div>

        <div className="iq-summary">
          {summaryCells.map((s) => (
            <div className="iq-summary__cell" key={s.k}>
              <div className="iq-summary__k">{s.k}</div>
              <div className="iq-summary__v">{s.v}</div>
            </div>
          ))}
        </div>

        <div className="iq-filter">
          <form className="iq-search" action="/admin/admins" method="get">
            {tab !== "all" && <input type="hidden" name="tab" value={tab} />}
            <span className="iq-search__ico">
              <Icons.search />
            </span>
            <input
              name="q"
              defaultValue={q}
              placeholder="İsim, e-posta veya firma ile ara…"
            />
          </form>
          <div className="iq-tabs">
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={hrefFor(t.key, q)}
                className={"iq-tab" + (t.key === tab ? " iq-tab--on" : "")}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mv-card mv-card--flush">
          {rows.length === 0 ? (
            <div className="mv-empty">Bu filtreye uygun kullanıcı yok.</div>
          ) : (
            <table className="mv-table usr-table">
              <thead>
                <tr>
                  <th>Kullanıcı</th>
                  <th>Firma</th>
                  <th>Rol</th>
                  <th>Durum</th>
                  <th className="mv-num">Teklif</th>
                  <th>Son giriş</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => {
                  const isSelf = u.id === admin.id;
                  return (
                    <tr key={u.id} className={u.isActive ? "" : "usr-row--off"}>
                      <td>
                        <div className="usr-id">
                          <div className="usr-id__av">
                            {initialsOf(u.name, u.email)}
                          </div>
                          <div className="usr-id__meta">
                            <Link href={`/admin/admins/${u.id}`} className="mv-co mv-ref">
                              {u.name ?? u.email}
                              {isSelf && <span className="usr-self">siz</span>}
                            </Link>
                            <div className="mv-co__sub">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="mv-muted">{u.company ?? "—"}</td>
                      <td>
                        <span
                          className={`mv-pill mv-pill--${
                            u.role === Role.ADMIN ? "info" : "mute"
                          }`}
                        >
                          {u.role === Role.ADMIN ? "Yönetici" : "Müşteri"}
                        </span>
                      </td>
                      <td>
                        <div className="usr-badges">
                          {!u.isActive && (
                            <span className="mv-pill mv-pill--mute">Pasif</span>
                          )}
                          {u.role === Role.CUSTOMER &&
                            (u.isVerified ? (
                              <span className="mv-pill mv-pill--ok">Doğrulandı</span>
                            ) : (
                              <span className="mv-pill mv-pill--warn">Bekliyor</span>
                            ))}
                        </div>
                      </td>
                      <td className="mv-num mv-muted">{u.quoteCount}</td>
                      <td className="mv-dim">{u.lastLoginLabel}</td>
                      <td>
                        <UserRowActions
                          id={u.id}
                          name={u.name ?? u.email}
                          role={u.role}
                          isVerified={u.isVerified}
                          isActive={u.isActive}
                          isSelf={isSelf}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
