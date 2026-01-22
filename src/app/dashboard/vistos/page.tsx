"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Globe, Eye, Plane, Briefcase, Building2, Clock, CheckCircle2, AlertCircle, FileText, CreditCard, User, Calendar, Trash2, Circle, ChevronRight, Folder, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingState } from "@/components/loading-state";
import { useDataCache } from "@/hooks/useDataCache";
import { usePrefetch } from "@/hooks/usePrefetch";
import { OptimizedLink } from "@/components/optimized-link";
import { prefetchVistoById } from "@/utils/prefetch-functions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as DateRangeCalendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Visto {
  id: string;
  clientName: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  cpf?: string;
  rnm?: string;
  passaporte?: string;
  statusFinal?: string;
  statusFinalOutro?: string;
  currentStep?: number;
  country?: string;
  travelStartDate?: string;
  travelEndDate?: string;
  stepData?: Record<string, any>;
}

export default function VistosPage() {
  const normalizeStatus = (status: string) => (status || "").toLowerCase();
  const { data: vistosData, isLoading, error, refetch } = useDataCache(
    "vistos",
    async () => {
      const response = await fetch("/api/vistos?limit=100");
      return response.json();
    }
  );
  const vistos = Array.isArray(vistosData) ? vistosData : [];
  const vistosIdsKey = useMemo(() => {
    try {
      const ids = Array.isArray(vistos) ? vistos.map((v: any) => String(v.id)) : [];
      return [...new Set(ids)].sort().join(",");
    } catch {
      return "";
    }
  }, [vistos]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [datePopoverFor, setDatePopoverFor] = useState<string | null>(null);
  const [dateRangeEdit, setDateRangeEdit] = useState<{ from?: Date; to?: Date }>({});
  const [viewMode, setViewMode] = useState<'cards' | 'folders'>('cards');
  const [dateEditField, setDateEditField] = useState<'from' | 'to'>('from');
  const formatISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const saveTravelDates = async (id: string, from?: Date, to?: Date) => {
    const payload: any = {};
    if (from) payload.travelStartDate = formatISO(from);
    if (to) payload.travelEndDate = formatISO(to);
    try {
      const res = await fetch(`/api/vistos?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await refetch();
        setDatePopoverFor(null);
        setDateRangeEdit({});
      }
    } catch {}
  };
  useEffect(() => {
    // Prefetch disponível para navegação futura
  }, []);

  const filteredVistos = vistos.filter((v) => {
    const s = (search || "").toLowerCase();
    const fields = [
      v.clientName,
      v.type,
      v.country,
      v.cpf,
      v.rnm,
      v.passaporte,
    ];
    const matchesSearch = !s || fields.some((f) => String(f || "").toLowerCase().includes(s));
    const matchesType = typeFilter === "all" || v.type === typeFilter;
    const matchesStatus = statusFilter === "all" || normalizeStatus(v.status) === statusFilter.toLowerCase();
    return matchesSearch && matchesType && matchesStatus;
  });

  const { data: foldersData } = useDataCache(
    "folders_vistos",
    async () => {
      const res = await fetch("/api/folders?moduleType=vistos");
      return res.json();
    }
  );
  const folders = Array.isArray(foldersData) ? foldersData : [] as Array<{ id: number; name: string }>;
  const matchingFolders = folders.filter((f: any) => String(f?.name || "").toLowerCase().includes((search || "").toLowerCase()));

  const stats = {
    total: vistos.length,
    emAndamento: vistos.filter(v => normalizeStatus(v.status) === "em andamento").length,
    finalizado: vistos.filter(v => normalizeStatus(v.status) === "finalizado").length,
  };

  const [vistosAssignments, setVistosAssignments] = useState<Record<string, { responsibleName?: string; dueDate?: string; currentIndex?: number }>>({});

  useEffect(() => {
    if (!vistosIdsKey) { setVistosAssignments({}); return; }
    const loadAssignments = async () => {
      const entries = await Promise.all(
        vistos.map(async (v: any) => {
          const id = String(v.id);
          try {
            const res = await fetch(`/api/step-assignments?moduleType=vistos&recordId=${id}`);
            if (!res.ok) return [id, null] as const;
            const data = await res.json();
            const arr = Array.isArray(data) ? data : [data];
            let currentIdx = 0;
            if (arr.length) {
              const pending = arr.filter((a: any) => !a.isDone);
              if (pending.length) {
                currentIdx = Math.min(...pending.map((a: any) => (a.stepIndex ?? 0)));
              } else {
                currentIdx = Math.max(...arr.map((a: any) => (a.stepIndex ?? 0)));
              }
            }
            // Buscar currentStep real do registro para sincronizar com o fluxo
            try {
              const caseRes = await fetch(`/api/vistos?id=${id}`);
              if (caseRes.ok) {
                const caseJson = await caseRes.json();
                const serverCurrent = Number(caseJson.currentStep ?? caseJson.current_step ?? currentIdx ?? 0);
                if (!Number.isNaN(serverCurrent)) currentIdx = serverCurrent;
              }
            } catch {}
            const currentAssignment = arr.find((a: any) => a.stepIndex === currentIdx) || null;
            return [id, { responsibleName: currentAssignment?.responsibleName, dueDate: currentAssignment?.dueDate, currentIndex: currentIdx }] as const;
          } catch {
            return [id, null] as const;
          }
        })
      );
      const map: Record<string, { responsibleName?: string; dueDate?: string; currentIndex?: number }> = {};
      for (const [id, value] of entries) {
        if (value) map[id] = value;
      }
      setVistosAssignments((prev) => {
        const prevKeys = Object.keys(prev).sort().join(",");
        const nextKeys = Object.keys(map).sort().join(",");
        if (prevKeys === nextKeys) {
          let changed = false;
          for (const k of Object.keys(map)) {
            const a = prev[k];
            const b = map[k];
            if (!a || !b || a.responsibleName !== b.responsibleName || a.dueDate !== b.dueDate || a.currentIndex !== b.currentIndex) {
              changed = true; break;
            }
          }
          if (!changed) return prev;
        }
        return map;
      });
    };
    loadAssignments();
  }, [vistosIdsKey]);

  const getStatusColor = (status: string) => {
    switch (normalizeStatus(status)) {
      case "em andamento":
        return "bg-blue-500 text-white hover:bg-blue-600";
      case "finalizado":
        return "bg-emerald-500 text-white hover:bg-emerald-600";
      default:
        return "bg-slate-500 text-white hover:bg-slate-600";
    }
  };

  const getTypeIcon = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("turismo")) return <Plane className="h-6 w-6 text-white" />;
    if (t.includes("trabalho")) return <Briefcase className="h-6 w-6 text-white" />;
    if (t.includes("investidor")) return <Building2 className="h-6 w-6 text-white" />;
    return <Globe className="h-6 w-6 text-white" />;
  };

  const getStatusIcon = (status: string) => {
    switch (normalizeStatus(status)) {
      case "em andamento":
        return <Clock className="h-4 w-4" />;
      case "finalizado":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getVistoSteps = (type: string) => {
    const t = (type || "").toLowerCase();
    const WORKFLOWS_LIST = {
      "Visto de Trabalho": [
        "Cadastro de Documentos",
        "Agendar no Consulado",
        "Preencher Formulário",
        "Preparar Documentação",
        "Aguardar Aprovação",
        "Processo Finalizado",
      ],
      "Visto de Turismo": [
        "Cadastro de Documentos",
        "Agendar no Consulado",
        "Preencher Formulário",
        "Preparar Documentação",
        "Aguardar Aprovação",
        "Processo Finalizado",
      ],
      "Visto de Estudante": [
        "Cadastro de Documentos",
        "Agendar no Consulado",
        "Preencher Formulário",
        "Preparar Documentação",
        "Aguardar Aprovação",
        "Processo Finalizado",
      ],
      "Visto de Reunião Familiar": [
        "Cadastro de Documentos",
        "Agendar no Consulado",
        "Preencher Formulário",
        "Preparar Documentação",
        "Aguardar Aprovação",
        "Processo Finalizado",
      ],
    } as const;

    if (t.includes("turismo")) return WORKFLOWS_LIST["Visto de Turismo"];
    if (t.includes("estudante")) return WORKFLOWS_LIST["Visto de Estudante"];
    if (t.includes("reunião") || t.includes("reuniao")) return WORKFLOWS_LIST["Visto de Reunião Familiar"];
    if (t.includes("trabalho") && t.includes("brasil")) return [
        "Cadastro de Documentos",
        "Documentos para Protocolo",
        "Protocolo",
        "Exigências",
        "Processo Finalizado"
    ];
    return WORKFLOWS_LIST["Visto de Trabalho"];
  };

  const getVistoStepTitle = (type: string, index: number, country?: string) => {
    const steps = getVistoSteps((type || "") + (country ? ` - ${country}` : ""));
    const clampedIndex = Math.min(Math.max(index || 0, 0), steps.length - 1);
    return steps[clampedIndex];
  };

  const getStatusFinalClass = (s: string) => {
    const v = (s || "").toLowerCase();
    if (v === "deferido" || v === "aprovado") return "text-emerald-600 font-semibold";
    if (v === "indeferido" || v === "negado") return "text-red-600 font-semibold";
    if (v === "aguardando") return "text-amber-600 font-semibold";
    return "text-slate-700 dark:text-slate-300";
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/vistos?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        refetch();
      } else {
        console.error('Failed to delete visto');
      }
    } catch (error) {
      console.error('Error deleting visto:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl p-8 shadow-lg border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg flex items-center justify-center overflow-hidden">
                <img src="https://cdn-icons-png.flaticon.com/512/7082/7082001.png" alt="Vistos" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Vistos</h1>
                <p className="text-slate-300 mt-1">
                  Gerencie processos de vistos internacionais
                </p>
              </div>
            </div>
          </div>
          <Link href="/dashboard/vistos/novo" className="w-full md:w-auto">
            <Button size="lg" className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold shadow-lg">
              <Plus className="h-5 w-5 mr-2" />
              Nova Ação
            </Button>
          </Link>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 items-stretch">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 h-full min-h-[140px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total de Processos</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-slate-700 rounded-lg">
                <CreditCard className="h-6 w-6 text-slate-300" />
              </div>
            </div>
          </div>

          <div className="bg-blue-900 rounded-lg p-4 border border-blue-700 h-full min-h-[140px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Em andamento</p>
                <p className="text-3xl font-bold text-blue-400 mt-1">{stats.emAndamento}</p>
              </div>
              <div className="p-3 bg-blue-800 rounded-lg">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>

          

          <div className="bg-emerald-900 rounded-lg p-4 border border-emerald-700 h-full min-h-[140px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-300 text-sm font-medium">Finalizados</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1">{stats.finalizado}</p>
              </div>
              <div className="p-3 bg-emerald-800 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-md">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Search className="h-5 w-5 text-amber-500" />
            Filtros de Busca
          </h2>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-slate-300 dark:border-slate-600 focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="border-slate-300 dark:border-slate-600 focus:border-amber-500 focus:ring-amber-500">
                <SelectValue placeholder="Tipo de visto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="Trabalho:Brasil">Trabalho - Brasil</SelectItem>
                <SelectItem value="Trabalho:Residência Prévia">Trabalho - Residência Prévia</SelectItem>
                <SelectItem value="Trabalho:Renovação 1 ano">Trabalho - Renovação 1 ano</SelectItem>
                <SelectItem value="Trabalho:Indeterminado">Trabalho - Indeterminado</SelectItem>
                <SelectItem value="Trabalho:Mudança de Empregador">Trabalho - Mudança de Empregador</SelectItem>
                <SelectItem value="Investidor">Investidor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-slate-300 dark:border-slate-600 focus:border-amber-500 focus:ring-amber-500">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Em andamento">Em andamento</SelectItem>
                <SelectItem value="Finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/vistos/pastas" className="w-fit">
                <Button variant="outline" className="border-slate-300 dark:border-slate-600 w-fit px-3 focus:border-amber-500 focus:ring-amber-500">
                  Pastas
                </Button>
              </Link>
              <Button
                variant="outline"
                size="icon"
                aria-label="Alternar modo de visualização"
                className="border-slate-300 dark:border-slate-600 focus:border-amber-500 focus:ring-amber-500"
                onClick={() => setViewMode((m) => (m === 'cards' ? 'folders' : 'cards'))}
              >
                {viewMode === 'cards' ? (
                  <LayoutGrid className="h-4 w-4" />
                ) : (
                  <Folder className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista / Pastas */}
      <div className="grid gap-4">
        {viewMode === 'folders' ? (
          <Card className="border-slate-200 dark:border-slate-700 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Folder className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-semibold">Pastas</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(() => {
                  const list = (search ? matchingFolders : folders) as any[];
                  if (!list || list.length === 0) {
                    return (
                      <div className="text-sm text-slate-500 dark:text-slate-400">Nenhuma pasta encontrada</div>
                    );
                  }
                  return list.map((f: any) => (
                    <Link key={f.id} href={`/dashboard/vistos/pastas/${f.id}`}>
                      <Card className="hover:shadow-md transition-all cursor-pointer">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-amber-500 rounded-md"><Folder className="h-5 w-5 text-white" /></div>
                            <div className="text-sm font-semibold truncate">{f.name}</div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <LoadingState count={3} type="card" />
        ) : filteredVistos.length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-700 shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                <Globe className="h-12 w-12 text-slate-400" />
              </div>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Nenhum visto encontrado
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 mt-2">
                {search || typeFilter !== "all" || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Comece criando um novo processo de visto"}
              </p>
              <Link href="/dashboard/vistos/novo">
                <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Visto
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          filteredVistos.map((visto) => (
            <Card 
              key={visto.id} 
              className="border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-amber-500/50 transition-all duration-200 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 relative"
            >
              <CardContent className="pt-6">
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  <OptimizedLink 
                    href={`/dashboard/vistos/${visto.id}`}
                    prefetchData={() => prefetchVistoById(visto.id)}
                  >
                    <Button 
                      size="sm"
                      className="h-8 w-8 p-0 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-900 text-white font-semibold shadow-md"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </OptimizedLink>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-white hover:bg-red-500 dark:text-red-400 dark:hover:text-white dark:hover:bg-red-600 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o visto de {visto.clientName}? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(visto.id)}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Ícone do processo */}
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-md flex-shrink-0">
                      {getTypeIcon(visto.type)}
                    </div>

                    {/* Informações do processo */}
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          {visto.clientName}
                        </h3>
                          <Badge className={`${getStatusColor(visto.status)} flex items-center gap-1.5 px-3 py-1 shadow-md`}>
                          {getStatusIcon(visto.status)}
                          {normalizeStatus(visto.status) === "em andamento" ? "Em andamento" : "Finalizado"}
                          </Badge>
                      </div>

                      <div className="grid gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium">Tipo de Visto:</span>
                          <span>{(visto.type || "").replace(/:/g, " - ")}</span>
                        </div>
                        {String(visto.type || "").toLowerCase().includes("turismo") && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            <span className="font-medium">Destino:</span>
                            <span>{String(visto.country || "—")}</span>
                            {(() => {
                              const fmt = (s?: string) => {
                                if (!s) return "";
                                const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/);
                                if (m) return `${m[3]}/${m[2]}/${m[1]}`;
                                try { const d = new Date(s); return isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR"); } catch { return ""; }
                              };
                              const start = fmt(visto.travelStartDate);
                              const end = fmt(visto.travelEndDate);
                              const text = [start, end].filter(Boolean).join(" — ");
                              return (
                                <Popover
                                  open={datePopoverFor === String(visto.id)}
                                  onOpenChange={(o) => {
                                    setDatePopoverFor(o ? String(visto.id) : null);
                                    if (o) {
                                      const parseIso = (val?: string) => {
                                        if (!val) return undefined;
                                        const m = String(val).match(/^(\d{4})-(\d{2})-(\d{2})$/);
                                        return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(val);
                                      };
                                      setDateRangeEdit({ from: parseIso(visto.travelStartDate), to: parseIso(visto.travelEndDate) });
                                      setDateEditField('from');
                                    } else {
                                      setDateRangeEdit({});
                                    }
                                  }}
                                >
                                  <PopoverTrigger asChild>
                                    <button
                                      className="text-slate-500 hover:underline decoration-dotted"
                                      onClick={() => setDatePopoverFor(String(visto.id))}
                                    >
                                      • {text || "Definir datas"}
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[360px] p-3" align="start">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Button
                                        variant={dateEditField === 'from' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setDateEditField('from')}
                                      >
                                        Ida
                                      </Button>
                                      <Button
                                        variant={dateEditField === 'to' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setDateEditField('to')}
                                      >
                                        Volta
                                      </Button>
                                    </div>
                                    <DateRangeCalendar
                                      mode="single"
                                      selected={dateRangeEdit?.[dateEditField] as any}
                                      onSelect={(d: Date | undefined) => {
                                        const next = { ...dateRangeEdit, [dateEditField]: d };
                                        setDateRangeEdit(next);
                                        const f = next.from;
                                        const t = next.to;
                                        if (dateEditField === 'from' && d) setDateEditField('to');
                                        if (f && t) {
                                          saveTravelDates(String(visto.id), f, t);
                                        }
                                      }}
                                      weekStartsOn={1}
                                      captionLayout="dropdown"
                                      locale={ptBR}
                                      fromMonth={new Date(2000, 0, 1)}
                                      toMonth={new Date(2100, 11, 31)}
                                      numberOfMonths={1}
                                      style={{ "--cell-size": "2.5rem" } as React.CSSProperties}
                                    />
                                  </PopoverContent>
                                </Popover>
                              );
                            })()}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium">Data de criação:</span>
                          <span>{new Date(visto.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
                        </div>
                        <div className="flex items-center gap-2 w-full">
                          <Circle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium">Status Processo:</span>
                          <span className={getStatusFinalClass(String(visto.statusFinal || ""))}>{(() => {
                            const s = String(visto.statusFinal || "");
                            if (!s) return "-";
                            if (s === "Outro") return String(visto.statusFinalOutro || "Outro");
                            return s;
                          })()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium">Fluxo atual:</span>
                          <span>{getVistoStepTitle(
                            visto.type,
                            (visto.currentStep ?? vistosAssignments[String(visto.id)]?.currentIndex ?? 0),
                            visto.country
                          )}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium">Responsável:</span>
                          <span>{vistosAssignments[String(visto.id)]?.responsibleName || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium">Prazo:</span>
                          <span>{(() => {
                            // Check for Prazo de Cumprimento in stepData
                            if (visto.stepData) {
                                for (const key in visto.stepData) {
                                    if (visto.stepData[key]?.prazoCumprimento) {
                                        const p = visto.stepData[key].prazoCumprimento;
                                        const m = String(p).match(/^(\d{4})-(\d{2})-(\d{2})$/);
                                        if (m) return `${m[3]}/${m[2]}/${m[1]}`;
                                        try { const d = new Date(p); return isNaN(d.getTime()) ? p : d.toLocaleDateString("pt-BR"); } catch { return p; }
                                    }
                                }
                            }

                            const iso = vistosAssignments[String(visto.id)]?.dueDate;
                            if (!iso) return "—";
                            const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
                            if (m) return `${m[3]}/${m[2]}/${m[1]}`;
                            try { const d = new Date(iso); return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR"); } catch { return "—"; }
                          })()}</span>
                        </div>
                      </div>

                      

                      
                    </div>
                  </div>

                  
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
