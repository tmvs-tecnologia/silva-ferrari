"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Radar, Plus, RefreshCw, Trash2, Search, Clock, AlertCircle,
  ChevronRight, Scale, Loader2, X, CheckCircle2, Bell, Eye,
  Calendar, Activity, Filter, ArrowUpRight, Satellite
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonitoredProcess {
  id: number;
  numero_processo: string;
  client_name: string;
  classe: string | null;
  orgao_julgador: string | null;
  assuntos: string | null;
  data_ajuizamento: string | null;
  last_movement_date: string | null;
  last_movement_name: string | null;
  movement_count: number;
  status: string;
  created_at: string;
}

interface Movement {
  id: number;
  movement_name: string;
  movement_date: string;
  complementos: string | null;
  is_new: boolean;
}

export default function MonitoramentoPage() {
  const [processes, setProcesses] = useState<MonitoredProcess[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<MonitoredProcess | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("Ativo");
  const [mounted, setMounted] = useState(false);

  // Form state
  const [formNpu, setFormNpu] = useState("");
  const [formClient, setFormClient] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchProcesses = useCallback(async () => {
    try {
      const res = await fetch(`/api/monitoramento?status=${filterStatus}`);
      if (res.ok) {
        const data = await res.json();
        setProcesses(data);
      }
    } catch (e) {
      console.error("Erro ao buscar processos:", e);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  const fetchMovements = async (processId: number) => {
    setLoadingMovements(true);
    try {
      const res = await fetch(`/api/monitoramento/${processId}`);
      if (res.ok) {
        const data = await res.json();
        setMovements(data.movements || []);
      }
    } catch (e) {
      console.error("Erro ao buscar movimentações:", e);
    } finally {
      setLoadingMovements(false);
    }
  };

  const handleSelectProcess = (p: MonitoredProcess) => {
    setSelectedProcess(p);
    fetchMovements(p.id);
  };

  const handleNpuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 20) value = value.substring(0, 20);
    let formatted = value;
    if (value.length > 7) formatted = value.substring(0, 7) + "-" + value.substring(7);
    if (value.length > 9) formatted = formatted.substring(0, 10) + "." + formatted.substring(10);
    if (value.length > 13) formatted = formatted.substring(0, 15) + "." + formatted.substring(15);
    if (value.length > 14) formatted = formatted.substring(0, 17) + "." + formatted.substring(17);
    if (value.length > 16) formatted = formatted.substring(0, 20) + "." + formatted.substring(20);
    setFormNpu(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNpu = formNpu.replace(/\D/g, "");
    if (cleanNpu.length !== 20) {
      toast.error("O número do processo deve conter 20 dígitos.");
      return;
    }
    if (!formClient.trim()) {
      toast.error("Informe o nome do cliente.");
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch("/api/monitoramento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numeroProcesso: cleanNpu, clientName: formClient.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Processo cadastrado! ${data.movementCount} movimentações encontradas.`);
        setDialogOpen(false);
        setFormNpu("");
        setFormClient("");
        fetchProcesses();
      } else {
        toast.error(data.error || "Erro ao cadastrar processo.");
      }
    } catch (err) {
      toast.error("Erro de conexão.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleRefresh = async (processId: number) => {
    setRefreshingId(processId);
    try {
      const res = await fetch(`/api/monitoramento/${processId}`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.newMovements > 0) {
          toast.success(`${data.newMovements} nova(s) movimentação(ões) detectada(s)!`);
        } else {
          toast.info("Nenhuma nova movimentação encontrada.");
        }
        fetchProcesses();
        if (selectedProcess?.id === processId) {
          fetchMovements(processId);
        }
      } else {
        toast.error(data.error || "Erro ao atualizar.");
      }
    } catch (err) {
      toast.error("Erro de conexão com o Datajud.");
    } finally {
      setRefreshingId(null);
    }
  };

  const handleDelete = async (processId: number) => {
    if (!confirm("Remover este processo do monitoramento?")) return;
    try {
      const res = await fetch(`/api/monitoramento/${processId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Processo removido.");
        if (selectedProcess?.id === processId) {
          setSelectedProcess(null);
          setMovements([]);
        }
        fetchProcesses();
      }
    } catch (err) {
      toast.error("Erro ao remover.");
    }
  };

  const formatNpu = (npu: string) => {
    if (npu.length !== 20) return npu;
    return `${npu.slice(0,7)}-${npu.slice(7,9)}.${npu.slice(9,13)}.${npu.slice(13,14)}.${npu.slice(14,16)}.${npu.slice(16,20)}`;
  };

  const formatDate = (d?: string | null) => {
    if (!d) return "—";
    try { return format(parseISO(d), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }); }
    catch { return d; }
  };

  const formatTimeAgo = (d?: string | null) => {
    if (!d) return "";
    try { return formatDistanceToNow(parseISO(d), { addSuffix: true, locale: ptBR }); }
    catch { return ""; }
  };

  const parseComplementos = (c: string | null) => {
    if (!c) return [];
    try { return JSON.parse(c); } catch { return []; }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#f8fafc] relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {mounted && (
          <>
            <motion.div animate={{ x: [0, 40, 0], y: [0, 25, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] bg-indigo-100/40 rounded-full blur-[100px]" />
            <motion.div animate={{ x: [0, -30, 0], y: [0, 40, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] bg-cyan-100/40 rounded-full blur-[100px]" />
          </>
        )}
      </div>

      <div className="flex flex-col flex-1 relative z-10 w-full">
        {/* Header */}
        <header className="sticky top-0 z-50 px-8 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/20">
              <Satellite className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Monitoramento de Processos</h1>
              <p className="text-xs text-slate-500 font-medium">Vigília processual automatizada via Datajud CNJ</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              {["Ativo", "Arquivado", "all"].map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterStatus === s ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  {s === "all" ? "Todos" : s}
                </button>
              ))}
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white shadow-lg shadow-indigo-500/25 font-bold">
                  <Plus className="w-4 h-4" /> Cadastrar Processo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-white border-slate-200/60 shadow-2xl overflow-hidden p-0">
                <div className="p-8">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-black text-slate-900 tracking-tight">
                      <Scale className="w-6 h-6 text-indigo-600" /> Cadastrar Processo
                    </DialogTitle>
                    <p className="text-sm text-slate-500 font-medium mt-1">Insira os dados para monitoramento em tempo real</p>
                  </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Número do Processo (NPU)</label>
                    <Input placeholder="0000000-00.0000.0.00.0000" value={formNpu} onChange={handleNpuChange} disabled={formLoading} className="text-lg py-5 font-mono" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Nome do Cliente</label>
                    <Input placeholder="Nome completo do cliente" value={formClient} onChange={(e) => setFormClient(e.target.value)} disabled={formLoading} className="py-5" />
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800">
                    <p className="font-semibold flex items-center gap-2"><Radar className="w-4 h-4" /> O que acontece ao cadastrar:</p>
                    <ul className="mt-2 space-y-1 text-xs text-indigo-700">
                      <li>• Consulta automática ao Datajud para obter dados do processo</li>
                      <li>• Todas as movimentações atuais são salvas</li>
                      <li>• O processo será verificado diariamente às 7h</li>
                      <li>• Você receberá notificações de novas movimentações</li>
                    </ul>
                  </div>
                  <Button type="submit" disabled={formLoading} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-bold text-base shadow-lg">
                    {formLoading ? (<><Loader2 className="w-5 h-5 animate-spin mr-2" /> Consultando Datajud...</>) : (<><Satellite className="w-5 h-5 mr-2" /> Iniciar Monitoramento</>)}
                  </Button>
                </form>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <main className="flex-1 max-w-[1600px] mx-auto w-full p-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-140px)]">
            {/* LEFT: Lista de Processos */}
            <div className="lg:col-span-2 flex flex-col bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900">Processos Monitorados</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{processes.length} processo(s)</p>
                </div>
                <button onClick={() => { setLoading(true); fetchProcesses(); }} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                      <p className="text-sm text-slate-500 mt-3">Carregando processos...</p>
                    </div>
                  ) : processes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                        <Satellite className="w-8 h-8 text-indigo-300" />
                      </div>
                      <h3 className="text-base font-bold text-slate-700">Nenhum processo monitorado</h3>
                      <p className="text-sm text-slate-500 mt-1 max-w-[220px]">Clique em "Cadastrar Processo" para começar o monitoramento.</p>
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {processes.map((p, idx) => (
                        <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: idx * 0.03 }}
                          onClick={() => handleSelectProcess(p)}
                          className={`p-4 rounded-2xl cursor-pointer transition-all group border ${selectedProcess?.id === p.id
                            ? "bg-indigo-50/80 border-indigo-200 shadow-md shadow-indigo-500/10"
                            : "bg-white/60 border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm"}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-slate-900 truncate">{p.client_name}</p>
                              <p className="text-xs font-mono text-indigo-600 mt-0.5">{formatNpu(p.numero_processo)}</p>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <button onClick={(e) => { e.stopPropagation(); handleRefresh(p.id); }}
                                className="p-1.5 rounded-lg hover:bg-indigo-100 transition-colors" title="Atualizar">
                                <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 ${refreshingId === p.id ? "animate-spin" : ""}`} />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                                className="p-1.5 rounded-lg hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100" title="Remover">
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </button>
                            </div>
                          </div>

                          {p.classe && <p className="text-xs text-slate-500 truncate mb-2">{p.classe}</p>}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Activity className="w-3 h-3" />
                              <span>{p.movement_count} mov.</span>
                            </div>
                            {p.last_movement_date && (
                              <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                                {formatTimeAgo(p.last_movement_date)}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* RIGHT: Timeline de Movimentações */}
            <div className="lg:col-span-3 flex flex-col bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden min-h-0">
              {!selectedProcess ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-50 to-cyan-50 flex items-center justify-center mb-6 border border-indigo-100">
                    <Eye className="w-10 h-10 text-indigo-300" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-slate-700">Selecione um processo</h3>
                  <p className="text-sm text-slate-500 mt-2 max-w-[280px]">Clique em um processo à esquerda para visualizar o histórico completo de movimentações.</p>
                </div>
              ) : (
                <>
                  {/* Process Header */}
                  <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-cyan-50/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full ${selectedProcess.status === "Ativo" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{selectedProcess.status}</span>
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-900">{selectedProcess.client_name}</h2>
                        <p className="text-sm font-mono text-indigo-600 mt-0.5">{formatNpu(selectedProcess.numero_processo)}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleRefresh(selectedProcess.id)} disabled={refreshingId === selectedProcess.id}
                        className="gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshingId === selectedProcess.id ? "animate-spin" : ""}`} />
                        Atualizar
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      {[
                        { label: "Classe", value: selectedProcess.classe },
                        { label: "Órgão Julgador", value: selectedProcess.orgao_julgador },
                        { label: "Ajuizamento", value: selectedProcess.data_ajuizamento ? formatDate(selectedProcess.data_ajuizamento) : null },
                        { label: "Movimentações", value: String(selectedProcess.movement_count) },
                      ].map((item, i) => (
                        <div key={i} className="bg-white/70 rounded-xl p-3 border border-white">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                          <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">{item.value || "—"}</p>
                        </div>
                      ))}
                    </div>

                    {selectedProcess.assuntos && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {selectedProcess.assuntos.split(", ").map((a, i) => (
                          <span key={i} className="bg-indigo-100/70 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-semibold">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="p-5">
                      <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-500" /> Linha do Tempo
                      </h3>
                      {loadingMovements ? (
                        <div className="flex flex-col items-center py-16">
                          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                          <p className="text-sm text-slate-500 mt-2">Carregando movimentações...</p>
                        </div>
                      ) : movements.length === 0 ? (
                        <p className="text-center text-slate-500 py-12">Nenhuma movimentação registrada.</p>
                      ) : (
                        <div className="space-y-0">
                          {movements.map((mov, idx) => {
                            const comps = parseComplementos(mov.complementos);
                            return (
                              <motion.div key={mov.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }}
                                className="flex gap-4 relative">
                                {/* Timeline line + dot */}
                                <div className="flex flex-col items-center">
                                  <div className={`w-3 h-3 rounded-full z-10 flex-shrink-0 border-2 ${idx === 0 ? "bg-indigo-500 border-indigo-300 shadow-lg shadow-indigo-500/30" : "bg-white border-slate-300"} ${mov.is_new && idx === 0 ? "animate-pulse" : ""}`} />
                                  {idx !== movements.length - 1 && (
                                    <div className="w-px flex-1 bg-slate-200 min-h-[40px]" />
                                  )}
                                </div>

                                {/* Content */}
                                <div className="pb-6 -mt-1 flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="text-xs font-medium text-slate-400">{formatDate(mov.movement_date)}</span>
                                    {mov.is_new && (
                                      <span className="text-[9px] font-extrabold text-white bg-gradient-to-r from-red-500 to-rose-500 px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse shadow-sm">
                                        Nova
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-sm font-semibold ${idx === 0 ? "text-slate-900" : "text-slate-700"}`}>{mov.movement_name}</p>

                                  {comps.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {comps.map((comp: any, ci: number) => (
                                        <p key={ci} className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                          <span className="font-semibold">{comp.nome}:</span> {comp.valor}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
