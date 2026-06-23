"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import {
  toggleProductActive,
  toggleProductFeatured,
  deleteProduct,
} from "@/lib/actions/admin-product";
import { Icons } from "../icons";

export function RowActions({
  id,
  name,
  isActive,
  isFeatured,
}: {
  id: string;
  name: string;
  isActive: boolean;
  isFeatured: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    setOpen(false);
    if (!confirm(`"${name}" ürününü silmek istediğinize emin misiniz?`)) return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      const res = await deleteProduct(fd);
      if (!res.ok && res.reason === "referenced") {
        alert(
          "Bu ürün bir veya daha fazla teklif talebinde geçiyor; geçmiş kayıtları korumak için silinemez. Bunun yerine ürünü pasife alın.",
        );
      }
    });
  };

  return (
    <div className="pl-actions">
      <button
        type="button"
        className="pl-actions__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label="İşlemler"
        disabled={pending}
      >
        <Icons.more />
      </button>

      {open && (
        <>
          <div className="pl-actions__backdrop" onClick={() => setOpen(false)} />
          <div className="pl-actions__menu" role="menu">
            <Link href={`/admin/products/${id}`} className="pl-actions__item">
              Düzenle
            </Link>

            <form action={toggleProductActive} onSubmit={() => setOpen(false)}>
              <input type="hidden" name="id" value={id} />
              <button type="submit" className="pl-actions__item">
                {isActive ? "Pasife al" : "Aktif et"}
              </button>
            </form>

            <form action={toggleProductFeatured} onSubmit={() => setOpen(false)}>
              <input type="hidden" name="id" value={id} />
              <button type="submit" className="pl-actions__item">
                {isFeatured ? "Öne çıkarmayı kaldır" : "Öne çıkar"}
              </button>
            </form>

            <button
              type="button"
              className="pl-actions__item pl-actions__item--danger"
              onClick={handleDelete}
            >
              Sil
            </button>
          </div>
        </>
      )}
    </div>
  );
}
