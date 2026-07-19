"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { updateProfileAction } from "@/lib/actions/customer-profile";
import type { AuthFormState } from "@/lib/actions/customer-auth-types";

const initial: AuthFormState = { ok: false };

export type ProfileDefaults = {
  companyName: string;
  fullName: string;
  email: string;
  phone: string;
  taxNumber: string;
  taxOffice: string;
  city: string;
  address: string;
};

export function ProfileForm({ defaults }: { defaults: ProfileDefaults }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  const fe = state.fieldErrors;

  return (
    <form className="ac-form" action={action} noValidate>
      {state.ok && <p className="ac-ok-msg">{t("account.profile.form.saved")}</p>}
      {state.formError && <p className="ac-alert">{state.formError}</p>}

      <label className="ac-field">
        <span className="ac-flabel">{t("account.profile.form.companyName")}</span>
        <input
          name="companyName"
          defaultValue={defaults.companyName}
          className={fe?.companyName ? "ac-input--err" : ""}
        />
        {fe?.companyName && <em className="ac-errtext">{fe.companyName[0]}</em>}
      </label>

      <div className="ac-grid2">
        <label className="ac-field">
          <span className="ac-flabel">{t("account.profile.form.fullName")}</span>
          <input
            name="fullName"
            defaultValue={defaults.fullName}
            className={fe?.fullName ? "ac-input--err" : ""}
          />
          {fe?.fullName && <em className="ac-errtext">{fe.fullName[0]}</em>}
        </label>
        <label className="ac-field">
          <span className="ac-flabel">{t("account.profile.form.phone")}</span>
          <input
            name="phone"
            defaultValue={defaults.phone}
            className={fe?.phone ? "ac-input--err" : ""}
          />
          {fe?.phone && <em className="ac-errtext">{fe.phone[0]}</em>}
        </label>
      </div>

      <label className="ac-field">
        <span className="ac-flabel">
          {t("account.profile.form.emailReadonly")}{" "}
          <i>{t("account.profile.form.emailReadonlyHint")}</i>
        </span>
        <input value={defaults.email} disabled className="ac-input--ro" />
      </label>

      <div className="ac-grid2">
        <label className="ac-field">
          <span className="ac-flabel">
            {t("account.profile.form.taxNumber")}{" "}
            <i>{t("account.profile.form.taxNumberOptional")}</i>
          </span>
          <input
            name="taxNumber"
            inputMode="numeric"
            defaultValue={defaults.taxNumber}
            className={fe?.taxNumber ? "ac-input--err" : ""}
          />
          {fe?.taxNumber && <em className="ac-errtext">{fe.taxNumber[0]}</em>}
        </label>
        <label className="ac-field">
          <span className="ac-flabel">
            {t("account.profile.form.taxOffice")}{" "}
            <i>{t("account.profile.form.taxOfficeOptional")}</i>
          </span>
          <input name="taxOffice" defaultValue={defaults.taxOffice} />
        </label>
      </div>

      <div className="ac-grid2">
        <label className="ac-field">
          <span className="ac-flabel">
            {t("account.profile.form.city")}{" "}
            <i>{t("account.profile.form.cityOptional")}</i>
          </span>
          <input name="city" defaultValue={defaults.city} />
        </label>
      </div>

      <label className="ac-field">
        <span className="ac-flabel">
          {t("account.profile.form.address")}{" "}
          <i>{t("account.profile.form.addressOptional")}</i>
        </span>
        <textarea name="address" rows={3} defaultValue={defaults.address} />
      </label>

      <div>
        <button type="submit" className="ac-btn" disabled={pending}>
          {pending
            ? t("account.profile.form.submitting")
            : t("account.profile.form.submit")}
        </button>
      </div>
    </form>
  );
}
