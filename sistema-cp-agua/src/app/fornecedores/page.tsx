"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Building2, Loader2, Plus, Search, X } from "lucide-react";
import Link from "next/link";

type Supplier = { id: string; legalName: string; tradeName: string | null; cnpj: string; city: string | null; state: string | null; email: string | null; active: boolean };

const emptyForm = { legalName: "", tradeName: "", cnpj: "", phone: "", email: "", address: "", city: "", state: "", notes: "" };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadSuppliers() {
    setLoading(true);
    const response = await fetch("/api/suppliers");
    if (response.ok) setSuppliers((await response.json()).suppliers);
    setLoading(false);
  }
  // Initial data fetch is intentionally triggered once when the screen mounts.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadSuppliers(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setMessage("");
    const response = await fetch("/api/suppliers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json();
    if (!response.ok) setMessage(data.error ?? "Não foi possível salvar.");
    else { setOpen(false); setForm(emptyForm); await loadSuppliers(); }
    setSaving(false);
  }

  const filtered = suppliers.filter((item) => `${item.legalName} ${item.tradeName ?? ""} ${item.cnpj}`.toLowerCase().includes(query.toLowerCase()));

  return <main className="min-h-screen bg-[#f7f8fa] p-5 text-slate-900 sm:p-8"><div className="mx-auto max-w-6xl"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Link href="/" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-cyan-700"><ArrowLeft size={15} /> Voltar ao dashboard</Link><p className="text-sm font-medium text-cyan-700">Módulo de Compras</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Fornecedores</h1><p className="mt-2 text-sm text-slate-500">Cadastre e consulte os fornecedores utilizados nas solicitações.</p></div><button onClick={() => { setMessage(""); setOpen(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0e7490] px-4 py-2.5 text-sm font-semibold text-white"><Plus size={17} /> Novo fornecedor</button></div><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2"><Search size={15} className="text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar fornecedor ou CNPJ" className="w-64 bg-transparent text-sm outline-none placeholder:text-slate-400" /></div><span className="text-xs text-slate-400">{filtered.length} fornecedor(es)</span></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Fornecedor</th><th className="px-5 py-3">CNPJ</th><th className="px-5 py-3">Localização</th><th className="px-5 py-3">E-mail</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400"><Loader2 className="mx-auto mb-2 animate-spin" size={20} />Carregando fornecedores...</td></tr> : filtered.length === 0 ? <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400"><Building2 className="mx-auto mb-2" size={22} />Nenhum fornecedor encontrado.</td></tr> : filtered.map((supplier) => <tr key={supplier.id} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-semibold text-slate-700">{supplier.tradeName || supplier.legalName}</p><p className="mt-1 text-xs text-slate-400">{supplier.legalName}</p></td><td className="px-5 py-4 text-slate-600">{supplier.cnpj}</td><td className="px-5 py-4 text-slate-600">{supplier.city ? `${supplier.city}/${supplier.state ?? ""}` : "—"}</td><td className="px-5 py-4 text-slate-600">{supplier.email || "—"}</td><td className="px-5 py-4"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Ativo</span></td></tr>)}</tbody></table></div></section></div>{open && <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4"><form onSubmit={submit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-cyan-700">Cadastro de fornecedor</p><h2 className="mt-1 text-xl font-bold">Dados do fornecedor</h2></div><button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-400"><X size={18} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Razão social *" value={form.legalName} onChange={(value) => setForm({ ...form, legalName: value })} required /><Field label="Nome fantasia" value={form.tradeName} onChange={(value) => setForm({ ...form, tradeName: value })} /><Field label="CNPJ *" value={form.cnpj} onChange={(value) => setForm({ ...form, cnpj: value })} required /><Field label="Telefone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} /><Field label="E-mail" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} /><Field label="Cidade" value={form.city} onChange={(value) => setForm({ ...form, city: value })} /><Field label="Estado" value={form.state} maxLength={2} onChange={(value) => setForm({ ...form, state: value.toUpperCase() })} /><Field label="Endereço" value={form.address} onChange={(value) => setForm({ ...form, address: value })} /><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Observações</span><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500" /></label></div>{message && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{message}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600">Cancelar</button><button disabled={saving} className="rounded-xl bg-[#0e7490] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Salvando..." : "Salvar fornecedor"}</button></div></form></div>}</main>;
}

function Field({ label, value, onChange, required = false, type = "text", maxLength }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; maxLength?: number }) { return <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span><input required={required} type={type} maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-50" /></label>; }
