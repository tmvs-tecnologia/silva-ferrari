"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Briefcase,
  Shield,
  Home,
  Globe,
  Bell,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  ArrowUpRight,
  Activity,
  Target
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    acoesCiveis: 0,
    acoesTrabalhistas: 0,
    acoesCriminais: 0,
    compraVenda: 0,
    perdaNacionalidade: 0,
    vistos: 0,
  });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoints = [
          "/api/acoes-civeis?limit=1000",
          "/api/acoes-trabalhistas?limit=1000",
          "/api/acoes-criminais?limit=1000",
          "/api/compra-venda-imoveis?limit=1000",
          "/api/perda-nacionalidade?limit=1000",
          "/api/vistos?limit=1000",
          "/api/alerts?isRead=false&limit=10",
        ];

        const responses = await Promise.all(
          endpoints.map((url) => fetch(url).catch(() => undefined))
        );

        const safeJson = async (res: Response | undefined) => {
          if (!res) return [];
          if (!res.ok) return [];
          const ct = res.headers.get("content-type") || "";
          if (!ct.includes("application/json")) return [];
          try {
            return await res.json();
          } catch {
            return [];
          }
        };

        const [
          acoesCiveis,
          acoesTrabalhistas,
          acoesCriminais,
          compraVenda,
          perdaNacionalidade,
          vistos,
          alertsData,
        ] = await Promise.all(responses.map((r) => safeJson(r)));

        setStats({
          acoesCiveis: acoesCiveis.length,
          acoesTrabalhistas: acoesTrabalhistas.length,
          acoesCriminais: acoesCriminais.length,
          compraVenda: compraVenda.length,
          perdaNacionalidade: perdaNacionalidade.length,
          vistos: vistos.length,
        });

        setAlerts(alertsData);
        try {
          const totalRes = await fetch('/api/processos/count');
          if (totalRes.ok) {
            const ct = totalRes.headers.get('content-type') || '';
            if (ct.includes('application/json')) {
              const totalJson = await totalRes.json();
              setTotalCount(totalJson.total ?? 0);
            }
          }
        } catch (err) {
          console.error('Erro ao buscar total de processos:', err);
        }
        try {
          const raRes = await fetch('/api/recent-activities?limit=10');
          if (raRes.ok) {
            const ct = raRes.headers.get('content-type') || '';
            const raJson = ct.includes('application/json') ? await raRes.json() : [];
            setRecentActivity(Array.isArray(raJson) ? raJson : []);
          }
        } catch { }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const onFocus = () => {
      fetch('/api/processos/count')
        .then(r => r.json())
        .then(j => setTotalCount(j.total ?? 0))
        .catch(err => console.error('Erro ao atualizar total de processos:', err));
    };
    window.addEventListener('focus', onFocus);
    const interval = setInterval(onFocus, 60000);
    const refreshAlerts = () => {
      fetch('/api/alerts?isRead=false&limit=10')
        .then(r => r.ok ? r.json() : [])
        .then(j => setAlerts(Array.isArray(j) ? j : []))
        .catch(() => { });
    };
    const onStorage = (e: StorageEvent) => { if (e.key === 'alerts-updated') refreshAlerts(); };
    const onCustom = () => refreshAlerts();
    window.addEventListener('storage', onStorage);
    window.addEventListener('alerts-updated', onCustom as EventListener);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('alerts-updated', onCustom as EventListener);
    };
  }, []);

  const modules = [
    {
      title: "Ações Cíveis",
      count: stats.acoesCiveis,
      icon: FileText,
      href: "/dashboard/acoes-civeis",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      description: "Processos judiciais cíveis",
      trend: "+12%",
    },
    {
      title: "Ações Trabalhistas",
      count: stats.acoesTrabalhistas,
      icon: Briefcase,
      href: "/dashboard/acoes-trabalhistas",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      description: "Processos trabalhistas",
      trend: "+8%",
    },
    {
      title: "Ações Criminais",
      count: stats.acoesCriminais,
      icon: Shield,
      href: "/dashboard/acoes-criminais",
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      description: "Processos criminais",
      trend: "+5%",
    },
    {
      title: "Compra e Venda",
      count: stats.compraVenda,
      icon: Home,
      href: "/dashboard/compra-venda",
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      description: "Transações imobiliárias",
      trend: "+15%",
    },
    {
      title: "Perda de Nacionalidade",
      count: stats.perdaNacionalidade,
      icon: Globe,
      href: "/dashboard/perda-nacionalidade",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      description: "Processos de nacionalidade",
      trend: "+3%",
    },
    {
      title: "Vistos",
      count: stats.vistos,
      icon: Globe,
      href: "/dashboard/vistos",
      color: "from-cyan-500 to-cyan-600",
      bgColor: "bg-cyan-50",
      description: "Processos de vistos",
      trend: "+7%",
    },
  ];

  const totalProcessos = Object.values(stats).reduce((a, b) => a + b, 0);

  const formatModule = (m: string) => {
    switch (m) {
      case 'acoes_civeis': return 'Ações Cíveis';
      case 'acoes_trabalhistas': return 'Ações Trabalhistas';
      case 'acoes_criminais': return 'Ações Criminais';
      case 'compra_venda_imoveis': return 'Compra e Venda';
      case 'perda_nacionalidade': return 'Perda de Nacionalidade';
      case 'vistos': return 'Vistos';
      default: return m;
    }
  };

  const formatTypeLabel = (t: string) => {
    if (t === 'criado') return 'Nova ação criada';
    if (t === 'finalizado') return 'Processo finalizado';
    if (t === 'responsavel_definido') return 'Responsável definido';
    return t;
  };

  const formatDetail = (item: any) => {
    if (item.type === 'responsavel_definido') {
      return item.detail ? `Prazo: ${new Date(item.detail).toLocaleDateString('pt-BR')}` : '';
    }
    return item.detail ? `Tipo: ${item.detail}` : '';
  };

  const clearAlerts = async () => {
    try {
      await Promise.all(
        (alerts || []).map((a: any) =>
          fetch(`/api/alerts?id=${a.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isRead: true })
          }).catch(() => undefined)
        )
      );
    } finally {
      setAlerts([]);
    }
  };

  const clearRecentActivity = () => {
    setRecentActivity([]);
  };

  return (
    <div className="relative min-h-[calc(100vh-120px)] w-full">
      {/* Liquid Background Blobs */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-[#fef1bf]/[0.15] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[#fdf3ce]/[0.12] rounded-full blur-[100px]" />
        <div className="absolute top-[20%] right-[10%] w-[35vw] h-[35vw] bg-[#fef9e6]/[0.1] rounded-full blur-[100px]" />
      </div>

      <div className="space-y-10 animate-in fade-in duration-700">
        {/* Welcome Section */}
        <section className="premium-glass rounded-[2.5rem] p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[400px] h-full bg-gradient-to-l from-gold-300/10 to-transparent pointer-events-none group-hover:from-gold-300/20 transition-all duration-700"></div>

          <div className="flex flex-col md:flex-row justify-between items-start relative z-10 gap-6">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl font-extrabold text-[#432818] mb-3 tracking-tight">
                Bem-vindo ao <span className="gold-text-gradient">Sistema Jurídico</span>
              </h1>
              <p className="text-[#432818]/70 text-xl font-medium">
                Gestão de alto padrão para seus processos inteligentes
              </p>
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, delay: 0.4 }}
              className="text-right"
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ca8a04] mb-2">Processos Totais</p>
              <div className="text-7xl font-black text-[#432818] opacity-90 gold-text-gradient">
                {loading ? "..." : totalProcessos}
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 relative z-10">
            <motion.div whileHover={{ y: -5 }} className="glass-card rounded-2xl p-6 bg-white/40 border-gold-200/50 hover:bg-white/60 cursor-pointer transition-all">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#facc15] to-[#ca8a04] text-white shadow-lg shadow-gold-500/20">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gold-800/60 uppercase tracking-wider">Ações</p>
                  <p className="text-3xl font-bold text-[#432818]">{loading ? '...' : totalCount}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              onClick={() => router.push('/dashboard/pendencias')}
              className="glass-card rounded-2xl p-6 bg-white/40 border-gold-200/50 hover:bg-white/60 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/20">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gold-800/60 uppercase tracking-wider">Pendências</p>
                  <p className="text-lg font-bold text-[#432818]">Abrir Calendário</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              onClick={() => router.push('/dashboard/procuracao/novo')}
              className="glass-card rounded-2xl p-6 bg-white/40 border-gold-200/50 hover:bg-white/60 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#432818] to-[#2d1b10] text-white shadow-lg shadow-bronze/20">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gold-800/60 uppercase tracking-wider">Documentos</p>
                  <p className="text-lg font-bold text-[#432818]">Criar Procuração</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Modules Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((module, index) => (
            <motion.div
              key={module.href}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
            >
              <Link href={module.href}>
                <Card className="glass-card rounded-2xl p-6 flex flex-col justify-between h-full bg-white/30 border-gold-200/30 hover:border-gold-400/50 hover:bg-white/50 transition-all group">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-lg text-[#432818] group-hover:text-[#ca8a04] transition-colors">{module.title}</h3>
                      <module.icon className="w-5 h-5 text-gold-600" />
                    </div>
                    <p className="text-sm text-[#432818]/60 mb-8">{module.description}</p>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-[#432818]">{module.count}</span>
                      <span className="text-xs font-bold text-amber-600 flex items-center bg-amber-100/50 px-2 py-0.5 rounded-full">
                        <ArrowUpRight className="w-3 h-3 mr-0.5" /> {module.trend}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gold-700 uppercase tracking-tight">
                        <Activity className="w-3 h-3" /> ativos
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </section>

        {/* Bottom Section: Activity & Alerts */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Alerts Section */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="premium-glass rounded-[2rem] border-gold-200/30 overflow-hidden">
              <CardHeader className="border-b border-gold-200/30 p-6">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Bell className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-[#432818] font-bold">Alertas Recentes</span>
                    {alerts.length > 0 && (
                      <Badge className="bg-red-500 text-white border-0">{alerts.length}</Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearAlerts} className="hover:bg-amber-50 text-amber-700 font-bold">Limpar</Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[320px] overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full bg-slate-100 rounded-xl" />
                    ))}
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <p className="text-[#432818]/60 font-medium">Tudo sob controle</p>
                    <p className="text-xs text-[#432818]/40 mt-1">Nenhum alerta pendente</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="flex flex-col p-4 rounded-xl bg-white/30 border border-gold-200/20 hover:bg-white/50 transition-all">
                        <p className="text-sm font-semibold text-[#432818] mb-1">{alert.message}</p>
                        <span className="text-[10px] text-gold-700/60 uppercase font-bold tracking-wider">{new Date().toLocaleDateString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Section */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="premium-glass rounded-[2rem] border-gold-200/30 overflow-hidden">
              <CardHeader className="border-b border-gold-200/30 p-6">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-[#432818] font-bold">Atividade Recente</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearRecentActivity} className="hover:bg-blue-50 text-blue-700 font-bold">Limpar</Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[320px] overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full bg-slate-100 rounded-xl" />
                    ))}
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
                      <Activity className="w-8 h-8" />
                    </div>
                    <p className="text-[#432818]/60 font-medium">Sem atividades</p>
                    <p className="text-xs text-[#432818]/40 mt-1">As movimentações aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {recentActivity.map((activity: any) => (
                      <div key={activity.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/30 border border-gold-200/20 hover:bg-white/50 transition-all group">
                        <div className="w-10 h-10 bg-gold-50 text-gold-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#432818]">
                            {formatTypeLabel(activity.type)}
                          </p>
                          <p className="text-[10px] text-gold-700 font-bold uppercase tracking-wider">
                            {formatModule(activity.moduleType)}
                          </p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <span className="text-[10px] font-bold text-[#432818]/40">{new Date(activity.time).toLocaleDateString('pt-BR')}</span>
                          <span className="text-[11px] font-bold text-amber-600">{formatDetail(activity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
