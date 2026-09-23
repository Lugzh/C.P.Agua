import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const actionSchema = z.object({ action: z.enum(["SUBMIT", "APPROVE", "REJECT", "RESUBMIT", "SEND_TO_FINANCE"]), reason: z.string().trim().max(1000).optional() });

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  const { id } = await params;
  const current = await prisma.purchaseRequest.findUnique({ where: { id }, include: { items: true } });
  if (!current || current.deletedAt) return NextResponse.json({ error: "Solicitação não encontrada." }, { status: 404 });

  const { action, reason } = parsed.data;
  const canApprove = ["SUPERVISOR", "GESTOR_CONTRATO"].includes(user.role.name) && hasPermission(user, "compras.aprovar") && hasPermission(user, "compras.assinar");
  const canCreate = hasPermission(user, "compras.editar");

  if (action === "SUBMIT") {
    if (!canCreate || current.buyerId !== user.id || current.status !== "DRAFT") return NextResponse.json({ error: "Somente o comprador responsável pode enviar um rascunho para Gestão." }, { status: 409 });
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.purchaseRequest.update({ where: { id }, data: { status: "SENT_TO_MANAGEMENT", }, });
      await tx.purchaseRequestHistory.create({ data: { requestId: id, userId: user.id, action: "SENT_TO_MANAGEMENT", description: "Enviou a solicitação para Gestão" } });
      return result;
    });
    return NextResponse.json({ request: updated });
  }

  if (action === "RESUBMIT") {
    if (!canCreate || current.buyerId !== user.id || current.status !== "REJECTED") return NextResponse.json({ error: "Somente o comprador responsável pode reenviar uma solicitação reprovada." }, { status: 409 });
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.purchaseRequest.update({ where: { id }, data: { status: "RESUBMITTED" } });
      await tx.purchaseRequestHistory.create({ data: { requestId: id, userId: user.id, action: "RESUBMITTED", description: "Corrigiu e reenviou a solicitação para Gestão" } });
      return result;
    });
    return NextResponse.json({ request: updated });
  }

  if (action === "SEND_TO_FINANCE") {
    if (!hasPermission(user, "compras.enviar_financeiro")) return NextResponse.json({ error: "Você não possui permissão para enviar ao Financeiro." }, { status: 403 });
    if (current.status !== "APPROVED") return NextResponse.json({ error: "Somente solicitações aprovadas podem ser enviadas ao Financeiro." }, { status: 409 });
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.purchaseRequest.update({ where: { id }, data: { status: "SENT_TO_FINANCE" } });
      await tx.purchaseRequestHistory.create({ data: { requestId: id, userId: user.id, action: "SENT_TO_FINANCE", description: "Enviou a solicitação aprovada ao Financeiro" } });
      return result;
    });
    return NextResponse.json({ request: updated });
  }

  if (!canApprove || current.buyerId === user.id || current.creatorId === user.id) return NextResponse.json({ error: "Somente Supervisor ou Gestor do Contrato pode aprovar, e o solicitante não pode aprovar a própria solicitação." }, { status: 403 });

  if (action === "REJECT") {
    if (!["SENT_TO_MANAGEMENT", "UNDER_REVIEW", "RESUBMITTED"].includes(current.status)) return NextResponse.json({ error: "Esta solicitação não está disponível para reprovação." }, { status: 409 });
    if (!reason) return NextResponse.json({ error: "O motivo da reprovação é obrigatório." }, { status: 400 });
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.purchaseRequest.update({ where: { id }, data: { status: "REJECTED" } });
      await tx.purchaseRequestHistory.create({ data: { requestId: id, userId: user.id, action: "REJECTED", description: `Reprovou a solicitação. Motivo: ${reason}`, metadata: { reason } } });
      return result;
    });
    return NextResponse.json({ request: updated });
  }

  if (action === "APPROVE") {
    if (!["SENT_TO_MANAGEMENT", "UNDER_REVIEW", "RESUBMITTED"].includes(current.status)) return NextResponse.json({ error: "Esta solicitação não está disponível para aprovação." }, { status: 409 });
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.purchaseRequest.update({ where: { id }, data: { status: "APPROVED" } });
      const approvalRole = user.role.name === "SUPERVISOR" ? "SUPERVISOR" : "CONTRACT_MANAGER";
      await tx.purchaseRequestApproval.upsert({ where: { requestId_role: { requestId: id, role: approvalRole } }, update: { userId: user.id, approved: true, action: `Aprovação digital do papel ${user.role.name}`, signedAt: new Date() }, create: { requestId: id, userId: user.id, role: approvalRole, approved: true, action: `Aprovação digital do papel ${user.role.name}` } });
      await tx.purchaseRequestHistory.create({ data: { requestId: id, userId: user.id, action: "APPROVED", description: `Aprovou e assinou digitalmente como ${user.role.name}` } });
      return result;
    });
    return NextResponse.json({ request: updated });
  }
}
