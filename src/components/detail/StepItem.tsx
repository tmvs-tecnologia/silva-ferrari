"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Edit2, CircleCheck, Circle, Calendar as CalendarIcon, User } from "lucide-react";
import { ReactNode, useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import "react-day-picker/dist/style.css";

interface StepItemProps {
  index: number;
  title: string;
  isCurrent: boolean;
  isCompleted: boolean;
  isPending: boolean;
  expanded: boolean;
  onToggle: () => void;
  onMarkComplete?: () => void;
  onMarkIncomplete?: () => void;
  children: ReactNode;
  assignment?: { responsibleName?: string; dueDate?: string };
  onSaveAssignment?: (assignment: { responsibleName?: string; dueDate?: string }) => Promise<boolean> | boolean;
  canAssign?: boolean;
  extraBadges?: { label: string; variant?: "default" | "outline" | "secondary" }[];
}

export function StepItem({ index, title, isCurrent, isCompleted, isPending, expanded, onToggle, onMarkComplete, onMarkIncomplete, children, assignment, onSaveAssignment, canAssign = true, extraBadges = [] }: StepItemProps) {
  const [resp, setResp] = useState(assignment?.responsibleName || "");
  const [due, setDue] = useState(assignment?.dueDate || "");
  const [showRespList, setShowRespList] = useState(false);
  const [saveError, setSaveError] = useState<string>("");
  const [assignOpen, setAssignOpen] = useState(false);
  const RESPONSAVEIS = [
    "Administrativo - Jéssica Cavallaro",
    "Administrativo - Priscila Ribeiro",
    "Advogada – Jailda Silva",
    "Advogada – Adriana Roder",
    "Advogado - Giuliano Pereira",
    "Estagiário – Wendel Macriani",
  ];
  const statusColor = useMemo(() => {
    if (!due) return "text-muted-foreground";
    const d = (() => {
      const parts = due.split("-").map((v) => parseInt(v, 10));
      const y = parts[0];
      const m = (parts[1] || 1) - 1;
      const day = parts[2] || 1;
      return new Date(y, m, day);
    })();
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return "text-red-600";
    if (days <= 3) return "text-amber-600";
    return "text-muted-foreground";
  }, [due]);

  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <div className="flex items-start gap-3 p-4 rounded-lg transition-colors relative"
        data-state={isCurrent ? "current" : isCompleted ? "completed" : "pending"}
      >
        <button
          className="shrink-0 mt-0.5 hover:scale-110 transition-transform cursor-pointer z-10 bg-transparent border-none p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          title={isCompleted ? "Desfazer conclusão" : "Clique para marcar como concluído"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isCompleted) {
              onMarkIncomplete?.();
            } else if (onMarkComplete) {
              onMarkComplete();
            }
          }}
          type="button"
          aria-label={isCompleted ? "Desfazer conclusão do passo" : "Marcar passo como concluído"}
        >
          {isCompleted ? (
            <CircleCheck className="h-6 w-6 text-green-600" />
          ) : (
            <Circle className={isCurrent ? "h-6 w-6 text-primary" : "h-6 w-6 text-muted-foreground"} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 flex-wrap w-full text-left">
              <span className="font-medium">{title}</span>
              {isCurrent && (
                <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50 dark:border-blue-400 dark:text-blue-300 dark:bg-blue-950">Atual</Badge>
              )}
              {isCompleted && (
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">Concluído</Badge>
              )}
              {extraBadges.map((b, i) => (
                <Badge key={i} variant={b.variant || "outline"}>{b.label}</Badge>
              ))}
              {(assignment?.responsibleName || assignment?.dueDate) && (
                <div className="w-full mt-1">
                  <span className={`inline-flex items-center gap-2 text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300`}>
                    <User className="h-3 w-3" />
                    {assignment?.responsibleName || "—"}
                    <span className={`inline-flex items-center gap-1 ${statusColor}`}>
                      <CalendarIcon className="h-3 w-3" />
                      {assignment?.dueDate ? (() => {
                        const parts = assignment.dueDate.split("-").map((v) => parseInt(v, 10));
                        const y = parts[0];
                        const m = (parts[1] || 1) - 1;
                        const day = parts[2] || 1;
                        return new Date(y, m, day).toLocaleDateString("pt-BR");
                      })() : "—"}
                    </span>
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isCurrent && <Edit2 className="h-4 w-4 text-muted-foreground" />}
              {canAssign && (
                <Popover open={assignOpen} onOpenChange={setAssignOpen}>
                  <PopoverTrigger asChild>
                    <button className="rounded-md border px-2 py-1 text-xs text-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-100">
                      Definir Responsável
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
                    <div className="bg-slate-900 px-4 py-3 flex items-center gap-2 text-white">
                      <User className="w-4 h-4 text-blue-400" />
                      <h4 className="font-bold text-sm">Definir Responsável</h4>
                    </div>
                    <div className="p-4 space-y-5 bg-white">
                      <div className="space-y-2">
                        <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-1">Membro da Equipe</Label>
                        <Select value={resp} onValueChange={setResp}>
                          <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500/20">
                            <SelectValue placeholder="Selecione um membro..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-200">
                            {RESPONSAVEIS.map(r => <SelectItem key={r} value={r} className="rounded-lg">{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-1">Data Limite</Label>
                        <div className="flex flex-col items-center p-1 bg-slate-50/50 border border-slate-100 rounded-2xl overflow-hidden">
                          <Calendar
                            mode="single"
                            selected={due ? (() => { const p = due.split("-").map((v)=>parseInt(v,10)); return new Date(p[0], (p[1]||1)-1, p[2]||1); })() : undefined}
                            onSelect={(date) => {
                              if (!date) { setDue(""); return; }
                              const y = date.getFullYear();
                              const m = String(date.getMonth() + 1).padStart(2, "0");
                              const d = String(date.getDate()).padStart(2, "0");
                              setDue(`${y}-${m}-${d}`);
                            }}
                            className="rounded-xl border-none p-0"
                          />
                        </div>
                        {due && (
                          <div className="flex items-center justify-center gap-2 mt-2 py-2 px-3 bg-blue-50 border border-blue-100/50 rounded-xl">
                            <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-[11px] text-blue-700 font-bold">
                              Vencimento: {due.split('-').reverse().join('/')}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 rounded-xl h-11 border-slate-200" onClick={() => { setResp(""); setDue(""); setSaveError(""); }}>Limpar</Button>
                        <Button 
                          className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 transition-all shadow-md active:scale-[0.98]" 
                          onClick={async () => {
                            setSaveError("");
                            const ok = onSaveAssignment
                              ? await onSaveAssignment({ responsibleName: resp || undefined, dueDate: due || undefined })
                              : true;
                            if (!ok) {
                              setSaveError("Falha ao salvar. Tente novamente.");
                            } else {
                              setAssignOpen(false);
                            }
                          }}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Salvar
                        </Button>
                      </div>
                      {saveError && (
                        <div className="text-red-600 text-[10px] text-center font-bold uppercase tracking-tight">{saveError}</div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              <CollapsibleTrigger asChild>
                <button type="button" aria-label="Alternar conteúdo">
                  {expanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
            </div>
          </div>
          <CollapsibleContent>
            {children}
          </CollapsibleContent>
        </div>
      </div>
    </Collapsible>
  );
}
