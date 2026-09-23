"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? "Não foi possível entrar.");
    else router.push("/");
    setLoading(false);
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-5 py-10"><div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 lg:grid-cols-[1.05fr_0.95fr]"><section className="hidden bg-[#0e7490] p-12 text-white lg:flex lg:flex-col lg:justify-between"><div><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-lg font-bold">CP</div><div><p className="font-bold">C.P. Água</p><p className="text-xs text-cyan-100">Gestão empresarial</p></div></div><div className="mt-24 max-w-sm"><p className="text-sm font-semibold text-cyan-100">Módulo de Compras</p><h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight">Decisões mais simples. Processos mais seguros.</h1><p className="mt-5 text-sm leading-6 text-cyan-50">Centralize solicitações, fornecedores e aprovações em um único fluxo, com rastreabilidade em cada etapa.</p></div></div><p className="text-xs text-cyan-100/80">© 2026 C.P. Água · Acesso restrito</p></section><section className="p-7 sm:p-12"><div className="mx-auto max-w-sm"><div className="mb-10 lg:hidden"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-700 text-lg font-bold text-white">CP</div><p className="mt-3 font-bold">C.P. Água</p></div><div className="mb-8"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700"><LockKeyhole size={19} /></div><h2 className="text-2xl font-bold tracking-tight">Acesse sua conta</h2><p className="mt-2 text-sm text-slate-500">Entre para acompanhar suas solicitações de compras.</p></div><form onSubmit={handleSubmit} className="space-y-5"><label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">E-mail</span><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50" /></label><label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">Senha</span><div className="relative"><input type={showPassword ? "text" : "password"} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Digite sua senha" className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>{error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{error}</p>}<button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0e7490] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#155e75] disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Entrando..." : "Entrar no sistema"}{!loading && <ArrowRight size={17} />}</button></form><p className="mt-8 text-center text-xs leading-5 text-slate-400">Em caso de dificuldade, procure o administrador do sistema.</p></div></section></div></main>;
}
