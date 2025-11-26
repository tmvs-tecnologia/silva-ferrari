"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar as CalendarIcon, Users, Clock, FileText, ChevronRight, Trash2 } from "lucide-react";

export default function PendenciasPage() {
  const [responsible, setResponsible] = useState("");
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);

  const fetchTasks = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (responsible) params.set("responsible", responsible);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    tasks.forEach((t) => {
      const key = t.responsibleName || "Sem responsável";
      map[key] = map[key] || [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

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
          <Button onClick={fetchTasks} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold shadow-lg">
            Atualizar
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-700 shadow-md">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Filtrar por responsável"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="pl-9 border-slate-300 dark:border-slate-600 focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={fetchTasks} className="bg-slate-900 hover:bg-slate-800 text-white">Buscar</Button>
              <Link href="/dashboard/calendario">
                <Button variant="outline" className="border-slate-300 dark:border-slate-700">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Ver Calendário
                </Button>
              </Link>
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
                      <div key={`${t.moduleType}-${t.recordId}-${t.stepIndex}-${t.id}`} className="flex items-center justify-between p-3 rounded-md border">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded">
                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{t.clientName || t.moduleType}</div>
                            <div className="text-xs text-slate-600">{getStepTitle(t)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50 dark:border-amber-400 dark:text-amber-300 dark:bg-amber-950">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDueDate(t.dueDate)}
                          </Badge>
                          <Link href={linkFor(t)}>
                            <Button variant="ghost" className="hover:bg-slate-100 dark:hover:bg-slate-800">
                              Ver
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </Link>
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
