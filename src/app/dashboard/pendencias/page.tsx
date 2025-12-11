"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar as CalendarIcon, Users, Clock, FileText, ChevronRight, Trash2, Filter, CheckCircle, Eye, AlertTriangle } from "lucide-react";
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

  useEffect(() => {
    fetchTasks();
  }, []);
  useEffect(() => {
    // Atualiza automaticamente quando o responsável muda
    fetchTasks();
  }, [responsible]);
  useEffect(() => {
    // Atualiza automaticamente quando o módulo muda
    fetchTasks();
  }, [moduleType]);

  const todayStart = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); }, []);
  const isOverdue = (due?: string) => {
    if (!due) return false;
    const t = new Date(due); t.setHours(0,0,0,0); return t.getTime() < todayStart;
  };
  const isDueSoon = (due?: string) => {
    if (!due) return false;
    const t = new Date(due); t.setHours(0,0,0,0);
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
    <div className="space-y-6 p-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl p-8 shadow-lg border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Visão Admin Tarefas Pendentes</h1>
                <p className="text-slate-300 mt-1">Painel administrativo para gerenciar tarefas jurídicas pendentes</p>
              </div>
            </div>
          </div>
          <Button onClick={() => fetchTasks()} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold shadow-lg">
            Atualizar
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2 items-stretch">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 h-full min-h-[140px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Tarefas Pendentes</p>
                <p className="text-3xl font-bold text-white mt-1">{totalPending}</p>
              </div>
              <div className="p-3 bg-slate-700 rounded-lg">
                <FileText className="h-6 w-6 text-slate-300" />
              </div>
            </div>
          </div>
          <div className="bg-red-900 rounded-lg p-4 border border-red-700 h-full min-h-[140px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm font-medium">Atrasadas</p>
                <p className="text-3xl font-bold text-red-400 mt-1">{overdueCount}</p>
              </div>
              <div className="p-3 bg-red-800 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </div>
          <div className="bg-amber-900 rounded-lg p-4 border border-amber-700 h-full min-h-[140px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-300 text-sm font-medium">Próximas</p>
                <p className="text-3xl font-bold text-amber-400 mt-1">{upcomingCount}</p>
              </div>
              <div className="p-3 bg-amber-800 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </div>
          <div className="bg-emerald-900 rounded-lg p-4 border border-emerald-700 h-full min-h-[140px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-300 text-sm font-medium">Concluídas</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1">{completedCount}</p>
              </div>
              <div className="p-3 bg-emerald-800 rounded-lg">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-700 shadow-md">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="grid gap-1 grid-cols-1 xl:grid-cols-4">
            <div>
              <label className="text-xs font-medium text-slate-600">Filtrar por Responsável</label>
              <Select value={responsible} onValueChange={(v) => setResponsible(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="__none__">Sem responsável</SelectItem>
                  {responsaveis.map((nome) => (
                    <SelectItem key={nome} value={nome === 'Sem responsável' ? '__none__' : nome}>{nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Filtrar por Módulo</label>
              <Select value={moduleType} onValueChange={(v) => setModuleType(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue placeholder="Módulo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {MODULE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Filtrar por Status</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Atrasado">Atrasado</SelectItem>
                  <SelectItem value="Próximo">Próximo</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Intervalo de Datas</label>
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm h-9 mt-1 bg-white shadow-xs cursor-pointer">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{dateRangeLabel || "Selecione"}</span>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[360px] p-3" align="start">
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
          
        </CardHeader>
        <CardContent className="pt-2 space-y-2">
          
          {loading ? (
            <div className="p-4 text-center text-slate-600">Carregando...</div>
          ) : displayTasks.length === 0 ? (
            <div className="p-8 text-center text-slate-600">Nenhuma pendência</div>
          ) : (
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-4/12 px-3">Descrição da Tarefa</TableHead>
                  <TableHead className="w-3/12 px-3">Advogado Responsável</TableHead>
                  <TableHead className="w-2/12 px-3">Prazo</TableHead>
                  <TableHead className="w-1/12 px-3">Status Atual</TableHead>
                  <TableHead className="w-2/12 px-3 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayTasks.map((t: any) => {
                  const overdue = !t.isDone && isOverdue(t.dueDate);
                  const dueSoon = !t.isDone && isDueSoon(t.dueDate) && !overdue;
                  return (
                    <TableRow key={`${t.moduleType}-${t.recordId}-${t.stepIndex}-${t.id}`}>
                      <TableCell className="w-4/12 px-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-600" />
                          <div className="truncate flex items-center gap-2">
                            <div className="text-sm font-medium truncate">{getStepTitle(t)}</div>
                            <Badge variant="outline" className="border-slate-300 text-slate-700 bg-slate-50">
                              {moduleLabel(t.moduleType)}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="w-3/12 px-3 truncate">{t.responsibleName || 'Sem responsável'}</TableCell>
                      <TableCell className="w-2/12 px-3">{formatDueDate(t.dueDate)}</TableCell>
                      <TableCell className="w-1/12 px-3">
                        {overdue ? (
                          <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">Atrasado</Badge>
                        ) : dueSoon ? (
                          <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">Próximo</Badge>
                        ) : t.isDone ? (
                          <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50">Concluída</Badge>
                        ) : (
                          <Badge variant="outline" className="border-slate-300 text-slate-700 bg-slate-50">Sem prazo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="w-2/12 px-3">
                        <div className="flex items-center gap-1 justify-end min-w-[110px]">
                          <Link href={linkFor(t)}>
                            <Button variant="outline" size="icon" aria-label="Ver" title="Ver" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant={t.isDone ? 'outline' : 'default'}
                            size="icon"
                            className={(t.isDone ? 'border-emerald-500 text-emerald-700 bg-emerald-50 ' : 'bg-emerald-600 hover:bg-emerald-700 text-white ') + 'h-8 w-8 p-0'}
                            aria-label={t.isDone ? 'Concluída' : 'Concluir'}
                            title={t.isDone ? 'Concluída' : 'Concluir'}
                            onClick={() => toggleDone(t)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-red-600 border-red-300 hover:bg-red-50 h-8 w-8 p-0"
                            aria-label="Excluir"
                            title="Excluir"
                            onClick={async () => {
                              const ok = typeof window !== 'undefined' ? window.confirm('Excluir esta pendência?') : true;
                              if (ok) await handleDelete(t);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
