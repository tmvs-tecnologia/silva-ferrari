"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar as CalendarIcon, User, FileText } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface TaskItem {
  id: number;
  moduleType: string;
  recordId: number;
  stepIndex: number;
  responsibleName?: string;
  dueDate?: string;
  clientName?: string | null;
}

export default function CalendarPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [moduleType, setModuleType] = useState<string>("all");
  const [responsible, setResponsible] = useState<string>("");
  const [from, setFrom] = useState<Date | undefined>(undefined);
  const [to, setTo] = useState<Date | undefined>(undefined);

  const fetchTasks = async () => {
    const params = new URLSearchParams();
    if (moduleType !== "all") params.set("moduleType", moduleType);
    if (responsible) params.set("responsible", responsible);
    if (from) params.set("from", formatDate(from));
    if (to) params.set("to", formatDate(to));
    const res = await fetch(`/api/tasks?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setTasks(data || []);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groupedByDate = useMemo(() => {
    const map: Record<string, TaskItem[]> = {};
    tasks.forEach(t => {
      const key = t.dueDate || "sem-data";
      map[key] = map[key] || [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  const onApplyFilters = async () => {
    await fetchTasks();
  };

  return (
    <div className="space-y-6 p-6 w-full">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarIcon className="h-5 w-5" /> Calendário de Tarefas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Responsável</label>
              <Input value={responsible} onChange={(e) => setResponsible(e.target.value)} placeholder="Nome do responsável" />
            </div>
            <div>
              <label className="text-sm font-medium">Módulo</label>
              <Select value={moduleType} onValueChange={setModuleType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="acoes_civeis">Ações Cíveis</SelectItem>
                  <SelectItem value="acoes_trabalhistas">Ações Trabalhistas</SelectItem>
                  <SelectItem value="vistos">Vistos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={onApplyFilters} className="w-full">Aplicar Filtros</Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border p-2">
              <label className="text-sm font-medium">De</label>
              <DayPicker mode="single" selected={from} onSelect={setFrom} weekStartsOn={1} captionLayout="buttons" />
            </div>
            <div className="rounded-md border p-2">
              <label className="text-sm font-medium">Até</label>
              <DayPicker mode="single" selected={to} onSelect={setTo} weekStartsOn={1} captionLayout="buttons" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista por data */}
      <div className="grid gap-6">
        {Object.entries(groupedByDate).sort(([a], [b]) => (a === "sem-data" ? 1 : b === "sem-data" ? -1 : (a > b ? 1 : -1))).map(([date, items]) => (
          <Card key={date} className="border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" /> {date === "sem-data" ? "Sem data" : new Date(date).toLocaleDateString("pt-BR")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((t) => (
                <div key={`${t.moduleType}-${t.recordId}-${t.stepIndex}-${t.id}`} className="flex items-center justify-between p-3 rounded-md border">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700"><User className="h-3 w-3" />{t.responsibleName || "—"}</span>
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700"><FileText className="h-3 w-3" />{t.clientName || `${t.moduleType} #${t.recordId}`}</span>
                    <span className="text-xs text-slate-500">Etapa {t.stepIndex + 1}</span>
                  </div>
                  <Link href={getDetailHref(t)} className="text-sm text-blue-600 hover:underline">Abrir</Link>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDetailHref(t: TaskItem): string {
  switch (t.moduleType) {
    case 'acoes_civeis':
      return `/dashboard/acoes-civeis/${t.recordId}`;
    case 'acoes_trabalhistas':
      return `/dashboard/acoes-trabalhistas/${t.recordId}`;
    case 'vistos':
      return `/dashboard/vistos/${t.recordId}`;
    default:
      return `/dashboard`;
  }
}