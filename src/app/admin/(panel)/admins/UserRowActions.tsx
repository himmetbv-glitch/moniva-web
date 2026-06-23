"use client";

import { useState, useTransition } from "react";
import { Role } from "@prisma/client";

import {
  toggleUserVerified,
  setUserRole,
  setUserPassword,
  toggleUserActive,
  type UserActionResult,
} from "@/lib/actions/admin-user";
import { Icons } from "../icons";

export function UserRowActions({
  id,
  name,
  role,
  isVerified,
  isActive,
  isSelf,
}: {
  id: string;
  name: string;
  role: Role;
  isVerified: boolean;
  isActive: boolean;
  isSelf: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const run = (
    action: (fd: FormData) => Promise<UserActionResult>,
    extra?: Record<string, string>,
    confirmMsg?: string,
  ) => {
    setOpen(false);
    if (confirmMsg && !confirm(confirmMsg)) return;
    const fd = new FormData();
    fd.set("id", id);
    if (extra) for (const [k, v] of Object.entries(extra)) fd.set(k, v);
    startTransition(async () => {
      const res = await action(fd);
      if (!res.ok) alert(res.error);
    });
  };

  const changePassword = () => {
    setOpen(false);
    const pw = prompt(`"${name}" için yeni şifre girin (en az 8 karakter):`);
    if (pw === null) return; // iptal
    if (pw.trim().length < 8) {
      alert("Şifre en az 8 karakter olmalı.");
      return;
    }
    const fd = new FormData();
    fd.set("id", id);
    fd.set("password", pw);
    startTransition(async () => {
      const res = await setUserPassword(fd);
      alert(res.ok ? "Şifre güncellendi." : res.error);
    });
  };

  return (
    <div className="pl-actions">
      <button
        type="button"
        className="pl-actions__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label="İşlemler"
        disabled={pending}
      >
        <Icons.more />
      </button>

      {open && (
        <>
          <div className="pl-actions__backdrop" onClick={() => setOpen(false)} />
          <div className="pl-actions__menu" role="menu">
            <button
              type="button"
              className="pl-actions__item"
              onClick={() => run(toggleUserVerified)}
            >
              {isVerified ? "Doğrulamayı kaldır" : "B2B doğrula"}
            </button>

            <button
              type="button"
              className="pl-actions__item"
              onClick={changePassword}
            >
              Şifre değiştir
            </button>

            {role === Role.CUSTOMER ? (
              <button
                type="button"
                className="pl-actions__item"
                onClick={() =>
                  run(
                    setUserRole,
                    { role: Role.ADMIN },
                    `"${name}" kullanıcısına yönetici yetkisi verilsin mi?`,
                  )
                }
              >
                Yönetici yap
              </button>
            ) : (
              <button
                type="button"
                className="pl-actions__item"
                disabled={isSelf}
                onClick={() =>
                  run(
                    setUserRole,
                    { role: Role.CUSTOMER },
                    `"${name}" kullanıcısının yönetici yetkisi kaldırılsın mı?`,
                  )
                }
              >
                Müşteriye düşür
              </button>
            )}

            <button
              type="button"
              className={
                "pl-actions__item" + (isActive ? " pl-actions__item--danger" : "")
              }
              disabled={isSelf && isActive}
              onClick={() =>
                run(
                  toggleUserActive,
                  undefined,
                  isActive
                    ? `"${name}" hesabı pasife alınsın mı? Kullanıcı giriş yapamayacak.`
                    : undefined,
                )
              }
            >
              {isActive ? "Pasife al" : "Aktif et"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
