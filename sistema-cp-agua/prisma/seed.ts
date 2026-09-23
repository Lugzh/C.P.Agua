import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const permissions = [
  ["compras.visualizar", "Visualizar solicitações de compras"],
  ["compras.criar", "Criar solicitações de compras"],
  ["compras.editar", "Editar solicitações permitidas"],
  ["compras.aprovar", "Aprovar solicitações"],
  ["compras.reprovar", "Reprovar solicitações"],
  ["compras.assinar", "Assinar aprovações"],
  ["compras.enviar_financeiro", "Enviar solicitações ao Financeiro"],
  ["fornecedores.visualizar", "Visualizar fornecedores"],
  ["fornecedores.criar", "Cadastrar fornecedores"],
  ["fornecedores.editar", "Editar fornecedores"],
] as const;

async function assignPermissions(roleId: string, permissionRecords: { id: string }[]) {
  await prisma.rolePermission.deleteMany({ where: { roleId } });
  await prisma.rolePermission.createMany({ data: permissionRecords.map((permission) => ({ roleId, permissionId: permission.id })) });
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@cpagua.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 12) throw new Error("Defina SEED_ADMIN_PASSWORD com pelo menos 12 caracteres antes de executar o seed.");

  const permissionRecords = await Promise.all(permissions.map(([key, description]) => prisma.permission.upsert({ where: { key }, update: { description }, create: { key, description } })));
  const supervisorRole = await prisma.role.upsert({ where: { name: "SUPERVISOR" }, update: {}, create: { name: "SUPERVISOR" } });
  const contractManagerRole = await prisma.role.upsert({ where: { name: "GESTOR_CONTRATO" }, update: {}, create: { name: "GESTOR_CONTRATO" } });
  const administratorRole = await prisma.role.upsert({ where: { name: "ADMINISTRADOR" }, update: {}, create: { name: "ADMINISTRADOR" } });
  const buyerRole = await prisma.role.upsert({ where: { name: "COMPRADOR" }, update: {}, create: { name: "COMPRADOR" } });
  const legacyManagementRole = await prisma.role.findUnique({ where: { name: "GESTAO" } });
  if (legacyManagementRole) {
    await prisma.user.updateMany({ where: { roleId: legacyManagementRole.id }, data: { roleId: administratorRole.id } });
    await prisma.rolePermission.deleteMany({ where: { roleId: legacyManagementRole.id } });
  }
  await assignPermissions(supervisorRole.id, permissionRecords);
  await assignPermissions(contractManagerRole.id, permissionRecords);
  await assignPermissions(administratorRole.id, permissionRecords);
  const buyerPermissionKeys = new Set(["compras.visualizar", "compras.criar", "compras.editar", "fornecedores.visualizar", "fornecedores.criar"]);
  await assignPermissions(buyerRole.id, permissionRecords.filter((permission) => buyerPermissionKeys.has(permission.key)));

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: { name: "Administrador", passwordHash, status: "ACTIVE", roleId: administratorRole.id },
    create: { name: "Administrador", email: adminEmail.toLowerCase(), passwordHash, status: "ACTIVE", roleId: administratorRole.id },
  });

  await prisma.company.upsert({ where: { document: "CPAGUA-SEED" }, update: { name: "C.P. Água" }, create: { name: "C.P. Água", document: "CPAGUA-SEED" } });
  await prisma.costCenter.upsert({ where: { code: "CC-001" }, update: { name: "Operações" }, create: { code: "CC-001", name: "Operações" } });
  console.log(`Usuário inicial configurado: ${admin.email} (ADMINISTRADOR)`);
}

main().catch(() => { console.error("Falha ao executar o seed."); process.exitCode = 1; }).finally(() => prisma.$disconnect());
