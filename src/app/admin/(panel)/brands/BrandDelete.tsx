"use client";

import { useTransition } from "react";

import { deleteBrand } from "@/lib/actions/admin-brand";

export function BrandDelete({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  const handle = () => {
    if (!confirm(`"${name}" markasını silmek istediğinize emin misiniz?`)) return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      const res = await deleteBrand(fd);
      if (!res.ok && res.reason === "has-products") {
        alert("Bu markaya bağlı ürünler var; silinemez. Önce ürünlerin markasını değiştirin.");
      }
    });
  };

  return (
    <button type="button" className="br-del" onClick={handle} disabled={pending}>
      Sil
    </button>
  );
}
