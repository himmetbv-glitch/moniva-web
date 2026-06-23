"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Role } from "@prisma/client";

import { createUser } from "@/lib/actions/admin-user";

export function NewUserForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("ADMIN");
  const [isVerified, setIsVerified] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");

  const isCustomer = role === "CUSTOMER";

  const submit = () =>
    start(async () => {
      setError(null);
      const res = await createUser({
        name,
        email,
        password,
        role,
        isVerified,
        companyName,
        phone,
      });
      if (res.ok) {
        router.push("/admin/admins");
        router.refresh();
      } else setError(res.error);
    });

  return (
    <div className="mv-page">
      <div className="iq-head">
        <div>
          <div className="iq-head__crumb">
            <Link href="/admin/admins">KULLANICILAR</Link> / YENİ
          </div>
          <div className="iq-head__title">
            <span>Yeni kullanıcı</span>
          </div>
          <div className="iq-head__meta" style={{ marginTop: -6 }}>
            Panelden yönetici veya B2B müşteri hesabı oluşturun.
          </div>
        </div>
        <div className="iq-head__actions">
          <Link href="/admin/admins" className="mv-btn mv-btn--ghost">İptal</Link>
          <button
            className="mv-btn mv-btn--primary"
            onClick={submit}
            disabled={pending || !name.trim() || !email.trim() || password.length < 8}
          >
            {pending ? "Oluşturuluyor…" : "Oluştur"}
          </button>
        </div>
      </div>

      {error && <div className="pe-error">{error}</div>}

      <div className="pe-grid">
        <div className="pe-main">
          <div className="mv-card iq-pad">
            <div className="pe-sectitle">Hesap bilgileri</div>
            <label className="pe-field">
              <span className="pe-label">Ad soyad</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Yetkili kişi / yönetici adı" />
            </label>
            <label className="pe-field">
              <span className="pe-label">E-posta</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@firma.com" autoComplete="off" />
            </label>
            <label className="pe-field">
              <span className="pe-label">Şifre</span>
              <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="En az 8 karakter" autoComplete="new-password" />
              <span className="pe-hint">Bu şifreyi kullanıcıya siz iletirsiniz.</span>
            </label>
          </div>

          {isCustomer && (
            <div className="mv-card iq-pad">
              <div className="pe-sectitle">Firma bilgileri <i>(müşteri)</i></div>
              <label className="pe-field">
                <span className="pe-label">Firma adı</span>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Örn. Yılmaz Lojistik A.Ş." />
              </label>
              <label className="pe-field">
                <span className="pe-label">Telefon</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90 5xx xxx xx xx" />
              </label>
              <label className="pe-check">
                <input type="checkbox" checked={isVerified} onChange={(e) => setIsVerified(e.target.checked)} />
                <span>Doğrulanmış B2B hesabı (özel koşullardan yararlanır)</span>
              </label>
            </div>
          )}
        </div>

        <div className="pe-side">
          <div className="mv-card iq-pad">
            <div className="iq-cardhead__ttl iq-side__ttl">Rol</div>
            <label className="pe-field">
              <span className="pe-label">Kullanıcı rolü</span>
              <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="ADMIN">Yönetici</option>
                <option value="CUSTOMER">Müşteri</option>
              </select>
            </label>
            <div className="pe-hint">
              {isCustomer
                ? "Müşteri: katalogdan teklif oluşturur, doğrulanınca özel koşullar."
                : "Yönetici: tüm panele erişir. Otomatik doğrulanmış sayılır."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
