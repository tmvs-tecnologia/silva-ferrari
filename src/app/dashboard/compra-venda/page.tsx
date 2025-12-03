"use client";

 import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Home, Eye, AlertTriangle, Clock, CheckCircle2, AlertCircle, FileText, Building2, User, Users, Trash2, Calendar } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingState } from "@/components/loading-state";
import { useDataCache } from "@/hooks/useDataCache";
import { usePrefetch } from "@/hooks/usePrefetch";
import { OptimizedLink } from "@/components/optimized-link";
import { prefetchCompraVendaById } from "@/utils/prefetch-functions";
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

export default function CompraVendaPage() {
  const { data: propertiesData, isLoading, error, refetch } = useDataCache(
    "compra-venda",
    async () => {
      const response = await fetch("/api/compra-venda-imoveis?limit=100");
      return response.json();
    }
  );
  const properties = Array.isArray(propertiesData) ? propertiesData : [];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [caseAssignments, setCaseAssignments] = useState<Record<number, { responsibleName?: string; dueDate?: string }>>({});
  const lastAssignmentIdsRef = useRef<string>("");
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'compra-venda-status-update') {
          const updateData = JSON.parse(e.newValue || '{}');
          if (updateData.id && updateData.status) {
            refetch();
            localStorage.removeItem('compra-venda-status-update');
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
      window.addEventListener('compra-venda-status-updated', handleCustomEvent as EventListener);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('compra-venda-status-updated', handleCustomEvent as EventListener);
      };
    }
  }, [refetch]);

  const filteredProperties = properties.filter((p) => {
    const matchesSearch = !search || p.enderecoImovel?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || (p.status || "").toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: properties.length,
    emAndamento: properties.filter(p => (p.status || "").toLowerCase() === "em andamento").length,
    finalizado: properties.filter(p => (p.status || "").toLowerCase() === "finalizado").length,
  };

  const WORKFLOW_STEP_TITLES = [
    "Cadastro Documentos",
    "Emitir Certidões",
    "Fazer/Analisar Contrato Compra e Venda",
    "Assinatura de contrato",
    "Escritura",
    "Cobrar a Matrícula do Cartório",
    "Processo Finalizado",
  ];

  const getStepTitle = (index: number) => WORKFLOW_STEP_TITLES[(index || 1) - 1] || `Etapa ${index || 1}`;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'step-assignments-update') {
          try {
            const updateData = JSON.parse(e.newValue || '{}');
            if (updateData.moduleType === 'compra_venda_imoveis' && updateData.recordId) {
              const rid = typeof updateData.recordId === 'string' ? parseInt(updateData.recordId) : updateData.recordId;
              setCaseAssignments(prev => ({
                ...prev,
                [rid]: { responsibleName: updateData.responsibleName, dueDate: updateData.dueDate }
              }));
              localStorage.removeItem('step-assignments-update');
            }
          } catch {}
        }
      };

      const handleCustomEvent = (e: CustomEvent) => {
        const updateData: any = e.detail;
        if (updateData?.moduleType === 'compra_venda_imoveis' && updateData.recordId) {
          const rid = typeof updateData.recordId === 'string' ? parseInt(updateData.recordId) : updateData.recordId;
          setCaseAssignments(prev => ({
            ...prev,
            [rid]: { responsibleName: updateData.responsibleName, dueDate: updateData.dueDate }
          }));
        }
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('step-assignments-updated', handleCustomEvent as EventListener);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('step-assignments-updated', handleCustomEvent as EventListener);
      };
    }
  }, []);

  useEffect(() => {
    const ids = properties.map((c: any) => c.id).join(",");
    if (ids === lastAssignmentIdsRef.current) return;
    lastAssignmentIdsRef.current = ids;

    const loadAssignments = async () => {
      const entries = await Promise.all(
        properties.map(async (p: any) => {
          try {
            const res = await fetch(`/api/step-assignments?moduleType=compra_venda_imoveis&recordId=${p.id}&stepIndex=${p.currentStep}`);
            if (!res.ok) return [p.id, null] as const;
            const data = await res.json();
            const item = Array.isArray(data) ? (data[0] || null) : data;
            return [p.id, item ? { responsibleName: item.responsibleName, dueDate: item.dueDate } : null] as const;
          } catch {
            return [p.id, null] as const;
          }
        })
      );
      const map: Record<number, { responsibleName?: string; dueDate?: string }> = {};
      for (const [id, a] of entries) {
        if (a) map[id] = a;
      }
      const nextStr = JSON.stringify(map);
      const prevStr = JSON.stringify(caseAssignments);
      if (nextStr !== prevStr) {
        setCaseAssignments(map);
      }
    };

    if (properties.length > 0) {
      loadAssignments();
    } else {
      setCaseAssignments({});
    }
  }, [properties]);

  const getDaysUntil = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineColor = (days: number | null) => {
    if (days === null) return "text-slate-600 dark:text-slate-400";
    if (days < 0) return "text-red-600 dark:text-red-400";
    if (days <= 7) return "text-orange-600 dark:text-orange-400";
    return "text-emerald-600 dark:text-emerald-400";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Em andamento":
        return "bg-blue-500 text-white hover:bg-blue-600";
      case "Finalizado":
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
      case "finalizado":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const normalizeStatusLabel = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "em andamento") return "Em andamento";
    if (s === "finalizado") return "Finalizado";
    return status;
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/compra-venda-imoveis?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        refetch();
      }
    } catch {}
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl p-8 shadow-lg border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Compra e Venda de Imóveis</h1>
                <p className="text-slate-300 mt-1">
                  Gerencie transações imobiliárias
                </p>
              </div>
            </div>
          </div>
          <Link href="/dashboard/compra-venda/novo">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold shadow-lg">
              <Plus className="h-5 w-5 mr-2" />
              Nova Ação
            </Button>
          </Link>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total de Processos</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-slate-700 rounded-lg">
                <Building2 className="h-6 w-6 text-slate-300" />
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
                placeholder="Buscar por endereço..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-slate-300 dark:border-slate-600 focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
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
        ) : filteredProperties.length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-700 shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                <Building2 className="h-12 w-12 text-slate-400" />
              </div>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Nenhuma transação encontrada
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 mt-2">
                {search || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Comece cadastrando uma nova transação"}
              </p>
              <Link href="/dashboard/compra-venda/novo">
                <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Transação
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          filteredProperties.map((property) => {
            const daysUntilSinal = getDaysUntil(property.prazoSinal);
            const daysUntilEscritura = getDaysUntil(property.prazoEscritura);

            return (
              <Card 
                key={property.id} 
                className="border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-amber-500/50 transition-all duration-200 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 relative"
              >
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  <OptimizedLink 
                    href={`/dashboard/compra-venda/${property.id}`}
                    prefetchData={() => prefetchCompraVendaById(property.id)}
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
                          Tem certeza que deseja excluir a transação de {property.clientName || 'Cliente'}? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(property.id)}
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
                        <Home className="h-6 w-6 text-white" />
                      </div>

                      {/* Informações do processo */}
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            {property.clientName || "Cliente não informado"}
                          </h3>
                          <Badge className={`${getStatusColor(property.status)} flex items-center gap-1.5 px-3 py-1 shadow-md`}>
                            {getStatusIcon(property.status)}
                            {normalizeStatusLabel(property.status)}
                          </Badge>
                        </div>

                        

                          <div className="grid gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            <span className="font-medium">Tipo de Ação:</span>
                            <span>Compra e Venda</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            <span className="font-medium">Nome do Cliente:</span>
                            <span>{property.clientName || "Não informado"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            <span className="font-medium">Vendedores:</span>
                            <span>{property.rgVendedores ? `${String(property.rgVendedores).split(',').length} vendedor(es)` : "—"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            <span className="font-medium">Comprador:</span>
                            <span>{property.rnmComprador || property.cpfComprador || "—"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            <span className="font-medium">Responsável:</span>
                            <span>{caseAssignments[property.id]?.responsibleName || "—"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            <span className="font-medium">Prazo:</span>
                            <span>{caseAssignments[property.id]?.dueDate ? new Date(caseAssignments[property.id]!.dueDate!).toLocaleDateString("pt-BR") : "—"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            <span className="font-medium">Fluxo atual:</span>
                            <span>{getStepTitle(property.currentStep || 1)}</span>
                          </div>
                        </div>

                        {/* Prazos */}
                        {(property.prazoSinal || property.prazoEscritura) && (
                          <div className="flex flex-wrap gap-4 pt-2">
                            {property.prazoSinal && (
                              <div className="flex items-center gap-2">
                                {daysUntilSinal !== null && daysUntilSinal <= 7 && (
                                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                                )}
                                <div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Prazo Sinal
                                  </p>
                                  <p className={`text-sm font-medium ${getDeadlineColor(daysUntilSinal)}`}>
                                    {new Date(property.prazoSinal).toLocaleDateString("pt-BR")}
                                    {daysUntilSinal !== null && (
                                      <span className="ml-2">
                                        ({daysUntilSinal > 0 ? `${daysUntilSinal}d` : "Vencido"})
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {property.prazoEscritura && (
                              <div className="flex items-center gap-2">
                                {daysUntilEscritura !== null && daysUntilEscritura <= 7 && (
                                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                                )}
                                <div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Prazo Escritura
                                  </p>
                                  <p className={`text-sm font-medium ${getDeadlineColor(daysUntilEscritura)}`}>
                                    {new Date(property.prazoEscritura).toLocaleDateString("pt-BR")}
                                    {daysUntilEscritura !== null && (
                                      <span className="ml-2">
                                        ({daysUntilEscritura > 0 ? `${daysUntilEscritura}d` : "Vencido"})
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {property.contractNotes && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            {`Observações: ${property.contractNotes}`}
                          </p>
                        )}
                      </div>
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
