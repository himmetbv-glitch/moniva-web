import type { Metadata } from "next";
import Link from "next/link";
import { QuoteStatus } from "@prisma/client";

import { getDashboardData, type DashTask } from "@/lib/admin/dashboard";
import { AdminTopbar } from "../AdminTopbar";
import { Icons } from "../icons";

export const metadata: Metadata = { title: "Panel" };

const nf = new Intl.NumberFormat("tr-TR");

const STATUS_PILL: Record<QuoteStatus, { kind: string; label: string }> = {
  NEW: { kind: "info", label: "Yeni" },
  QUOTED: { kind: "mute", label: "Teklif verildi" },
  CLOSED: { kind: "ok", label: "Kapandı" },
};

function Pill({ kind, children }: { kind: string; children: React.ReactNode }) {
  return <span className={`ad-pill ad-pill--${kind}`}>{children}</span>;
}

// Area chart — ports the mockup's SVG geometry, fed by real daily counts.
function QuoteChart({ daily, max }: { daily: number[]; max: number }) {
  const W = 715;
  const H = 160;
  const x0 = 40;
  const y0 = 20;
  const pts = daily.map<[number, number]>((v, i) => [
    x0 + (i / (daily.length - 1)) * W,
    y0 + H - (v / max) * H,
  ]);
  const line = pts
    .map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1))
    .join(" ");
  const area = `${line} L ${x0 + W},${y0 + H} L ${x0},${y0 + H} Z`;
  const yLabels = [max, Math.round(max * 0.75), Math.round(max * 0.5), Math.round(max * 0.25), 0];

  return (
    <svg width="100%" height="220" viewBox="0 0 760 220" preserveAspectRatio="none">
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="40" x2="755" y1={20 + i * 40} y2={20 + i * 40} stroke="#EFEDF3" strokeWidth="1" />
      ))}
      {yLabels.map((v, i) => (
        <text key={i} x="32" y={24 + i * 40} fontSize="9" fill="#8A839C" textAnchor="end">
          {v}
        </text>
      ))}
      <defs>
        <linearGradient id="ad-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4F3D8C" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#4F3D8C" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#ad-grad)" />
      <path d={line} fill="none" stroke="#4F3D8C" strokeWidth="2" />
      {pts.map(([x, y], i) =>
        i % 5 === 0 ? (
          <circle key={i} cx={x} cy={y} r="3" fill="#fff" stroke="#4F3D8C" strokeWidth="2" />
        ) : null,
      )}
    </svg>
  );
}

