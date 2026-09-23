import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const itemSchema = z.object({ unit: z.string().trim().min(1).max(20), quantity: z.coerce.number().positive(), description: z.string().trim().min(2).max(500), unitPrice: z.coerce.number().nonnegative() });
const requestSchema = z.object({ companyId: z.string().min(1), costCenterId: z.string().min(1), destination: z.string().trim().min(2).max(240), requesterName: z.string().trim().min(2).max(180), supplierId: z.string().min(1).nullable().optional(), items: z.array(itemSchema).min(1) });

const includeData = { include: { supplier: true, buyer: true, items: true, company: true, costCenter: true } } as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "compras.visualizar")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const requests = await prisma.purchaseRequest.findMany({ where: { deletedAt: null }, ...includeData, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ requests });
}

async function saveRequest(data: z.infer<typeof requestSchema>, userId: string, id?: string) {
  const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const items = data.items.map((item, index) => ({ itemNumber: index + 1, unit: item.unit, quantity: new Prisma.Decimal(item.quantity), description: item.description, unitPrice: new Prisma.Decimal(item.unitPrice.toFixed(2)), totalPrice: new Prisma.Decimal((item.quantity * item.unitPrice).toFixed(2)) }));
  if (!id) return prisma.purchaseRequest.create({ data: { ...data, supplierId: data.supplierId || null, buyerId: userId, creatorId: userId, totalAmount: new Prisma.Decimal(totalAmount.toFixed(2)), items: { create: items }, history: { create: { userId, action: "CREATED", description: "Criou a solicitação de compras" } } }, include: { items: true, supplier: true } });
  return prisma.$transaction(async (tx) => {
    await tx.purchaseRequestItem.deleteMany({ where: { requestId: id } });
    const updated = await tx.purchaseRequest.update({ where: { id }, data: { ...data, supplierId: data.supplierId || null, totalAmount: new Prisma.Decimal(totalAmount.toFixed(2)), items: { create: items } }, include: { items: true, supplier: true } });
    await tx.purchaseRequestHistory.create({ data: { requestId: id, userId, action: "UPDATED", description: "Editou a solicitação de compras" } });
    return updated;
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "compras.criar")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  return NextResponse.json({ request: await saveRequest(parsed.data, user.id) }, { status: 201 });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "compras.editar")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const body = await request.json().catch(() => null) as { id?: string } & Record<string, unknown>;
  if (!body.id) return NextResponse.json({ error: "Solicitação não informada." }, { status: 400 });
  const current = await prisma.purchaseRequest.findUnique({ where: { id: body.id } });
  if (!current || current.deletedAt) return NextResponse.json({ error: "Solicitação não encontrada." }, { status: 404 });
  if (!["DRAFT", "REJECTED"].includes(current.status) || (current.creatorId !== user.id && current.buyerId !== user.id)) return NextResponse.json({ error: "A solicitação está bloqueada para edição." }, { status: 409 });
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  return NextResponse.json({ request: await saveRequest(parsed.data, user.id, body.id) });
}
