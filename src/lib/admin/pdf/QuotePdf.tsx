import path from "node:path";

import {
  Document,
  Page,
  Text,
  View,
  Image,
  Font,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

import type { InquiryDetail } from "@/lib/admin/inquiries";
import { formatMoney } from "@/lib/admin/quote-pricing";

const FONT_DIR = path.join(process.cwd(), "src/lib/admin/pdf-fonts");
const LOGO = path.join(process.cwd(), "public/brand/moniva-logo.png");

let fontReady = false;
function ensureFont() {
  if (fontReady) return;
  Font.register({ family: "DejaVu", src: path.join(FONT_DIR, "DejaVuSans.ttf") });
  // Türkçe kelimeler tirelemede bozulmasın
  Font.registerHyphenationCallback((word) => [word]);
  fontReady = true;
}

const C = {
  primary: "#4F3D8C",
  dark: "#1B1640",
  accent: "#7E6DC2",
  tint: "#EFEDF7",
  txt: "#26242e",
  mid: "#6b7280",
  dim: "#9aa0ab",
  border: "#e5e7eb",
  borderSoft: "#f0f0f4",
  neg: "#b3261e",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "DejaVu",
    fontSize: 9,
    color: C.txt,
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 44,
    lineHeight: 1.45,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { width: 116, height: 36, objectFit: "contain" },
  hRight: { alignItems: "flex-end" },
  hTitle: { fontSize: 22, color: C.dark, letterSpacing: 2, lineHeight: 1.3 },
  hRef: { fontSize: 10, color: C.primary, marginTop: 4 },
  hDate: { fontSize: 8.5, color: C.mid, marginTop: 2 },
  rule: { height: 2, backgroundColor: C.primary, marginTop: 14, marginBottom: 16 },

  cols: { flexDirection: "row", gap: 24, marginBottom: 18 },
  col: { flex: 1 },
  blockTtl: {
    fontSize: 8,
    color: C.dim,
    letterSpacing: 1,
    marginBottom: 5,
    textTransform: "uppercase",
  },
  strong: { fontSize: 11, color: C.dark, marginBottom: 2 },
  line: { fontSize: 9, color: C.txt },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  metaK: { fontSize: 9, color: C.mid },
  metaV: { fontSize: 9, color: C.dark },

  tHead: {
    flexDirection: "row",
    backgroundColor: C.dark,
    color: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  th: { fontSize: 8, letterSpacing: 0.5, color: "#fff" },
  tRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
  },
  tRowAlt: { backgroundColor: "#faf9fd" },
  cNo: { width: 22 },
  cPart: { flex: 1, paddingRight: 8 },
  cQty: { width: 50, textAlign: "right" },
  cUnit: { width: 78, textAlign: "right" },
  cLine: { width: 84, textAlign: "right" },
  sku: { fontSize: 9, color: C.primary },
  pname: { fontSize: 9.5, color: C.txt },
  oem: { fontSize: 7.5, color: C.dim },
  num: { fontSize: 9.5, color: C.txt },

  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
  totals: { width: 250 },
  tr: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2.5 },
  trK: { fontSize: 9.5, color: C.mid },
  trV: { fontSize: 9.5, color: C.dark },
  trVneg: { fontSize: 9.5, color: C.neg },
  grand: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1.5,
    borderTopColor: C.primary,
  },
  grandK: { fontSize: 12, color: C.dark },
  grandV: { fontSize: 14, color: C.primary },

  terms: {
    marginTop: 22,
    padding: 12,
    backgroundColor: C.tint,
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
  },
  termsTtl: { fontSize: 8, color: C.primary, letterSpacing: 1, marginBottom: 4 },
  termsTxt: { fontSize: 8, color: C.mid, lineHeight: 1.5 },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  fTxt: { fontSize: 7.5, color: C.dim },
});

const STATUS_TR: Record<string, string> = {
  NEW: "Yeni talep",
  QUOTED: "Teklif verildi",
  CLOSED: "Kapatıldı",
};

