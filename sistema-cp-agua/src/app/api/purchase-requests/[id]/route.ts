import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "compras.editar")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const { id } = await params;
  const current = await prisma.purchaseRequest.findUnique({ where: { id } });
  if (!current || current.deletedAt) return NextResponse.json({ error: "Solicitação não encontrada." }, { status: 404 });
  if (current.creatorId !== user.id && current.buyerId !== user.id) return NextResponse.json({ error: "Somente o comprador responsável pode excluir esta solicitação." }, { status: 403 });
  if (["APPROVED", "SENT_TO_FINANCE"].includes(current.status)) return NextResponse.json({ error: "Solicitações aprovadas ou enviadas ao Financeiro não podem ser excluídas." }, { status: 409 });
  const deleted = await prisma.$transaction(async (tx) => {
    const result = await tx.purchaseRequest.update({ where: { id }, data: { deletedAt: new Date() } });
    await tx.purchaseRequestHistory.create({ data: { requestId: id, userId: user.id, action: "UPDATED", description: "Excluiu a solicitação logicamente" } });
    return result;
  });
  return NextResponse.json({ request: deleted });
}
