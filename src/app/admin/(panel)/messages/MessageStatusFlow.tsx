import { SubmissionStatus } from "@prisma/client";

import { updateMessageStatus } from "@/lib/actions/admin-message";
import { SUBMISSION_FLOW, type SubmissionKind } from "@/lib/admin/messages";

export function MessageStatusFlow({
  kind,
  id,
  status,
}: {
  kind: SubmissionKind;
  id: string;
  status: SubmissionStatus;
}) {
  return (
    <div className="ad-card iq-flow">
      {SUBMISSION_FLOW.map((s) => {
        const cur = s.key === status;
        return (
          <form action={updateMessageStatus} key={s.key} className="iq-flow__cell">
            <input type="hidden" name="kind" value={kind} />
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value={s.key} />
            <button
              type="submit"
              className={"iq-flow__btn" + (cur ? " iq-flow__btn--cur" : "")}
            >
              <span className="iq-flow__dot">{cur ? "●" : "○"}</span>
              <span className="iq-flow__label">{s.label}</span>
            </button>
          </form>
        );
      })}
    </div>
  );
}
