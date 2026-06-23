import "server-only";

import { Role, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
  company: string | null;
  role: Role;
  isVerified: boolean;
  isActive: boolean;
  quoteCount: number;
  lastLoginLabel: string;
  createdAtLabel: string;
};

export type AdminUserSummary = {
  total: number;
  admins: number;
  customers: number;
  verified: number;
  pending: number; // doğrulama bekleyen müşteri (CUSTOMER & !isVerified & isActive)
};

export type AdminUsersResult = {
  rows: AdminUserRow[];
  summary: AdminUserSummary;
};

export type AdminUserFilters = {
  q?: string;
  role?: "ADMIN" | "CUSTOMER";
  pending?: boolean;
};

export type AdminUserQuote = {
  id: string;
  ref: string;
  status: string;
  itemCount: number;
  createdAtLabel: string;
};

export type AdminUserDetail = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  isVerified: boolean;
  isActive: boolean;
  companyName: string | null;
  taxNumber: string | null;
  taxOffice: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  lastLoginLabel: string;
  createdAtLabel: string;
  quotes: AdminUserQuote[];
};

const dateOnlyFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function relativeLabel(date: Date, now: number): string {
  const min = Math.round((now - date.getTime()) / 60000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} sa önce`;
  const d = Math.floor(hr / 24);
  if (d === 1) return "dün";
  if (d < 30) return `${d} gün önce`;
  return dateOnlyFmt.format(date);
}

export async function getAdminUsers(
  filters: AdminUserFilters = {},
): Promise<AdminUsersResult> {
  const now = Date.now();

  const where: Prisma.UserWhereInput = {};
  if (filters.role) where.role = filters.role as Role;
  if (filters.pending) {
    where.role = Role.CUSTOMER;
    where.isVerified = false;
    where.isActive = true;
  }
  if (filters.q && filters.q.trim()) {
    const term = filters.q.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { companyName: { contains: term, mode: "insensitive" } },
    ];
  }

  const [rows, total, admins, customers, verified, pending] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        role: true,
        isVerified: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        _count: { select: { quoteRequests: true } },
      },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { role: Role.ADMIN } }),
    prisma.user.count({ where: { role: Role.CUSTOMER } }),
    prisma.user.count({ where: { isVerified: true } }),
    prisma.user.count({
      where: { role: Role.CUSTOMER, isVerified: false, isActive: true },
    }),
  ]);

  return {
    rows: rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      company: u.companyName,
      role: u.role,
      isVerified: u.isVerified,
      isActive: u.isActive,
      quoteCount: u._count.quoteRequests,
      lastLoginLabel: u.lastLogin ? relativeLabel(u.lastLogin, now) : "—",
      createdAtLabel: dateOnlyFmt.format(u.createdAt),
    })),
    summary: { total, admins, customers, verified, pending },
  };
}

// Son aktif yöneticiyi düşürme/pasife alma guard'ı için.
export async function countActiveAdmins(): Promise<number> {
  return prisma.user.count({ where: { role: Role.ADMIN, isActive: true } });
}

const dateTimeFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export async function getUserDetail(id: string): Promise<AdminUserDetail | null> {
  const u = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isVerified: true,
      isActive: true,
      companyName: true,
      taxNumber: true,
      taxOffice: true,
      phone: true,
      city: true,
      address: true,
      lastLogin: true,
      createdAt: true,
      quoteRequests: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          status: true,
          createdAt: true,
          _count: { select: { items: true } },
        },
      },
    },
  });
  if (!u) return null;

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isVerified: u.isVerified,
    isActive: u.isActive,
    companyName: u.companyName,
    taxNumber: u.taxNumber,
    taxOffice: u.taxOffice,
    phone: u.phone,
    city: u.city,
    address: u.address,
    lastLoginLabel: u.lastLogin ? dateTimeFmt.format(u.lastLogin) : "—",
    createdAtLabel: dateTimeFmt.format(u.createdAt),
    quotes: u.quoteRequests.map((q) => ({
      id: q.id,
      ref: `QR-${q.id.slice(-6).toUpperCase()}`,
      status: q.status,
      itemCount: q._count.items,
      createdAtLabel: dateOnlyFmt.format(q.createdAt),
    })),
  };
}
