"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Edit2, CircleCheck, Circle, Calendar as CalendarIcon, User } from "lucide-react";
import { ReactNode, useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  const RESPONSAVEIS = [
    "Secretária – Jessica Cavallaro",
    "Advogada – Jailda Silva",
    "Advogada – Adriana Roder",
    "Advogado – Fábio Ferrari",
    "Advogado – Guilherme Augusto",
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
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="rounded-md border px-2 py-1 text-xs text-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-100">
                      Definir Responsável
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[420px] max-w-[95vw]">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label>Responsável</Label>
                        <Input
                          value={resp}
                          onChange={(e) => setResp(e.target.value)}
                          onFocus={() => setShowRespList(true)}
                          onBlur={() => setTimeout(() => setShowRespList(false), 150)}
                          placeholder="Selecione ou digite o responsável"
                        />
                        {showRespList && (
                          <div className="rounded-md border mt-2 bg-white dark:bg-slate-900 shadow-sm">
                            {RESPONSAVEIS.map((r) => (
                              <button
                                key={r}
                                type="button"
                                className="w-full text-left px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                                onMouseDown={() => { setResp(r); setShowRespList(false); }}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label>Data limite</Label>
                        <div className="rounded-md border p-2 overflow-hidden">
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
                            weekStartsOn={1}
                            captionLayout="label"
                            className="w-full [--cell-size:--spacing(10)]"
                            classNames={{ root: "w-full", months: "w-full", month: "w-full", table: "w-full" }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setResp(""); setDue(""); setSaveError(""); }}>Limpar</Button>
                        <Button size="sm" onClick={async () => {
                          setSaveError("");
                          const ok = onSaveAssignment
                            ? await onSaveAssignment({ responsibleName: resp || undefined, dueDate: due || undefined })
                            : true;
                          if (!ok) {
                            setSaveError("Falha ao salvar. Verifique sua conexão ou tente novamente.");
                          }
                        }}>Salvar</Button>
                      </div>
                      {saveError && (
                        <div className="text-red-600 text-xs">{saveError}</div>
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