export default async function AdminDashboardPage() {
  const d = await getDashboardData();

  const statCards = [
    {
      label: "Teklif talepleri (30g)",
      val: nf.format(d.stats.rfq30d),
      delta:
        d.stats.rfqDeltaPct === null
          ? null
          : `${d.stats.rfqDeltaPct >= 0 ? "+" : ""}${d.stats.rfqDeltaPct.toFixed(1)}%`,
      up: (d.stats.rfqDeltaPct ?? 0) >= 0,
      sub: "önceki döneme göre",
    },
    {
      label: "Aktif ürün",
      val: nf.format(d.stats.activeProducts),
      delta: d.stats.addedThisMonth > 0 ? `+${d.stats.addedThisMonth}` : null,
      up: true,
      sub: "bu ay eklendi",
    },
    {
      label: "Katalog görüntüleme",
      val: d.stats.catalogueViews === null ? "—" : nf.format(d.stats.catalogueViews),
      delta: null,
      up: true,
      sub: "analitik yakında",
    },
    {
      label: "Cevap bekleyen teklif",
      val: nf.format(d.newQuotes),
      delta: null,
      up: false,
      sub: "gelen kutusunda",
    },
  ];

  const legend: [string, string, string | null][] = [
    ["Toplam", nf.format(d.chart.total), null],
    ["Günlük ort.", d.chart.avgPerDay, null],
    ["Dönüşüm", "—", null],
    ["Ort. parça / teklif", d.chart.avgPartsPerRfq, null],
  ];

  return (
    <>
      <AdminTopbar title="Panel" crumbs={["Moniva Yönetim", "Genel Bakış"]} />

      <div className="ad-page">
        {/* Karşılama */}
        <div className="ad-welcome">
          <div>
            <div className="ad-welcome__hi">{d.greeting}.</div>
            <div className="ad-welcome__sub">
              {d.newQuotes > 0 ? (
                <>
                  <b>{d.newQuotes} teklif talebi</b> incelenmeyi bekliyor.
                </>
              ) : (
                <>Şu an bekleyen teklif talebi yok.</>
              )}
            </div>
          </div>
          <div className="ad-welcome__actions">
            <a
              className="ad-btn ad-btn--ghost"
              href="/api/admin/reports/quotes"
              title="Teklif taleplerini CSV olarak indir"
            >
              <Icons.exp /> Rapor al
            </a>
            <Link className="ad-btn ad-btn--primary" href="/admin/products/new">
              <Icons.plus /> Yeni ürün
            </Link>
          </div>
        </div>

        {/* İstatistik kartları */}
        <div className="ad-stats">
          {statCards.map((s) => (
            <div className="ad-stat" key={s.label}>
              <div className="ad-stat__label">{s.label}</div>
              <div className="ad-stat__row">
                <div className="ad-stat__val">{s.val}</div>
                {s.delta && (
                  <span className={"ad-stat__delta" + (s.up ? "" : " ad-stat__delta--dn")}>
                    {s.up ? <Icons.arrowUp /> : <Icons.arrowDn />} {s.delta}
                  </span>
                )}
              </div>
              <div className="ad-stat__sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Grafik + Action items */}
        <div className="ad-grid ad-grid--chart">
          <div className="ad-card ad-card--flush">
            <div className="ad-card__head">
              <div>
                <div className="ad-card__title">Teklif talepleri — son 30 gün</div>
                <div className="ad-card__sub">Gönderim tarihine göre günlük hacim</div>
              </div>
              <div className="ad-seg">
                {["7G", "30G", "90G", "1Y"].map((p, i) => (
                  <span key={p} className={"ad-seg__btn" + (i === 1 ? " ad-seg__btn--on" : "")}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <div className="ad-card__body">
              <QuoteChart daily={d.chart.daily} max={d.chart.max} />
              <div className="ad-legend">
                {legend.map(([k, v]) => (
                  <div key={k}>
                    <div className="ad-legend__k">{k}</div>
                    <div className="ad-legend__v">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="ad-card ad-card--flush">
            <div className="ad-card__head">
              <div className="ad-card__title">Yapılacaklar</div>
              <span className="ad-card__link">Tümü ▶</span>
            </div>
            {d.tasks.length === 0 ? (
              <div className="ad-empty">Bekleyen iş yok.</div>
            ) : (
              d.tasks.map((t: DashTask, i) => (
                <div className="ad-task" key={i}>
                  <span className="ad-task__box" />
                  <div className="ad-task__body">
                    <div className="ad-task__text">{t.text}</div>
                    <Pill kind={t.kind}>{t.due}</Pill>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Son teklifler + Top ürünler */}
        <div className="ad-grid ad-grid--lower">
          <div className="ad-card ad-card--flush">
            <div className="ad-card__head">
              <div className="ad-card__title">Son teklif talepleri</div>
              <span className="ad-card__link">Gelen kutusu ▶</span>
            </div>
            {d.recentQuotes.length === 0 ? (
              <div className="ad-empty">Henüz teklif talebi yok.</div>
            ) : (
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Referans</th>
                    <th>Firma</th>
                    <th className="ad-num">Parça</th>
                    <th>Durum</th>
                    <th>Geliş</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {d.recentQuotes.map((q) => (
                    <tr key={q.id}>
                      <td>
                        <span className="ad-mono ad-ref">{q.ref}</span>
                      </td>
                      <td>
                        <div className="ad-co">{q.companyName}</div>
                        <div className="ad-co__sub">{q.country}</div>
                      </td>
                      <td className="ad-num ad-muted">{q.itemCount}</td>
                      <td>
                        <Pill kind={STATUS_PILL[q.status].kind}>
                          {STATUS_PILL[q.status].label}
                        </Pill>
                      </td>
                      <td className="ad-dim">{q.timeLabel}</td>
                      <td className="ad-dim ad-more">
                        <Icons.more />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="ad-card ad-card--flush">
            <div className="ad-card__head">
              <div className="ad-card__title">Bu ayın öne çıkan ürünleri</div>
              <span className="ad-card__link">Tümü ▶</span>
            </div>
            {d.topProducts.length === 0 ? (
              <div className="ad-empty">Henüz teklife konu ürün yok.</div>
            ) : (
              d.topProducts.map((p, i) => (
                <div className="ad-top" key={p.productId}>
                  <div className="ad-top__rank">{i + 1}</div>
                  <div className="ad-top__meta">
                    <div className="ad-top__name">{p.name}</div>
                    <div className="ad-top__sku ad-mono">{p.sku}</div>
                  </div>
                  <div className="ad-top__num">
                    <div className="ad-top__val">{nf.format(p.quotes)}</div>
                    <div className="ad-top__lbl">teklif</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <p className="ad-note">
          Not: B2B kataloğunda ürünlerde stok/fiyat alanı yoktur. Katalog
          görüntüleme ve mesaj metrikleri analitik/mesaj modülü eklendiğinde
          canlanacak. <Link href="/admin/dashboard">Yenile</Link>
        </p>
      </div>
    </>
  );
}