function QuoteDocument({ d }: { d: InquiryDetail }) {
  const cur = d.currency;
  const money = (n: number) => formatMoney(n, cur);

  return (
    <Document
      title={`Teklif ${d.ref}`}
      author="Moniva"
      subject={`${d.companyName} için teklif`}
    >
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          {/* react-pdf Image — HTML img değil; alt prop'u yok */}
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={LOGO} style={s.logo} />
          <View style={s.hRight}>
            <Text style={s.hTitle}>TEKLİF</Text>
            <Text style={s.hRef}>{d.ref}</Text>
            <Text style={s.hDate}>Düzenlenme: {d.quotedAtLabel ?? d.createdAtLabel}</Text>
          </View>
        </View>
        <View style={s.rule} />

        {/* Alıcı + Teklif bilgisi */}
        <View style={s.cols}>
          <View style={s.col}>
            <Text style={s.blockTtl}>Alıcı</Text>
            <Text style={s.strong}>{d.companyName}</Text>
            <Text style={s.line}>{d.fullName}</Text>
            <Text style={s.line}>{d.address}</Text>
            <Text style={s.line}>
              {[d.city, d.country].filter(Boolean).join(", ")}
            </Text>
            {d.taxNumber && (
              <Text style={s.line}>
                VKN: {d.taxNumber}
                {d.taxOffice ? ` · ${d.taxOffice}` : ""}
              </Text>
            )}
            <Text style={s.line}>{d.email}</Text>
            <Text style={s.line}>{d.phone}</Text>
          </View>
          <View style={s.col}>
            <Text style={s.blockTtl}>Teklif bilgisi</Text>
            {(
              [
                ["Teklif No", d.ref],
                ["Durum", STATUS_TR[d.status] ?? d.status],
                ["Para birimi", cur],
                ["Teslim şekli", d.shippingMode ?? "—"],
                ["Ödeme vadesi", d.paymentTerms ?? "—"],
                ["Geçerlilik", d.validUntil ?? "—"],
              ] as [string, string][]
            ).map(([k, v]) => (
              <View style={s.metaRow} key={k}>
                <Text style={s.metaK}>{k}</Text>
                <Text style={s.metaV}>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Kalemler */}
        <View style={s.tHead}>
          <Text style={[s.th, s.cNo]}>#</Text>
          <Text style={[s.th, s.cPart]}>PARÇA</Text>
          <Text style={[s.th, s.cQty]}>ADET</Text>
          <Text style={[s.th, s.cUnit]}>BİRİM</Text>
          <Text style={[s.th, s.cLine]}>TUTAR</Text>
        </View>
        {d.items.map((it, i) => {
          const unit = it.unitPrice ?? 0;
          return (
            <View
              key={it.id}
              style={i % 2 === 1 ? [s.tRow, s.tRowAlt] : s.tRow}
              wrap={false}
            >
              <Text style={[s.num, s.cNo]}>{i + 1}</Text>
              <View style={s.cPart}>
                <Text style={s.sku}>{it.sku}</Text>
                <Text style={s.pname}>{it.name}</Text>
                {it.oem && <Text style={s.oem}>{it.oem}</Text>}
              </View>
              <Text style={[s.num, s.cQty]}>{it.quantity}</Text>
              <Text style={[s.num, s.cUnit]}>
                {it.unitPrice == null ? "—" : money(unit)}
              </Text>
              <Text style={[s.num, s.cLine]}>{money(it.quantity * unit)}</Text>
            </View>
          );
        })}

        {/* Toplamlar */}
        <View style={s.totalsWrap}>
          <View style={s.totals}>
            <View style={s.tr}>
              <Text style={s.trK}>Ara toplam</Text>
              <Text style={s.trV}>{money(d.totals.subtotal)}</Text>
            </View>
            <View style={s.tr}>
              <Text style={s.trK}>İskonto ({d.discountPct}%)</Text>
              <Text style={s.trVneg}>− {money(d.totals.discountAmount)}</Text>
            </View>
            <View style={s.tr}>
              <Text style={s.trK}>Navlun</Text>
              <Text style={s.trV}>{money(d.totals.shippingCost)}</Text>
            </View>
            <View style={s.tr}>
              <Text style={s.trK}>KDV ({d.vatRate}%)</Text>
              <Text style={s.trV}>{money(d.totals.vatAmount)}</Text>
            </View>
            <View style={s.grand}>
              <Text style={s.grandK}>Genel Toplam</Text>
              <Text style={s.grandV}>{money(d.totals.total)}</Text>
            </View>
          </View>
        </View>

        {/* Şartlar */}
        <View style={s.terms}>
          <Text style={s.termsTtl}>ŞARTLAR & NOTLAR</Text>
          <Text style={s.termsTxt}>
            Fiyatlar {cur} cinsindendir
            {d.vatRate === 0 ? " ve KDV hariçtir (ihracat / reverse charge)." : "."}
            {d.validUntil
              ? ` Teklif ${d.validUntil} tarihine kadar geçerlidir.`
              : ""}{" "}
            Stok ve teslim süreleri sipariş onayında teyit edilir. Bu belge moniva.com.tr
            üzerinden oluşturulmuş bir fiyat teklifidir ve fatura yerine geçmez.
          </Text>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.fTxt}>Moniva · Ağır Vasıta & Treyler Yedek Parça · moniva.com.tr</Text>
          <Text
            style={s.fTxt}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

export async function renderQuotePdf(d: InquiryDetail): Promise<Buffer> {
  ensureFont();
  return renderToBuffer(<QuoteDocument d={d} />);
}
