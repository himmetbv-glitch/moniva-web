"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { NewsStatus } from "@prisma/client";

import { deleteNews, setNewsStatus } from "@/lib/actions/admin-news";

export function NewsRowActions({
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
      await setNewsStatus(fd);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm(`"${title}" haberini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;
    start(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await deleteNews(fd);
      router.refresh();
    });
  }

  return (
    <div className="mv-rowact">
      <Link href={`/admin/news/${id}`} className="mv-linkbtn">Düzenle</Link>
      {status === "PUBLISHED" ? (
        <button type="button" className="mv-linkbtn" disabled={pending} onClick={() => changeStatus("DRAFT")}>
          Taslağa al
        </button>
      ) : (
        <button type="button" className="mv-linkbtn" disabled={pending} onClick={() => changeStatus("PUBLISHED")}>
          Yayınla
        </button>
      )}
      <button type="button" className="mv-linkbtn mv-linkbtn--danger" disabled={pending} onClick={remove}>
        Sil
      </button>
    </div>
  );
}
