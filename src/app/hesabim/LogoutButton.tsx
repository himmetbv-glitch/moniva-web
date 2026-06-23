"use client";

import { useTransition } from "react";

import { customerLogoutAction } from "@/lib/actions/customer-auth";

export function LogoutButton() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="ac-logout"
      disabled={pending}
      onClick={() => start(() => customerLogoutAction())}
    >
      {pending ? "Çıkılıyor…" : "Çıkış yap"}
    </button>
  );
}
