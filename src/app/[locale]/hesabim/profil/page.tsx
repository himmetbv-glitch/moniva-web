import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
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

  const t = await getTranslations();

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
        <Link href="/hesabim">{t("account.quoteDetail.crumbBack")}</Link>{" "}
        <span>/</span> {t("account.profile.crumbSelf")}
      </div>

      <div className="ac-head">
        <div>
          <h1 className="ac-title">{t("account.profile.title")}</h1>
          <p className="ac-sub">{t("account.profile.sub")}</p>
        </div>
      </div>

      <div className="ac-section">
        <h2 className="ac-section__title">
          {t("account.profile.section.info")}
        </h2>
        <div className="ac-card ac-pad">
          <ProfileForm defaults={defaults} />
        </div>
      </div>

      <div className="ac-section">
        <h2 className="ac-section__title">
          {t("account.profile.section.password")}
        </h2>
        <div className="ac-card ac-pad">
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
