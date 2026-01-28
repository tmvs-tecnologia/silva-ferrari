"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Folder, FolderPlus, Pencil, Trash2, Search, ChevronRight, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

interface FolderRow {
  id: number;
  name: string;
  module_type: string;
  created_at?: string;
  updated_at?: string;
}

// Cores para os cards (ciclando através das pastas)
const FOLDER_COLORS = [
  { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-500", hover: "hover:text-blue-500", accent: "bg-blue-500/5", accentHover: "group-hover:bg-blue-500/10", button: "hover:bg-blue-500" },
  { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-500", hover: "hover:text-emerald-500", accent: "bg-emerald-500/5", accentHover: "group-hover:bg-emerald-500/10", button: "hover:bg-emerald-500" },
  { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-500", hover: "hover:text-purple-500", accent: "bg-purple-500/5", accentHover: "group-hover:bg-purple-500/10", button: "hover:bg-purple-500" },
  { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-500", hover: "hover:text-amber-500", accent: "bg-amber-500/5", accentHover: "group-hover:bg-amber-500/10", button: "hover:bg-amber-500" },
  { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-500", hover: "hover:text-rose-500", accent: "bg-rose-500/5", accentHover: "group-hover:bg-rose-500/10", button: "hover:bg-rose-500" },
  { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-500", hover: "hover:text-cyan-500", accent: "bg-cyan-500/5", accentHover: "group-hover:bg-cyan-500/10", button: "hover:bg-cyan-500" },
];

export default function PastasVistosPage() {
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingName, setCreatingName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/folders?moduleType=vistos`);
      const data = await res.json();
      setFolders(Array.isArray(data) ? data : []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    let active = true;
    const loadCounts = async () => {
      const next: Record<number, number> = {};
      for (const f of folders) {
        try {
          const r = await fetch(`/api/folders/${f.id}/records`);
          if (!r.ok) continue;
          const arr = await r.json();
          next[f.id] = Array.isArray(arr) ? arr.length : 0;
        } catch { }
      }
      if (active) setCounts(next);
    };
    if (folders.length) loadCounts();
    return () => { active = false; };
  }, [folders]);

  const createFolder = async () => {
    const name = creatingName.trim();
    if (!name) return;
    try {
      const res = await fetch(`/api/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, moduleType: "vistos" }),
      });
      if (res.ok) {
        setCreatingName("");
        setShowCreateModal(false);
        await fetchFolders();
      }
    } catch { }
  };

  const renameFolder = async (id: number) => {
    const name = editingName.trim();
    if (!name) return;
    try {
      const res = await fetch(`/api/folders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setEditingId(null);
        setEditingName("");
        await fetchFolders();
      }
    } catch { }
  };

  const removeFolder = async (id: number) => {
    try {
      const res = await fetch(`/api/folders/${id}`, { method: "DELETE" });
      if (res.ok) await fetchFolders();
    } catch { }
  };

  // Filtrar pastas pela busca
  const filteredFolders = folders.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getColorScheme = (index: number) => FOLDER_COLORS[index % FOLDER_COLORS.length];

  // Primary color for Vistos: Blue instead of Amber/Orange
  const PRIMARY_COLOR_CLASS = "bg-blue-600";
  const PRIMARY_HOVER_CLASS = "hover:bg-blue-500";
  const PRIMARY_TEXT_CLASS = "text-blue-600";
  const PRIMARY_RING_CLASS = "focus:ring-blue-600";
  const PRIMARY_BORDER_CLASS = "border-blue-600/40";
  const PRIMARY_BORDER_HOVER_CLASS = "hover:border-blue-600/70";
  const PRIMARY_BG_LIGHT = "bg-blue-600/10";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500 overflow-x-hidden relative">
      {/* Liquid Blobs Background (Different colors for Vistos) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] bg-blue-300/40 dark:bg-blue-600/20 -top-40 -left-20 rounded-full blur-[100px] opacity-50" />
        <div className="absolute w-[500px] h-[500px] bg-purple-400/30 dark:bg-purple-600/10 bottom-0 -right-20 rounded-full blur-[100px] opacity-50" />
        <div className="absolute w-[400px] h-[400px] bg-emerald-400/20 dark:bg-emerald-600/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px] opacity-50" />
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="space-y-4">
            <Link
              href="/dashboard/vistos"
              className={`inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 ${PRIMARY_TEXT_CLASS} transition-colors group`}
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Voltar
            </Link>
            <div className="flex items-center gap-4">
              <div className={`w-1.5 h-10 ${PRIMARY_COLOR_CLASS} rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]`} />
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                <Briefcase className={`h-8 w-8 ${PRIMARY_TEXT_CLASS}`} />
                Pastas de Vistos
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className={`${PRIMARY_COLOR_CLASS} ${PRIMARY_HOVER_CLASS} text-white font-bold px-6 py-3.5 rounded-2xl shadow-[0_10px_20px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2`}
            >
              <FolderPlus className="h-5 w-5" />
              <span>Nova Pasta</span>
            </button>
          </div>
        </header>

        {/* Search Bar */}
        <div className="liquid-glass p-4 rounded-3xl mb-8 flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-top-4 duration-500 delay-100"
          style={{
            background: "rgba(255, 255, 255, 0.45)",
            backdropFilter: "blur(32px) saturate(200%)",
            WebkitBackdropFilter: "blur(32px) saturate(200%)",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.07), inset 0 0 0 1px rgba(255, 255, 255, 0.3)"
          }}
        >
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar pastas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-white/40 dark:bg-slate-900/40 border-transparent rounded-xl py-2.5 pl-12 pr-4 focus:ring-2 ${PRIMARY_RING_CLASS} focus:border-transparent transition-all outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400`}
            />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2.5 rounded-xl bg-white/40 dark:bg-slate-900/40 text-sm font-semibold flex items-center gap-2 hover:bg-white/60 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 16-4 4-4-4" /><path d="M17 20V4" /><path d="m3 8 4-4 4 4" /><path d="M7 4v16" /></svg>
              Ordenar
            </button>
            <button className="px-4 py-2.5 rounded-xl bg-white/40 dark:bg-slate-900/40 text-sm font-semibold flex items-center gap-2 hover:bg-white/60 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
              Filtrar
            </button>
          </div>
        </div>

        {/* Folders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Create New Folder Card */}
          <div
            onClick={() => setShowCreateModal(true)}
            className={`liquid-glass p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center border-2 border-dashed ${PRIMARY_BORDER_CLASS} ${PRIMARY_BORDER_HOVER_CLASS} transition-all cursor-pointer group hover:bg-white/50 dark:hover:bg-slate-800/50 min-h-[300px] animate-in fade-in slide-in-from-bottom-4 duration-500`}
            style={{
              background: "rgba(255, 255, 255, 0.45)",
              backdropFilter: "blur(32px) saturate(200%)",
              WebkitBackdropFilter: "blur(32px) saturate(200%)",
            }}
          >
            <div className={`w-20 h-20 ${PRIMARY_BG_LIGHT} dark:bg-blue-500/20 rounded-full flex items-center justify-center ${PRIMARY_TEXT_CLASS} group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 mb-4`}>
              <FolderPlus className="h-12 w-12" />
            </div>
            <h3 className="font-bold text-xl dark:text-white">Criar Nova Pasta</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-[200px]">
              Organize seus processos de vistos em categorias
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="liquid-glass p-6 rounded-[2.5rem] min-h-[300px] animate-pulse"
                  style={{
                    background: "rgba(255, 255, 255, 0.45)",
                    backdropFilter: "blur(32px) saturate(200%)",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
                    <div className="flex gap-1">
                      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                    </div>
                  </div>
                  <div className="mt-8 mb-6">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4 mb-2" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/2" />
                  </div>
                  <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
                </div>
              ))}
            </>
          )}

          {/* Folder Cards */}
          {!loading && filteredFolders.map((folder, index) => {
            const colors = getColorScheme(index);
            return (
              <div
                key={folder.id}
                className="liquid-glass p-6 rounded-[2.5rem] transition-all duration-300 relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-xl animate-in fade-in slide-in-from-bottom-4"
                style={{
                  background: "rgba(255, 255, 255, 0.45)",
                  backdropFilter: "blur(32px) saturate(200%)",
                  WebkitBackdropFilter: "blur(32px) saturate(200%)",
                  border: "1px solid rgba(255, 255, 255, 0.5)",
                  boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.07), inset 0 0 0 1px rgba(255, 255, 255, 0.3)",
                  animationDelay: `${(index + 1) * 100}ms`
                }}
              >
                {/* Background accent */}
                <div className={`absolute top-0 right-0 w-32 h-32 ${colors.accent} rounded-bl-full -mr-10 -mt-10 ${colors.accentHover} transition-colors`} />

                {/* Header with icon and actions */}
                <div className="flex items-start justify-between relative z-10">
                  <div className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center ${colors.text}`}>
                    <Folder className="h-8 w-8" />
                  </div>
                  <div className="flex gap-1">
                    {editingId === folder.id ? (
                      <Button
                        size="sm"
                        onClick={() => renameFolder(folder.id)}
                        className={`${PRIMARY_COLOR_CLASS} ${PRIMARY_HOVER_CLASS} text-white`}
                      >
                        Salvar
                      </Button>
                    ) : (
                      <button
                        onClick={() => { setEditingId(folder.id); setEditingName(folder.name); }}
                        className={`p-2 text-slate-400 hover:${PRIMARY_TEXT_CLASS} hover:bg-white/80 dark:hover:bg-slate-800/80 rounded-xl transition-all`}
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-white/80 dark:hover:bg-slate-800/80 rounded-xl transition-all">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir pasta</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a pasta "{folder.name}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeFolder(folder.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Folder info */}
                <div className="mt-8 mb-6 relative z-10">
                  {editingId === folder.id ? (
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && renameFolder(folder.id)}
                      className="text-xl font-bold"
                      autoFocus
                    />
                  ) : (
                    <h3 className={`font-bold text-xl text-slate-800 dark:text-white mb-1 ${colors.hover} transition-colors group-hover:${colors.text} truncate`} title={folder.name}>
                      {folder.name}
                    </h3>
                  )}
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs font-medium uppercase tracking-wider">
                      {counts[folder.id] ?? 0} cadastros
                    </span>
                  </div>
                </div>

                {/* View Details Button */}
                <Link
                  href={`/dashboard/vistos/pastas/${folder.id}`}
                  className={`relative z-10 flex items-center justify-between w-full py-4 px-6 rounded-2xl bg-white/60 dark:bg-slate-900/40 text-sm font-bold text-slate-700 dark:text-slate-200 ${colors.button} hover:text-white transition-all group/btn shadow-sm`}
                >
                  <span>Ver Detalhes</span>
                  <ChevronRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}

          {/* Empty State */}
          {!loading && filteredFolders.length === 0 && folders.length > 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">Nenhuma pasta encontrada com "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        {!loading && folders.length > 0 && (
          <footer className="mt-16 flex flex-wrap gap-8 items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${PRIMARY_TEXT_CLASS}`}
                style={{
                  background: "rgba(255, 255, 255, 0.45)",
                  backdropFilter: "blur(32px) saturate(200%)",
                  border: "1px solid rgba(255, 255, 255, 0.5)",
                }}
              >
                <Folder className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 dark:text-slate-500">Total de Pastas</p>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{folders.length}</p>
              </div>
            </div>
          </footer>
        )}
      </div>

      {/* Create Folder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowCreateModal(false)}>
          <div
            className="w-full max-w-md p-8 rounded-3xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            style={{
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(32px) saturate(200%)",
              border: "1px solid rgba(255, 255, 255, 0.5)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 ${PRIMARY_BG_LIGHT} rounded-2xl flex items-center justify-center ${PRIMARY_TEXT_CLASS}`}>
                <FolderPlus className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Nova Pasta</h2>
                <p className="text-sm text-slate-500">Crie uma pasta para organizar seus processos</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome da pasta</label>
                <input
                  type="text"
                  value={creatingName}
                  onChange={(e) => setCreatingName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createFolder()}
                  placeholder="Ex: Vistos Tecnologia"
                  className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 ${PRIMARY_RING_CLASS} focus:border-transparent transition-all outline-none text-slate-700`}
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 px-6 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={createFolder}
                  disabled={!creatingName.trim()}
                  className={`flex-1 py-3 px-6 rounded-xl ${PRIMARY_COLOR_CLASS} text-white font-semibold ${PRIMARY_HOVER_CLASS} transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_20px_rgba(37,99,235,0.3)]`}
                >
                  Criar Pasta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS for dark mode liquid glass */}
      <style jsx global>{`
        .dark .liquid-glass {
          background: rgba(15, 23, 42, 0.75) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.08) !important;
        }
      `}</style>
    </div>
  );
}
