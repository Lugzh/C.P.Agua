import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !["SUPERVISOR", "GESTOR_CONTRATO"].includes(user.role.name) || !hasPermission(user, "compras.aprovar")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const requests = await prisma.purchaseRequest.findMany({ where: { status: { in: ["SENT_TO_MANAGEMENT", "UNDER_REVIEW", "RESUBMITTED"] } }, include: { supplier: true, items: true, history: { orderBy: { createdAt: "desc" }, take: 10 }, buyer: { select: { name: true } } }, orderBy: { createdAt: "asc" }, take: 100 });
  return NextResponse.json({ requests });
}
