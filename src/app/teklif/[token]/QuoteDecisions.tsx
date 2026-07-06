"use client";

import { useState, useTransition } from "react";

import {
  submitQuoteDecision,
  type QuoteDecision,
} from "@/lib/actions/quote-decision";

const DONE_MSG: Record<QuoteDecision, { title: string; body: string; cls: string }> = {
  approve: {
    title: "Teklifi onayladınız",
    body: "Teşekkürler! Satış ekibimiz sipariş sürecini başlatmak için sizinle iletişime geçecek.",
    cls: "ok",
  },
  revision: {
    title: "Revizyon talebiniz alındı",
    body: "Notunuz iletildi. Güncellenmiş teklif en kısa sürede tarafınıza ulaştırılacak.",
    cls: "warn",
  },
  contact: {
    title: "Talebiniz alındı",
    body: "Satış temsilcimiz en kısa sürede sizinle iletişime geçecek.",
    cls: "info",
  },
  decline: {
    title: "Geri bildiriminiz alındı",
    body: "Bilgi için teşekkürler. İhtiyaç halinde bize her zaman ulaşabilirsiniz.",
    cls: "mute",
  },
};

export function QuoteDecisions({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const [noteMode, setNoteMode] = useState<null | "revision" | "decline">(null);
  const [note, setNote] = useState("");
  const [done, setDone] = useState<QuoteDecision | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit(decision: QuoteDecision) {
    setError(null);
    startTransition(async () => {
      const res = await submitQuoteDecision({
        token,
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
      <div className={`pq-done pq-done--${m.cls}`}>
        <div className="pq-done__ttl">{m.title}</div>
        <p className="pq-done__body">{m.body}</p>
      </div>
    );
  }

  return (
    <div className="pq-decide">
      <div className="pq-decide__ttl">Bu teklif hakkında ne yapmak istersiniz?</div>
      {error && <div className="pq-decide__err">{error}</div>}

      {noteMode ? (
        <div className="pq-noteform">
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
          <div className="pq-noteform__actions">
            <button
              type="button"
              className="pq-btn pq-btn--ghost"
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
              className="pq-btn pq-btn--primary"
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
        <div className="pq-btns">
          <button
            type="button"
            className="pq-btn pq-btn--approve"
            onClick={() => submit("approve")}
            disabled={pending}
          >
            Onayla
          </button>
          <button
            type="button"
            className="pq-btn pq-btn--rev"
            onClick={() => setNoteMode("revision")}
            disabled={pending}
          >
            Revizyon iste
          </button>
          <button
            type="button"
            className="pq-btn pq-btn--contact"
            onClick={() => submit("contact")}
            disabled={pending}
          >
            Temsilciyle görüş
          </button>
          <button
            type="button"
            className="pq-btn pq-btn--decline"
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
