import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "compras.visualizar")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const active = { deletedAt: null } as const;
  const [total, pending, approved, sentToFinance, totalValue] = await Promise.all([
    prisma.purchaseRequest.count({ where: active }),
    prisma.purchaseRequest.count({ where: { ...active, status: { in: ["SENT_TO_MANAGEMENT", "UNDER_REVIEW", "RESUBMITTED"] } } }),
    prisma.purchaseRequest.count({ where: { ...active, status: "APPROVED" } }),
    prisma.purchaseRequest.count({ where: { ...active, status: "SENT_TO_FINANCE" } }),
    prisma.purchaseRequest.aggregate({ where: { ...active, status: "SENT_TO_FINANCE" }, _sum: { totalAmount: true } }),
  ]);
  return NextResponse.json({ total, pending, approved, sentToFinance, financeValue: totalValue._sum.totalAmount?.toString() ?? "0" });
}
