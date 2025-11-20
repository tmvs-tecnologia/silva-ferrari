"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Globe, Eye, FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react";
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
      const response = await fetch("/api/perda-nacionalidade?limit=100");
      return response.json();
    }
  );
  const cases = Array.isArray(casesData) ? casesData : [];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
    const matchesStatus = statusFilter === "all" || (c.status || "").toLowerCase() === statusFilter.toLowerCase();
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
    return status;
  };

  const stats = {
    total: cases.length,
    emAndamento: cases.filter(c => (c.status || "").toLowerCase() === "em andamento").length,
    deferido: cases.filter(c => (c.status || "").toLowerCase() === "deferido").length,
    ratificado: cases.filter(c => (c.status || "").toLowerCase() === "ratificado").length,
    finalizado: cases.filter(c => (c.status || "").toLowerCase() === "ratificado").length,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl p-8 shadow-lg border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500 rounded-lg">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Perda de Nacionalidade</h1>
                <p className="text-slate-300 mt-1">
                  Gerencie processos de perda de nacionalidade brasileira
                </p>
              </div>
            </div>
          </div>
          <Link href="/dashboard/perda-nacionalidade/novo">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold shadow-lg">
              <Plus className="h-5 w-5 mr-2" />
              Nova Ação
            </Button>
          </Link>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
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

          <div className="bg-blue-900 rounded-lg p-4 border border-blue-700">
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

          

          <div className="bg-emerald-900 rounded-lg p-4 border border-emerald-700">
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
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Deferido">Deferido</SelectItem>
                <SelectItem value="Ratificado">Ratificado</SelectItem>
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
            <Card 
              key={caseItem.id} 
              className="border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-amber-500/50 transition-all duration-200 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800"
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Ícone do processo */}
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-md flex-shrink-0">
                      <Globe className="h-6 w-6 text-white" />
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

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded">
                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="font-medium">Passo {caseItem.currentStep + 1} de 9</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded">
                            <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          </div>
                          <span>
                            {new Date(caseItem.createdAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric"
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Barra de progresso */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">Progresso do Processo</span>
                          <span className="text-slate-700 dark:text-slate-300 font-semibold">
                            {Math.round(((caseItem.currentStep + 1) / 9) * 100)}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                            style={{ width: `${((caseItem.currentStep + 1) / 9) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botão de ação */}
                  <OptimizedLink 
                    href={`/dashboard/perda-nacionalidade/${caseItem.id}`}
                    prefetchData={() => prefetchPerdaNacionalidadeById(caseItem.id)}
                  >
                    <Button 
                      size="lg"
                      className="bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-900 text-white font-semibold shadow-md"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </OptimizedLink>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}