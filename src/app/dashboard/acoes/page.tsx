"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Calendar,
    ChevronLeft,
    Eye,
    Activity,
    ArrowRight,
    Search,
    Filter,
    RefreshCw,
    X,
    FilterX,
    CheckCircle2,
    Clock,
    LayoutGrid,
    LayoutList
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { NotificationBell } from "@/components/notification-bell";

interface ActionItem {
    id: string;
    cliente?: string;
    clientName?: string; // Some APIs use camelCase
    status: string;
    data?: string;
    modulo: string;
    created_at?: string;
    createdAt?: string;
    processo_numero?: string;
    numeroProcesso?: string;
    [key: string]: any;
}

interface ModuleConfig {
    title: string;
    icon: string;
    href: string;
    color: string;
    bg: string;
    border: string;
    iconBg: string;
    api: string;
}

const MODULES_CONFIG: Record<string, ModuleConfig> = {
    "acoes-civeis": {
        title: "Ações Cíveis",
        icon: "https://cdn-icons-png.flaticon.com/512/1157/1157026.png",
        href: "/dashboard/acoes-civeis",
        color: "text-blue-600",
        bg: "bg-blue-50/50",
        border: "border-blue-100",
        iconBg: "bg-blue-100",
        api: "/api/acoes-civeis",
    },
    "acoes-trabalhistas": {
        title: "Ações Trabalhistas",
        icon: "https://cdn-icons-png.flaticon.com/512/3135/3135687.png",
        href: "/dashboard/acoes-trabalhistas",
        color: "text-indigo-600",
        bg: "bg-indigo-50/50",
        border: "border-indigo-100",
        iconBg: "bg-indigo-100",
        api: "/api/acoes-trabalhistas",
    },
    "acoes-criminais": {
        title: "Ações Criminais",
        icon: "https://cdn-icons-png.flaticon.com/512/929/929429.png",
        href: "/dashboard/acoes-criminais",
        color: "text-rose-600",
        bg: "bg-rose-50/50",
        border: "border-rose-100",
        iconBg: "bg-rose-100",
        api: "/api/acoes-criminais",
    },
    "compra-venda": {
        title: "Compra e Venda",
        icon: "https://cdn-icons-png.flaticon.com/512/14523/14523054.png",
        href: "/dashboard/compra-venda",
        color: "text-emerald-600",
        bg: "bg-emerald-50/50",
        border: "border-emerald-100",
        iconBg: "bg-emerald-100",
        api: "/api/compra-venda-imoveis",
    },
    "perda-nacionalidade": {
        title: "Nacionalidade",
        icon: "https://cdn-icons-png.flaticon.com/512/4284/4284504.png",
        href: "/dashboard/perda-nacionalidade",
        color: "text-amber-600",
        bg: "bg-amber-50/50",
        border: "border-amber-100",
        iconBg: "bg-amber-100",
        api: "/api/perda-nacionalidade",
    },
    "vistos": {
        title: "Vistos",
        icon: "https://cdn-icons-png.flaticon.com/512/7082/7082001.png",
        href: "/dashboard/vistos",
        color: "text-teal-600",
        bg: "bg-teal-50/50",
        border: "border-teal-100",
        iconBg: "bg-teal-100",
        api: "/api/vistos",
    },
    "turismo": {
        title: "Turismo",
        icon: "https://cdn-icons-png.flaticon.com/512/2200/2200326.png",
        href: "/dashboard/turismo",
        color: "text-cyan-600",
        bg: "bg-cyan-50/50",
        border: "border-cyan-100",
        iconBg: "bg-cyan-100",
        api: "/api/turismo",
    },
};

