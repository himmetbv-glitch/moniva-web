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
    <header className="ad-topbar">
      <div className="ad-topbar__head">
        <div className="ad-topbar__crumbs">{crumbs.join(" / ")}</div>
        <div className="ad-topbar__title">{title}</div>
      </div>

      <div className="ad-topbar__right">
        <div className="ad-topbar__search">
          <span className="ad-topbar__searchico">
            <Icons.search />
          </span>
          <input placeholder="Yönetimde ara…" />
          <span className="ad-topbar__kbd">⌘K</span>
        </div>

        <div className="ad-noti">
          <button type="button" className="ad-topbar__bell" aria-label="Bildirimler">
            <Icons.bell />
            {unread > 0 && (
              <span className="ad-topbar__bellcount">{unread > 9 ? "9+" : unread}</span>
            )}
          </button>

          <div className="ad-noti__panel" role="menu">
            <div className="ad-noti__head">
              <span>Bildirimler</span>
              {unread > 0 && <span className="ad-noti__count">{unread}</span>}
            </div>

            {items.length === 0 ? (
              <div className="ad-noti__empty">Yeni bildirim yok.</div>
            ) : (
              <div className="ad-noti__list">
                {items.map((n) => (
                  <Link key={`${n.type}-${n.id}`} href={n.href} className="ad-noti__item">
                    <span className={`ad-noti__ico ad-noti__ico--${n.type}`}>
                      {TYPE_ICON[n.type]}
                    </span>
                    <span className="ad-noti__body">
                      <span className="ad-noti__title">{n.title}</span>
                      <span className="ad-noti__sub">{n.sub}</span>
                    </span>
                    <span className="ad-noti__time">{n.timeLabel}</span>
                  </Link>
                ))}
              </div>
            )}

            <div className="ad-noti__foot">
              <Link href="/admin/inquiries">Teklif talepleri</Link>
              <Link href="/admin/messages">Mesajlar</Link>
            </div>
          </div>
        </div>

        <span className="ad-topbar__divider" />

        <div className="ad-topbar__site">
          <span className="ad-topbar__live">
            <span className="ad-topbar__livedot" /> CANLI
          </span>
          <span className="ad-topbar__domain">moniva.com.tr</span>
          <Link href="/" className="ad-topbar__view" target="_blank">
            <Icons.exp /> Siteyi gör
          </Link>
        </div>
      </div>
    </header>
  );
}
