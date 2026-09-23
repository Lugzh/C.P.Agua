import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "compras.visualizar")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const [companies, costCenters, suppliers] = await Promise.all([
    prisma.company.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.costCenter.findMany({ where: { active: true }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
    prisma.supplier.findMany({ where: { active: true, deletedAt: null }, orderBy: { legalName: "asc" }, select: { id: true, legalName: true, tradeName: true, cnpj: true } }),
  ]);
  return NextResponse.json({ companies, costCenters, suppliers });
}
