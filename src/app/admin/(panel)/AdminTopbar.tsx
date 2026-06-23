import Link from "next/link";

import { getNotifications } from "@/lib/admin/notifications";
import { Icons } from "./icons";

const TYPE_ICON = {
  quote: <Icons.order size={15} />,
  contact: <Icons.msg size={15} />,
  application: <Icons.user size={15} />,
} as const;

export async function AdminTopbar({
  title,
  crumbs,
}: {
  title: string;
  crumbs: string[];
}) {
  const items = await getNotifications();
  const unread = items.length;

  return (
    <header className="mv-topbar">
      <div className="mv-topbar__head">
        <div className="mv-topbar__crumbs">{crumbs.join(" / ")}</div>
        <div className="mv-topbar__title">{title}</div>
      </div>

      <div className="mv-topbar__right">
        <div className="mv-topbar__search">
          <span className="mv-topbar__searchico">
            <Icons.search />
          </span>
          <input placeholder="Yönetimde ara…" />
          <span className="mv-topbar__kbd">⌘K</span>
        </div>

        <div className="mv-noti">
          <button type="button" className="mv-topbar__bell" aria-label="Bildirimler">
            <Icons.bell />
            {unread > 0 && (
              <span className="mv-topbar__bellcount">{unread > 9 ? "9+" : unread}</span>
            )}
          </button>

          <div className="mv-noti__panel" role="menu">
            <div className="mv-noti__head">
              <span>Bildirimler</span>
              {unread > 0 && <span className="mv-noti__count">{unread}</span>}
            </div>

            {items.length === 0 ? (
              <div className="mv-noti__empty">Yeni bildirim yok.</div>
            ) : (
              <div className="mv-noti__list">
                {items.map((n) => (
                  <Link key={`${n.type}-${n.id}`} href={n.href} className="mv-noti__item">
                    <span className={`mv-noti__ico mv-noti__ico--${n.type}`}>
                      {TYPE_ICON[n.type]}
                    </span>
                    <span className="mv-noti__body">
                      <span className="mv-noti__title">{n.title}</span>
                      <span className="mv-noti__sub">{n.sub}</span>
                    </span>
                    <span className="mv-noti__time">{n.timeLabel}</span>
                  </Link>
                ))}
              </div>
            )}

            <div className="mv-noti__foot">
              <Link href="/admin/inquiries">Teklif talepleri</Link>
              <Link href="/admin/messages">Mesajlar</Link>
            </div>
          </div>
        </div>

        <span className="mv-topbar__divider" />

        <div className="mv-topbar__site">
          <span className="mv-topbar__live">
            <span className="mv-topbar__livedot" /> CANLI
          </span>
          <span className="mv-topbar__domain">moniva.com.tr</span>
          <Link href="/" className="mv-topbar__view" target="_blank">
            <Icons.exp /> Siteyi gör
          </Link>
        </div>
      </div>
    </header>
  );
}
