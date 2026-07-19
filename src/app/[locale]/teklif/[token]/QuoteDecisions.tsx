"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import {
  submitQuoteDecision,
  type QuoteDecision,
} from "@/lib/actions/quote-decision";

const CLS_BY_DECISION: Record<QuoteDecision, string> = {
  approve: "ok",
  revision: "warn",
  contact: "info",
  decline: "mute",
};

export function QuoteDecisions({ token }: { token: string }) {
  const t = useTranslations();
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
    const cls = CLS_BY_DECISION[done];
    return (
      <div className={`pq-done pq-done--${cls}`}>
        <div className="pq-done__ttl">{t(`quote.decision.done.${done}.title`)}</div>
        <p className="pq-done__body">{t(`quote.decision.done.${done}.body`)}</p>
      </div>
    );
  }

  return (
    <div className="pq-decide">
      <div className="pq-decide__ttl">{t("quote.decision.prompt")}</div>
      {error && <div className="pq-decide__err">{error}</div>}

      {noteMode ? (
        <div className="pq-noteform">
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            placeholder={t(`quote.decision.notePlaceholder.${noteMode}`)}
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
              {t("quote.decision.cancel")}
            </button>
            <button
              type="button"
              className="pq-btn pq-btn--primary"
              onClick={() => submit(noteMode)}
              disabled={pending}
            >
              {pending
                ? t("quote.decision.sending")
                : noteMode === "revision"
                  ? t("quote.decision.sendRevision")
                  : t("quote.decision.send")}
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
            {t("quote.decision.buttons.approve")}
          </button>
          <button
            type="button"
            className="pq-btn pq-btn--rev"
            onClick={() => setNoteMode("revision")}
            disabled={pending}
          >
            {t("quote.decision.buttons.revision")}
          </button>
          <button
            type="button"
            className="pq-btn pq-btn--contact"
            onClick={() => submit("contact")}
            disabled={pending}
          >
            {t("quote.decision.buttons.contact")}
          </button>
          <button
            type="button"
            className="pq-btn pq-btn--decline"
            onClick={() => setNoteMode("decline")}
            disabled={pending}
          >
            {t("quote.decision.buttons.decline")}
          </button>
        </div>
      )}
    </div>
  );
}
