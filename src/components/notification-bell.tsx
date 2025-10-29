"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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
        console.error("Error fetching alerts: HTTP", response.status);
        setAlerts([]);
        setUnreadCount(0);
        return;
      }
      
      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setAlerts(data);
        setUnreadCount(data.length);
      } else {
        console.error("Error: API response is not an array:", data);
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
    
    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (alertId: number) => {
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      
      // Update local state
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

  const getModuleColor = (moduleType: string) => {
    const colors: Record<string, string> = {
      "Ações Cíveis": "bg-blue-500",
      "Ações Trabalhistas": "bg-purple-500",
      "Ações Criminais": "bg-red-500",
      "Compra e Venda": "bg-emerald-500",
      "Perda de Nacionalidade": "bg-orange-500",
      "Vistos": "bg-cyan-500",
    };
    return colors[moduleType] || "bg-slate-500";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-slate-100 transition-colors"
        >
          <Bell className="h-5 w-5 text-slate-700" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 text-white text-xs border-2 border-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 bg-slate-100 border-2 border-slate-200 shadow-xl" align="end">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-400" />
              <h3 className="font-bold text-white">Notificações</h3>
              {unreadCount > 0 && (
                <Badge className="bg-red-600 text-white border-0">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {alerts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-amber-400 hover:text-amber-300 hover:bg-slate-700 text-xs h-7 px-2"
              >
                Marcar todas
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px] bg-slate-100">
          {loading ? (
            <div className="p-4 text-center text-slate-600 bg-slate-100">
              Carregando...
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-8 text-center bg-slate-100">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-600 mb-3 shadow-lg">
                <Bell className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm text-slate-700 font-medium">
                Nenhuma notificação
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Você está em dia!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-300">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 hover:bg-slate-200 transition-colors group bg-slate-100"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getModuleColor(alert.moduleType)} shadow-md`}>
                      <Bell className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-slate-900 font-medium leading-relaxed">
                        {alert.message}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className="text-xs bg-slate-800 text-white border-0">
                          {alert.alertFor}
                        </Badge>
                        <Badge className="text-xs bg-slate-600 text-white border-0">
                          {alert.moduleType}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-600">
                          {new Date(alert.createdAt).toLocaleString("pt-BR")}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(alert.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Marcar lida
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};