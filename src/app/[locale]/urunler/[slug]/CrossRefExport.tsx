"use client";

import type { CrossRef } from "@/lib/products/queries";

export function CrossRefExport({
  sku,
  crossRefs,
}: {
  sku: string;
  crossRefs: CrossRef[];
}) {
  const exportCsv = () => {
    const header = "OEM Numarası;Üretici;Moniva SKU";
    const rows = crossRefs.map(
      (c) => `${c.oemNumber};${c.manufacturer ?? ""};${sku}`,
    );
    const csv = "﻿" + [header, ...rows].join("\r\n"); // BOM → Excel TR uyumu
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sku}-cross-references.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button className="pd-xref-export" onClick={exportCsv}>
      ↳ Excel'e Aktar (CSV)
    </button>
  );
}
