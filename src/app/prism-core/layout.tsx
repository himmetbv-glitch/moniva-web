import type { Metadata } from "next";

import "../globals.css";
import "./prism.css";

export const metadata: Metadata = {
  title: "PRISM CORE — Real-time Neural Core",
  description:
    "Gerçek zamanlı WebGL 2 kristal çekirdek: simplex gürültüsüyle deforme olan geometri, GPU instanced yörünge parçacıkları, bloom ve film grenii.",
  robots: { index: false, follow: false },
};

// Demo rotası kendi <html>'ini render eder (admin ile aynı çoklu-kök deseni):
// locale sarmalayıcısına, site header/footer'ına ve açık temaya ihtiyacı yok.
export default function PrismLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="prism-body">{children}</body>
    </html>
  );
}
