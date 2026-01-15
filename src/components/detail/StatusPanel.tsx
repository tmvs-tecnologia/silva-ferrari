"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CheckCircle } from "lucide-react";

interface StatusPanelProps {
  status: string;
  onStatusChange: (s: string) => void;
  currentStep: number;
  totalSteps: number;
  currentStepTitle?: string;
  workflowTitle?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function StatusPanel({ status, onStatusChange, currentStep, totalSteps, currentStepTitle, workflowTitle, createdAt, updatedAt }: StatusPanelProps) {
  const s = (status || '').toLowerCase();
  const displayStatus = s.includes('andamento') ? 'Em andamento' : 'Finalizado';
  const isInProgress = displayStatus === 'Em andamento';
  return (
    <Card className="rounded-xl border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle>Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Select value={displayStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="pl-3 pr-10 py-2.5 rounded-lg border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Em andamento">Em andamento</SelectItem>
            <SelectItem value="Finalizado">Finalizado</SelectItem>
          </SelectContent>
        </Select>
        <span className={`${isInProgress ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-green-500 text-white hover:bg-green-600'} inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium w-fit whitespace-nowrap shadow-md`}>
          {isInProgress ? <Clock className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          {displayStatus}
        </span>
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground uppercase">Fluxo</p>
          <p className="text-sm font-medium">{workflowTitle || "—"}</p>
        </div>
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground uppercase">Etapa atual</p>
          <span className="text-sm font-medium" data-testid="current-step-label">
            {currentStepTitle || `Etapa ${currentStep}`}
          </span>
        </div>
        {createdAt && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground uppercase">Criado em</p>
            <p className="text-sm font-medium">{new Date(createdAt).toLocaleDateString("pt-BR")}</p>
          </div>
        )}
        {updatedAt && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground uppercase">Última atualização</p>
            <p className="text-sm font-medium">{new Date(updatedAt).toLocaleDateString("pt-BR")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
