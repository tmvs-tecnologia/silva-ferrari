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
        } catch {}
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
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
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
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-blue-50 to-indigo-100 p-8 border border-slate-200/50">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Bem-vindo ao Sistema Jurídico
              </h1>
              <p className="text-slate-600 text-lg">
                Gerencie seus processos de forma inteligente e eficiente
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500 mb-1">Processos Totais</div>
              <div className="text-4xl font-bold gradient-text">
                {loading ? "..." : totalProcessos}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Ações</div>
                    <div className="text-xl font-bold text-slate-900">{loading ? '...' : totalCount}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 cursor-pointer" onClick={() => router.push('/dashboard/pendencias')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Pendências</div>
                    <div className="text-xs text-slate-500">Acesse o calendário de pendências</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-400/20 to-transparent rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="group relative overflow-hidden border-slate-200/50 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1">
              <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
              <CardHeader className="relative pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-slate-800">
                    {module.title}
                  </CardTitle>
                  <div className={`p-3 rounded-xl ${module.bgColor} group-hover:scale-110 transition-transform`}>
                    <module.icon className={`h-6 w-6 text-slate-700`} />
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-1">{module.description}</p>
              </CardHeader>
              <CardContent className="relative">
                {loading ? (
                  <Skeleton className="h-12 w-24 bg-slate-200" />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-end gap-2">
                      <div className="text-3xl font-bold text-slate-900">
                        {module.count}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-green-600 mb-1">
                        <ArrowUpRight className="w-4 h-4" />
                        <span>{module.trend}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Activity className="w-4 h-4" />
                      <span>processos ativos</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alerts Section */}
        <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-200/50">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-slate-900">Alertas Recentes</span>
                {alerts.length > 0 && (
                  <Badge className="bg-red-500 text-white border-0">{alerts.length}</Badge>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={clearAlerts}>Limpar tudo</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 h-80 overflow-y-auto">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full bg-slate-200" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <Bell className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-slate-600 font-medium">Nenhum alerta pendente</p>
                <p className="text-sm text-slate-500 mt-2">Todos os alertas foram processados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 mb-1">{alert.message}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Badge className="text-xs bg-slate-200 text-slate-700 border-0">{alert.alertFor}</Badge>
                        <Badge className="text-xs bg-slate-200 text-slate-700 border-0">{alert.moduleType}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-200/50">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-slate-900">Atividade Recente</span>
              </div>
              <Button variant="outline" size="sm" onClick={clearRecentActivity}>Limpar tudo</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 h-80 overflow-y-auto">
            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full bg-slate-200" />
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-slate-600 font-medium">Nenhuma atividade recente</p>
                <p className="text-sm text-slate-500 mt-2">As atividades aparecerão aqui</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity: any) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Activity className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {formatTypeLabel(activity.type)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {activity.title} • {formatModule(activity.moduleType)} • {new Date(activity.time).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDetail(activity)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
