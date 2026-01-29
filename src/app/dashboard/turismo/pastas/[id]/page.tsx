"use client";

import React, { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import {
  ArrowLeft,
  Search,
  ArrowUpDown,
  Filter,
  Eye,
  Pencil,
  Trash2,
  UserPlus,

  Check,
  ChevronsUpDown,
  Users
} from "lucide-react";

interface FolderRow { id: number; name: string; module_type: string; }
interface Visto { id: number; client_name: string; type?: string; status?: string; created_at?: string; updated_at?: string; country?: string; travelStartDate?: string; travelEndDate?: string; currentStep?: number; statusFinal?: string; statusFinalOutro?: string; }

export default function PastaTurismoDetail({ params }: { params: Promise<{ id: string }> }) {
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

  const [addToFolderOpen, setAddToFolderOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const normalizeStatus = (status: string) => (status || "").toLowerCase();

  const getStatusColor = (status: string) => {
    switch (normalizeStatus(status)) {
      case "em andamento":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-700/50";
      case "finalizado":
      case "concluído":
      case "concluido":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-700/50";
      case "pendente":
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/50";
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (normalizeStatus(status)) {
      case "em andamento": return "bg-amber-500";
      case "finalizado":
      case "concluído":
      case "concluido": return "bg-emerald-500";
      default: return "bg-slate-400";
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [folderRes, recRes, vistosRes] = await Promise.all([
        fetch(`/api/folders/${folderId}`),
        fetch(`/api/folders/${folderId}/records?includeDetails=true`),
        fetch(`/api/turismo?limit=200`),
      ]);
      const fold = await folderRes.json();
      const recs = await recRes.json(); // Now contains details
      const vistos = await vistosRes.json();

      setFolder(fold || null);

      // Ensure we extract ID and type for records state
      setRecords(Array.isArray(recs) ? recs.map((r: any) => ({
        record_id: r.record_id,
        module_type: r.module_type
      })) : []);

      // Create mapping from recs details
      const folderVistosMapped = Array.isArray(recs) ? recs.map((r: any) => {
        const v = r.details;
        if (!v) return null;
        return {
          id: v.id,
          client_name: v.clientName || v.client_name,
          type: v.type,
          status: v.status,
          created_at: v.created_at || v.createdAt,
          updated_at: v.updated_at || v.updatedAt,
          country: v.country,
          travelStartDate: v.travelStartDate || v.travel_start_date,
          travelEndDate: v.travelEndDate || v.travel_end_date,
          currentStep: v.currentStep ?? v.current_step,
          statusFinal: v.statusFinal ?? v.status_final,
          statusFinalOutro: v.statusFinalOutro ?? v.status_final_outro
        };
      }).filter((v: any): v is Visto => v !== null) : [];

      // We still use vistosList for candidates to add to folder
      setVistosList(Array.isArray(vistos) ? vistos.map((v: any) => ({
        id: v.id,
        client_name: v.clientName || v.client_name,
        type: v.type,
        status: v.status,
        created_at: v.created_at || v.createdAt,
        updated_at: v.updated_at || v.updatedAt,
        country: v.country,
        travelStartDate: v.travelStartDate || v.travel_start_date,
        travelEndDate: v.travelEndDate || v.travel_end_date,
        currentStep: v.currentStep ?? v.current_step,
        statusFinal: v.statusFinal ?? v.status_final,
        statusFinalOutro: v.statusFinalOutro ?? v.status_final_outro
      })) : []);

      // Overwrite vistosList with combined data to ensure all records in folder are available for display
      setVistosList(prevVistos => {
        const existingIds = new Set(prevVistos.map(v => v.id));
        const missingFromList = folderVistosMapped.filter(v => !existingIds.has(v.id));
        return [...prevVistos, ...missingFromList];
      });

      setNewName(String((fold && fold.name) || ''));
    } catch (err) {
      console.error("Error loading folder details:", err);
    }
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
      const res = await fetch(`/api/folders/${folderId}/records`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recordId: rid, moduleType: 'turismo' }) });
      if (res.ok) {
        setSelectedAddId('');
        setAddToFolderOpen(false);
        await loadAll();
      }
    } catch { }
  };

  const removeRecord = async (rid: number) => {
    try {
      const res = await fetch(`/api/folders/${folderId}/records?recordId=${rid}`, { method: 'DELETE' });
      if (res.ok) await loadAll();
    } catch { }
  };

  // Filter records based on search
  const filteredRecords = useMemo(() => {
    return records.map(r => {
      const v = vistosList.find(x => x.id === r.record_id);
      return v ? v : null;
    }).filter((v): v is Visto => {
      if (!v) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        (v?.client_name ? v.client_name.toLowerCase().includes(term) : false) ||
        (v?.country ? v.country.toLowerCase().includes(term) : false)
      );
    });
  }, [records, vistosList, searchTerm]);

  // Handle Initials
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return "??";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Handle Avatar Color (deterministic based on name length)
  const getAvatarColors = (name: string) => {
    const len = name.length;
    const colors = [
      "bg-orange-100 dark:bg-orange-900/30 text-primary",
      "bg-blue-100 dark:bg-blue-900/30 text-blue-500",
      "bg-purple-100 dark:bg-purple-900/30 text-purple-500",
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500",
      "bg-rose-100 dark:bg-rose-900/30 text-rose-500",
    ];
    return colors[len % colors.length];
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden font-display transition-colors duration-500">
      <style jsx global>{`
        .liquid-glass {
            background: rgba(255, 255, 255, 0.45);
            backdrop-filter: blur(32px) saturate(200%);
            -webkit-backdrop-filter: blur(32px) saturate(200%);
            border: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07),
                        inset 0 0 0 1px rgba(255, 255, 255, 0.3);
        }
        .dark .liquid-glass {
            background: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(32px) saturate(180%);
            -webkit-backdrop-filter: blur(32px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.12);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4),
                        inset 0 0 0 1px rgba(255, 255, 255, 0.08);
        }
        .glowing-border {
            position: relative;
        }
        .glowing-border::after {
            content: '';
            position: absolute;
            inset: -1.5px;
            border-radius: inherit;
            padding: 1.5px;
            background: linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.1), rgba(245,158,11,0.5));
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
        }
        .dark .glowing-border::after {
            background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05), rgba(245,158,11,0.4));
        }
        .liquid-blob {
            position: fixed;
            z-index: 0;
            filter: blur(100px);
            border-radius: 50%;
            opacity: 0.5;
            pointer-events: none;
        }
        .row-hover:hover {
            transform: translateX(4px);
            background: rgba(255, 255, 255, 0.6);
        }
        .dark .row-hover:hover {
            background: rgba(30, 41, 59, 0.85);
        }
      `}</style>

      {/* Background Blobs */}
      <div className="liquid-blob w-[600px] h-[600px] bg-orange-300/40 dark:bg-orange-600/20 -top-40 -left-20"></div>
      <div className="liquid-blob w-[500px] h-[500px] bg-blue-400/30 dark:bg-blue-600/10 bottom-0 -right-20"></div>
      <div className="liquid-blob w-[400px] h-[400px] bg-purple-400/20 dark:bg-purple-600/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>

      <div className="max-w-[1440px] mx-auto px-8 py-10 relative z-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-amber-500 transition-colors group"
            >
              <ArrowLeft className="w-[18px] group-hover:-translate-x-1 transition-transform" />
              Voltar
            </button>
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-10 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    className="text-4xl font-extrabold tracking-tight bg-transparent border-b border-amber-500 rounded-none px-0 h-auto focus-visible:ring-0 focus-visible:border-amber-600"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoFocus
                  />
                  <Button size="sm" onClick={saveName} className="bg-amber-500 hover:bg-amber-600">Salvar</Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 group">
                  <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {folder?.name || 'Pasta'}
                  </h1>
                  <button
                    onClick={() => { setNewName(folder?.name || ''); setEditing(true); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-400 hover:text-amber-500"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={addToFolderOpen} onOpenChange={setAddToFolderOpen}>
              <DialogTrigger asChild>
                <button className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3.5 rounded-2xl shadow-[0_10px_20px_rgba(245,158,11,0.3)] transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  <span>Adicionar Cliente</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md p-0 border-0 bg-transparent shadow-none">
                <div className="liquid-glass p-6 rounded-3xl glowing-border relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                  <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-extrabold text-center text-slate-800 dark:text-white flex items-center justify-center gap-2">
                      <UserPlus className="w-6 h-6 text-amber-500" />
                      Adicionar Cliente
                    </DialogTitle>
                    <p className="text-center text-slate-500 dark:text-slate-400 text-sm mt-1">
                      Selecione um cliente da lista para incluir nesta pasta.
                    </p>
                  </DialogHeader>

                  <div className="flex flex-col gap-5">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 h-12 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all focus:ring-2 focus:ring-amber-500/50"
                        >
                          <span className="truncate text-base">
                            {(() => {
                              const sel = vistosList.find((x) => String(x.id) === String(selectedAddId));
                              return sel ? `${sel.client_name}` : 'Selecione um cliente...';
                            })()}
                          </span>
                          <ChevronsUpDown className="h-4 w-4 opacity-50 text-slate-500" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 rounded-xl shadow-2xl">
                        <Command className="bg-transparent">
                          <CommandInput placeholder="Buscar cliente..." className="h-11" />
                          <CommandList>
                            <CommandEmpty className="py-6 text-center text-slate-500">Nenhum cliente encontrado.</CommandEmpty>
                            <CommandGroup className="max-h-[200px] overflow-y-auto">
                              {candidates.map((v) => (
                                <CommandItem
                                  key={v.id}
                                  value={`${v.client_name}`}
                                  onSelect={() => setSelectedAddId(String(v.id))}
                                  className="py-3 px-4 aria-selected:bg-amber-50 dark:aria-selected:bg-amber-900/20 aria-selected:text-amber-600 dark:aria-selected:text-amber-400 cursor-pointer transition-colors"
                                >
                                  <span className="truncate font-medium">{v.client_name}</span>
                                  {String(selectedAddId) === String(v.id) && <Check className="ml-auto h-4 w-4 text-amber-500" />}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <Button
                      onClick={addRecord}
                      disabled={!selectedAddId}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold h-12 rounded-xl shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.23)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
                    >
                      Confirmar Adição
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="liquid-glass p-4 rounded-3xl mb-8 flex flex-col md:flex-row gap-4 glowing-border">
          <div className="relative flex-grow">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              className="w-full bg-white/40 dark:bg-slate-900/40 border-transparent rounded-xl py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
              placeholder="Pesquisar clientes pelo nome ou documento..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2.5 rounded-xl bg-white/40 dark:bg-slate-900/40 text-sm font-semibold flex items-center gap-2 hover:bg-white/60 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300">
              <ArrowUpDown className="w-[18px]" />
              Ordenar
            </button>
            <button className="px-4 py-2.5 rounded-xl bg-white/40 dark:bg-slate-900/40 text-sm font-semibold flex items-center gap-2 hover:bg-white/60 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300">
              <Filter className="w-[18px]" />
              Status
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="px-8 py-2 hidden lg:grid grid-cols-12 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <div className="col-span-4">Cliente</div>
            <div className="col-span-3">Destino</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-2 text-right">Ações</div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-400">Carregando...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-20 text-slate-400">Nenhum cadastro encontrado nesta pasta</div>
          ) : (
            filteredRecords.map((v) => (
              <div key={v.id} className="liquid-glass p-4 lg:px-8 rounded-2xl row-hover transition-all duration-300 glowing-border">
                <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-4 lg:gap-0">
                  <div className="col-span-4 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${getAvatarColors(v.client_name)}`}>
                      {getInitials(v.client_name)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white capitalize">
                        {v.client_name.toLowerCase()}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 lg:hidden">Destino: {v.country || '—'}</p>
                    </div>
                  </div>

                  <div className="col-span-3 hidden lg:block">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {v.country || '—'}
                    </span>
                  </div>

                  <div className="col-span-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(v.status || '')}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${getStatusDotColor(v.status || '')} ${normalizeStatus(v.status || '') === 'em andamento' ? 'animate-pulse' : ''}`}></span>
                      {v.status || 'Pendente'}
                    </span>
                  </div>

                  <div className="col-span-2 flex justify-end gap-2">
                    <Link href={`/dashboard/turismo/${v.id}`}>
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
                          <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                          <AlertDialogDescription>
                            Remover {v.client_name} desta pasta?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => removeRecord(v.id)}>Remover</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <footer className="mt-16 flex flex-wrap gap-8 items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl liquid-glass flex items-center justify-center text-amber-500 glowing-border">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 dark:text-slate-500">Total de Clientes</p>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{filteredRecords.length}</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
