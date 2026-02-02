"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  AlertTriangle,
  Calendar as CalendarIcon,
  FileText,
  History,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

// Golden Glass Palette - Hardcoded to ensure visibility without server restart
const COLORS = {
  gold50: "#fffcf2",
  gold100: "#fff9e6",
  gold200: "#fef1bf",
  gold300: "#fde38a",
  gold400: "#facc15",
  gold500: "#eab308",
  gold600: "#ca8a04",
  gold700: "#a16207",
  gold800: "#854d0e",
  gold900: "#713f12",
  bronze: "#432818",
  bronzeDark: "#2d1b10",
  glassBg: "rgba(255, 252, 240, 0.45)",
};

interface Alert {
  id: number;
  message: string;
  moduleType: string;
  alertFor: string;
  isRead: boolean;
  createdAt: string;
}

export const NotificationBell = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Poll e Realtime logic mantida
  const fetchAlerts = async () => {
    try {
      const response = await fetch("/api/alerts?isRead=false&limit=20");
      if (!response.ok) {
        setAlerts([]);
        setUnreadCount(0);
        return;
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setAlerts(data);
        setUnreadCount(data.length);
      } else {
        setAlerts([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
      setAlerts([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);

    let channel: any | null = null;
    let supabaseClient: any | null = null;
    const setupRealtime = async () => {
      try {
        if (typeof window === "undefined") return;
        const mod = await import("@/lib/supabase");
        supabaseClient = mod.getSupabaseBrowserClient();
        if (!supabaseClient) return;
        channel = supabaseClient
          .channel("alerts-realtime")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "alerts" },
            (payload: any) => {
              const a = payload?.new;
              if (!a || a.is_read) return;
              const mapped = {
                id: a.id,
                message: a.message,
                moduleType: a.module_type,
                alertFor: a.alert_for,
                isRead: a.is_read,
                createdAt: a.created_at,
              } as Alert;
              setAlerts((prev) => {
                const exists = prev.some((p) => p.id === mapped.id);
                return exists ? prev.map((p) => (p.id === mapped.id ? mapped : p)) : [mapped, ...prev].filter((p) => !p.isRead);
              });
              setUnreadCount((prev) => prev + 1);
            }
          )
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "alerts" },
            (payload: any) => {
              const a = payload?.new;
              if (!a) return;
              const mapped = {
                id: a.id,
                message: a.message,
                moduleType: a.module_type,
                alertFor: a.alert_for,
                isRead: a.is_read,
                createdAt: a.created_at,
              } as Alert;

              setAlerts((prev) => {
                if (mapped.isRead) return prev.filter(p => p.id !== mapped.id);
                return prev.map((p) => (p.id === mapped.id ? mapped : p));
              });

              if (a.is_read) fetchAlerts();
            }
          )
          .subscribe();
      } catch (err) {
        console.error("Erro ao inicializar realtime de alertas:", err);
      }
    };
    setupRealtime();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "alerts-updated") fetchAlerts();
    };
    const onCustom = () => fetchAlerts();
    if (typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
      window.addEventListener("alerts-updated", onCustom as EventListener);
    }

    return () => {
      clearInterval(interval);
      if (channel && supabaseClient) {
        try { supabaseClient.removeChannel(channel); } catch { }
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener("alerts-updated", onCustom as EventListener);
      }
    };
  }, []);

  const markAsRead = async (alertId: number) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      window.dispatchEvent(new Event("alerts-updated"));
    } catch (error) {
      console.error("Error marking alert as read:", error);
      fetchAlerts();
    }
  };

  const markAllAsRead = async () => {
    const backup = [...alerts];
    setAlerts([]);
    setUnreadCount(0);

    try {
      await Promise.all(
        backup.map((alert) =>
          fetch(`/api/alerts/${alert.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isRead: true }),
          })
        )
      );
      window.dispatchEvent(new Event("alerts-updated"));
    } catch (error) {
      console.error("Error marking all alerts as read:", error);
      setAlerts(backup);
      setUnreadCount(backup.length);
    }
  };

  const getAlertConfig = (alert: Alert) => {
    const msg = alert.message.toLowerCase();

    if (msg.includes('urgente') || msg.includes('prazo') || msg.includes('expira') || msg.includes('vencimento')) {
      return {
        icon: AlertTriangle,
        bgGradient: 'from-red-400 to-red-600',
        title: 'Prazo Urgente',
        urgent: true,
        textColor: 'text-red-600'
      };
    }
    if (msg.includes('audiência') || msg.includes('agendada') || msg.includes('marcada')) {
      return {
        icon: CalendarIcon,
        bgGradient: 'from-[var(--gold400)] to-[var(--gold600)]', // Need to use arbitrary values in className, here we return logic strings
        isGold: true,
        title: 'Audiência Agendada',
        urgent: false,
      };
    }
    if (msg.includes('assinado') || msg.includes('procuração') || msg.includes('documento') || msg.includes('contrato')) {
      return {
        icon: FileText,
        bgGradient: 'from-[var(--bronze)] to-[var(--bronzeDark)]',
        isBronze: true,
        title: 'Documento Assinado',
        urgent: false,
      };
    }
    if (msg.includes('sucesso') || msg.includes('concluído') || msg.includes('aprovado')) {
      return {
        icon: CheckCircle2,
        bgGradient: 'from-green-400 to-green-600',
        title: 'Concluído',
        urgent: false,
        textColor: 'text-green-700'
      };
    }

    return {
      icon: Bell,
      bgGradient: 'from-[var(--gold500)] to-[var(--gold700)]',
      isGoldDefault: true,
      title: alert.moduleType || 'Nova Notificação',
      urgent: false,
    };
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return 'Agora';
    if (diffInMins < 60) return `Há ${diffInMins} min`;
    if (diffInHours < 24) return `Há ${diffInHours} horas`;
    if (diffInDays === 1) return 'Ontem';
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center relative backdrop-blur-md transition-all duration-300 group"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            borderColor: 'rgba(212, 175, 55, 0.3)',
            borderWidth: '1px',
            boxShadow: '0 0 10px rgba(212, 175, 55, 0.1)'
          }}
        >
          <Bell className="w-5 h-5 transition-colors stroke-[1.5]" style={{ color: COLORS.gold700 }} />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 border-2 border-white rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-md z-10"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </SheetTrigger>

      {/* FORCE Override of sheet styles using style prop and arbitrary classes */}
      <SheetContent
        className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col z-[100] border-l shadow-2xl transition-all duration-500"
        style={{
          backgroundColor: 'rgba(255, 253, 245, 0.85)', // High opacity cream glass
          backdropFilter: 'blur(24px)',
          borderColor: 'rgba(212, 175, 55, 0.4)',
          boxShadow: '-20px 0 50px rgba(0, 0, 0, 0.1)'
        }}
      >

        {/* Liquid Background Blobs inside Sheet - using style for reliability */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
          <div className="absolute top-[-10%] left-[-20%] w-[300px] h-[300px] rounded-full blur-[80px]" style={{ backgroundColor: COLORS.gold200 }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] rounded-full bg-amber-100 blur-[60px]" />
          <div className="absolute top-[40%] right-[-20%] w-[200px] h-[200px] rounded-full blur-[70px]" style={{ backgroundColor: 'rgba(253, 227, 138, 0.3)' }} />
        </div>

        {/* Header */}
        <div
          className="relative z-10 p-6 border-b flex items-center justify-between shrink-0"
          style={{
            borderColor: 'rgba(212, 175, 55, 0.3)',
            backgroundColor: 'rgba(255, 255, 255, 0.4)'
          }}
        >
          <div>
            <h2 className="text-xl font-extrabold tracking-tight font-display" style={{ color: COLORS.bronze }}>Central de Notificações</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: COLORS.gold700 }}>
              {unreadCount} {unreadCount === 1 ? 'NOVA MENSAGEM' : 'NOVAS MENSAGENS'}
            </p>
          </div>
          {alerts.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-all uppercase tracking-tight"
              style={{
                color: COLORS.gold700,
                backgroundColor: 'rgba(255, 249, 230, 0.5)',
                borderColor: 'rgba(253, 227, 138, 0.5)'
              }}
            >
              Limpar Tudo
            </button>
          )}
        </div>

        <style jsx global>{`
              .notification-scroll::-webkit-scrollbar {
                width: 4px;
              }
              .notification-scroll::-webkit-scrollbar-track {
                background: transparent;
              }
              .notification-scroll::-webkit-scrollbar-thumb {
                background: rgba(212, 175, 55, 0.3);
                border-radius: 20px;
              }
              .notification-scroll::-webkit-scrollbar-thumb:hover {
                background: rgba(212, 175, 55, 0.6);
              }
            `}</style>
        {/* Content */}
        <ScrollArea className="flex-1 relative z-10 p-4 notification-scroll">
          <div className="space-y-4 pb-6 h-full notification-scroll">

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: COLORS.gold100, borderTopColor: COLORS.gold500 }} />
                <p className="text-sm font-medium animate-pulse" style={{ color: COLORS.gold700 }}>Carregando mensagens...</p>
              </div>
            ) : alerts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <div className="w-20 h-20 rounded-2xl border flex items-center justify-center mb-6 shadow-inner"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gold50}E6, ${COLORS.gold100}80)`,
                    borderColor: 'rgba(254, 241, 191, 0.5)'
                  }}>
                  <Bell className="w-8 h-8 stroke-[1.5]" style={{ color: COLORS.gold400 }} />
                </div>
                <h3 className="text-lg font-bold mb-1" style={{ color: COLORS.bronze }}>Você está em dia!</h3>
                <p className="text-sm max-w-[200px]" style={{ color: COLORS.bronze, opacity: 0.6 }}>Nenhuma notificação pendente no momento.</p>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {alerts.map((alert) => {
                  const config = getAlertConfig(alert);

                  // Resolve gradient manually for safety
                  let gradClass = config.bgGradient;
                  let gradStyle = {};
                  if (config.isGold) {
                    gradStyle = { backgroundImage: `linear-gradient(135deg, ${COLORS.gold400}, ${COLORS.gold600})` };
                    gradClass = "";
                  } else if (config.isBronze) {
                    gradStyle = { backgroundImage: `linear-gradient(135deg, ${COLORS.bronze}, ${COLORS.bronzeDark})` };
                    gradClass = "";
                  } else if (config.isGoldDefault) {
                    gradStyle = { backgroundImage: `linear-gradient(135deg, ${COLORS.gold500}, ${COLORS.gold700})` };
                    gradClass = "";
                  }

                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                      layout
                      className="group relative"
                    >
                      <div
                        onClick={() => markAsRead(alert.id)}
                        className={cn(
                          "p-5 rounded-2xl flex gap-4 cursor-pointer transition-all duration-300",
                          "backdrop-blur-sm shadow-sm hover:shadow-md",
                        )}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.4)',
                          border: '1px solid rgba(254, 241, 191, 0.4)',
                        }}
                      >
                        {/* Icon Box */}
                        <div
                          className={cn(
                            "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg",
                            gradClass
                          )}
                          style={gradStyle}
                        >
                          <config.icon className="w-6 h-6 stroke-[1.5]" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1.5">
                            <h4 className="font-bold text-sm truncate uppercase tracking-tight" style={{ color: COLORS.bronze }}>
                              {config.title}
                            </h4>
                            <span
                              className="text-[10px] font-semibold whitespace-nowrap ml-2 px-2 py-0.5 rounded-full border"
                              style={{
                                color: 'rgba(133, 77, 14, 0.5)',
                                backgroundColor: 'rgba(255, 252, 240, 0.5)',
                                borderColor: 'rgba(255, 249, 230, 0.5)'
                              }}
                            >
                              {getTimeAgo(alert.createdAt)}
                            </span>
                          </div>

                          <p className="text-sm leading-relaxed font-medium line-clamp-2 transition-colors" style={{ color: COLORS.bronze, opacity: 0.7 }}>
                            {alert.message}
                          </p>

                          {/* Priority/Tags */}
                          {config.urgent && (
                            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-red-600 uppercase tracking-wider bg-red-50/50 px-2 py-1 rounded-md w-fit border border-red-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse ring-2 ring-red-200"></span>
                              Prioridade Alta
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}

            {!loading && alerts.length > 0 && (
              <div className="pt-8 pb-4 text-center opacity-30 select-none">
                <History className="w-6 h-6 mx-auto mb-2" style={{ color: COLORS.gold800 }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.gold900 }}>Fim das notificações</p>
              </div>
            )}
          </div>
        </ScrollArea>


      </SheetContent>
    </Sheet>
  );
};
