import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moniva — B2B Yedek Parça",
  description:
    "Treyler ve ağır vasıta yedek parça B2B katalog ve teklif sistemi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: tarayıcı eklentileri (ör. Yandex Browser'ın
    // data-yd-* attribute'ları) <html>'e React yüklenmeden önce nitelik ekler;
    // bu, uygulama hatası değil — yalnızca bu etiketin nitelik uyuşmazlığını sustur.
    <html lang="tr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
