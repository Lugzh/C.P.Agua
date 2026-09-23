"use client";

import {
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const requests = [
  { number: "SC-000123", requester: "João Alves", supplier: "Hidráulica Varginha", value: "R$ 5.200,00", status: "Em análise", tone: "amber" },
  { number: "SC-000124", requester: "João Alves", supplier: "Materiais Sul Ltda.", value: "R$ 2.100,00", status: "Reprovada", tone: "red" },
  { number: "SC-000125", requester: "Maria Souza", supplier: "Fornecedor Z", value: "R$ 8.900,00", status: "Aprovada", tone: "green" },
  { number: "SC-000126", requester: "Carlos Lima", supplier: "Casa das Bombas", value: "R$ 12.450,00", status: "Rascunho", tone: "slate" },
];

const statusStyles: Record<string, string> = {
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, sentToFinance: 0, financeValue: "0" });
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
  const canApprove = ["SUPERVISOR", "GESTOR_CONTRATO", "ADMINISTRADOR"].includes(currentUser?.role ?? "");
  const canManageUsers = ["GESTOR_CONTRATO", "ADMINISTRADOR"].includes(currentUser?.role ?? "");
  useEffect(() => { fetch("/api/dashboard/stats").then((response) => response.ok ? response.json() : null).then((data) => data && setStats(data)).catch(() => undefined); fetch("/api/auth/me").then((response) => response.ok ? response.json() : null).then((data) => data?.user && setCurrentUser(data.user)).catch(() => undefined); }, []);

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0e7490] text-white shadow-sm"><span className="text-lg font-bold">CP</span></div>
          <div><p className="text-sm font-bold tracking-tight">C.P. Água</p><p className="text-xs text-slate-400">Gestão empresarial</p></div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto rounded-lg p-2 text-slate-400 lg:hidden"><X size={18} /></button>
        </div>
        <nav className="flex-1 space-y-7 px-4 py-7">
          <div><p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Visão geral</p><NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active /></div>
          <div><p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Compras</p><NavItem href="/solicitacoes" icon={<FileText size={18} />} label="Solicitações" /><NavItem href="/fornecedores" icon={<Truck size={18} />} label="Fornecedores" /><NavItem href="/cotacoes" icon={<Clock3 size={18} />} label="Cotações" /></div>
          <div>{(canApprove || canManageUsers) && <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Gestão</p>}{canManageUsers && <NavItem href="/usuarios" icon={<Users size={18} />} label="Usuários" />}{canApprove && <NavItem href="/aprovacoes" icon={<ShieldCheck size={18} />} label="Aprovações" />}</div>
        </nav>
        <div className="border-t border-slate-100 p-4"><NavItem href="/configuracoes" icon={<Settings size={18} />} label="Configurações" /><div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700">JA</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{currentUser?.name || "Usuário"}</p><p className="text-[11px] text-slate-400">{currentUser?.role === "GESTOR_CONTRATO" ? "Gestor do Contrato" : currentUser?.role === "ADMINISTRADOR" ? "Administrador" : currentUser?.role === "SUPERVISOR" ? "Supervisor" : "Comprador"}</p></div><LogOut size={16} className="text-slate-400" /></div></div>
      </aside>

      <main className="lg:pl-72">
        <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8"><div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-slate-500 lg:hidden"><Menu size={20} /></button><div><p className="text-xs text-slate-400">Terça-feira, 22 de setembro de 2026</p><h1 className="text-lg font-bold tracking-tight">Bom dia, {currentUser?.name?.split(" ")[0] || "usuário"}</h1></div></div><div className="flex items-center gap-2"><button className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-50"><Bell size={19} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-500" /></button><div className="mx-2 hidden h-8 w-px bg-slate-200 sm:block" /><div className="hidden items-center gap-2 sm:flex"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700">JA</div><ChevronDown size={15} className="text-slate-400" /></div></div></header>

        <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-medium text-cyan-700">Módulo de Compras</p><h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Visão geral</h2><p className="mt-1 text-sm text-slate-500">Acompanhe as solicitações e pendências da sua equipe.</p></div><Link href="/solicitacoes" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0e7490] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#155e75]"><Plus size={17} /> Nova solicitação</Link></div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<FileText size={19} />} label="Total de solicitações" value={String(stats.total)} detail="Dados reais do banco" color="cyan" /><Metric icon={<Clock3 size={19} />} label="Aguardando análise" value={String(stats.pending)} detail="Requer atenção" color="amber" /><Metric icon={<CheckCircle2 size={19} />} label="Aprovadas" value={String(stats.approved)} detail="Status aprovado" color="green" /><Metric icon={<Truck size={19} />} label="Enviadas ao financeiro" value={String(stats.sentToFinance)} detail={Number(stats.financeValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} color="violet" /></div>

          <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_340px]"><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center"><div><h3 className="font-bold">Solicitações recentes</h3><p className="mt-1 text-xs text-slate-400">Últimas movimentações do módulo</p></div><div className="flex gap-2"><div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2"><Search size={15} className="text-slate-400" /><input placeholder="Pesquisar" className="w-24 bg-transparent text-xs outline-none placeholder:text-slate-400" /></div><button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600">Todos <ChevronDown size={13} className="ml-1 inline" /></button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3 font-semibold">Número</th><th className="px-5 py-3 font-semibold">Solicitante</th><th className="px-5 py-3 font-semibold">Fornecedor</th><th className="px-5 py-3 font-semibold">Valor</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3" /></tr></thead><tbody className="divide-y divide-slate-100">{requests.map((request) => <tr key={request.number} className="transition hover:bg-slate-50/80"><td className="px-5 py-4 font-semibold text-cyan-700">{request.number}</td><td className="px-5 py-4 text-slate-600">{request.requester}</td><td className="px-5 py-4 text-slate-600">{request.supplier}</td><td className="px-5 py-4 font-medium text-slate-700">{request.value}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[request.tone]}`}>{request.status}</span></td><td className="px-5 py-4"><button className="text-slate-400 hover:text-cyan-700"><ArrowUpRight size={17} /></button></td></tr>)}</tbody></table></div><div className="flex justify-center border-t border-slate-100 px-5 py-4"><button className="text-xs font-semibold text-cyan-700 hover:text-cyan-800">Ver todas as solicitações</button></div></section>

          <aside className="space-y-6"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="font-bold">Pendências</h3><p className="mt-1 text-xs text-slate-400">Ações que precisam de você</p></div><span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-xs font-bold text-amber-700">4</span></div><div className="mt-5 space-y-4"><Pending icon={<Clock3 size={16} />} title="Solicitações em análise" detail="3 aguardando aprovação" tone="amber" /><Pending icon={<X size={16} />} title="Solicitação reprovada" detail="SC-000124 precisa de revisão" tone="red" /><Pending icon={<Users size={16} />} title="Cadastro incompleto" detail="1 fornecedor pendente" tone="blue" /></div><button className="mt-5 w-full rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Ver pendências</button></section><section className="rounded-2xl bg-[#0e7490] p-5 text-white shadow-sm"><div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15"><ShieldCheck size={18} /></div><p className="text-sm font-semibold">Fluxo seguro e auditável</p><p className="mt-2 text-xs leading-5 text-cyan-50">Cada aprovação, reprovação e alteração fica registrada no histórico da solicitação.</p><button className="mt-4 text-xs font-semibold text-white underline underline-offset-4">Conheça o fluxo</button></section></aside></div>
        </div>
      </main>
      {showNewRequest && <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-cyan-700">Nova solicitação</p><h3 className="mt-1 text-xl font-bold">Comece pelos dados gerais</h3></div><button onClick={() => setShowNewRequest(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"><X size={18} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Empresa" placeholder="Selecione a empresa" /><Field label="Centro de custo" placeholder="Ex.: CC-001" /><Field label="Destinação" placeholder="Descreva a destinação" full /><Field label="Fornecedor" placeholder="Selecione o fornecedor" full /></div><div className="mt-6 flex justify-end gap-3"><button onClick={() => setShowNewRequest(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button><button onClick={() => setShowNewRequest(false)} className="rounded-xl bg-[#0e7490] px-4 py-2.5 text-sm font-semibold text-white">Continuar</button></div></div></div>}
    </div>
  );
}

function NavItem({ icon, label, active = false, href = "#" }: { icon: React.ReactNode; label: string; active?: boolean; href?: string }) { return <Link href={href} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-cyan-50 text-cyan-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>{icon}<span>{label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-600" />}</Link>; }
function Metric({ icon, label, value, detail, color }: { icon: React.ReactNode; label: string; value: string; detail: string; color: string }) { const colors: Record<string, string> = { cyan: "bg-cyan-50 text-cyan-700", amber: "bg-amber-50 text-amber-700", green: "bg-emerald-50 text-emerald-700", violet: "bg-violet-50 text-violet-700" }; return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${colors[color]}`}>{icon}</div><ArrowUpRight size={16} className="text-slate-300" /></div><p className="mt-5 text-xs font-medium text-slate-400">{label}</p><p className="mt-1 text-2xl font-bold tracking-tight">{value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div>; }
function Pending({ icon, title, detail, tone }: { icon: React.ReactNode; title: string; detail: string; tone: string }) { const colors: Record<string, string> = { amber: "bg-amber-50 text-amber-700", red: "bg-red-50 text-red-700", blue: "bg-blue-50 text-blue-700" }; return <div className="flex gap-3"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors[tone]}`}>{icon}</div><div><p className="text-xs font-semibold text-slate-700">{title}</p><p className="mt-1 text-[11px] text-slate-400">{detail}</p></div></div>; }
function Field({ label, placeholder, full = false }: { label: string; placeholder: string; full?: boolean }) { return <label className={full ? "sm:col-span-2" : ""}><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span><input placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" /></label>; }