export default function AcoesPage() {
    const router = useRouter();
    const [data, setData] = useState<Record<string, ActionItem[]>>({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [moduleFilter, setModuleFilter] = useState<string>("all");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [mounted, setMounted] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = async () => {
        setIsRefreshing(true);
        try {
            const endpoints = Object.entries(MODULES_CONFIG).map(([key, config]) => ({
                key,
                url: `${config.api}?limit=50`
            }));

            const responses = await Promise.all(
                endpoints.map((e) => fetch(e.url).then(async res => {
                    if (!res.ok) return [];
                    const json = await res.json();
                    // Ensure it's an array and mark with module key
                    return (Array.isArray(json) ? json : []).map(item => ({ ...item, modulo: e.key }));
                }).catch(() => []))
            );

            const newData: Record<string, ActionItem[]> = {};
            endpoints.forEach((e, i) => {
                if (responses[i].length > 0) {
                    newData[e.key] = responses[i];
                }
            });

            setData(newData);
        } catch (error) {
            console.error("Error fetching actions:", error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchData();
    }, []);

    const filteredData = useMemo(() => {
        const result: Record<string, ActionItem[]> = {};

        Object.entries(data).forEach(([key, items]) => {
            // Filter by module
            if (moduleFilter !== "all" && moduleFilter !== key) return;

            const filtered = items.filter(item => {
                // Filter by search query
                const query = searchQuery.toLowerCase();
                const name = (item.cliente || item.clientName || item.nome_vendedor || item.comprador_nome || "").toLowerCase();
                const id = (item.id || "").toString().toLowerCase();
                const proc = (item.processo_numero || item.numeroProcesso || "").toLowerCase();
                const matchesSearch = !searchQuery.trim() || name.includes(query) || id.includes(query) || proc.includes(query);

                // Filter by status
                const status = (item.status || "").toLowerCase();
                let matchesStatus = true;
                if (statusFilter === "andamento") {
                    matchesStatus = status.includes("andamento") || status === "ativo";
                } else if (statusFilter === "finalizado") {
                    matchesStatus = status.includes("finalizado") || status === "concluido";
                }

                return matchesSearch && matchesStatus;
            });

            if (filtered.length > 0) {
                result[key] = filtered;
            }
        });

        return result;
    }, [data, searchQuery, statusFilter, moduleFilter]);

    const totalActions = useMemo(() =>
        Object.values(data).reduce((acc, curr) => acc + curr.length, 0),
        [data]);

    const filteredTotal = useMemo(() =>
        Object.values(filteredData).reduce((acc, curr) => acc + curr.length, 0),
        [filteredData]);

    if (!mounted) return null;

    return (
        <div className="flex flex-col min-h-screen w-full bg-[#f8fafc] relative overflow-x-hidden">
            {/* Liquid Background Blobs */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        x: [0, 50, 0],
                        y: [0, 30, 0],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-blue-100/40 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{
                        x: [0, -40, 0],
                        y: [0, 50, 0],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-purple-100/40 rounded-full blur-[100px]"
                />
            </div>

            <div className="flex flex-col flex-1 relative z-10 w-full">
                {/* Header */}
                <header className="sticky top-0 z-50 px-8 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.back()}
                            className="p-2.5 rounded-xl hover:bg-slate-100 transition-all border border-slate-200 bg-white shadow-sm hover:scale-105 active:scale-95"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <h1 className="text-2xl font-extrabold tracking-tight">
                            <span className="text-slate-900">Central de</span>{" "}
                            <span className="text-blue-600">Processos</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex px-5 py-2 rounded-full border border-slate-200 bg-white/40 items-center gap-2 text-sm font-semibold text-slate-700 shadow-sm">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            {new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
                        </div>
                        <NotificationBell />
                    </div>
                </header>

                <main className="flex-1 max-w-7xl mx-auto w-full p-8">
                    {/* Actions Summary */}
                    <section className="mb-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/40 backdrop-blur-xl border border-white/60 p-8 rounded-[2.5rem] shadow-xl shadow-blue-500/5 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-blue-500/5 to-transparent pointer-events-none" />
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                                <div className="text-center md:text-left">
                                    <h2 className="text-3xl font-black text-slate-900 mb-2 mt-2">Visão Consolidada</h2>
                                    <p className="text-slate-500 font-medium max-w-md">Gerencie todos os processos do escritório em um único lugar, filtrados por módulo e cliente.</p>
                                </div>

                                <div className="flex items-center gap-12">
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-1">Total Ativos</p>
                                        <p className="text-5xl font-black text-slate-900">{loading ? "..." : totalActions}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Módulos</p>
                                        <p className="text-5xl font-black text-slate-900">{Object.keys(data).length}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </section>

                    {/* Search and Filters */}
                    <div className="flex flex-col gap-6 mb-10">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Pesquisar por cliente, CPF ou número do processo..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-medium text-slate-900 shadow-sm"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={fetchData}
                                    disabled={isRefreshing}
                                    className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                    title="Atualizar dados"
                                >
                                    <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                                </button>
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className={`px-6 py-4 rounded-2xl border transition-all shadow-sm flex items-center gap-2 font-bold ${isFilterOpen || statusFilter !== 'all' || moduleFilter !== 'all'
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <Filter className="w-5 h-5" />
                                    Filtros
                                    {(statusFilter !== 'all' || moduleFilter !== 'all') && (
                                        <span className="ml-1 w-5 h-5 bg-white text-blue-600 rounded-full flex items-center justify-center text-[10px]">
                                            {(statusFilter !== 'all' ? 1 : 0) + (moduleFilter !== 'all' ? 1 : 0)}
                                        </span>
                                    )}
                                </button>
                                <div className="hidden sm:flex p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <LayoutList className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <LayoutGrid className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Expandable Filter Panel */}
                        <AnimatePresence>
                            {isFilterOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-6 bg-white/70 backdrop-blur-md border border-slate-200 rounded-[2rem] shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Status do Processo</p>
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    { id: 'all', label: 'Todos', icon: FilterX },
                                                    { id: 'andamento', label: 'Em Andamento', icon: Clock },
                                                    { id: 'finalizado', label: 'Finalizado', icon: CheckCircle2 },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => setStatusFilter(opt.id)}
                                                        className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 text-sm font-bold transition-all ${statusFilter === opt.id
                                                            ? 'bg-blue-50 border-blue-200 text-blue-600 ring-2 ring-blue-500/10'
                                                            : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
                                                            }`}
                                                    >
                                                        <opt.icon className="w-4 h-4" />
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Módulo Jurídico</p>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => setModuleFilter('all')}
                                                    className={`px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${moduleFilter === 'all'
                                                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                                                        : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
                                                        }`}
                                                >
                                                    Todos Módulos
                                                </button>
                                                {Object.entries(MODULES_CONFIG).map(([key, config]) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => setModuleFilter(key)}
                                                        className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 text-sm font-bold transition-all ${moduleFilter === key
                                                            ? 'bg-blue-50 border-blue-200 text-blue-600'
                                                            : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
                                                            }`}
                                                    >
                                                        <img src={config.icon} alt="" className="w-4 h-4 object-contain grayscale brightness-110" />
                                                        {config.title}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {(statusFilter !== 'all' || moduleFilter !== 'all') && (
                                            <div className="md:col-span-2 pt-4 border-t border-slate-100 flex justify-end">
                                                <button
                                                    onClick={() => {
                                                        setStatusFilter('all');
                                                        setModuleFilter('all');
                                                    }}
                                                    className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1.5"
                                                >
                                                    <X className="w-3.5 h-3.5" /> Limpar Filtros
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Grid de Módulos */}
                    <div className="space-y-16">
                        <AnimatePresence mode="wait">
                            {loading && Object.keys(data).length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center p-20 space-y-4"
                                >
                                    <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando processos...</p>
                                </motion.div>
                            ) : Object.keys(filteredData).length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center p-20 bg-white/40 rounded-[2rem] border border-dashed border-slate-200"
                                >
                                    <div className="p-6 bg-slate-100 rounded-full mb-4">
                                        <Search className="w-10 h-10 text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">Nenhum processo encontrado</h3>
                                    <p className="text-slate-500">Tente buscar por termos diferentes ou verifique se há processos cadastrados.</p>
                                </motion.div>
                            ) : (
                                Object.entries(filteredData).map(([moduleKey, items], moduleIndex) => {
                                    const config = MODULES_CONFIG[moduleKey];
                                    if (!config) return null;

                                    return (
                                        <motion.section
                                            key={moduleKey}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.05 * moduleIndex }}
                                            className="space-y-6"
                                        >
                                            <div className="flex items-center justify-between px-2">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-2xl ${config.iconBg} shadow-sm border border-white/50`}>
                                                        <img src={config.icon} alt="" className="w-8 h-8 object-contain" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{config.title}</h3>
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{items.length} processos encontrados</p>
                                                    </div>
                                                </div>
                                                <Link
                                                    href={config.href}
                                                    className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:gap-3 transition-all px-4 py-2 rounded-xl hover:bg-blue-50"
                                                >
                                                    Ver Módulo <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            </div>

                                            {viewMode === 'grid' ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {items.slice(0, 9).map((item, itemIndex) => {
                                                        const clientName = item.cliente || item.clientName || item.comprador_nome || item.nome_vendedor || "Sem nome";
                                                        const status = item.status || "Pendente";
                                                        const date = item.created_at || item.createdAt;
                                                        const processId = item.id;
                                                        const processNum = item.processo_numero || item.numeroProcesso;

                                                        return (
                                                            <motion.div
                                                                key={`${moduleKey}-${item.id}`}
                                                                whileHover={{ y: -8, scale: 1.01 }}
                                                                className="bg-white/70 backdrop-blur-md border border-white/80 hover:bg-white/95 rounded-[2rem] p-7 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all group relative overflow-hidden"
                                                            >
                                                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                                                <div className="flex items-start justify-between gap-4 mb-6">
                                                                    <div className="flex-1">
                                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Cliente</p>
                                                                        <h4 className="text-xl font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                                                                            {clientName}
                                                                        </h4>
                                                                    </div>

                                                                    <button
                                                                        onClick={() => router.push(`${config.href}/${item.id}`)}
                                                                        className="p-3.5 rounded-2xl bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm group/btn active:scale-90"
                                                                        title="Ver Detalhes"
                                                                    >
                                                                        <Eye className="w-5.5 h-5.5 group-hover/btn:scale-110 transition-transform" />
                                                                    </button>
                                                                </div>

                                                                <div className="flex flex-wrap gap-2 mb-6">
                                                                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${status === 'Em Andamento' || status === 'ativo' || status === 'Em andamento'
                                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                                        }`}>
                                                                        <span className={`w-1.5 h-1.5 rounded-full ${status === 'Em Andamento' || status === 'ativo' || status === 'Em andamento' ? 'bg-emerald-500' : 'bg-amber-500'
                                                                            }`} />
                                                                        {status}
                                                                    </span>
                                                                    {processNum && (
                                                                        <span className="px-3 py-1.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100 text-[10px] font-bold uppercase tracking-widest">
                                                                            #{processNum.slice(-8)}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                                                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                                                                        <div className="p-1.5 rounded-lg bg-slate-50">
                                                                            <Calendar className="w-3.5 h-3.5" />
                                                                        </div>
                                                                        {date ? new Date(date).toLocaleDateString('pt-BR') : 'Recentemente'}
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-300 uppercase tracking-tighter group-hover:text-blue-200 transition-colors">
                                                                        <Activity className="w-3.5 h-3.5" /> ID: {processId}
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 overflow-hidden shadow-sm">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left border-collapse">
                                                            <thead>
                                                                <tr className="border-b border-slate-200/50">
                                                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cliente</th>
                                                                    <th className="px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                                                                    <th className="px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Processo</th>
                                                                    <th className="px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Data</th>
                                                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Ações</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {items.map((item) => {
                                                                    const clientName = item.cliente || item.clientName || item.comprador_nome || item.nome_vendedor || "Sem nome";
                                                                    const status = item.status || "Pendente";
                                                                    const date = item.created_at || item.createdAt;
                                                                    const processNum = item.processo_numero || item.numeroProcesso;

                                                                    return (
                                                                        <motion.tr
                                                                            key={`${moduleKey}-${item.id}`}
                                                                            initial={{ opacity: 0 }}
                                                                            whileInView={{ opacity: 1 }}
                                                                            className="group hover:bg-white/60 transition-colors"
                                                                        >
                                                                            <td className="px-8 py-4">
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{clientName}</span>
                                                                                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">ID: {item.id}</span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-4">
                                                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${status === 'Em Andamento' || status === 'ativo' || status === 'Em andamento'
                                                                                    ? 'bg-emerald-50 text-emerald-600'
                                                                                    : 'bg-amber-50 text-amber-600'
                                                                                    }`}>
                                                                                    <span className={`w-1 rounded-full aspect-square ${status === 'Em Andamento' || status === 'ativo' || status === 'Em andamento' ? 'bg-emerald-500' : 'bg-amber-500'
                                                                                        }`} />
                                                                                    {status}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-4 py-4">
                                                                                <span className="text-xs font-bold text-slate-600 font-mono">
                                                                                    {processNum ? `#${processNum.slice(-8)}` : '---'}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-4 py-4">
                                                                                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                                                                                    {date ? new Date(date).toLocaleDateString('pt-BR') : '---'}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-8 py-4 text-right">
                                                                                <button
                                                                                    onClick={() => router.push(`${config.href}/${item.id}`)}
                                                                                    className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 group/btn"
                                                                                >
                                                                                    <Eye className="w-4 h-4" />
                                                                                </button>
                                                                            </td>
                                                                        </motion.tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.section>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </div>
                </main>

                <footer className="p-12 text-center text-slate-400 text-sm">
                    <p className="font-medium">© 2026 Silva & Ferrari • Sistema Jurídico Integrado</p>
                </footer>
            </div>
        </div>
    );
}
