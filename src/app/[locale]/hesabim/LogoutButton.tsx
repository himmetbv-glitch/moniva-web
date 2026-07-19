"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";

import { customerLogoutAction } from "@/lib/actions/customer-auth";

export function LogoutButton() {
  const t = useTranslations();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="ac-logout"
      disabled={pending}
      onClick={() => start(() => customerLogoutAction())}
    >
      {pending ? t("account.loggingOut") : t("account.logout")}
    </button>
  );
}
