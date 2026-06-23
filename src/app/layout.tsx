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
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
