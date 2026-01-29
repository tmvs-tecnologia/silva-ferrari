"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, Eye, Clock, CheckCircle2, AlertCircle, Scale, Trash2, User, Calendar } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingState } from "@/components/loading-state";
import { useDataCache } from "@/hooks/useDataCache";
import { usePrefetch } from "@/hooks/usePrefetch";
import { OptimizedLink } from "@/components/optimized-link";
import { prefetchAcaoCivilById } from "@/utils/prefetch-functions";
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
  const fetchCases = useCallback(async () => {
    // Fetch only necessary columns for the list view
    const columns = 'id,client_name,type,status,current_step,notes,created_at,updated_at';
    const response = await fetch(`/api/acoes-civeis?limit=100&select=${columns}`);
    return response.json();
  }, []);

  const { data: casesData, isLoading, error, refetch } = useDataCache(
    "acoes-civeis",
    fetchCases
  );
  const cases = Array.isArray(casesData) ? casesData : [];
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState<number | null>(null);
  const [editResponsibleName, setEditResponsibleName] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [caseAssignments, setCaseAssignments] = useState<Record<number, { responsibleName?: string; dueDate?: string }>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'acoes-civeis-status-update') {
          const updateData = JSON.parse(e.newValue || '{}');
          if (updateData.id && updateData.status) {
            refetch();
            localStorage.removeItem('acoes-civeis-status-update');
          }
        }
        if (e.key === 'acoes-civeis-case-update') {
          const updateData = JSON.parse(e.newValue || '{}');
          if (updateData.id && typeof updateData.currentStep === 'number') {
            refetch();
            localStorage.removeItem('acoes-civeis-case-update');
          }
        }
        if (e.key === 'step-assignments-update') {
          const updateData = JSON.parse(e.newValue || '{}');
          if (updateData.moduleType === 'acoes_civeis' && updateData.recordId) {
            const rid = typeof updateData.recordId === 'string' ? parseInt(updateData.recordId) : updateData.recordId;
            setCaseAssignments(prev => ({
              ...prev,
              [rid]: { responsibleName: updateData.responsibleName, dueDate: updateData.dueDate }
            }));
            localStorage.removeItem('step-assignments-update');
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);

      const handleCustomEvent = (e: CustomEvent) => {
        const updateData: any = e.detail;
        if (updateData.id && updateData.status) {
          refetch();
        }
        if (updateData.id && typeof updateData.currentStep === 'number') {
          refetch();
        }
        if (updateData.moduleType === 'acoes_civeis' && updateData.recordId) {
          const rid = typeof updateData.recordId === 'string' ? parseInt(updateData.recordId) : updateData.recordId;
          setCaseAssignments(prev => ({
            ...prev,
            [rid]: { responsibleName: updateData.responsibleName, dueDate: updateData.dueDate }
          }));
        }
      };

      window.addEventListener('acoes-civeis-status-updated', handleCustomEvent as EventListener);
      window.addEventListener('acoes-civeis-case-updated', handleCustomEvent as EventListener);
      window.addEventListener('step-assignments-updated', handleCustomEvent as EventListener);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('acoes-civeis-status-updated', handleCustomEvent as EventListener);
        window.removeEventListener('acoes-civeis-case-updated', handleCustomEvent as EventListener);
        window.removeEventListener('step-assignments-updated', handleCustomEvent as EventListener);
      };
    }
  }, [refetch]);

  const openEditAssignment = (cid: number) => {
    setEditingCaseId(cid);
    const a = caseAssignments[cid];
    setEditResponsibleName(a?.responsibleName || "");
    setEditDueDate(a?.dueDate ? new Date(a.dueDate).toISOString().slice(0, 10) : "");
    setIsEditOpen(true);
  };

  const handleUpdateAssignment = async () => {
    if (!editingCaseId) return;
    const c = cases.find((x: any) => x.id === editingCaseId);
    const stepIndex = c?.currentStep ?? 0;
    try {
      const res = await fetch('/api/step-assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleType: 'acoes_civeis',
          recordId: editingCaseId,
          stepIndex,
          responsibleName: editResponsibleName,
          dueDate: editDueDate || null,
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setCaseAssignments((prev) => ({
          ...prev,
          [editingCaseId]: {
            responsibleName: updated.responsibleName,
            dueDate: updated.dueDate,
          }
        }));
        setIsEditOpen(false);
      }
    } catch { }
  };

  const lastAssignmentIdsRef = useRef<string>("");
  useEffect(() => {
    const ids = cases.map((c: any) => c.id).join(",");
    if (ids === lastAssignmentIdsRef.current) return;
    if (isTypeOpen || isStatusOpen) return;
    lastAssignmentIdsRef.current = ids;

    const loadAssignments = async () => {
      if (cases.length === 0) {
        setCaseAssignments({});
        return;
      }

      try {
        const recordIds = cases.map((c: any) => c.id).join(',');
        const res = await fetch(`/api/step-assignments?moduleType=acoes_civeis&recordIds=${recordIds}`);
        if (!res.ok) return;

        const data = await res.json();
        const map: Record<number, { responsibleName?: string; dueDate?: string }> = {};

        // Data is an array of assignments
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            // We only care about the assignment for the current step of each case
            const caseItem = cases.find((c: any) => c.id === item.recordId);
            if (caseItem && item.stepIndex === caseItem.currentStep) {
              map[item.recordId] = {
                responsibleName: item.responsibleName,
                dueDate: item.dueDate
              };
            }
          });
        }

        const nextStr = JSON.stringify(map);
        const prevStr = JSON.stringify(caseAssignments);
        if (nextStr !== prevStr) {
          setCaseAssignments(map);
        }
      } catch (err) {
        console.error("Error loading assignments:", err);
      }
    };

    loadAssignments();
  }, [cases, isTypeOpen, isStatusOpen]);

  const filteredCases = cases.filter((c) => {
    const matchesSearch = c.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || c.type === typeFilter;
    const matchesStatus = statusFilter === "all" || (c.status || "").toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: cases.length,
    emAndamento: cases.filter(c => (c.status || "").toLowerCase() === "em andamento").length,
    finalizado: cases.filter(c => (c.status || "").toLowerCase() === "finalizado").length,
  };

  const getStepTitle = (type: string, index: number) => {
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
    const USUCAPIAO_STEPS = [
      "Cadastro de Documentos",
      "Elaboração da Procuração",
      "Contratação de um Engenheiro",
      "Elaboração da Petição Inicial",
      "Emissão da Guia Judicial",
      "À Protocolar",
      "Processo Finalizado",
    ];
    const DIVORCIO_LITIGIO_STEPS = [
      "Cadastro de Documentos",
      "Elaboração de Procuração do Cliente, Petição do Cliente e Emissão da Guia Judicial",
      "À Protocolar",
      "Processo Finalizado",
    ];
    const steps = type === "Exame DNA"
      ? EXAME_DNA_STEPS
      : (type === "Alteração de Nome" || type === "Guarda" || type === "Acordos de Guarda")
        ? ALTERACAO_NOME_STEPS
        : (type === "Usucapião" ? USUCAPIAO_STEPS : ((type === "Divórcio Litígio" || type === "Divórcio Consensual") ? DIVORCIO_LITIGIO_STEPS : STANDARD_CIVIL_STEPS));
    const clampedIndex = Math.min(Math.max(index, 0), steps.length - 1);
    return steps[clampedIndex];
  };

  const getStatusIcon = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "em andamento":
        return <Clock className="h-4 w-4" />;
      case "finalizado":
        return <CheckCircle2 className="h-4 w-4" />;
      case "deferido":
        return <AlertCircle className="h-4 w-4" />;
      case "indeferido":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const normalizeStatusLabel = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "em andamento") return "Em Andamento";
    if (s === "finalizado") return "Finalizado";
    if (s === "deferido") return "Deferido";
    if (s === "indeferido") return "Indeferido";
    return status;
  };

  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "em andamento":
        return "bg-blue-500 text-white hover:bg-blue-600";
      case "finalizado":
        return "bg-emerald-500 text-white hover:bg-emerald-600";
      case "deferido":
        return "bg-amber-500 text-white hover:bg-amber-600";
      case "indeferido":
        return "bg-red-600 text-white hover:bg-red-700";
      case "outro":
        return "bg-violet-500 text-white hover:bg-violet-600";
      default:
        return "bg-slate-500 text-white hover:bg-slate-600";
    }
  };

  const computeDisplayStatus = (caseItem: any) => {
    const sf = String(caseItem?.statusFinal || "").trim();
    if (sf) {
      if (sf.toLowerCase() === "outro") {
        const outroText = String(caseItem?.statusFinalOutro || "").trim();
        return outroText || "Outro";
      }
      return sf;
    }
    return String(caseItem?.status || "");
  };

  const getLastNoteContent = (notesStr: string) => {
    if (!notesStr) return "";
    try {
      const parsed = JSON.parse(notesStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const last = parsed[parsed.length - 1];
        return last.content || "";
      }
      return "";
    } catch {
      return notesStr;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/acoes-civeis/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Atualiza dados via refetch para refletir remoção
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
                <img src="https://cdn-icons-png.flaticon.com/512/1157/1157026.png" alt="Ações Cíveis" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Ações Cíveis</h1>
                <p className="text-slate-300 mt-1">
                  Gerencie ações cíveis e processos jurídicos
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/acoes-civeis/novo">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold shadow-lg">
                <Plus className="h-5 w-5 mr-2" />
                Nova Ação
              </Button>
            </Link>
          </div>
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
            <Select value={typeFilter} onValueChange={setTypeFilter} open={isTypeOpen} onOpenChange={setIsTypeOpen}>
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
            <Select value={statusFilter} onValueChange={setStatusFilter} open={isStatusOpen} onOpenChange={setIsStatusOpen}>
              <SelectTrigger className="border-slate-300 dark:border-slate-600 focus:border-amber-500 focus:ring-amber-500">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
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
              {/* Button Container - Alinhado horizontalmente */}
              <div className="absolute top-2 right-2 flex items-center gap-2">
                {/* Ver Detalhes Button */}
                <OptimizedLink
                  href={`/dashboard/acoes-civeis/${caseItem.id}`}
                  prefetchData={() => prefetchAcaoCivilById(caseItem.id)}
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
                        Tem certeza que deseja excluir a ação cível de {caseItem.clientName}? Esta ação não pode ser desfeita.
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
                      <Scale className="h-6 w-6 text-white" />
                    </div>

                    {/* Informações do processo */}
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          {caseItem.clientName}
                        </h3>
                        {(() => {
                          const display = computeDisplayStatus(caseItem);
                          const category = (caseItem?.statusFinal ? caseItem.statusFinal : caseItem.status) || "";
                          return (
                            <Badge className={`${getStatusColor(category)} flex items-center gap-1.5 px-3 py-1 shadow-md`}>
                              {getStatusIcon(category)}
                              {normalizeStatusLabel(display)}
                            </Badge>
                          );
                        })()}
                      </div>

                      <div className="grid gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium">Tipo de ação:</span>
                          <span>{caseItem.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium">Fluxo atual:</span>
                          <span>{getStepTitle(caseItem.type, caseItem.currentStep)}</span>
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



                      {caseItem.notes && getLastNoteContent(caseItem.notes) && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          <span className="font-medium">Observações:</span> {getLastNoteContent(caseItem.notes)}
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

      <AlertDialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <AlertDialogContent className="sm:max-w-[380px] p-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Editar responsável/prazo</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Atualize o responsável pela tarefa e a data limite.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Responsável</Label>
              <Input className="h-8 text-sm" value={editResponsibleName} onChange={(e) => setEditResponsibleName(e.target.value)} placeholder="Nome do responsável" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Prazo</Label>
              <Input className="h-8 text-sm" type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 px-3 text-sm">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="h-8 px-3 text-sm" onClick={handleUpdateAssignment}>Salvar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
