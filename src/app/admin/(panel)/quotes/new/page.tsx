import type { Metadata } from "next";

import { AdminTopbar } from "../../AdminTopbar";
import { QuickQuoteBuilder } from "./QuickQuoteBuilder";
import "./quote-builder.css";

export const metadata: Metadata = { title: "Hızlı Teklif" };

export default function QuickQuotePage() {
  return (
    <>
      <AdminTopbar title="Hızlı Teklif" crumbs={["Moniva Yönetim", "Satış"]} />

      <div className="mv-page">
        <div className="qq-head">
          <div>
            <div className="qq-head__crumb">SATIŞ / HIZLI TEKLİF</div>
            <h1 className="qq-head__title">Yeni teklif oluştur</h1>
            <p className="qq-head__sub">
              Parçaları seçin, fiyatları girin, PDF olarak indirip müşteriye gönderin.
              Bu teklif kaydedilmez.
            </p>
          </div>
        </div>

        <QuickQuoteBuilder />
      </div>
    </>
  );
}
