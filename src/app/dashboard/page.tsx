"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  FileText,
  TrendingUp,
  Bell,
  Activity,
  Menu
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { NotificationBell } from "@/components/notification-bell";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    acoesCiveis: 0,
    acoesTrabalhistas: 0,
    acoesCriminais: 0,
    compraVenda: 0,
    perdaNacionalidade: 0,
    vistos: 0,
    turismo: 0,
  });
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const totalRes = await fetch('/api/processos/count');
        if (totalRes.ok) {
          const data = await totalRes.json();
          const { total, byTable } = data;

          setTotalCount(total ?? 0);
          setStats({
            acoesCiveis: byTable?.acoes_civeis ?? 0,
            acoesTrabalhistas: byTable?.acoes_trabalhistas ?? 0,
            acoesCriminais: byTable?.acoes_criminais ?? 0,
            compraVenda: byTable?.compra_venda_imoveis ?? 0,
            perdaNacionalidade: byTable?.perda_nacionalidade ?? 0,
            vistos: byTable?.vistos ?? 0,
            turismo: byTable?.turismo ?? 0,
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalProcessos = Object.values(stats).reduce((a, b) => a + b, 0);

  const modules = [
    {
      title: "Ações Cíveis",
      count: stats.acoesCiveis,
      icon: "https://cdn-icons-png.flaticon.com/512/1157/1157026.png",
      href: "/dashboard/acoes-civeis",
      description: "Processos judiciais cíveis",
      trend: "+12%",
    },
    {
      title: "Ações Trabalhistas",
      count: stats.acoesTrabalhistas,
      icon: "https://cdn-icons-png.flaticon.com/512/3135/3135687.png",
      href: "/dashboard/acoes-trabalhistas",
      description: "Processos trabalhistas",
      trend: "+8%",
    },
    {
      title: "Ações Criminais",
      count: stats.acoesCriminais,
      icon: "https://cdn-icons-png.flaticon.com/512/929/929429.png",
      href: "/dashboard/acoes-criminais",
      description: "Processos criminais",
      trend: "+5%",
    },
    {
      title: "Compra e Venda",
      count: stats.compraVenda,
      icon: "https://cdn-icons-png.flaticon.com/512/14523/14523054.png",
      href: "/dashboard/compra-venda",
      description: "Transações imobiliárias",
      trend: "+15%",
    },
    {
      title: "Perda de Nacionalidade",
      count: stats.perdaNacionalidade,
      icon: "https://cdn-icons-png.flaticon.com/512/4284/4284504.png",
      href: "/dashboard/perda-nacionalidade",
      description: "Processos de nacionalidade",
      trend: "+3%",
    },
    {
      title: "Vistos",
      count: stats.vistos,
      icon: "https://cdn-icons-png.flaticon.com/512/7082/7082001.png",
      href: "/dashboard/vistos",
      description: "Processos de vistos",
      trend: "+7%",
    },
    {
      title: "Turismo",
      count: stats.turismo,
      icon: "https://cdn-icons-png.flaticon.com/512/2200/2200326.png",
      href: "/dashboard/turismo",
      description: "Processos de turismo",
      trend: "+5%",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#f8fafc] relative overflow-x-hidden">
      {/* Liquid Background Blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {mounted && (
          <>
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
            <motion.div
              animate={{
                x: [0, 30, 0],
                y: [0, -40, 0],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute top-[30%] left-[40%] w-[35vw] h-[35vw] bg-pink-100/30 rounded-full blur-[100px]"
            />
          </>
        )}
      </div>

      <div className="flex flex-col flex-1 relative z-10 w-full">
        {/* Header */}
        <header className="sticky top-0 z-50 px-8 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="lg:hidden">
              <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <Menu className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              <span className="text-slate-900">Visão</span>{" "}
              <span className="text-blue-600">Geral</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex px-5 py-2 rounded-full border border-slate-200 bg-white/40 items-center gap-2 text-sm font-semibold text-slate-700 shadow-sm">
              <Calendar className="w-4 h-4 text-blue-500" />
              {mounted ? new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()) : '...'}
            </div>
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full p-8 space-y-12">
          {/* Welcome Section */}
          <section className="bg-blue-50/50 border border-blue-100 rounded-[2.5rem] p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[400px] h-full bg-gradient-to-l from-blue-100/30 to-transparent pointer-events-none group-hover:from-blue-100/50 transition-all duration-700"></div>

            <div className="flex flex-col md:flex-row justify-between items-start relative z-10 gap-6">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Bem-vindo ao Sistema Jurídico</h2>
                <p className="text-slate-600 text-lg font-medium">Gerencie seus processos de forma inteligente e eficiente</p>
              </motion.div>

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                className="text-right"
              >
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Processos Totais</p>
                <div className="text-7xl font-black text-slate-900/90 tracking-tighter">
                  {loading ? "..." : totalCount}
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 relative z-10">
              <motion.div
                whileHover={{ y: -5 }}
                onClick={() => router.push('/dashboard/acoes')}
                className="rounded-2xl p-6 bg-white/60 border border-white hover:bg-white/80 transition-all cursor-pointer shadow-lg shadow-blue-500/5"
              >
                <div className="flex items-center gap-5">
                  <div className="p-3 rounded-xl bg-blue-100 flex items-center justify-center">
                    <img src="https://cdn-icons-png.flaticon.com/512/17728/17728633.png" alt="" className="w-8 h-8 object-contain" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</p>
                    <p className="text-3xl font-bold text-slate-900">{loading ? '...' : totalCount}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                onClick={() => router.push('/dashboard/pendencias')}
                className="rounded-2xl p-6 bg-purple-50/60 border border-white hover:bg-purple-50/80 transition-all cursor-pointer shadow-lg shadow-purple-500/5"
              >
                <div className="flex items-center gap-5">
                  <div className="p-3 rounded-xl bg-purple-100 flex items-center justify-center">
                    <img src="https://cdn-icons-png.flaticon.com/512/3652/3652191.png" alt="" className="w-8 h-8 object-contain" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pendências</p>
                    <p className="text-lg font-bold text-slate-900">Acesse o calendário de pendências</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                onClick={() => router.push('/dashboard/procuracao/novo')}
                className="rounded-2xl p-6 bg-amber-50/60 border border-white hover:bg-amber-50/80 transition-all cursor-pointer shadow-lg shadow-amber-500/5"
              >
                <div className="flex items-center gap-5">
                  <div className="p-3 rounded-xl bg-amber-100 flex items-center justify-center">
                    <img src="https://cdn-icons-png.flaticon.com/512/15182/15182162.png" alt="" className="w-8 h-8 object-contain" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Elaborar Procuração</p>
                    <p className="text-lg font-bold text-slate-900">Criar rapidamente uma procuração</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Modules Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {modules.map((module, index) => {
              // Custom colors per module
              const moduleStyles = [
                { bg: 'bg-blue-50/50', border: 'border-blue-100', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', hover: 'hover:border-blue-300' },
                { bg: 'bg-indigo-50/50', border: 'border-indigo-100', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', hover: 'hover:border-indigo-300' },
                { bg: 'bg-rose-50/50', border: 'border-rose-100', iconBg: 'bg-rose-100', iconColor: 'text-rose-600', hover: 'hover:border-rose-300' },
                { bg: 'bg-emerald-50/50', border: 'border-emerald-100', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', hover: 'hover:border-emerald-300' },
                { bg: 'bg-amber-50/50', border: 'border-amber-100', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', hover: 'hover:border-amber-300' },
                { bg: 'bg-teal-50/50', border: 'border-teal-100', iconBg: 'bg-teal-100', iconColor: 'text-teal-600', hover: 'hover:border-teal-300' },
                { bg: 'bg-cyan-50/50', border: 'border-cyan-100', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600', hover: 'hover:border-cyan-300' },
              ][index % 7];

              return (
                <motion.div
                  key={module.href}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Link href={module.href}>
                    <div className={`${moduleStyles.bg} ${moduleStyles.border} ${moduleStyles.hover} rounded-3xl p-8 flex flex-col justify-between h-full border transition-all group shadow-sm hover:shadow-md h-[240px]`}>
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-bold text-xl text-slate-900">{module.title}</h3>
                          <img src={module.icon} alt="" className="w-8 h-8 object-contain transition-all group-hover:scale-110" />
                        </div>
                        <p className="text-sm text-slate-500 mb-8">{module.description}</p>
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-extrabold text-slate-900">{module.count}</span>
                          <span className="text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full">
                            <TrendingUp className="w-3 h-3 mr-0.5" /> {module.trend}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            <Activity className="w-3 h-3" /> processos ativos
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </section>
        </main>

        <footer className="p-12 text-center text-slate-400 text-sm">
          <p className="font-medium">© 2026 Silva & Ferrari • Sistema Jurídico Integrado</p>
        </footer>
      </div>
    </div>
  );
}
