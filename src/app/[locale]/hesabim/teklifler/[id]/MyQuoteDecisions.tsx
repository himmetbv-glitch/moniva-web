"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import {
  submitMyQuoteDecision,
  type QuoteDecision,
} from "@/lib/actions/quote-decision";

const KIND_BY_DECISION: Record<QuoteDecision, string> = {
  approve: "ready",
  revision: "new",
  contact: "ready",
  decline: "closed",
};

export function MyQuoteDecisions({ quoteRequestId }: { quoteRequestId: string }) {
  const t = useTranslations();
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
    const kind = KIND_BY_DECISION[done];
    return (
      <div className={`ac-done ac-done--${kind}`}>
        <div className="ac-done__title">
          {t(`quote.decision.done.${done}.title`)}
        </div>
        <p className="ac-done__body">{t(`quote.decision.done.${done}.body`)}</p>
      </div>
    );
  }

  return (
    <div className="ac-decide">
      <div className="ac-decide__title">{t("quote.decision.prompt")}</div>
      {error && <div className="ac-decide__err">{error}</div>}

      {noteMode ? (
        <div className="ac-noteform">
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            placeholder={t(`quote.decision.notePlaceholder.${noteMode}`)}
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
              {t("quote.decision.cancel")}
            </button>
            <button
              type="button"
              className="ac-btn"
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
        <div className="ac-decide__btns">
          <button
            type="button"
            className="ac-dbtn ac-dbtn--approve"
            onClick={() => submit("approve")}
            disabled={pending}
          >
            {t("quote.decision.buttons.approve")}
          </button>
          <button
            type="button"
            className="ac-dbtn ac-dbtn--rev"
            onClick={() => setNoteMode("revision")}
            disabled={pending}
          >
            {t("quote.decision.buttons.revision")}
          </button>
          <button
            type="button"
            className="ac-dbtn ac-dbtn--contact"
            onClick={() => submit("contact")}
            disabled={pending}
          >
            {t("quote.decision.buttons.contact")}
          </button>
          <button
            type="button"
            className="ac-dbtn ac-dbtn--decline"
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
