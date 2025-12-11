"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar as DateRangeCalendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { ArrowLeft, Folder, Pencil, Trash2, Eye, ChevronsUpDown, Check, Globe, Plane, Briefcase, Building2, Clock, CheckCircle2, Calendar, Circle, User } from "lucide-react";

interface FolderRow { id: number; name: string; module_type: string; }
interface Visto { id: number; client_name: string; type?: string; status?: string; created_at?: string; updated_at?: string; country?: string; travelStartDate?: string; travelEndDate?: string; currentStep?: number; statusFinal?: string; statusFinalOutro?: string; }

export default function PastaVistosDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const folderId = parseInt(params.id);
  const [folder, setFolder] = useState<FolderRow | null>(null);
  const [records, setRecords] = useState<{ record_id: number; module_type: string }[]>([]);
  const [vistosList, setVistosList] = useState<Visto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedAddId, setSelectedAddId] = useState<string>("");
  const [statusFinalOverrides, setStatusFinalOverrides] = useState<Record<string, { statusFinal: string; statusFinalOutro: string | null }>>({});
  const [datePopoverFor, setDatePopoverFor] = useState<string | null>(null);
  const [dateRangeEdit, setDateRangeEdit] = useState<{ from?: Date; to?: Date }>({});
  const [dateEditField, setDateEditField] = useState<'from' | 'to'>('from');
  const [vistosAssignments, setVistosAssignments] = useState<Record<string, { responsibleName?: string; dueDate?: string; currentIndex?: number }>>({});
  const normalizeStatus = (status: string) => (status || "").toLowerCase();
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

  const loadAll = async () => {
    setLoading(true);
    try {
      const [folderRes, recRes, vistosRes] = await Promise.all([
        fetch(`/api/folders/${folderId}`),
        fetch(`/api/folders/${folderId}/records`),
        fetch(`/api/vistos?limit=200`),
      ]);
      const fold = await folderRes.json();
      const recs = await recRes.json();
      const vistos = await vistosRes.json();
      setFolder(fold || null);
      setRecords(Array.isArray(recs) ? recs.map((r: any) => ({ record_id: r.record_id, module_type: r.module_type })) : []);
      setVistosList(Array.isArray(vistos) ? vistos.map((v: any) => ({ id: v.id, client_name: v.clientName || v.client_name, type: v.type, status: v.status, created_at: v.created_at || v.createdAt, updated_at: v.updated_at || v.updatedAt, country: v.country, travelStartDate: v.travelStartDate || v.travel_start_date, travelEndDate: v.travelEndDate || v.travel_end_date, currentStep: v.currentStep ?? v.current_step, statusFinal: v.statusFinal ?? v.status_final, statusFinalOutro: v.statusFinalOutro ?? v.status_final_outro })) : []);
      setNewName(String((fold && fold.name) || ''));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, [folderId]);

  const inFolderIds = useMemo(() => new Set(records.map(r => r.record_id)), [records]);
  const candidates = useMemo(() => vistosList.filter(v => !inFolderIds.has(v.id)), [vistosList, inFolderIds]);

  const saveName = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const res = await fetch(`/api/folders/${folderId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      if (res.ok) { setEditing(false); await loadAll(); }
    } catch {}
  };

  const addRecord = async () => {
    const rid = parseInt(selectedAddId);
    if (isNaN(rid)) return;
    try {
      const res = await fetch(`/api/folders/${folderId}/records`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recordId: rid, moduleType: 'vistos' }) });
      if (res.ok) { setSelectedAddId(''); await loadAll(); }
    } catch {}
  };

  const removeRecord = async (rid: number) => {
    try {
      const res = await fetch(`/api/folders/${folderId}/records?recordId=${rid}`, { method: 'DELETE' });
      if (res.ok) await loadAll();
    } catch {}
  };

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
        setDatePopoverFor(null);
        setDateRangeEdit({});
        await loadAll();
      }
    } catch {}
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
    return WORKFLOWS_LIST["Visto de Trabalho"];
  };

  const getVistoStepTitle = (type: string, index: number) => {
    const steps = getVistoSteps(type);
    const clampedIndex = Math.min(Math.max(index || 0, 0), steps.length - 1);
    return steps[clampedIndex];
  };

  const getFinalStatusOrder = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("turismo")) return ["Aprovado", "Negado", "Aguardando"];
    return ["Deferido", "Indeferido", "Outro"];
  };

  const cycleStatusFinal = (current: string | undefined, type: string) => {
    const order = getFinalStatusOrder(type);
    const idx = order.indexOf(String(current || ""));
    const nextIdx = ((idx < 0 ? -1 : idx) + 1) % order.length;
    return order[nextIdx];
  };

  const getStatusFinalClass = (s: string) => {
    const v = (s || "").toLowerCase();
    if (v === "deferido" || v === "aprovado") return "text-emerald-600 font-semibold";
    if (v === "indeferido" || v === "negado") return "text-red-600 font-semibold";
    if (v === "aguardando") return "text-amber-600 font-semibold";
    return "text-slate-700 dark:text-slate-300";
  };

  const handleStatusFinalToggle = async (v: Visto) => {
    const id = String(v.id);
    const current = String(statusFinalOverrides[id]?.statusFinal ?? v.statusFinal ?? "");
    const next = cycleStatusFinal(current, v.type || "");
    const optimistic: { statusFinal: string; statusFinalOutro: string | null } = {
      statusFinal: next,
      statusFinalOutro: next === "Outro" ? (statusFinalOverrides[id]?.statusFinalOutro ?? v.statusFinalOutro ?? "Outro") : null,
    };
    setStatusFinalOverrides((prev) => ({ ...prev, [id]: optimistic }));

    const payload: any = { statusFinal: optimistic.statusFinal, statusFinalOutro: optimistic.statusFinalOutro };
    try {
      await fetch(`/api/vistos?id=${v.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {}
  };

  const recordsIdsKey = useMemo(() => {
    try {
      const ids = records.map((r) => String(r.record_id));
      return [...new Set(ids)].sort().join(",");
    } catch {
      return "";
    }
  }, [records]);

  useEffect(() => {
    if (!recordsIdsKey) { setVistosAssignments({}); return; }
    const loadAssignments = async () => {
      const entries = await Promise.all(
        records.map(async (r: any) => {
          const id = String(r.record_id);
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
  }, [recordsIdsKey]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500 rounded-md"><Folder className="h-5 w-5 text-white" /></div>
          {editing ? (
            <div className="flex items-center gap-2">
              <Input className="h-8" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Button size="sm" onClick={saveName}>Salvar</Button>
            </div>
          ) : (
            <h1 className="text-2xl font-bold">{folder?.name || 'Pasta'}</h1>
          )}
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar cadastros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 w-[320px] justify-between">
                  <span className="truncate">
                    {(() => {
                      const sel = vistosList.find((x) => String(x.id) === String(selectedAddId));
                      return sel ? `${sel.client_name} — ${sel.type || ''}` : 'Selecione um cadastro';
                    })()}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[420px]">
                <Command>
                  <CommandInput placeholder="Buscar cadastro..." />
                  <CommandList>
                    <CommandEmpty>Nenhum cadastro encontrado.</CommandEmpty>
                    <CommandGroup>
                      {candidates.map((v) => (
                        <CommandItem key={v.id} value={`${v.client_name} ${v.type || ''}`} onSelect={() => setSelectedAddId(String(v.id))}>
                          <span className="truncate">{v.client_name} — {v.type || ''}</span>
                          {String(selectedAddId) === String(v.id) ? <Check className="ml-auto h-4 w-4" /> : null}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button onClick={addRecord} className="bg-amber-500 hover:bg-amber-600 text-slate-900">Adicionar</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          <Card><CardContent className="p-6">Carregando...</CardContent></Card>
        ) : records.length === 0 ? (
          <Card><CardContent className="p-6">Nenhum cadastro nesta pasta</CardContent></Card>
        ) : (
          records.map((r) => {
            const v = vistosList.find((x) => x.id === r.record_id);
            if (!v) return null;
            return (
              <Card
                key={r.record_id}
                className="border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-amber-500/50 transition-all duration-200 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 relative"
              >
                <CardContent className="pt-6">
                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    <Link href={`/dashboard/vistos/${v.id}`}>
                      <Button 
                        size="sm"
                        className="h-8 w-8 p-0 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-900 text-white font-semibold shadow-md"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
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
                          <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                          <AlertDialogDescription>
                            Remover {v.client_name} desta pasta?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeRecord(v.id)}>Remover</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-md flex-shrink-0">
                        {getTypeIcon(v.type || "")}
                      </div>
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          {v.client_name}
                        </h3>
                        <Badge className={`${getStatusColor(v.status || '')} flex items-center gap-1.5 px-3 py-1 shadow-md`}>
                          {getStatusIcon(v.status || '')}
                          {normalizeStatus(v.status || '') === 'em andamento' ? 'Em andamento' : (normalizeStatus(v.status || '') === 'finalizado' ? 'Finalizado' : 'Status')}
                        </Badge>
                      </div>
                      <div className="grid gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium">Tipo de Visto:</span>
                          <span>{String(v.type || '').replace(/:/g, ' - ')}</span>
                        </div>
                        {String(v.type || '').toLowerCase().includes('turismo') && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            <span className="font-medium">Destino:</span>
                            <span>{String(v.country || '—')}</span>
                            {(() => {
                              const fmt = (s?: string) => {
                                if (!s) return "";
                                const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/);
                                if (m) return `${m[3]}/${m[2]}/${m[1]}`;
                                try { const d = new Date(s); return isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR"); } catch { return ""; }
                              };
                              const start = fmt(v.travelStartDate);
                              const end = fmt(v.travelEndDate);
                              const text = [start, end].filter(Boolean).join(" — ");
                              return (
                                <Popover
                                  open={datePopoverFor === String(v.id)}
                                  onOpenChange={(o) => {
                                    setDatePopoverFor(o ? String(v.id) : null);
                                    if (o) {
                                      const parseIso = (val?: string) => {
                                        if (!val) return undefined;
                                        const m = String(val).match(/^(\d{4})-(\d{2})-(\d{2})$/);
                                        return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(val);
                                      };
                                      setDateRangeEdit({ from: parseIso(v.travelStartDate), to: parseIso(v.travelEndDate) });
                                      setDateEditField('from');
                                    } else {
                                      setDateRangeEdit({});
                                    }
                                  }}
                                >
                                  <PopoverTrigger asChild>
                                    <button
                                      className="text-slate-500 hover:underline decoration-dotted"
                                      onClick={() => setDatePopoverFor(String(v.id))}
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
                                          saveTravelDates(String(v.id), f, t);
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
                          <span>{(() => {
                            const iso = v.created_at || '';
                            try { const d = new Date(iso); return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }); } catch { return '—'; }
                          })()}</span>
                        </div>
                        <div className="flex items-center gap-2 cursor-pointer w-full" onClick={() => handleStatusFinalToggle(v)}>
                          <Circle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium">Status Processo:</span>
                          <span className={(() => {
                            const override = statusFinalOverrides[String(v.id)];
                            const s = String((override?.statusFinal ?? v.statusFinal) || "");
                            return getStatusFinalClass(s);
                          })()}>{(() => {
                            const override = statusFinalOverrides[String(v.id)];
                            const s = String((override?.statusFinal ?? v.statusFinal) || "");
                            if (!s) return "—";
                            if (s === "Outro") return String((override?.statusFinalOutro ?? v.statusFinalOutro) || "Outro");
                            return s;
                          })()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium">Fluxo atual:</span>
                          <span>{getVistoStepTitle(
                            v.type || "",
                            (v.currentStep ?? vistosAssignments[String(v.id)]?.currentIndex ?? 0)
                          )}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium">Responsável:</span>
                          <span>{vistosAssignments[String(v.id)]?.responsibleName || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium">Prazo:</span>
                          <span>{(() => {
                            const iso = vistosAssignments[String(v.id)]?.dueDate;
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
            );
          })
        )}
      </div>
    </div>
  );
}
