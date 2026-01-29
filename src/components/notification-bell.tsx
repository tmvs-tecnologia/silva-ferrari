"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  AlertTriangle,
  Calendar as CalendarIcon,
  FileText,
  History,
  ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";

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
                const next = exists ? prev.map((p) => (p.id === mapped.id ? mapped : p)) : [mapped, ...prev];
                return next.filter((p) => !p.isRead);
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
                const next = prev.map((p) => (p.id === mapped.id ? mapped : p)).filter((p) => !p.isRead);
                return next;
              });
              if (a.is_read) setUnreadCount((prev) => Math.max(0, prev - 1));
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
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        alerts.map((alert) =>
          fetch(`/api/alerts/${alert.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isRead: true }),
          })
        )
      );
      setAlerts([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all alerts as read:", error);
    }
  };

  const getAlertConfig = (alert: Alert) => {
    const msg = alert.message.toLowerCase();
    if (msg.includes('urgente') || msg.includes('prazo') || msg.includes('expira')) {
      return {
        icon: AlertTriangle,
        color: 'from-red-400 to-red-600',
        title: 'Prazo Urgente',
        urgent: true
      };
    }
    if (msg.includes('audiência') || msg.includes('agendada') || msg.includes('marcada')) {
      return {
        icon: CalendarIcon,
        color: 'from-gold-400 to-gold-600',
        title: 'Audiência Agendada',
        urgent: false
      };
    }
    if (msg.includes('assinado') || msg.includes('procuração') || msg.includes('documento')) {
      return {
        icon: FileText,
        color: 'from-bronze to-bronze-dark',
        title: 'Documento Assinado',
        urgent: false
      };
    }
    return {
      icon: Bell,
      color: 'from-gold-500 to-gold-700',
      title: alert.moduleType || 'Notificação',
      urgent: false
    };
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

    if (diffInMins < 1) return 'Agora';
    if (diffInMins < 60) return `Há ${diffInMins} min`;
    if (diffInHours < 24) return `Há ${diffInHours} horas`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="w-10 h-10 rounded-full flex items-center justify-center relative bg-white/40 backdrop-blur-md border border-gold-300/30 shadow-[0_0_10px_rgba(212,175,55,0.1)] transition-all duration-300 hover:border-gold-400 group">
          <Bell className="w-5 h-5 text-gold-700 group-hover:text-gold-600 transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 border-2 border-white rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-md animate-in zoom-in duration-300">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="p-0 sm:max-w-md border-l border-gold-300/30 bg-[#fffdf5bf] backdrop-blur-[24px] shadow-[-20px_0_50px_rgba(0,0,0,0.1)] flex flex-col">
        <div className="p-6 border-b border-gold-300/30 flex items-center justify-between bg-white/40">
          <div>
            <h2 className="text-xl font-extrabold text-bronze tracking-tight">Central de Notificações</h2>
            <p className="text-[10px] font-bold text-gold-700 uppercase tracking-widest mt-1">
              {unreadCount} {unreadCount === 1 ? 'NOVA MENSAGEM' : 'NOVAS MENSAGENS'}
            </p>
          </div>
          {alerts.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-bold text-gold-700 hover:text-gold-900 bg-gold-100/50 px-3 py-1.5 rounded-lg border border-gold-300/50 transition-colors uppercase tracking-tight"
            >
              Limpar Tudo
            </button>
          )}
        </div>

        <ScrollArea className="flex-1 px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-3">
              <div className="w-8 h-8 border-4 border-gold-100 border-t-gold-500 rounded-full animate-spin" />
              <p className="text-sm text-gold-700 font-medium">Carregando mensagens...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gold-50/50 flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-gold-300 opacity-50" />
              </div>
              <p className="text-sm text-bronze font-bold uppercase tracking-wider">Você está em dia!</p>
              <p className="text-xs text-gold-700/60 mt-1 font-medium">Nenhuma notificação recente por aqui.</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {alerts.map((alert) => {
                const config = getAlertConfig(alert);
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="p-5 rounded-2xl flex gap-4 bg-white/30 border border-gold-200/50 shadow-sm relative overflow-hidden hover:border-gold-400 hover:bg-white/60 transition-all cursor-pointer group"
                    onClick={() => markAsRead(alert.id)}
                  >
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white shadow-md`}>
                      <config.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-bronze truncate group-hover:text-gold-700 transition-colors uppercase text-xs tracking-tight">{config.title}</h4>
                        <span className="text-[10px] font-semibold text-gold-800/50 whitespace-nowrap ml-2">{getTimeAgo(alert.createdAt)}</span>
                      </div>
                      <p className="text-sm text-bronze/70 leading-relaxed mb-2 line-clamp-2">{alert.message}</p>
                      {config.urgent && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span> Prioridade Alta
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              <div className="pt-8 pb-4 text-center opacity-30">
                <History className="w-8 h-8 mx-auto mb-2 text-gold-800" />
                <p className="text-[10px] font-bold text-gold-900 uppercase tracking-widest">Fim das notificações recentes</p>
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="p-6 border-t border-gold-300/30 bg-gold-50/20">
          <button className="w-full py-4 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-white font-bold text-sm shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 transition-all flex items-center justify-center gap-2 group">
            Ver todas as atividades
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
