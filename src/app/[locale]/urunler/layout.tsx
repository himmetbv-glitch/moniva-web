import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./products.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Ürünler · Moniva",
  description:
    "Treyler ve ağır vasıta yedek parça kataloğu — OEM ve aftermarket. Fiyat için teklif alın.",
};

export default function ProductsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className={`pcat ${inter.variable}`}>{children}</div>;
}
