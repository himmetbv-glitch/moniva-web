import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/customer/dal";
import { ProfileForm, type ProfileDefaults } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";

export default async function ProfilePage() {
  const sessionUser = await requireUser("/hesabim/profil");
  const u = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      name: true,
      email: true,
      companyName: true,
      phone: true,
      taxNumber: true,
      taxOffice: true,
      city: true,
      address: true,
    },
  });
  if (!u) notFound();

  const defaults: ProfileDefaults = {
    companyName: u.companyName ?? "",
    fullName: u.name ?? "",
    email: u.email ?? "",
    phone: u.phone ?? "",
    taxNumber: u.taxNumber ?? "",
    taxOffice: u.taxOffice ?? "",
    city: u.city ?? "",
    address: u.address ?? "",
  };

  return (
    <div className="ac-inner">
      <div className="ac-crumb">
        <Link href="/hesabim">Hesabım</Link> <span>/</span> Profil
      </div>

      <div className="ac-head">
        <div>
          <h1 className="ac-title">Profil bilgileri</h1>
          <p className="ac-sub">
            Firma bilgileriniz teklif formlarına otomatik gelir.
          </p>
        </div>
      </div>

      <div className="ac-section">
        <h2 className="ac-section__title">Firma & iletişim</h2>
        <div className="ac-card ac-pad">
          <ProfileForm defaults={defaults} />
        </div>
      </div>

      <div className="ac-section">
        <h2 className="ac-section__title">Şifre değiştir</h2>
        <div className="ac-card ac-pad">
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
