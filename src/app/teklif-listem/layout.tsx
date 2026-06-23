import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./quote.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Teklif Listem · Moniva",
  description:
    "Teklif listenizdeki ürünler için size özel fiyat teklifi alın. Fiyat gösterilmez — uzman ekibimiz 24 saat içinde döner.",
};

export default function QuoteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`qsys ${inter.variable}`}>{children}</div>
  );
}
