import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const supplierSchema = z.object({
  legalName: z.string().trim().min(2).max(180),
  tradeName: z.string().trim().max(180).optional().or(z.literal("")),
  cnpj: z.string().transform((value) => value.replace(/\D/g, "")).refine((value) => value.length === 14, "CNPJ deve conter 14 dígitos"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  address: z.string().trim().max(240).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  state: z.string().trim().length(2).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "fornecedores.visualizar")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const suppliers = await prisma.supplier.findMany({ where: { deletedAt: null }, orderBy: { legalName: "asc" }, take: 100 });
  return NextResponse.json({ suppliers });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "fornecedores.criar")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const parsed = supplierSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  try {
    const supplier = await prisma.supplier.create({ data: { ...parsed.data, tradeName: parsed.data.tradeName || null, phone: parsed.data.phone || null, email: parsed.data.email || null, address: parsed.data.address || null, city: parsed.data.city || null, state: parsed.data.state || null, notes: parsed.data.notes || null } });
    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) return NextResponse.json({ error: "Já existe um fornecedor com este CNPJ." }, { status: 409 });
    return NextResponse.json({ error: "Não foi possível cadastrar o fornecedor." }, { status: 500 });
  }
}
