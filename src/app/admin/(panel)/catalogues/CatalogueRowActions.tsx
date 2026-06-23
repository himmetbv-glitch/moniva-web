"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { NewsStatus } from "@prisma/client";

import { deleteCatalogue, setCatalogueStatus } from "@/lib/actions/admin-catalogue";

export function CatalogueRowActions({
  id,
  status,
  title,
  hasFile,
}: {
  id: string;
  status: NewsStatus;
  title: string;
  hasFile: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function changeStatus(next: NewsStatus) {
    start(async () => {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("status", next);
      await setCatalogueStatus(fd);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm(`"${title}" kataloğunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;
    start(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await deleteCatalogue(fd);
      router.refresh();
    });
  }

  return (
    <div className="mv-rowact" style={{ justifyContent: "flex-end" }}>
      <Link href={`/admin/catalogues/${id}`} className="mv-linkbtn">Düzenle</Link>
      {status === "PUBLISHED" ? (
        <button type="button" className="mv-linkbtn" disabled={pending} onClick={() => changeStatus("DRAFT")}>
          Taslağa al
        </button>
      ) : (
        <button
          type="button"
          className="mv-linkbtn"
          disabled={pending || !hasFile}
          title={hasFile ? undefined : "Yayınlamak için önce PDF yükleyin"}
          onClick={() => changeStatus("PUBLISHED")}
        >
          Yayınla
        </button>
      )}
      <button type="button" className="mv-linkbtn mv-linkbtn--danger" disabled={pending} onClick={remove}>
        Sil
      </button>
    </div>
  );
}
