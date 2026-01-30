"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  Search,
  Plus,
  FileText,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Trash2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingState } from "@/components/loading-state";
import { OptimizedLink } from "@/components/optimized-link";
import { prefetchAcaoTrabalhistaById } from "@/utils/prefetch-functions";
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
import { useDataCache } from "@/hooks/useDataCache";
import { usePrefetch } from "@/hooks/usePrefetch";

const CASE_TYPES = [
  "Rescisão Indireta",
  "Horas Extras",
  "Adicional Noturno",
  "Insalubridade",
  "Periculosidade",
  "FGTS",
  "Seguro Desemprego",
  "Acidente de Trabalho",
  "Assédio Moral",
  "Discriminação",
  "Outros"
];

export default function AcoesTrabalhistasPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Usar cache para dados
  const { data: cases, isLoading, error, refetch } = useDataCache(
    'acoes-trabalhistas',
    async () => {
      const response = await fetch("/api/acoes-trabalhistas?limit=100&select=id,client_name,current_step,status,notes,responsavel_name,responsavel_date,numero_processo,reu_name");
      return response.json();
    }
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'acoes-trabalhistas-status-update') {
          const updateData = JSON.parse(e.newValue || '{}');
          if (updateData.id && updateData.status) {
            refetch();
            localStorage.removeItem('acoes-trabalhistas-status-update');
          }
        }
      };

      const handleCustomEvent = (e: CustomEvent) => {
        const updateData = e.detail;
        if (updateData.id && updateData.status) {
          refetch();
        }
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('acoes-trabalhistas-status-updated', handleCustomEvent as EventListener);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('acoes-trabalhistas-status-updated', handleCustomEvent as EventListener);
      };
    }
  }, [refetch]);

  // Prefetch de dados quando usuário interage com navegação
  const { prefetchData } = usePrefetch();

  const casesList = Array.isArray(cases) ? cases : [];
  const filteredCases = casesList.filter((c) => {
    const matchesSearch = c.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || (c.status || "").toLowerCase() === statusFilter.toLowerCase();
    const matchesType = typeFilter === "all" || c.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: casesList.length,
    emAndamento: casesList.filter(c => (c.status || "").toLowerCase() === "em andamento").length,
    finalizado: casesList.filter(c => (c.status || "").toLowerCase() === "finalizado").length,
  };

  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "em andamento":
        return "bg-blue-500 text-white hover:bg-blue-600";
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
        return <Clock className="h-3 w-3" />;
      case "finalizado":
        return <CheckCircle2 className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const normalizeStatusLabel = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "em andamento") return "Em andamento";
    if (s === "finalizado") return "Finalizado";
    return status;
  };

  const STEP_TITLES = [
    "Análise Inicial",
    "Petição Inicial",
    "Citação",
    "Contestação",
    "Audiência Inicial",
    "Instrução Processual",
    "Alegações Finais",
    "Sentença",
    "Execução/Recurso",
  ];

  const getStepTitle = (idx?: number) => {
    const i = typeof idx === 'number' ? idx : 0;
    return STEP_TITLES[i] || `Etapa ${i + 1}`;
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/acoes-trabalhistas/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Atualiza os dados via refetch para refletir a exclusão
        refetch();
      } else {
        console.error('Failed to delete case');
      }
    } catch (error) {
      console.error('Error deleting case:', error);
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
                <img src="https://cdn-icons-png.flaticon.com/512/3135/3135687.png" alt="Ações Trabalhistas" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Ações Trabalhistas</h1>
                <p className="text-slate-300 mt-1">
                  Gerencie ações trabalhistas e direitos do trabalhador
                </p>
              </div>
            </div>
          </div>
          <Link href="/dashboard/acoes-trabalhistas/novo">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold shadow-lg">
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
          <div className="grid gap-4 md:grid-cols-3">
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
                <SelectValue placeholder="Tipo de ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {CASE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
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
                <Briefcase className="h-12 w-12 text-slate-400" />
              </div>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Nenhuma ação encontrada
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 mt-2">
                {search || typeFilter !== "all" || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Comece criando uma nova ação trabalhista"}
              </p>
              <Link href="/dashboard/acoes-trabalhistas/novo">
                <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Ação
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          filteredCases.map((caseItem) => (
            <Card
              key={caseItem.id}
              className="border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-amber-500/50 transition-all duration-200 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 relative"
            >
              {/* Button Container - Alinhado horizontalmente */}
              <div className="absolute top-2 right-2 flex items-center gap-2">
                {/* Ver Detalhes Button */}
                <OptimizedLink
                  href={`/dashboard/acoes-trabalhistas/${caseItem.id}`}
                  prefetchData={() => prefetchAcaoTrabalhistaById(caseItem.id)}
                >
                  <Button
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-900 text-white font-semibold shadow-md h-8 px-3"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </OptimizedLink>

                {/* Delete Button */}
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
                        Tem certeza que deseja excluir a ação trabalhista de {caseItem.clientName}? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(caseItem.id)}
                        className="bg-white text-red-600 border border-red-500 hover:bg-red-50 hover:text-red-700"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Ícone do processo */}
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-md flex-shrink-0">
                      <Briefcase className="h-6 w-6 text-white" />
                    </div>

                    {/* Informações do processo */}
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          {caseItem.clientName}
                        </h3>
                        <Badge className={`${getStatusColor(caseItem.status)} flex items-center gap-1.5 px-3 py-1 shadow-md`}>
                          {getStatusIcon(caseItem.status)}
                          {normalizeStatusLabel(caseItem.status)}
                        </Badge>
                      </div>

                      <div className="grid gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium">Tipo de ação:</span>
                          <span>{caseItem.type || "Trabalhista"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium">Fluxo atual:</span>
                          <span>{getStepTitle(caseItem.currentStep)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium">Responsável:</span>
                          <span>{caseItem.responsavelName || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar h-4 w-4 text-slate-600 dark:text-slate-400"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>
                          <span className="font-medium">Prazo:</span>
                          <span>{caseItem.responsavelDate ? new Date(caseItem.responsavelDate).toLocaleDateString("pt-BR") : "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium">Nº do processo:</span>
                          <span>{caseItem.numeroProcesso || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium">Réu:</span>
                          <span>{caseItem.reuName || "—"}</span>
                        </div>
                      </div>

                      {caseItem.notes && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {caseItem.notes}
                        </p>
                      )}
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
