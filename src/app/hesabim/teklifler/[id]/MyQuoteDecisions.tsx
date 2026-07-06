"use client";

import { useState, useTransition } from "react";

import {
  submitMyQuoteDecision,
  type QuoteDecision,
} from "@/lib/actions/quote-decision";

const DONE_MSG: Record<QuoteDecision, { title: string; body: string; kind: string }> = {
  approve: {
    title: "Teklifi onayladınız",
    body: "Teşekkürler! Satış ekibimiz sipariş sürecini başlatmak için sizinle iletişime geçecek.",
    kind: "ready",
  },
  revision: {
    title: "Revizyon talebiniz alındı",
    body: "Notunuz iletildi. Güncellenmiş teklif en kısa sürede tarafınıza ulaştırılacak.",
    kind: "new",
  },
  contact: {
    title: "Talebiniz alındı",
    body: "Satış temsilcimiz en kısa sürede sizinle iletişime geçecek.",
    kind: "ready",
  },
  decline: {
    title: "Geri bildiriminiz alındı",
    body: "Bilgi için teşekkürler. İhtiyaç halinde bize her zaman ulaşabilirsiniz.",
    kind: "closed",
  },
};

export function MyQuoteDecisions({ quoteRequestId }: { quoteRequestId: string }) {
  const [pending, startTransition] = useTransition();
  const [noteMode, setNoteMode] = useState<null | "revision" | "decline">(null);
  const [note, setNote] = useState("");
  const [done, setDone] = useState<QuoteDecision | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit(decision: QuoteDecision) {
    setError(null);
    startTransition(async () => {
      const res = await submitMyQuoteDecision({
        quoteRequestId,
        decision,
        note: note.trim() || undefined,
      });
      if (res.ok) setDone(decision);
      else setError(res.error);
    });
  }

  if (done) {
    const m = DONE_MSG[done];
    return (
      <div className={`ac-done ac-done--${m.kind}`}>
        <div className="ac-done__title">{m.title}</div>
        <p className="ac-done__body">{m.body}</p>
      </div>
    );
  }

  return (
    <div className="ac-decide">
      <div className="ac-decide__title">Bu teklif hakkında ne yapmak istersiniz?</div>
      {error && <div className="ac-decide__err">{error}</div>}

      {noteMode ? (
        <div className="ac-noteform">
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            placeholder={
              noteMode === "revision"
                ? "Nasıl bir revizyon istersiniz? (opsiyonel)"
                : "Kısaca sebebini yazabilirsiniz (opsiyonel)"
            }
          />
          <div className="ac-noteform__actions">
            <button
              type="button"
              className="ac-btn ac-btn--ghost"
              onClick={() => {
                setNoteMode(null);
                setNote("");
              }}
              disabled={pending}
            >
              Vazgeç
            </button>
            <button
              type="button"
              className="ac-btn"
              onClick={() => submit(noteMode)}
              disabled={pending}
            >
              {pending
                ? "Gönderiliyor…"
                : noteMode === "revision"
                  ? "Revizyon talebini gönder"
                  : "Gönder"}
            </button>
          </div>
        </div>
      ) : (
        <div className="ac-decide__btns">
          <button
            type="button"
            className="ac-dbtn ac-dbtn--approve"
            onClick={() => submit("approve")}
            disabled={pending}
          >
            Onayla
          </button>
          <button
            type="button"
            className="ac-dbtn ac-dbtn--rev"
            onClick={() => setNoteMode("revision")}
            disabled={pending}
          >
            Revizyon iste
          </button>
          <button
            type="button"
            className="ac-dbtn ac-dbtn--contact"
            onClick={() => submit("contact")}
            disabled={pending}
          >
            Temsilciyle görüş
          </button>
          <button
            type="button"
            className="ac-dbtn ac-dbtn--decline"
            onClick={() => setNoteMode("decline")}
            disabled={pending}
          >
            Şu an uygun değil
          </button>
        </div>
      )}
    </div>
  );
}
