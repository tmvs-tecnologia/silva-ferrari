"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar as CalendarIcon, Users, Clock, FileText, ChevronRight, Trash2, Filter, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export default function PendenciasPage() {
  const [responsible, setResponsible] = useState("");
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [moduleType, setModuleType] = useState<string>("");
  const [moduleFilterOpen, setModuleFilterOpen] = useState(false);

  const fetchTasks = async (respOverride?: string, moduleOverride?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    const r = typeof respOverride === 'string' ? respOverride : responsible;
    if (r) params.set("responsible", r);
    const m = typeof moduleOverride === 'string' ? moduleOverride : moduleType;
    if (m) params.set("moduleType", m);
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

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    const dataset = responsible ? tasks.filter((t) => !t.isDone) : tasks;
    dataset.forEach((t) => {
      const key = t.responsibleName || "Sem responsável";
      map[key] = map[key] || [];
      map[key].push(t);
    });
    return map;
  }, [tasks, responsible]);

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
  ];

  const linkFor = (t: any) => {
    if (t.moduleType === "acoes_civeis") return `/dashboard/acoes-civeis/${t.recordId}`;
    if (t.moduleType === "acoes_trabalhistas") return `/dashboard/acoes-trabalhistas/${t.recordId}`;
    if (t.moduleType === "acoes_criminais") return `/dashboard/acoes-criminais/${t.recordId}`;
    if (t.moduleType === "compra_venda_imoveis" || t.moduleType === "compra-venda") return `/dashboard/compra-venda/${t.recordId}`;
    return "#";
  };

  const formatDueDate = (s?: string) => {
    if (!s) return "Sem prazo";
    const p = s.split("-").map((v) => parseInt(v, 10));
    const d = new Date(p[0], (p[1] || 1) - 1, p[2] || 1);
    return d.toLocaleDateString("pt-BR");
  };

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
    return `Passo ${t.stepIndex}`;
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
                <h1 className="text-3xl font-bold text-white">Calendário de Pendências</h1>
                <p className="text-slate-300 mt-1">Acompanhe tarefas pendentes por responsável</p>
              </div>
            </div>
          </div>
          <Button onClick={() => fetchTasks()} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold shadow-lg">
            Atualizar
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-700 shadow-md">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="flex flex-wrap items-center gap-3">
              <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-slate-300 dark:border-slate-700">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrar por responsável
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Filtrar por responsável</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Selecionado:</span>
                      <Badge variant="outline" className="border-slate-300 dark:border-slate-700">
                        {responsible ? responsible : "Todos"}
                      </Badge>
                    </div>
                    <div className="grid gap-2">
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={async () => {
                          setResponsible("");
                          setFilterOpen(false);
                          await fetchTasks("", moduleType);
                        }}
                      >
                        Todos
                      </Button>
                      {responsaveis.map((nome) => (
                        <Button
                          key={nome}
                          variant="ghost"
                          className="justify-start"
                          onClick={async () => {
                            const valor = nome === "Sem responsável" ? "__none__" : nome;
                            setResponsible(valor);
                            setFilterOpen(false);
                            await fetchTasks(valor, moduleType);
                          }}
                        >
                          <Users className="h-4 w-4 mr-2 text-slate-500" />
                          {nome}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setFilterOpen(false)}>Fechar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={moduleFilterOpen} onOpenChange={setModuleFilterOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-slate-300 dark:border-slate-700">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrar por módulo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Filtrar por módulo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Selecionado:</span>
                      <Badge variant="outline" className="border-slate-300 dark:border-slate-700">
                        {moduleType ? MODULE_OPTIONS.find(o => o.key === moduleType)?.label || moduleType : "Todos"}
                      </Badge>
                    </div>
                    <div className="grid gap-2">
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={async () => {
                          setModuleType("");
                          setModuleFilterOpen(false);
                          await fetchTasks(responsible, "");
                        }}
                      >
                        Todos os módulos
                      </Button>
                      {MODULE_OPTIONS.map((opt) => (
                        <Button
                          key={opt.key}
                          variant="ghost"
                          className="justify-start"
                          onClick={async () => {
                            setModuleType(opt.key);
                            setModuleFilterOpen(false);
                            await fetchTasks(responsible, opt.key);
                          }}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setModuleFilterOpen(false)}>Fechar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {responsible ? (
                <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50 dark:border-amber-400 dark:text-amber-300 dark:bg-amber-950">
                  <Users className="h-3 w-3 mr-1" />
                  {responsible}
                </Badge>
              ) : null}
              {moduleType ? (
                <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50 dark:border-blue-400 dark:text-blue-300 dark:bg-blue-950">
                  {MODULE_OPTIONS.find(o => o.key === moduleType)?.label || moduleType}
                </Badge>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <Button onClick={() => fetchTasks()} className="bg-slate-900 hover:bg-slate-800 text-white">Buscar</Button>
              <Button asChild variant="outline" className="border-slate-300 dark:border-slate-700">
                <Link href="/dashboard/calendario">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Ver Calendário
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-slate-300 dark:border-slate-700"
                onClick={async () => {
                  setResponsible("");
                  setModuleType("");
                  await fetchTasks("", "");
                }}
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="p-4 text-center text-slate-600">Carregando...</div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="p-8 text-center text-slate-600">Nenhuma pendência</div>
          ) : (
            <div className="grid gap-4">
              {Object.entries(grouped).map(([resp, items]) => (
                <Card key={resp} className="border">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-slate-700" />
                      <div>
                        <div className="text-sm text-slate-600">Responsável</div>
                        <div className="text-xl font-bold text-slate-900 dark:text-white">{resp}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {items.map((t: any) => (
                      <div key={`${t.moduleType}-${t.recordId}-${t.stepIndex}-${t.id}`} className={`flex items-center justify-between p-3 rounded-md border ${t.isDone ? 'bg-emerald-50 border-emerald-400 dark:bg-emerald-950' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded">
                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{t.clientName || t.moduleType}</div>
                            <div className="text-xs text-slate-600">{getStepTitle(t)}</div>
                            {t.moduleType === "acoes_civeis" && t.caseType ? (
                              <Badge
                                variant="outline"
                                className="mt-1 border-blue-500 text-blue-700 bg-blue-50 dark:border-blue-400 dark:text-blue-300 dark:bg-blue-950 w-fit"
                              >
                                {t.caseType}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50 dark:border-amber-400 dark:text-amber-300 dark:bg-amber-950">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDueDate(t.dueDate)}
                          </Badge>
                          {t.isDone ? (
                            <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50 dark:border-emerald-400 dark:text-emerald-300 dark:bg-emerald-950">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Concluída
                            </Badge>
                          ) : null}
                          <Link href={linkFor(t)}>
                            <Button variant="ghost" className="hover:bg-slate-100 dark:hover:bg-slate-800">
                              Ver
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </Link>
                          <Button
                            variant={t.isDone ? 'outline' : 'default'}
                            className={t.isDone ? 'border-emerald-500 text-emerald-700 bg-emerald-50 dark:border-emerald-400 dark:text-emerald-300 dark:bg-emerald-950' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
                            onClick={() => toggleDone(t)}
                            aria-label={t.isDone ? 'Desmarcar como concluída' : 'Marcar como concluída'}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t.isDone ? 'Concluída' : 'Concluir'}
                          </Button>
                          <Button
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                            onClick={async () => {
                              const ok = typeof window !== 'undefined' ? window.confirm('Excluir esta pendência?') : true;
                              if (ok) await handleDelete(t);
                            }}
                            aria-label="Excluir pendência"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
