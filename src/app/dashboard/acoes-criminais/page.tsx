"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  AlertCircle, 
  Search, 
  Plus, 
  FileText, 
  Eye, 
  Clock, 
  CheckCircle2, 
  Shield,
  Gavel,
  Trash2
} from "lucide-react";
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
  "Defesa Criminal",
  "Habeas Corpus",
  "Revisão Criminal",
  "Execução Penal",
  "Inquérito Policial",
  "Outros"
];

export default function AcoesCriminaisPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await fetch("/api/acoes-criminais?limit=100");
      const data = await response.json();
      setCases(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    const matchesSearch = c.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesType = typeFilter === "all" || c.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: cases.length,
    emAndamento: cases.filter(c => c.status === "Em Andamento").length,
    aguardando: cases.filter(c => c.status === "Aguardando").length,
    finalizado: cases.filter(c => c.status === "Finalizado").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Em Andamento":
        return "bg-blue-500 text-white";
      case "Aguardando":
        return "bg-yellow-500 text-white";
      case "Finalizado":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Em Andamento":
        return Clock;
      case "Aguardando":
        return AlertCircle;
      case "Finalizado":
        return CheckCircle2;
      default:
        return FileText;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/acoes-criminais/${id}`, {
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
    <div className="space-y-8">
      {/* Header com gradiente */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-red-600 to-red-800 p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Ações Criminais</h1>
              <p className="mt-2 text-red-100">
                Gerencie e acompanhe suas ações criminais
              </p>
            </div>
            <Link href="/dashboard/acoes-criminais/nova">
              <Button className="bg-white text-red-600 hover:bg-red-50">
                <Plus className="mr-2 h-4 w-4" />
                Nova Ação
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
          <Shield className="h-full w-full" />
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Total de Ações</div>
            <Gavel className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Todas as ações criminais
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Em Andamento</div>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.emAndamento}</div>
            <p className="text-xs text-muted-foreground">
              Ações em tramitação
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Aguardando</div>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.aguardando}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando providências
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Finalizadas</div>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.finalizado}</div>
            <p className="text-xs text-muted-foreground">
              Ações concluídas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Aguardando">Aguardando</SelectItem>
                <SelectItem value="Finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Tipo" />
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
          </div>
        </CardContent>
      </Card>

      {/* Lista de ações */}
      <div className="grid gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredCases.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="mx-auto h-16 w-16 text-muted-foreground" />
              <h3 className="mt-4 text-xl font-semibold">Nenhuma ação encontrada</h3>
              <p className="mt-2 text-muted-foreground">
                Não há ações criminais que correspondam aos filtros aplicados.
              </p>
              <Link href="/dashboard/acoes-criminais/nova">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Nova Ação
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          filteredCases.map((caseItem) => {
            const StatusIcon = getStatusIcon(caseItem.status);
            return (
              <Card key={caseItem.id} className="hover:shadow-lg transition-all duration-200 relative">
                {/* Discrete Delete Button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 z-10 h-8 w-8 p-0 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 opacity-70 hover:opacity-100 transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir a ação criminal de <strong>{caseItem.clientName}</strong>? 
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDelete(caseItem.id)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                          <Shield className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{caseItem.clientName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {caseItem.type || "Defesa Criminal"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <Badge className={`${getStatusColor(caseItem.status)} flex items-center space-x-1`}>
                          <StatusIcon className="h-3 w-3" />
                          <span>{caseItem.status}</span>
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Criado em: {new Date(caseItem.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="flex items-center space-x-2 text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>Processo: {caseItem.processNumber || "Não informado"}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Gavel className="h-4 w-4 text-muted-foreground" />
                          <span>Vara: {caseItem.court || "Não informado"}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          <span>Prioridade: {caseItem.priority || "Normal"}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}