"use client";

import React, { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar as DateRangeCalendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { ArrowLeft, Search, ArrowUpDown, Filter, Moon, Sun, UserPlus, Eye, Pencil, Trash2, Check, Plane, Briefcase, Building2, Globe, Clock, CheckCircle2, Calendar, User, MoreHorizontal, FileText, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FolderRow { id: number; name: string; module_type: string; }
interface Visto { id: number; client_name: string; type?: string; status?: string; created_at?: string; updated_at?: string; country?: string; travelStartDate?: string; travelEndDate?: string; currentStep?: number; statusFinal?: string; statusFinalOutro?: string; }

export default function PastaVistosDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const folderId = parseInt(resolvedParams.id);
  const [folder, setFolder] = useState<FolderRow | null>(null);
  const [records, setRecords] = useState<{ record_id: number; module_type: string }[]>([]);
  const [vistosList, setVistosList] = useState<Visto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedAddId, setSelectedAddId] = useState<string>("");
  const [datePopoverFor, setDatePopoverFor] = useState<string | null>(null);
  const [dateRangeEdit, setDateRangeEdit] = useState<{ from?: Date; to?: Date }>({});
  const [dateEditField, setDateEditField] = useState<'from' | 'to'>('from');
  const [vistosAssignments, setVistosAssignments] = useState<Record<string, { responsibleName?: string; dueDate?: string; currentIndex?: number }>>({});

  // Design System state
  const [searchQuery, setSearchQuery] = useState("");
  const [isDark, setIsDark] = useState(false);

  // Toggle Dark Mode (Local only for this view for now, usually handled by ThemeProvider)
  // Since we are inside a layout that probably handles theme, we might just use the global theme mechanism if available.
  // But strictly following the file provided, we'll implement a local toggle or just assume global.
  // We'll skip manual classList toggle to avoid conflict with potential global providers, or leave strict visual toggle if preferred.
  // Let's rely on standard Tailwind 'dark' class if the app uses it.

  useEffect(() => {
    // Check if system preference or saved preference
    if (document.documentElement.classList.contains('dark')) setIsDark(true);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      setIsDark(true);
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
    } catch { }
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
    } catch { }
  };

  const addRecord = async () => {
    const rid = parseInt(selectedAddId);
    if (isNaN(rid)) return;
    try {
      const res = await fetch(`/api/folders/${folderId}/records`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recordId: rid, moduleType: 'vistos' }) });
      if (res.ok) { setSelectedAddId(''); await loadAll(); }
    } catch { }
  };

  const removeRecord = async (rid: number) => {
    try {
      const res = await fetch(`/api/folders/${folderId}/records?recordId=${rid}`, { method: 'DELETE' });
      if (res.ok) await loadAll();
    } catch { }
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
    } catch { }
  };

  // Assignments Logic
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
            } catch { }
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
      setVistosAssignments(map);
    };
    loadAssignments();
  }, [recordsIdsKey]);

  // Helpers
  const normalizeStatus = (status: string) => (status || "").toLowerCase();
  const getStatusColor = (status: string) => {
    const s = normalizeStatus(status);
    if (s === "em andamento") return "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-700/50";
    if (s === "finalizado") return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-700/50";
    return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/50";
  };

  const getStatusDotColor = (status: string) => {
    const s = normalizeStatus(status);
    if (s === "em andamento") return "bg-blue-500 animate-pulse";
    if (s === "finalizado") return "bg-emerald-500";
    return "bg-slate-400";
  }

  const getTypeIcon = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("turismo")) return <Plane className="h-5 w-5" />;
    if (t.includes("trabalho")) return <Briefcase className="h-5 w-5" />;
    if (t.includes("investidor")) return <Building2 className="h-5 w-5" />;
    return <Globe className="h-5 w-5" />;
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const filteredRecords = useMemo(() => {
    if (!searchQuery) return records;
    return records.filter(r => {
      const v = vistosList.find(x => x.id === r.record_id);
      if (!v) return false;
      const q = searchQuery.toLowerCase();
      return v.client_name.toLowerCase().includes(q) || (v.country || "").toLowerCase().includes(q);
    });
  }, [records, vistosList, searchQuery]);

  return (
    <div className="relative z-10 font-sans text-slate-900 dark:text-slate-100">
      {/* Liquid Blobs - positioned absolutely relative to this container or fixed if preferred. 
          Using fixed to allow scrolling content over them. */}
      <div className="fixed -z-10 top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="liquid-blob w-[600px] h-[600px] bg-orange-300/40 dark:bg-orange-600/20 -top-40 -left-20"></div>
        <div className="liquid-blob w-[500px] h-[500px] bg-blue-400/30 dark:bg-blue-600/10 bottom-0 -right-20"></div>
        <div className="liquid-blob w-[400px] h-[400px] bg-purple-400/20 dark:bg-purple-600/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="max-w-[1440px] mx-auto pb-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors group"
            >
              <ArrowLeft className="w-[18px] group-hover:-translate-x-1 transition-transform" />
              Voltar
            </button>
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white bg-transparent border-b border-primary outline-none min-w-[300px]"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onBlur={saveName}
                    onKeyDown={(e) => e.key === 'Enter' && saveName()}
                    autoFocus
                  />
                  <Button size="sm" onClick={saveName} variant="ghost"><Check className="h-6 w-6 text-green-500" /></Button>
                </div>
              ) : (
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white group flex items-center gap-3">
                  {folder?.name || 'Pasta sem Nome'}
                  <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                    <Pencil className="h-5 w-5 text-slate-400" />
                  </button>
                </h1>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="liquid-glass p-3.5 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all glowing-border"
              onClick={toggleTheme}
            >
              {isDark ? <Sun className="h-6 w-6 text-yellow-400" /> : <Moon className="h-6 w-6" />}
            </button>

            <Popover>
              <PopoverTrigger asChild>
                <button className="bg-primary hover:bg-orange-600 text-white font-bold px-6 py-3.5 rounded-2xl shadow-[0_10px_20px_rgba(245,158,11,0.3)] transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2">
                  <UserPlus className="h-6 w-6" />
                  <span>Adicionar Cliente</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[420px]" align="end">
                <Command>
                  <CommandInput placeholder="Buscar cliente..." />
                  <CommandList>
                    <CommandEmpty>Nenhum cadastro encontrado.</CommandEmpty>
                    <CommandGroup heading="Clientes Disponíveis">
                      {candidates.map((v) => (
                        <CommandItem key={v.id} value={`${v.client_name} ${v.type || ''}`} onSelect={() => setSelectedAddId(String(v.id))}>
                          <div className="flex items-center gap-2 w-full">
                            <span className="truncate flex-1">{v.client_name}</span>
                            <span className="text-xs text-slate-400">{v.type}</span>
                            {String(selectedAddId) === String(v.id) && <Check className="ml-auto h-4 w-4 text-primary" />}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                  {selectedAddId && (
                    <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                      <Button onClick={addRecord} className="w-full bg-primary hover:bg-orange-600 text-white">Adicionar Selecionado</Button>
                    </div>
                  )}
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        <div className="liquid-glass p-4 rounded-3xl mb-8 flex flex-col md:flex-row gap-4 glowing-border">
          <div className="relative flex-grow">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="h-5 w-5" />
            </span>
            <input
              className="w-full bg-white/40 dark:bg-slate-900/40 border-transparent rounded-xl py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
              placeholder="Pesquisar clientes pelo nome ou documento..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2.5 rounded-xl bg-white/40 dark:bg-slate-900/40 text-sm font-semibold flex items-center gap-2 hover:bg-white/60 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200">
              <ArrowUpDown className="h-[18px] w-[18px]" />
              Ordenar
            </button>
            <button className="px-4 py-2.5 rounded-xl bg-white/40 dark:bg-slate-900/40 text-sm font-semibold flex items-center gap-2 hover:bg-white/60 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200">
              <Filter className="h-[18px] w-[18px]" />
              Status
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="px-8 py-2 hidden lg:grid grid-cols-12 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <div className="col-span-4">Cliente</div>
            <div className="col-span-3">Processo</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-2 text-right">Ações</div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-400">Carregando...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-20 text-slate-400">Nenhum cliente nesta pasta</div>
          ) : (
            filteredRecords.map((r) => {
              const v = vistosList.find((x) => x.id === r.record_id);
              if (!v) return null;

              return (
                <div key={r.record_id} className="liquid-glass p-4 lg:px-8 rounded-2xl row-hover transition-all duration-300 glowing-border group">
                  <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-4 lg:gap-0">
                    <div className="col-span-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                        {getInitials(v.client_name)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 dark:text-white truncate">{v.client_name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 lg:hidden mt-1">
                          {getTypeIcon(v.type || "")}
                          <span className="truncate">{v.type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-3 hidden lg:block">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {getTypeIcon(v.type || "")}
                        </div>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">{v.type}</span>
                      </div>
                    </div>

                    <div className="col-span-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(v.status || '')}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${getStatusDotColor(v.status || '')}`}></span>
                        {normalizeStatus(v.status || '') || 'Indefinido'}
                      </span>
                    </div>

                    <div className="col-span-2 flex justify-end gap-2 opacity-100 lg:opacity-60 lg:group-hover:opacity-100 transition-opacity">
                      <Link href={`/dashboard/vistos/${v.id}`}>
                        <button className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all" title="Visualizar">
                          <Eye className="w-5 h-5" />
                        </button>
                      </Link>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all" title="Remover da pasta">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover da pasta</AlertDialogTitle>
                            <AlertDialogDescription>
                              Você tem certeza que deseja remover {v.client_name} desta pasta? O registro do visto não será excluído.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeRecord(v.id)} className="bg-red-500 hover:bg-red-600 text-white">Remover</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <footer className="mt-16 flex flex-wrap gap-8 items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl liquid-glass flex items-center justify-center text-primary glowing-border">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 dark:text-slate-500">Total de Clientes</p>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{records.length}</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
