"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar as CalendarIcon, Users, Clock, FileText, ChevronRight, Trash2, Filter, CheckCircle, Eye, AlertTriangle, ArrowLeft, RotateCcw, AlertCircle, ChevronDown, ChevronUp, RefreshCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import "react-day-picker/dist/style.css";

export default function PendenciasPage() {
  const [responsible, setResponsible] = useState("");
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [moduleType, setModuleType] = useState<string>("");
  const [moduleFilterOpen, setModuleFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [pendingDocs, setPendingDocs] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [expandedRecordIds, setExpandedRecordIds] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);

  const togglePendingDocsExpansion = (moduleType: string, recordId: number) => {
    const key = `${moduleType}-${recordId}`;
    setExpandedRecordIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const fetchTasks = async (respOverride?: string, moduleOverride?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    const r = typeof respOverride === 'string' ? respOverride : responsible;
    if (r) params.set("responsible", r);
    const m = typeof moduleOverride === 'string' ? moduleOverride : moduleType;
    if (m) params.set("moduleType", m);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("limit", "300");
    const res = await fetch(`/api/tasks?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  };

  const fetchPendingDocs = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch('/api/pending-documents');
      if (res.ok) {
        const data = await res.json();
        const filtered = (Array.isArray(data) ? data : []).filter((d: any) => (d.missing_count || 0) > 0);
        setPendingDocs(filtered);
      }
    } catch (err) {
      console.error('Error fetching pending docs:', err);
    }
    setLoadingDocs(false);
  };

  const syncPendingDocs = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/pending-documents/rebuild", { method: 'POST' });
      if (res.ok) {
        await fetchPendingDocs();
      }
    } catch (error) {
      console.error("Erro ao sincronizar documentos:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchPendingDocs();
  }, []);
  useEffect(() => {
    // Atualiza automaticamente quando o responsável muda
    fetchTasks();
  }, [responsible]);
  useEffect(() => {
    // Atualiza automaticamente quando o módulo muda
    fetchTasks();
  }, [moduleType]);

  const todayStart = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }, []);
  const isOverdue = (due?: string) => {
    if (!due) return false;
    const t = new Date(due); t.setHours(0, 0, 0, 0); return t.getTime() < todayStart;
  };
  const isDueSoon = (due?: string) => {
    if (!due) return false;
    const t = new Date(due); t.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((t.getTime() - todayStart) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 2;
  };
  const displayTasks = useMemo(() => {
    let list = tasks.slice();
    if (statusFilter === 'Atrasado') list = list.filter((t) => !t.isDone && isOverdue(t.dueDate));
    else if (statusFilter === 'Próximo') list = list.filter((t) => !t.isDone && isDueSoon(t.dueDate));
    else if (statusFilter === 'Concluída') list = list.filter((t) => !!t.isDone);
    return list;
  }, [tasks, statusFilter]);
  const totalPending = useMemo(() => tasks.filter((t) => !t.isDone).length, [tasks]);
  const overdueCount = useMemo(() => tasks.filter((t) => !t.isDone && isOverdue(t.dueDate)).length, [tasks]);
  const upcomingCount = useMemo(() => tasks.filter((t) => !t.isDone && isDueSoon(t.dueDate)).length, [tasks]);
  const completedCount = useMemo(() => tasks.filter((t) => !!t.isDone).length, [tasks]);

  const responsaveis = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.responsibleName && t.responsibleName.trim()) set.add(t.responsibleName.trim());
      else set.add("Sem responsável");
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [tasks]);

  const MODULE_OPTIONS: { key: string; label: string }[] = [
    { key: "acoes_civeis", label: "Ações Cíveis" },
    { key: "acoes_trabalhistas", label: "Ações Trabalhistas" },
    { key: "acoes_criminais", label: "Ações Criminais" },
    { key: "compra_venda_imoveis", label: "Compra e Venda" },
    { key: "perda_nacionalidade", label: "Perda de Nacionalidade" },
    { key: "vistos", label: "Vistos" },
  ];

  const linkFor = (t: any) => {
    if (t.moduleType === "acoes_civeis") return `/dashboard/acoes-civeis/${t.recordId}`;
    if (t.moduleType === "acoes_trabalhistas") return `/dashboard/acoes-trabalhistas/${t.recordId}`;
    if (t.moduleType === "acoes_criminais") return `/dashboard/acoes-criminais/${t.recordId}`;
    if (t.moduleType === "compra_venda_imoveis" || t.moduleType === "compra-venda") return `/dashboard/compra-venda/${t.recordId}`;
    if (t.moduleType === "perda_nacionalidade") return `/dashboard/perda-nacionalidade/${t.recordId}`;
    if (t.moduleType === "vistos") return `/dashboard/vistos/${t.recordId}`;
    return "#";
  };

  const formatDueDate = (s?: string) => {
    if (!s) return "Sem prazo";
    const p = s.split("-").map((v) => parseInt(v, 10));
    const d = new Date(p[0], (p[1] || 1) - 1, p[2] || 1);
    return d.toLocaleDateString("pt-BR");
  };

  const formatNumber = (num: number) => {
    return num < 10 ? `0${num}` : num.toString();
  };

  const formatDateBR = (s?: string) => {
    if (!s) return "";
    const p = s.split("-").map((v) => parseInt(v, 10));
    const d = new Date(p[0], (p[1] || 1) - 1, p[2] || 1);
    return d.toLocaleDateString("pt-BR");
  };
  const formatDateISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const dateRangeLabel = useMemo(() => {
    const f = formatDateBR(from);
    const t = formatDateBR(to);
    if (!f && !t) return "";
    if (f && t) return `${f} - ${t}`;
    return f || t;
  }, [from, to]);

  const getCivilStepTitle = (caseType: string | undefined, stepIndex: number) => {
    const STANDARD_CIVIL_STEPS = [
      "Cadastro Documentos",
      "Agendar Exame DNA",
      "Elaboração Procuração",
      "Aguardar procuração assinada",
      "À Protocolar",
      "Processo Protocolado",
      "Processo Finalizado",
    ];
    const EXAME_DNA_STEPS = [
      "Cadastro Documentos",
      "Agendar Exame DNA",
      "Elaboração Procuração",
      "Aguardar procuração assinada",
      "À Protocolar",
      "Processo Protocolado",
      "Processo Finalizado",
    ];
    const ALTERACAO_NOME_STEPS = [
      "Cadastro Documentos",
      "Emissão da Guia Judicial",
      "Elaboração Procuração",
      "Aguardar procuração assinada",
      "Peticionar",
      "À Protocolar",
      "Processo Protocolado",
      "Processo Finalizado",
    ];
    const steps = caseType === "Exame DNA"
      ? EXAME_DNA_STEPS
      : (caseType === "Alteração de Nome" || caseType === "Guarda" || caseType === "Acordos de Guarda")
        ? ALTERACAO_NOME_STEPS
        : STANDARD_CIVIL_STEPS;
    return steps[stepIndex] || `Passo ${stepIndex}`;
  };

  const getStepTitle = (t: any) => {
    if (t.moduleType === "acoes_civeis") return getCivilStepTitle(t.caseType, t.stepIndex);
    if (t.moduleType === "acoes_trabalhistas") {
      const steps = [
        "Cadastro de Documentos",
        "Análise do Caso",
        "Petição Inicial",
        "Protocolar Processo",
        "Audiência",
        "Sentença",
        "Recursos",
      ];
      return steps[t.stepIndex] || `Passo ${t.stepIndex}`;
    }
    if (t.moduleType === "acoes_criminais") {
      const steps = [
        "Cadastro de Documentos",
        "Análise do Caso",
        "Petição Inicial",
        "Protocolar Processo",
        "Aguardar Citação",
        "Resposta à Acusação",
        "Instrução Processual",
        "Alegações Finais",
        "Sentença",
        "Recurso",
      ];
      return steps[t.stepIndex] || `Passo ${t.stepIndex}`;
    }
    if (t.moduleType === "compra_venda_imoveis" || t.moduleType === "compra-venda") {
      const steps = [
        "Cadastro Documentos",
        "Emitir Certidões",
        "Fazer/Analisar Contrato Compra e Venda",
        "Assinatura de contrato",
        "Escritura",
        "Cobrar a Matrícula do Cartório",
        "Processo Finalizado",
      ];
      return steps[t.stepIndex] || `Passo ${t.stepIndex}`;
    }
    if (t.moduleType === "perda_nacionalidade") {
      const steps = [
        "Cadastro de Documento",
        "Fazer a Procuração e o Pedido de Perda",
        "Colher assinaturas nas Procurações e Pedidos",
        "Protocolar no SEI",
        "Processo Protocolado",
        "Processo Deferido",
        "Passaporte Chinês",
        "Manifesto",
        "Protocolar no SEI",
        "Processo Ratificado",
        "Processo Finalizado",
      ];
      return steps[t.stepIndex] || `Passo ${t.stepIndex}`;
    }
    if (t.moduleType === "vistos") {
      const steps = [
        "Cadastro Documentos",
        "Comprovação Financeira",
        "Reservas e Itinerário",
        "Taxa",
        "Análise",
        "Protocolo",
        "Decisão",
      ];
      return steps[t.stepIndex] || `Passo ${t.stepIndex}`;
    }
    return `Passo ${t.stepIndex}`;
  };

  const moduleLabel = (moduleType: string) => {
    if (moduleType === "acoes_civeis") return "Ações Cíveis";
    if (moduleType === "acoes_trabalhistas") return "Ações Trabalhistas";
    if (moduleType === "acoes_criminais") return "Ações Criminais";
    if (moduleType === "compra_venda_imoveis" || moduleType === "compra-venda") return "Compra e Venda";
    if (moduleType === "perda_nacionalidade") return "Perda de Nacionalidade";
    if (moduleType === "vistos") return "Vistos";
    return moduleType;
  };

  const handleDelete = async (t: any) => {
    const url = `/api/step-assignments?moduleType=${encodeURIComponent(t.moduleType)}&recordId=${t.recordId}&stepIndex=${t.stepIndex}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (res.ok) {
      setTasks(prev => prev.filter(x => !(x.moduleType === t.moduleType && x.recordId === t.recordId && x.stepIndex === t.stepIndex)));
    }
  };

  const toggleDone = async (t: any) => {
    const newValue = !t.isDone;
    const payload = {
      moduleType: t.moduleType,
      recordId: t.recordId,
      stepIndex: t.stepIndex,
      isDone: newValue,
    };
    const res = await fetch('/api/step-assignments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const updated = await res.json();
      setTasks(prev => prev.map(x => (
        x.id === t.id
          ? { ...x, isDone: newValue, completedAt: newValue ? (updated?.completedAt ?? new Date().toISOString()) : null }
          : x
      )));
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-50/50 pt-6 pb-12">
      {/* Liquid Background Blobs */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-500/[0.08] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-pink-500/[0.06] rounded-full blur-[100px]" />
        <div className="absolute top-[20%] right-[10%] w-[35vw] h-[35vw] bg-sky-500/[0.05] rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 max-w-7xl space-y-10">
        {/* Header Section */}
        <header className="flex flex-col gap-6">
          <div className="grid grid-cols-3 items-center w-full">
            <div className="flex justify-start">
              <Button
                variant="ghost"
                className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors p-0 h-auto font-semibold"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Voltar
              </Button>
            </div>

            <div className="flex flex-col items-center text-center">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Tarefas Pendentes</h1>
              <p className="text-sm text-slate-500 font-medium whitespace-nowrap">Gestão administrativa de prazos e obrigações jurídicas</p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => fetchTasks()}
                disabled={loading}
                className="bg-[#F59E0B] hover:bg-amber-500 text-white font-bold py-2.5 px-6 rounded-full transition-all shadow-lg shadow-amber-500/30 border border-white/20 h-auto"
              >
                <RotateCcw className={`mr-2 h-4 w-4 ${(loading || loadingDocs) ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </header>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tarefas Pendentes */}
          <div className="glass-card rounded-[2.5rem] p-6 flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Tarefas Pendentes</span>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-bold text-slate-900 tracking-tighter">{formatNumber(totalPending)}</span>
            </div>
          </div>

          {/* Atrasadas */}
          <div className="glass-card rounded-[2.5rem] p-6 flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
              <span className="text-red-500/80 text-sm font-semibold uppercase tracking-wider">Atrasadas</span>
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-bold text-red-600 tracking-tighter">{formatNumber(overdueCount)}</span>
            </div>
          </div>

          {/* Próximas */}
          <div className="glass-card rounded-[2.5rem] p-6 flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
              <span className="text-amber-600/80 text-sm font-semibold uppercase tracking-wider">Próximas</span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-bold text-amber-600 tracking-tighter">{formatNumber(upcomingCount)}</span>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="glass-card rounded-[2.5rem] p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Select value={responsible} onValueChange={(v) => setResponsible(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-full h-12 bg-white/50 border-white/80 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all shadow-none">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/80 shadow-xl backdrop-blur-xl bg-white/90">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="__none__">Sem responsável</SelectItem>
                  {responsaveis.map((nome) => (
                    <SelectItem key={nome} value={nome === 'Sem responsável' ? '__none__' : nome}>{nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Select value={moduleType} onValueChange={(v) => setModuleType(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-full h-12 bg-white/50 border-white/80 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all shadow-none">
                  <SelectValue placeholder="Módulo" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/80 shadow-xl backdrop-blur-xl bg-white/90">
                  <SelectItem value="all">Todos os Módulos</SelectItem>
                  {MODULE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-full h-12 bg-white/50 border-white/80 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all shadow-none">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/80 shadow-xl backdrop-blur-xl bg-white/90">
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Atrasado">Atrasado</SelectItem>
                  <SelectItem value="Próximo">Próximo</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-full h-12 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/50 hover:bg-white/80 transition-all px-4 text-sm text-slate-600 shadow-none">
                    <CalendarIcon className="h-5 w-5 text-slate-400" />
                    <span className="truncate">{dateRangeLabel || "Intervalo de Datas"}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[360px] p-4 rounded-3xl border-white shadow-2xl backdrop-blur-xl" align="end">
                  <Calendar
                    mode="range"
                    selected={dateRange as any}
                    onSelect={(range: any) => {
                      setDateRange(range || {});
                      setFrom(range?.from ? formatDateISO(range.from) : "");
                      setTo(range?.to ? formatDateISO(range.to) : "");
                    }}
                    weekStartsOn={1}
                    captionLayout="dropdown"
                    locale={ptBR}
                    style={{ "--cell-size": "2.5rem" } as React.CSSProperties}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Pending Documents Section */}
        {pendingDocs.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-4">
              <h2 className="text-xl font-bold text-slate-900">Documentos Pendentes</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={syncPendingDocs}
                disabled={isSyncing}
                className="bg-white hover:bg-orange-50 text-orange-600 border-orange-200 hover:border-orange-300 gap-2 font-bold text-[10px] uppercase tracking-wider"
              >
                <RefreshCcw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
            </div>
            <div className="grid grid-cols-12 px-8 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
              <div className="col-span-4">Cliente</div>
              <div className="col-span-3 text-center">Módulo</div>
              <div className="col-span-4 text-center">Status</div>
              <div className="col-span-1 text-right">Ações</div>
            </div>

            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
              {pendingDocs.map((doc: any) => {
                const isExpanded = expandedRecordIds.has(`${doc.module_type}-${doc.record_id}`);
                const pendingData = Array.isArray(doc.pending) ? doc.pending : (doc.pending ? [doc.pending] : []);

                return (
                  <div
                    key={`pending-doc-${doc.module_type}-${doc.record_id}-${doc.id}`}
                    className="space-y-3"
                  >
                    <div
                      className="glass-row rounded-[2.5rem] p-5 grid grid-cols-12 items-center px-8"
                    >
                      <div className="col-span-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm bg-orange-50 border-orange-100 text-orange-500">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 truncate">{doc.client_name}</h3>
                        </div>
                      </div>

                      <div className="col-span-3 text-center">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200">
                          {moduleLabel(doc.module_type)}
                        </span>
                      </div>

                      <div className="col-span-4 flex justify-center">
                        <button
                          onClick={() => togglePendingDocsExpansion(doc.module_type, doc.record_id)}
                          className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center gap-2"
                        >
                          {doc.missing_count} Documentos Pendentes
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      </div>

                      <div className="col-span-1 flex justify-end gap-2">
                        <Link href={`/dashboard/${doc.module_type === 'turismo' ? 'turismo' : 'vistos'}/${doc.record_id}`}>
                          <button className="w-9 h-9 rounded-xl bg-white/40 hover:bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all border border-white/50 shadow-sm">
                            <Eye className="h-5 w-5" />
                          </button>
                        </Link>
                      </div>
                    </div>

                    {/* Expandable Content (Image 2 style) */}
                    {isExpanded && (
                      <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 shadow-sm">
                          <div className="flex items-start justify-between mb-4">
                            <h4 className="flex items-center gap-2 text-amber-800 font-bold">
                              <AlertCircle className="h-5 w-5" />
                              Documentos Pendentes
                            </h4>
                          </div>
                          <p className="text-sm text-amber-700 mb-6">
                            Os documentos abaixo ainda não foram adicionados ao fluxo do processo.
                          </p>

                          <div className="space-y-6">
                            {doc.pending && Array.isArray(doc.pending) ? (
                              doc.pending.map((group: any) => (
                                <div key={group.flow} className="space-y-3">
                                  <h5 className="text-sm font-bold text-amber-900 border-b border-amber-200 pb-1.5 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    {group.flow || "Sem Categoria"}
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2.5 pt-1">
                                    {group.docs && Array.isArray(group.docs) && group.docs.map((f: any) => (
                                      <div key={f.key || Math.random()} className="flex items-start gap-2.5 text-[13px] text-amber-800/90 group leading-relaxed">
                                        <span className="mt-1.5 w-2 h-0.5 bg-amber-300 flex-shrink-0 group-hover:bg-amber-500 transition-colors" />
                                        <span className="font-semibold">{f.label || f.key || "Documento Pendente"}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="flex flex-col items-center justify-center p-8 text-center bg-amber-100/30 rounded-lg border border-dashed border-amber-200">
                                <FileText className="h-8 w-8 text-amber-300 mb-2" />
                                <p className="text-sm text-amber-700 font-medium">Informações detalhadas não disponíveis.</p>
                                <p className="text-xs text-amber-600/80 mt-1">Sincronize os dados para atualizar esta lista.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Task List Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 px-4">Tarefas Pendentes</h2>
          <div className="grid grid-cols-12 px-8 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
            <div className="col-span-4">Descrição da Tarefa</div>
            <div className="col-span-3 text-center">Advogado Responsável</div>
            <div className="col-span-2 text-center">Prazo</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-1 text-right">Ações</div>
          </div>

          <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="glass-row rounded-[2rem] p-12 text-center text-slate-500 font-medium">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                  Carregando tarefas...
                </div>
              </div>
            ) : displayTasks.length === 0 ? (
              <div className="glass-row rounded-[2rem] p-12 text-center text-slate-500 font-medium italic border-dashed border-slate-200">
                Nenhuma pendência encontrada com os filtros atuais
              </div>
            ) : (
              displayTasks.map((t: any) => {
                const overdue = !t.isDone && isOverdue(t.dueDate);
                const dueSoon = !t.isDone && isDueSoon(t.dueDate) && !overdue;
                const done = !!t.isDone;

                return (
                  <div
                    key={`${t.moduleType}-${t.recordId}-${t.stepIndex}-${t.id}`}
                    className="glass-row rounded-[2.5rem] p-5 grid grid-cols-12 items-center px-8"
                  >
                    {/* Task Info */}
                    <div className="col-span-4 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${overdue ? 'bg-red-50 border-red-100 text-red-500' :
                        dueSoon ? 'bg-amber-50 border-amber-100 text-amber-500' :
                          done ? 'bg-emerald-50 border-emerald-100 text-emerald-500' :
                            'bg-indigo-50 border-indigo-100 text-indigo-500'
                        }`}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{getStepTitle(t)}</h3>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                          Módulo: {moduleLabel(t.moduleType)}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-3 text-center">
                      <span className="text-sm font-medium text-slate-600 truncate block px-2">
                        {t.responsibleName || 'Sem responsável'}
                      </span>
                    </div>

                    <div className="col-span-2 text-center">
                      <span className={`text-sm font-bold ${overdue ? 'text-red-600' : 'text-slate-700'}`}>
                        {formatDueDate(t.dueDate)}
                      </span>
                    </div>

                    <div className="col-span-2 flex justify-center">
                      {overdue ? (
                        <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-red-500/10 text-red-600 border border-red-500/30">Atrasado</div>
                      ) : dueSoon ? (
                        <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/30">Próxima</div>
                      ) : done ? (
                        <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">Concluída</div>
                      ) : (
                        <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200">Pendente</div>
                      )}
                    </div>

                    <div className="col-span-1 flex justify-end gap-2">
                      <Link href={linkFor(t)}>
                        <button className="w-9 h-9 rounded-xl bg-white/40 hover:bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all border border-white/50 shadow-sm">
                          <Eye className="h-5 w-5" />
                        </button>
                      </Link>
                      <button
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border shadow-sm ${done
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-200'
                          : 'bg-white/40 hover:bg-emerald-50 text-emerald-600 border-white/50'
                          }`}
                        onClick={() => toggleDone(t)}
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
