"use client";

import { useTransition } from "react";

import { setInquiryArchived, deleteInquiry } from "@/lib/actions/admin-inquiry";

export function InquiryDangerActions({
  id,
  refLabel,
  isArchived,
}: {
  id: string;
  refLabel: string;
  isArchived: boolean;
}) {
  const [pending, start] = useTransition();

  function toggleArchive() {
    start(async () => {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("archived", isArchived ? "false" : "true");
      await setInquiryArchived(fd);
    });
  }

  function remove() {
    if (
      !confirm(
        `${refLabel} teklif talebini kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      )
    )
      return;
    start(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await deleteInquiry(fd);
    });
  }

  return (
    <div className="iq-danger">
      <button
        type="button"
        className="ad-btn ad-btn--ghost ad-btn--sm"
        disabled={pending}
        onClick={toggleArchive}
      >
        {isArchived ? "Arşivden çıkar" : "Arşivle"}
      </button>
      <button
        type="button"
        className="ad-btn ad-btn--sm iq-danger__del"
        disabled={pending}
        onClick={remove}
      >
        Sil
      </button>
    </div>
  );
}
