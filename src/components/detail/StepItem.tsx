"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Edit2, CircleCheck, Circle } from "lucide-react";
import { ReactNode } from "react";

interface StepItemProps {
  index: number;
  title: string;
  isCurrent: boolean;
  isCompleted: boolean;
  isPending: boolean;
  expanded: boolean;
  onToggle: () => void;
  onMarkComplete?: () => void;
  children: ReactNode;
}

export function StepItem({ index, title, isCurrent, isCompleted, isPending, expanded, onToggle, onMarkComplete, children }: StepItemProps) {
  return (
    <Collapsible>
      <div className="flex items-start gap-3 p-4 rounded-lg transition-colors relative"
        data-state={isCurrent ? "current" : isCompleted ? "completed" : "pending"}
      >
        <button
          className="shrink-0 mt-0.5 hover:scale-110 transition-transform cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 z-10 bg-transparent border-none p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          title={isCurrent ? "Clique para marcar como concluído" : isCompleted ? "Concluído" : "Aguardando passo anterior"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão clicado, isCurrent:', isCurrent, 'onMarkComplete:', !!onMarkComplete);
            if (isCurrent && onMarkComplete) {
              console.log('Marcando passo como completo:', index);
              onMarkComplete();
            }
          }}
          disabled={!isCurrent}
          type="button"
          aria-label={isCurrent ? "Marcar passo como concluído" : isCompleted ? "Passo concluído" : "Aguardando passo anterior"}
        >
          {isCompleted ? (
            <CircleCheck className="h-6 w-6 text-green-600" />
          ) : (
            <Circle className={isCurrent ? "h-6 w-6 text-primary" : "h-6 w-6 text-muted-foreground"} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <CollapsibleTrigger className="w-full text-left" onClick={onToggle}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{title}</span>
                {isCurrent && (
                  <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50 dark:border-blue-400 dark:text-blue-300 dark:bg-blue-950">Atual</Badge>
                )}
                {isCompleted && (
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">Concluído</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isCurrent && <Edit2 className="h-4 w-4 text-muted-foreground" />}
                {expanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {children}
          </CollapsibleContent>
        </div>
      </div>
    </Collapsible>
  );
}