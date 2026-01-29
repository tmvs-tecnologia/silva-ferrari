"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { CardListItem } from "@/components/ui/card-list-item";
import { Input } from "@/components/ui/input";
import { Plus, Search, Globe, Eye, FileText, Clock, CheckCircle2, AlertCircle, Trash2, User, Calendar } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingState } from "@/components/loading-state";
import { useDataCache } from "@/hooks/useDataCache";
import { usePrefetch } from "@/hooks/usePrefetch";
import { OptimizedLink } from "@/components/optimized-link";
import { prefetchPerdaNacionalidadeById } from "@/utils/prefetch-functions";
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

interface PerdaNacionalidadeCase {
  id: string;
  clientName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  currentStep: number;
}

export default function PerdaNacionalidadePage() {
  const { data: casesData, isLoading, error, refetch } = useDataCache(
    "perda-nacionalidade",
    async () => {
      const response = await fetch("/api/perda-nacionalidade?limit=100&select=id,client_name,status,current_step,notes,created_at");
      return response.json();
    }
  );
  const cases = Array.isArray(casesData) ? casesData : [];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Em andamento");
  const [caseAssignments, setCaseAssignments] = useState<Record<number, { responsibleName?: string; dueDate?: string }>>({});
  const lastAssignmentIdsRef = useRef<string>("");
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'perda-nacionalidade-status-update') {
        refetch();
      }
    };
    const onCustom = () => refetch();
    window.addEventListener('storage', onStorage);
    window.addEventListener('perda-nacionalidade-status-updated', onCustom as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('perda-nacionalidade-status-updated', onCustom as EventListener);
    };
  }, [refetch]);

  const filteredCases = cases.filter((c) => {
    const matchesSearch = c.clientName.toLowerCase().includes(search.toLowerCase());
    const statusVal = (c.status || "").toLowerCase();
    const filterVal = statusFilter.toLowerCase();
    const matchesStatus =
      filterVal === "finalizado"
        ? ["finalizado", "ratificado"].includes(statusVal)
        : statusVal === filterVal;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "em andamento":
        return "bg-blue-500 text-white hover:bg-blue-600";
      case "deferido":
        return "bg-amber-500 text-white hover:bg-amber-600";
      case "ratificado":
        return "bg-emerald-500 text-white hover:bg-emerald-600";
      case "finalizado":
        return "bg-emerald-500 text-white hover:bg-emerald-600";
      default:
        return "bg-slate-500 text-white hover:bg-slate-600";
    }
  };

  const getStatusIcon = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "em andamento":
        return <Clock className="h-4 w-4" />;
      case "deferido":
        return <AlertCircle className="h-4 w-4" />;
      case "ratificado":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const normalizeStatusLabel = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "em andamento") return "Em andamento";
    if (s === "deferido") return "Deferido";
    if (s === "ratificado") return "Ratificado";
    if (s === "finalizado") return "Finalizado";
    return status;
  };

  const stats = {
    total: cases.length,
    emAndamento: cases.filter(c => (c.status || "").toLowerCase() === "em andamento").length,
    deferido: cases.filter(c => (c.status || "").toLowerCase() === "deferido").length,
    ratificado: cases.filter(c => (c.status || "").toLowerCase() === "ratificado").length,
    finalizado: cases.filter(c => ["finalizado", "ratificado"].includes((c.status || "").toLowerCase())).length,
  };

  const WORKFLOW_STEP_TITLES = [
    "Cadastro de Documento",
    "Fazer a Procuração e o Pedido de Perda",
    "Colher assinaturas nas Procurações e Pedidos",
    "Protocolar no SEI",
    "Processo Protocolado",
    "Processo Deferido",
    "Passaporte Chinês",
    "Manifesto",
    "Protocolar no SEI",
  ];

  const getStepTitle = (index: number) => WORKFLOW_STEP_TITLES[(index || 0)] || `Etapa ${index + 1}`;

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/perda-nacionalidade?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        // Atualiza via refetch
        // @ts-ignore
        (typeof refetch === 'function') && refetch();
      }
    } catch { }
  };

  useEffect(() => {
    const ids = cases.map((c: any) => c.id).join(",");
    if (ids === lastAssignmentIdsRef.current) return;
    lastAssignmentIdsRef.current = ids;

    const loadAssignments = async () => {
      try {
        const recordIds = cases.map((c: any) => c.id).join(',');
        const res = await fetch(`/api/step-assignments?moduleType=perda_nacionalidade&recordIds=${recordIds}`);
        if (!res.ok) return;
        const data = await res.json();

        const map: Record<number, { responsibleName?: string; dueDate?: string }> = {};
        cases.forEach((c: any) => {
          const assignment = data.find((a: any) => a.recordId === Number(c.id) && a.stepIndex === Number(c.currentStep));
          if (assignment) {
            map[Number(c.id)] = { responsibleName: assignment.responsibleName, dueDate: assignment.dueDate };
          }
        });

        const nextStr = JSON.stringify(map);
        const prevStr = JSON.stringify(caseAssignments);
        if (nextStr !== prevStr) {
          setCaseAssignments(map);
        }
      } catch (error) {
        console.error("Error loading assignments:", error);
      }
    };

    if (cases.length > 0) {
      loadAssignments();
    } else {
      setCaseAssignments({});
    }
  }, [cases]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Perda de Nacionalidade"
        description="Gerencie processos de perda de nacionalidade brasileira"
        icon={<img src="https://cdn-icons-png.flaticon.com/512/4284/4284504.png" alt="Perda de Nacionalidade" className="h-full w-full object-contain" />}
        action={
          <Link href="/dashboard/perda-nacionalidade/novo">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold shadow-lg">
              <Plus className="h-5 w-5 mr-2" />
              Nova Ação
            </Button>
          </Link>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 h-full min-h-[140px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total de Processos</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-slate-700 rounded-lg">
                <FileText className="h-6 w-6 text-slate-300" />
              </div>
            </div>
          </div>
          <div className="bg-blue-900 rounded-lg p-4 border border-blue-700 h-full min-h-[140px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Em Andamento</p>
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
      </PageHeader>

      {/* Filtros */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-md">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Search className="h-5 w-5 text-amber-500" />
            Filtros de Busca
          </h2>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome do cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-slate-300 dark:border-slate-600 focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-slate-300 dark:border-slate-600 focus:border-amber-500 focus:ring-amber-500">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Em andamento">Em andamento</SelectItem>
                <SelectItem value="Finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de processos */}
      <div className="grid gap-4">
        {isLoading ? (
          <LoadingState count={3} type="card" />
        ) : filteredCases.length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-700 shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                <Globe className="h-12 w-12 text-slate-400" />
              </div>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Nenhum processo encontrado
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 mt-2">
                {search || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Comece criando um novo processo de perda de nacionalidade"}
              </p>
              <Link href="/dashboard/perda-nacionalidade/novo">
                <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Processo
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          filteredCases.map((caseItem) => (
            <CardListItem
              key={caseItem.id}
              icon={<Globe className="h-6 w-6 text-white" />}
              title={caseItem.clientName}
              status={caseItem.status}
              rightActions={
                <>
                  <OptimizedLink
                    href={`/dashboard/perda-nacionalidade/${caseItem.id}`}
                    prefetchData={() => prefetchPerdaNacionalidadeById(caseItem.id)}
                  >
                    <Button
                      size="sm"
                      className="bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-900 text-white font-semibold shadow-md h-8 px-3"
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
                          Tem certeza que deseja excluir o processo de {caseItem.clientName}? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(Number(caseItem.id))}
                          className="bg-white text-red-600 border border-red-500 hover:bg-red-50 hover:text-red-700"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              }
            >
              <div className="grid gap-2 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span className="font-medium">Tipo de ação:</span>
                  <span>Perda de Nacionalidade</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span className="font-medium">Fluxo atual:</span>
                  <span>{getStepTitle(caseItem.currentStep || 0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span className="font-medium">Observações:</span>
                  <span className="truncate max-w-[45ch]">
                    {String(caseItem.notes || "—").slice(0, 90)}{caseItem.notes && caseItem.notes.length > 90 ? "…" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span className="font-medium">Criado em:</span>
                  <span>
                    {new Date(caseItem.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span className="font-medium">Responsável:</span>
                  <span>{caseAssignments[caseItem.id]?.responsibleName || "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span className="font-medium">Prazo:</span>
                  <span>{caseAssignments[caseItem.id]?.dueDate ? new Date(caseAssignments[caseItem.id]!.dueDate!).toLocaleDateString("pt-BR") : "—"}</span>
                </div>
              </div>
            </CardListItem>
          ))
        )}
      </div>
    </div>
  );
}
