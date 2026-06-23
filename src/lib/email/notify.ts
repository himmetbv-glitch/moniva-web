import "server-only";

import { getSettings } from "@/lib/settings";
import { sendEmail } from "./resend";

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
  );
}

function layout(title: string, rows: [string, string][], cta?: { label: string; href: string }, note?: string): string {
  const body = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#777;font-size:13px;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;color:#1b1640;font-size:13px;font-weight:600">${v}</td></tr>`,
    )
    .join("");
  return `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;border:1px solid #ddd">
  <div style="background:#1b1640;padding:18px 22px"><span style="color:#fff;font-weight:700;font-size:18px;font-style:italic">moniva</span></div>
  <div style="padding:22px">
    <h2 style="margin:0 0 4px;color:#4f3d8c;font-size:17px">${esc(title)}</h2>
    ${note ? `<p style="margin:0 0 14px;color:#777;font-size:13px">${esc(note)}</p>` : ""}
    <table style="border-collapse:collapse;width:100%">${body}</table>
    ${cta ? `<a href="${esc(cta.href)}" style="display:inline-block;margin-top:18px;background:#4f3d8c;color:#fff;text-decoration:none;font-size:13px;font-weight:700;padding:11px 20px;border-radius:2px">${esc(cta.label)}</a>` : ""}
  </div>
  <div style="padding:14px 22px;background:#f6f2fb;color:#999;font-size:11px">Bu e-posta Moniva yönetim sisteminden otomatik gönderildi.</div>
</div>`;
}

// Bildirimler asla throw etmez — kullanıcı akışını (teklif/form) düşürmemeli.
async function safeSend(args: Parameters<typeof sendEmail>[0]): Promise<void> {
  try {
    const res = await sendEmail(args);
    if (!res.ok && !res.skipped) {
      console.warn("[email] gönderilemedi:", res.error);
    }
  } catch (e) {
    console.warn("[email] hata:", (e as Error).message);
  }
}

export async function notifyNewQuote(q: {
  id: string;
  ref: string;
  companyName: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  itemCount: number;
  notes?: string | null;
}): Promise<void> {
  const settings = await getSettings();
  if (!settings.notifyEmail) return;
  const html = layout(
    `Yeni teklif talebi · ${q.ref}`,
    [
      ["Firma", esc(q.companyName)],
      ["İlgili", esc(q.fullName)],
      ["E-posta", esc(q.email)],
      ["Telefon", esc(q.phone)],
      ["Ülke", esc(q.country)],
      ["Kalem", String(q.itemCount)],
      ...(q.notes ? ([["Not", esc(q.notes)]] as [string, string][]) : []),
    ],
    { label: "Talebi aç →", href: `${siteUrl()}/admin/inquiries/${q.id}` },
    "Katalogdan yeni bir teklif talebi geldi.",
  );
  await safeSend({ to: settings.notifyEmail, subject: `Yeni teklif talebi · ${q.ref}`, html, replyTo: q.email });
}

export async function notifyNewContact(c: {
  fullName: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  subject?: string | null;
  message: string;
}): Promise<void> {
  const settings = await getSettings();
  if (!settings.notifyEmail) return;
  const html = layout(
    "Yeni iletişim mesajı",
    [
      ["Gönderen", esc(c.fullName)],
      ["E-posta", esc(c.email)],
      ...(c.phone ? ([["Telefon", esc(c.phone)]] as [string, string][]) : []),
      ...(c.company ? ([["Firma", esc(c.company)]] as [string, string][]) : []),
      ...(c.subject ? ([["Konu", esc(c.subject)]] as [string, string][]) : []),
      ["Mesaj", esc(c.message).replace(/\n/g, "<br>")],
    ],
    { label: "Mesajları aç →", href: `${siteUrl()}/admin/messages?kind=contact` },
  );
  await safeSend({ to: settings.notifyEmail, subject: "Yeni iletişim mesajı · Moniva", html, replyTo: c.email });
}

export async function notifyNewApplication(a: {
  fullName: string;
  email: string;
  phone: string;
  position: string;
  experience?: string | null;
}): Promise<void> {
  const settings = await getSettings();
  if (!settings.notifyEmail) return;
  const html = layout(
    "Yeni iş başvurusu",
    [
      ["Aday", esc(a.fullName)],
      ["E-posta", esc(a.email)],
      ["Telefon", esc(a.phone)],
      ["Pozisyon", esc(a.position)],
      ...(a.experience ? ([["Deneyim", esc(a.experience)]] as [string, string][]) : []),
    ],
    { label: "Başvuruları aç →", href: `${siteUrl()}/admin/messages?kind=application` },
  );
  await safeSend({ to: settings.notifyEmail, subject: "Yeni iş başvurusu · Moniva", html, replyTo: a.email });
}
