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
  VIEWED: { kind: "info", label: "Görüntülendi" },
  APPROVED: { kind: "ok", label: "Onaylandı" },
  REVISION_REQUESTED: { kind: "warn", label: "Revizyon istendi" },
  DECLINED: { kind: "err", label: "Uygun değil" },
  EXPIRED: { kind: "mute", label: "Süresi doldu" },
  CLOSED: { kind: "ok", label: "Kapandı" },
};

function Pill({ kind, children }: { kind: string; children: React.ReactNode }) {
  return <span className={`mv-pill mv-pill--${kind}`}>{children}</span>;
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
        <linearGradient id="mv-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4F3D8C" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#4F3D8C" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#mv-grad)" />
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

      <div className="mv-page">
        {/* Karşılama */}
        <div className="mv-welcome">
          <div>
            <div className="mv-welcome__hi">{d.greeting}.</div>
            <div className="mv-welcome__sub">
              {d.newQuotes > 0 ? (
                <>
                  <b>{d.newQuotes} teklif talebi</b> incelenmeyi bekliyor.
                </>
              ) : (
                <>Şu an bekleyen teklif talebi yok.</>
              )}
            </div>
          </div>
          <div className="mv-welcome__actions">
            <a
              className="mv-btn mv-btn--ghost"
              href="/api/admin/reports/quotes"
              title="Teklif taleplerini CSV olarak indir"
            >
              <Icons.exp /> Rapor al
            </a>
            <Link className="mv-btn mv-btn--primary" href="/admin/products/new">
              <Icons.plus /> Yeni ürün
            </Link>
          </div>
        </div>

        {/* İstatistik kartları */}
        <div className="mv-stats">
          {statCards.map((s) => (
            <div className="mv-stat" key={s.label}>
              <div className="mv-stat__label">{s.label}</div>
              <div className="mv-stat__row">
                <div className="mv-stat__val">{s.val}</div>
                {s.delta && (
                  <span className={"mv-stat__delta" + (s.up ? "" : " mv-stat__delta--dn")}>
                    {s.up ? <Icons.arrowUp /> : <Icons.arrowDn />} {s.delta}
                  </span>
                )}
              </div>
              <div className="mv-stat__sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Grafik + Action items */}
        <div className="mv-grid mv-grid--chart">
          <div className="mv-card mv-card--flush">
            <div className="mv-card__head">
              <div>
                <div className="mv-card__title">Teklif talepleri — son 30 gün</div>
                <div className="mv-card__sub">Gönderim tarihine göre günlük hacim</div>
              </div>
            </div>
            <div className="mv-card__body">
              <QuoteChart daily={d.chart.daily} max={d.chart.max} />
              <div className="mv-legend">
                {legend.map(([k, v]) => (
                  <div key={k}>
                    <div className="mv-legend__k">{k}</div>
                    <div className="mv-legend__v">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mv-card mv-card--flush">
            <div className="mv-card__head">
              <div className="mv-card__title">Yapılacaklar</div>
            </div>
            {d.tasks.length === 0 ? (
              <div className="mv-empty">Bekleyen iş yok.</div>
            ) : (
              d.tasks.map((t: DashTask, i) => (
                <div className="mv-task" key={i}>
                  <span className="mv-task__box" />
                  <div className="mv-task__body">
                    <div className="mv-task__text">{t.text}</div>
                    <Pill kind={t.kind}>{t.due}</Pill>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Son teklifler + Top ürünler */}
        <div className="mv-grid mv-grid--lower">
          <div className="mv-card mv-card--flush">
            <div className="mv-card__head">
              <div className="mv-card__title">Son teklif talepleri</div>
              <Link className="mv-card__link" href="/admin/inquiries">
                Gelen kutusu ▶
              </Link>
            </div>
            {d.recentQuotes.length === 0 ? (
              <div className="mv-empty">Henüz teklif talebi yok.</div>
            ) : (
              <table className="mv-table">
                <thead>
                  <tr>
                    <th>Referans</th>
                    <th>Firma</th>
                    <th className="mv-num">Parça</th>
                    <th>Durum</th>
                    <th>Geliş</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {d.recentQuotes.map((q) => (
                    <tr key={q.id}>
                      <td>
                        <span className="mv-mono mv-ref">{q.ref}</span>
                      </td>
                      <td>
                        <div className="mv-co">{q.companyName}</div>
                        <div className="mv-co__sub">{q.country}</div>
                      </td>
                      <td className="mv-num mv-muted">{q.itemCount}</td>
                      <td>
                        <Pill kind={STATUS_PILL[q.status].kind}>
                          {STATUS_PILL[q.status].label}
                        </Pill>
                      </td>
                      <td className="mv-dim">{q.timeLabel}</td>
                      <td className="mv-dim mv-more">
                        <Icons.more />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="mv-card mv-card--flush">
            <div className="mv-card__head">
              <div className="mv-card__title">Bu ayın öne çıkan ürünleri</div>
              <Link className="mv-card__link" href="/admin/products">
                Tümü ▶
              </Link>
            </div>
            {d.topProducts.length === 0 ? (
              <div className="mv-empty">Henüz teklife konu ürün yok.</div>
            ) : (
              d.topProducts.map((p, i) => (
                <div className="mv-top" key={p.productId}>
                  <div className="mv-top__rank">{i + 1}</div>
                  <div className="mv-top__meta">
                    <div className="mv-top__name">{p.name}</div>
                    <div className="mv-top__sku mv-mono">{p.sku}</div>
                  </div>
                  <div className="mv-top__num">
                    <div className="mv-top__val">{nf.format(p.quotes)}</div>
                    <div className="mv-top__lbl">teklif</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <p className="mv-note">
          Not: B2B kataloğunda ürünlerde stok/fiyat alanı yoktur. Katalog
          görüntüleme ve mesaj metrikleri analitik/mesaj modülü eklendiğinde
          canlanacak. <Link href="/admin/dashboard">Yenile</Link>
        </p>
      </div>
    </>
  );
}
