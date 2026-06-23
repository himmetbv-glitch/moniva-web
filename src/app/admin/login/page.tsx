import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ADMIN_DASHBOARD_PATH } from "@/lib/actions/auth-types";
import { getLoginPanelData } from "@/lib/admin/login-stats";
import { LoginForm } from "./LoginForm";
import "./login.css";

export const metadata: Metadata = {
  title: "Yönetim Girişi — Moniva",
  robots: { index: false, follow: false },
};

const nf = new Intl.NumberFormat("tr-TR");

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user?.role === "ADMIN") {
    redirect(ADMIN_DASHBOARD_PATH);
  }

  const { rfq30d, productsLive, brands, activity } = await getLoginPanelData();

  return (
    <div className="al-stage">
      {/* ───────── SOL: MARKA PANELİ ───────── */}
      <aside className="al-brand">
        <div className="al-brand__inner">
          <div className="al-logo">
            <Image
              src="/brand/moniva-logo.png"
              alt="Moniva"
              width={150}
              height={46}
              className="al-logo__img"
              priority
            />
            <span className="al-logo__pill">YÖNETİM · v3.2</span>
          </div>

          <div className="al-hero">
            <h1>
              <span className="al-hero__accent">Moniva</span> yönetim panelinize
              tekrar hoş geldiniz.
            </h1>
            <p>
              Ürünleri, markaları ve teklif taleplerini tek bir çalışma
              alanından yönetin. Devam etmek için giriş yapın.
            </p>
          </div>

          <div className="al-live">
            <div className="al-live__stat">
              <div className="al-live__label">Teklif · 30g</div>
              <div className="al-live__val">{nf.format(rfq30d)}</div>
              <div className="al-live__delta">son 30 gün</div>
            </div>
            <div className="al-live__stat">
              <div className="al-live__label">Aktif ürün</div>
              <div className="al-live__val">{nf.format(productsLive)}</div>
              <div className="al-live__delta">yayında</div>
            </div>
            <div className="al-live__stat">
              <div className="al-live__label">Marka</div>
              <div className="al-live__val">{nf.format(brands)}</div>
              <div className="al-live__delta">katalogda</div>
            </div>
          </div>

          <div className="al-activity">
            <div className="al-activity__head">
              <span className="al-activity__ttl">Son hareketler</span>
              <span className="al-activity__live">Canlı</span>
            </div>
            {activity.length === 0 ? (
              <div className="al-act-row">
                <div className="al-act-row__txt">Henüz teklif talebi yok.</div>
              </div>
            ) : (
              activity.map((a) => (
                <div className="al-act-row" key={a.id}>
                  <div className="al-act-row__avatar">{a.initials}</div>
                  <div className="al-act-row__txt">
                    <b>{a.company}</b> firmasından teklif talebi · {a.ref}
                  </div>
                  <div className="al-act-row__time">{a.timeLabel}</div>
                </div>
              ))
            )}
          </div>

          <div className="al-brand__foot">
            <div className="al-certs">
              <span className="al-cert">ISO 9001:2015</span>
              <span className="al-cert">IATF 16949</span>
              <span className="al-cert">ECE R90</span>
            </div>
            <span className="al-vers">BACKEND 3.2.0</span>
          </div>
        </div>
      </aside>

      {/* ───────── SAĞ: FORM ───────── */}
      <section className="al-form-side">
        <div className="al-topbar">
          <span className="al-topbar__help">
            Hesabınız yok mu? <a href="#">Yöneticinize başvurun →</a>
          </span>
          <div className="al-lang">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
              <ellipse cx="7" cy="7" rx="2.8" ry="6" stroke="currentColor" strokeWidth="1.3" />
              <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            <span>TR</span>
          </div>
        </div>

        <div className="al-form-wrap">
          <div className="al-form-head">
            <div className="al-kicker">Yönetim Portalı · Güvenli Giriş</div>
            <h2>Çalışma alanınıza giriş yapın.</h2>
            <p>Moniva kurumsal e-postanız ve şifrenizle oturum açın.</p>
          </div>

          <LoginForm />
        </div>

        <div className="al-form-foot">
          <div className="al-form-foot__links">
            <a href="#">Künye</a>
            <a href="#">Gizlilik</a>
            <a href="#">Durum</a>
            <a href="#">Yardım</a>
          </div>
          <span>© 2026 Moniva</span>
        </div>
      </section>
    </div>
  );
}
