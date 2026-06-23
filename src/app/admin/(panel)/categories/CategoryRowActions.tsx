"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { toggleCategoryActive, deleteCategory } from "@/lib/actions/admin-category";
import { Icons } from "../icons";

export function CategoryRowActions({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    setOpen(false);
    if (!confirm(`"${name}" kategorisini silmek istediğinize emin misiniz?`)) return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      const res = await deleteCategory(fd);
      if (!res.ok) {
        if (res.reason === "has-children")
          alert("Alt kategorisi olan kategori silinemez. Önce alt kategorileri taşıyın/silin.");
        else if (res.reason === "has-products")
          alert("İçinde ürün olan kategori silinemez. Önce ürünleri başka kategoriye taşıyın.");
        else alert("Silinemedi.");
      }
    });
  };

  return (
    <div className="pl-actions">
      <button type="button" className="pl-actions__trigger" onClick={() => setOpen((v) => !v)} aria-label="İşlemler" disabled={pending}>
        <Icons.more />
      </button>
      {open && (
        <>
          <div className="pl-actions__backdrop" onClick={() => setOpen(false)} />
          <div className="pl-actions__menu" role="menu">
            <Link href={`/admin/categories/${id}`} className="pl-actions__item">Düzenle</Link>
            <form action={toggleCategoryActive} onSubmit={() => setOpen(false)}>
              <input type="hidden" name="id" value={id} />
              <button type="submit" className="pl-actions__item">Aktif/Pasif</button>
            </form>
            <button type="button" className="pl-actions__item pl-actions__item--danger" onClick={handleDelete}>Sil</button>
          </div>
        </>
      )}
    </div>
  );
}
