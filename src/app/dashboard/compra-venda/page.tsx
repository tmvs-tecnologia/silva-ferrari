"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Home, Eye, AlertTriangle, Clock, CheckCircle2, AlertCircle, FileText, Building2 } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CompraVendaPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/compra-venda-imoveis?limit=100");
      const data = await response.json();
      setProperties(data);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter((p) => {
    const matchesSearch = !search || p.enderecoImovel?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: properties.length,
    emAndamento: properties.filter(p => p.status === "Em Andamento").length,
    finalizado: properties.filter(p => p.status === "Finalizado").length,
    aguardando: properties.filter(p => p.status === "Aguardando").length,
  };

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
              Nova Transação
            </Button>
          </Link>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-4 border border-slate-700">
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

          <div className="bg-blue-500/10 backdrop-blur rounded-lg p-4 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Em Andamento</p>
                <p className="text-3xl font-bold text-blue-400 mt-1">{stats.emAndamento}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-amber-500/10 backdrop-blur rounded-lg p-4 border border-amber-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-300 text-sm font-medium">Aguardando</p>
                <p className="text-3xl font-bold text-amber-400 mt-1">{stats.aguardando}</p>
              </div>
              <div className="p-3 bg-amber-500/20 rounded-lg">
                <AlertCircle className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/10 backdrop-blur rounded-lg p-4 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-300 text-sm font-medium">Finalizados</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1">{stats.finalizado}</p>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-lg">
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
                className="border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-amber-500/50 transition-all duration-200 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800"
              >
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
                            {property.enderecoImovel || "Endereço não informado"}
                          </h3>
                          <Badge className={`${getStatusColor(property.status)} flex items-center gap-1.5 px-3 py-1 shadow-md`}>
                            {getStatusIcon(property.status)}
                            {property.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-6 text-sm flex-wrap">
                          {property.numeroMatricula && (
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded">
                                <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              </div>
                              <span className="font-medium">Matrícula: {property.numeroMatricula}</span>
                            </div>
                          )}
                          
                          {property.cpfComprador && (
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                              <span className="font-semibold">CPF Comprador:</span>
                              <span>{property.cpfComprador}</span>
                            </div>
                          )}
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
                            {property.contractNotes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Botão de ação */}
                    <Link href={`/dashboard/compra-venda/${property.id}`}>
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
            );
          })
        )}
      </div>
    </div>
  );
}