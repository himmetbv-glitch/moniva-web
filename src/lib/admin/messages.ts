import "server-only";

import { SubmissionStatus, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type SubmissionKind = "contact" | "application";

export type MessageRow = {
  kind: SubmissionKind;
  id: string;
  name: string;
  email: string;
  subtitle: string; // contact → konu, application → pozisyon
  status: SubmissionStatus;
  createdAt: Date;
  timeLabel: string;
  hasCv: boolean;
};

export type MessageSummary = {
  total: number;
  newCount: number;
  reviewed: number;
  archived: number;
  contactCount: number;
  applicationCount: number;
};

export type MessageListResult = {
  rows: MessageRow[];
  summary: MessageSummary;
};

export type ContactDetail = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  company: string | null;
  subject: string | null;
  message: string;
  status: SubmissionStatus;
  createdAtLabel: string;
  timeLabel: string;
};

export type ApplicationDetail = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string | null;
  position: string;
  experience: string | null;
  linkedinUrl: string | null;
  coverNote: string;
  cvFileName: string | null;
  hasCv: boolean;
  status: SubmissionStatus;
  createdAtLabel: string;
  timeLabel: string;
};

export const SUBMISSION_STATUS_PILL: Record<
  SubmissionStatus,
  { label: string; kind: "info" | "ok" | "mute" }
> = {
  NEW: { label: "Yeni", kind: "info" },
  REVIEWED: { label: "İncelendi", kind: "ok" },
  ARCHIVED: { label: "Arşiv", kind: "mute" },
};

export const SUBMISSION_FLOW: { key: SubmissionStatus; label: string }[] = [
  { key: SubmissionStatus.NEW, label: "Yeni" },
  { key: SubmissionStatus.REVIEWED, label: "İncelendi" },
  { key: SubmissionStatus.ARCHIVED, label: "Arşiv" },
];

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function relativeLabel(date: Date, now: number): string {
  const min = Math.round((now - date.getTime()) / 60000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} sa önce`;
  const d = Math.floor(hr / 24);
  return d === 1 ? "dün" : `${d} gün önce`;
}

function statusFromParam(v?: string): SubmissionStatus | undefined {
  return v && v in SubmissionStatus ? (v as SubmissionStatus) : undefined;
}

export async function getMessageList(
  kind?: SubmissionKind,
  statusParam?: string,
  q?: string,
): Promise<MessageListResult> {
  const now = Date.now();
  const status = statusFromParam(statusParam);
  const term = q?.trim();

  const wantContact = kind === undefined || kind === "contact";
  const wantApplication = kind === undefined || kind === "application";

  const contactWhere: Prisma.ContactMessageWhereInput = {};
  const appWhere: Prisma.JobApplicationWhereInput = {};
  if (status) {
    contactWhere.status = status;
    appWhere.status = status;
  }
  if (term) {
    contactWhere.OR = [
      { fullName: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { company: { contains: term, mode: "insensitive" } },
      { subject: { contains: term, mode: "insensitive" } },
    ];
    appWhere.OR = [
      { fullName: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { position: { contains: term, mode: "insensitive" } },
    ];
  }

  const [
    contacts,
    applications,
    contactCount,
    applicationCount,
    cNew,
    aNew,
    cReviewed,
    aReviewed,
    cArchived,
    aArchived,
  ] = await Promise.all([
    wantContact
      ? prisma.contactMessage.findMany({
          where: contactWhere,
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            fullName: true,
            email: true,
            subject: true,
            status: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
    wantApplication
      ? prisma.jobApplication.findMany({
          where: appWhere,
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            fullName: true,
            email: true,
            position: true,
            cvKey: true,
            status: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
    prisma.contactMessage.count(),
    prisma.jobApplication.count(),
    prisma.contactMessage.count({ where: { status: SubmissionStatus.NEW } }),
    prisma.jobApplication.count({ where: { status: SubmissionStatus.NEW } }),
    prisma.contactMessage.count({ where: { status: SubmissionStatus.REVIEWED } }),
    prisma.jobApplication.count({ where: { status: SubmissionStatus.REVIEWED } }),
    prisma.contactMessage.count({ where: { status: SubmissionStatus.ARCHIVED } }),
    prisma.jobApplication.count({ where: { status: SubmissionStatus.ARCHIVED } }),
  ]);

  const rows: MessageRow[] = [
    ...contacts.map((c) => ({
      kind: "contact" as const,
      id: c.id,
      name: c.fullName,
      email: c.email,
      subtitle: c.subject ?? "İletişim mesajı",
      status: c.status,
      createdAt: c.createdAt,
      timeLabel: relativeLabel(c.createdAt, now),
      hasCv: false,
    })),
    ...applications.map((a) => ({
      kind: "application" as const,
      id: a.id,
      name: a.fullName,
      email: a.email,
      subtitle: a.position,
      status: a.status,
      createdAt: a.createdAt,
      timeLabel: relativeLabel(a.createdAt, now),
      hasCv: Boolean(a.cvKey),
    })),
  ]
    .sort((x, y) => y.createdAt.getTime() - x.createdAt.getTime())
    .slice(0, 100);

  return {
    rows,
    summary: {
      total: contactCount + applicationCount,
      newCount: cNew + aNew,
      reviewed: cReviewed + aReviewed,
      archived: cArchived + aArchived,
      contactCount,
      applicationCount,
    },
  };
}

export async function getContactDetail(id: string): Promise<ContactDetail | null> {
  const now = Date.now();
  const c = await prisma.contactMessage.findUnique({ where: { id } });
  if (!c) return null;
  return {
    id: c.id,
    fullName: c.fullName,
    email: c.email,
    phone: c.phone,
    company: c.company,
    subject: c.subject,
    message: c.message,
    status: c.status,
    createdAtLabel: dateFmt.format(c.createdAt),
    timeLabel: relativeLabel(c.createdAt, now),
  };
}

export async function getApplicationDetail(
  id: string,
): Promise<ApplicationDetail | null> {
  const now = Date.now();
  const a = await prisma.jobApplication.findUnique({ where: { id } });
  if (!a) return null;
  return {
    id: a.id,
    fullName: a.fullName,
    email: a.email,
    phone: a.phone,
    location: a.location,
    position: a.position,
    experience: a.experience,
    linkedinUrl: a.linkedinUrl,
    coverNote: a.coverNote,
    cvFileName: a.cvFileName,
    hasCv: Boolean(a.cvKey),
    status: a.status,
    createdAtLabel: dateFmt.format(a.createdAt),
    timeLabel: relativeLabel(a.createdAt, now),
  };
}

export async function getNewMessageCount(): Promise<number> {
  const [c, a] = await Promise.all([
    prisma.contactMessage.count({ where: { status: SubmissionStatus.NEW } }),
    prisma.jobApplication.count({ where: { status: SubmissionStatus.NEW } }),
  ]);
  return c + a;
}
