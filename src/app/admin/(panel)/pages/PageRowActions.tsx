"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { NewsStatus } from "@prisma/client";

import { deletePage, setPageStatus } from "@/lib/actions/admin-page";

export function PageRowActions({
  id,
  status,
  title,
}: {
  id: string;
  status: NewsStatus;
  title: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function changeStatus(next: NewsStatus) {
    start(async () => {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("status", next);
      await setPageStatus(fd);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm(`"${title}" sayfasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;
    start(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await deletePage(fd);
      router.refresh();
    });
  }

  return (
    <div className="ad-rowact">
      <Link href={`/admin/pages/${id}`} className="ad-linkbtn">Düzenle</Link>
      {status === "PUBLISHED" ? (
        <button type="button" className="ad-linkbtn" disabled={pending} onClick={() => changeStatus("DRAFT")}>
          Taslağa al
        </button>
      ) : (
        <button type="button" className="ad-linkbtn" disabled={pending} onClick={() => changeStatus("PUBLISHED")}>
          Yayınla
        </button>
      )}
      <button type="button" className="ad-linkbtn ad-linkbtn--danger" disabled={pending} onClick={remove}>
        Sil
      </button>
    </div>
  );
}
