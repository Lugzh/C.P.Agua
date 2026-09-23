import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };
const money = (value: unknown) => Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const date = (value: Date) => value.toLocaleDateString("pt-BR");
const text = (value: unknown) => String(value ?? "");

export async function GET(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "compras.visualizar")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const { id } = await params;
  const request = await prisma.purchaseRequest.findUnique({ where: { id }, include: { company: true, costCenter: true, supplier: true, items: { orderBy: { itemNumber: "asc" } }, approvals: { include: { user: true }, orderBy: { signedAt: "asc" } }, history: { include: { user: true }, orderBy: { createdAt: "asc" } } } });
  if (!request || request.deletedAt) return NextResponse.json({ error: "Solicitação não encontrada." }, { status: 404 });

  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 36;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  const dark = rgb(0.08, 0.15, 0.22);
  const teal = rgb(0.05, 0.45, 0.56);
  const light = rgb(0.94, 0.97, 0.98);
  const line = rgb(0.78, 0.83, 0.86);
  const draw = (value: string, x: number, top: number, size = 9, font = regular, color = dark) => page.drawText(value, { x, y: top - size, size, font, color });
  const rect = (x: number, top: number, width: number, height: number, color: ReturnType<typeof rgb>) => page.drawRectangle({ x, y: top - height, width, height, color });
  const rule = (top: number) => page.drawLine({ start: { x: margin, y: top }, end: { x: pageWidth - margin, y: top }, thickness: 0.7, color: line });
  const supplierName = request.supplier?.tradeName || request.supplier?.legalName || "Não informado";
  const number = `SC-${String(request.number).padStart(5, "0")}/${request.createdAt.getFullYear()}`;

  rect(margin, y, pageWidth - margin * 2, 48, teal);
  draw("C.P. ÁGUA", margin + 16, y - 14, 16, bold, rgb(1, 1, 1));
  draw("SOLICITAÇÃO DE COMPRAS", margin + 16, y - 34, 9, regular, rgb(0.86, 0.96, 0.98));
  draw(`Nº: ${number}`, pageWidth - margin - 155, y - 17, 10, bold, rgb(1, 1, 1));
  draw(date(request.createdAt), pageWidth - margin - 155, y - 34, 9, regular, rgb(0.86, 0.96, 0.98));
  y -= 66;

  rect(margin, y, pageWidth - margin * 2, 70, light);
  draw("Empresa:", margin + 10, y - 14, 8, bold, teal); draw(text(request.company.name), margin + 62, y - 14, 9);
  draw("Centro de custo:", margin + 10, y - 34, 8, bold, teal); draw(text(request.costCenter.name), margin + 86, y - 34, 9);
  draw("Solicitante:", 335, y - 34, 8, bold, teal); draw(text(request.requesterName), 400, y - 34, 9);
  draw("Destinação:", margin + 10, y - 54, 8, bold, teal); draw(text(request.destination).slice(0, 75), margin + 72, y - 54, 9);
  draw("Fornecedor:", 335, y - 54, 8, bold, teal); draw(supplierName.slice(0, 32), 400, y - 54, 9);
  y -= 88;

  const columns = [{ label: "Item", x: margin, width: 38 }, { label: "Unid.", x: margin + 38, width: 52 }, { label: "Qtd.", x: margin + 90, width: 48 }, { label: "Descrição", x: margin + 138, width: 225 }, { label: "Valor unitário", x: margin + 363, width: 82 }, { label: "Valor total", x: margin + 445, width: 78 }];
  const headerHeight = 24;
  rect(margin, y, pageWidth - margin * 2, headerHeight, dark);
  columns.forEach((column) => draw(column.label, column.x + 5, y + 16, 7.5, bold, rgb(1, 1, 1)));
  y -= headerHeight;
  const rowHeight = 22;
  for (const item of request.items) {
    if (y < 105) {
      page = pdf.addPage([pageWidth, pageHeight]); y = pageHeight - margin;
      rect(margin, y, pageWidth - margin * 2, headerHeight, dark); columns.forEach((column) => draw(column.label, column.x + 5, y + 16, 7.5, bold, rgb(1, 1, 1))); y -= headerHeight;
    }
    if (item.itemNumber % 2 === 0) rect(margin, y, pageWidth - margin * 2, rowHeight, rgb(0.97, 0.98, 0.98));
    draw(text(item.itemNumber), columns[0].x + 7, y + 15, 8);
    draw(text(item.unit), columns[1].x + 5, y + 15, 8);
    draw(text(item.quantity), columns[2].x + 5, y + 15, 8);
    draw(text(item.description).slice(0, 48), columns[3].x + 5, y + 15, 8);
    draw(money(item.unitPrice), columns[4].x + 5, y + 15, 7.5);
    draw(money(item.totalPrice), columns[5].x + 5, y + 15, 7.5);
    page.drawRectangle({ x: margin, y: y - rowHeight, width: pageWidth - margin * 2, height: rowHeight, borderColor: line, borderWidth: 0.35, color: undefined });
    y -= rowHeight;
  }
  if (y < 150) { page = pdf.addPage([pageWidth, pageHeight]); y = pageHeight - margin; }
  y -= 10;
  rule(y); y -= 20;
  draw("TOTAL", pageWidth - margin - 160, y, 10, bold, teal);
  draw(money(request.totalAmount), pageWidth - margin - 82, y, 11, bold);
  y -= 40;
  draw("OBSERVAÇÕES / HISTÓRICO", margin, y, 9, bold, teal); y -= 16;
  const recentHistory = request.history.slice(-4);
  if (recentHistory.length === 0) draw("Sem observações registradas.", margin, y, 8, regular, rgb(0.35, 0.4, 0.45));
  for (const entry of recentHistory) { draw(`${date(entry.createdAt)} — ${entry.user.name}: ${entry.description}`.slice(0, 105), margin, y, 7.5, regular, rgb(0.35, 0.4, 0.45)); y -= 13; }
  y -= 28;
  draw("ASSINATURAS", margin, y, 9, bold, teal); y -= 28;
  const signatureWidth = (pageWidth - margin * 2 - 20) / 2;
  request.approvals.slice(0, 2).forEach((approval, index) => { const x = margin + index * (signatureWidth + 20); page.drawLine({ start: { x, y }, end: { x: x + signatureWidth, y }, thickness: 0.8, color: dark }); draw(approval.user.name, x, y - 8, 8, bold); draw(`${approval.role === "SUPERVISOR" ? "Supervisor" : "Gestor do Contrato"} — ${date(approval.signedAt)}`, x, y - 21, 7.5, regular, rgb(0.35, 0.4, 0.45)); });
  const bytes = await pdf.save();
  const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new NextResponse(body, { status: 200, headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="solicitacao-${request.number}.pdf"`, "Cache-Control": "no-store" } });
}
