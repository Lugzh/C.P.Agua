import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const accountSchema = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(180), password: z.string().min(12).max(200), role: z.enum(["COMPRADOR", "SUPERVISOR", "GESTOR_CONTRATO"]) });
function canManageAccounts(user: Awaited<ReturnType<typeof getCurrentUser>>) { return Boolean(user && ["ADMINISTRADOR", "GESTOR_CONTRATO", "GESTAO"].includes(user.role.name)); }

export async function GET() {
  const user = await getCurrentUser();
  if (!canManageAccounts(user)) return NextResponse.json({ error: "Somente Administrador ou Gestor do Contrato pode gerenciar contas." }, { status: 403 });
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, status: true, createdAt: true, role: { select: { name: true } } }, orderBy: { name: "asc" } });
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!canManageAccounts(user)) return NextResponse.json({ error: "Somente Administrador ou Gestor do Contrato pode criar contas." }, { status: 403 });
  const parsed = accountSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Já existe uma conta com este e-mail." }, { status: 409 });
  const role = await prisma.role.findUnique({ where: { name: parsed.data.role } });
  if (!role) return NextResponse.json({ error: "Função ainda não configurada. Execute o seed atualizado." }, { status: 409 });
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const created = await prisma.user.create({ data: { name: parsed.data.name, email, passwordHash, roleId: role.id }, select: { id: true, name: true, email: true, status: true, createdAt: true, role: { select: { name: true } } } });
  return NextResponse.json({ user: created }, { status: 201 });
}
