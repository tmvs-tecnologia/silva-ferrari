"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, Eye, Clock, CheckCircle2, AlertCircle, Scale, Trash2 } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
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

const CASE_TYPES = [
  "Exame DNA",
  "Alteração de Nome",
  "Guarda",
  "Acordos de Guarda",
  "Divórcio Consensual",
  "Divórcio Litígio",
  "Usucapião",
];

export default function AcoesCiveisPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/acoes-civeis?limit=100");
      const data = await response.json();
      setCases(data);
    } catch (error) {
      console.error("Error fetching cases:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    const matchesSearch = c.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || c.type === typeFilter;
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: cases.length,
    emAndamento: cases.filter(c => c.status === "Em Andamento").length,
    finalizado: cases.filter(c => c.status === "Finalizado").length,
    aguardando: cases.filter(c => c.status === "Aguardando").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Em Andamento":
        return "bg-blue-500 text-white hover:bg-blue-600";
      case "Finalizado":
        return "bg-emerald-500 text-white hover:bg-emerald-600";
      case "Aguardando":
        return "bg-amber-500 text-white hover:bg-amber-600";
      default:
        return "bg-slate-500 text-white hover:bg-slate-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Em Andamento":
        return <Clock className="h-4 w-4" />;
      case "Finalizado":
        return <CheckCircle2 className="h-4 w-4" />;
      case "Aguardando":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/acoes-civeis/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove the case from the local state
        setCases(cases.filter(c => c.id !== id));
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
              <div className="p-3 bg-amber-500 rounded-lg">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Ações Cíveis</h1>
                <p className="text-slate-300 mt-1">
                  Gerencie ações cíveis e processos jurídicos
                </p>
              </div>
            </div>
          </div>
          <Link href="/dashboard/acoes-civeis/novo">
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

          <div className="bg-amber-900 rounded-lg p-4 border border-amber-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-300 text-sm font-medium">Aguardando</p>
                <p className="text-3xl font-bold text-amber-400 mt-1">{stats.aguardando}</p>
              </div>
              <div className="p-3 bg-amber-800 rounded-lg">
                <AlertCircle className="h-6 w-6 text-amber-400" />
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
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Finalizado">Finalizado</SelectItem>
                <SelectItem value="Aguardando">Aguardando</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de processos */}
      <div className="grid gap-4">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-slate-200 dark:border-slate-700">
                <CardContent className="pt-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : filteredCases.length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-700 shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                <Scale className="h-12 w-12 text-slate-400" />
              </div>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Nenhuma ação encontrada
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 mt-2">
                {search || typeFilter !== "all" || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Comece criando uma nova ação cível"}
              </p>
              <Link href="/dashboard/acoes-civeis/novo">
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
              {/* Discrete delete button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 z-10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir a ação cível de {caseItem.clientName}? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(caseItem.id)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Ícone do processo */}
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-md flex-shrink-0">
                      <Scale className="h-6 w-6 text-white" />
                    </div>

                    {/* Informações do processo */}
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          {caseItem.clientName}
                        </h3>
                        <Badge className={`${getStatusColor(caseItem.status)} flex items-center gap-1.5 px-3 py-1 shadow-md`}>
                          {getStatusIcon(caseItem.status)}
                          {caseItem.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-6 text-sm flex-wrap">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded">
                            <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="font-medium">Tipo: {caseItem.type}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="font-medium">Passo {caseItem.currentStep}</span>
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

                      {caseItem.notes && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {caseItem.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botão de ação */}
                  <Link href={`/dashboard/acoes-civeis/${caseItem.id}`}>
                    <Button 
                      size="lg"
                      className="bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-900 text-white font-semibold shadow-md"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}