import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Yönetim — Moniva", template: "%s — Moniva Yönetim" },
  robots: { index: false, follow: false },
};

// Admin subtree renders its own <html lang="tr"> (single-language panel).
// suppressHydrationWarning: tarayıcı eklentileri (ör. Yandex Browser'ın
// data-yd-* attribute'ları) <html>'e React yüklenmeden önce nitelik ekler.
export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
