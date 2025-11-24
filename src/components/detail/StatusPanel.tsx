"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StatusPanelProps {
  status: string;
  onStatusChange: (s: string) => void;
  currentStep: number;
  totalSteps: number;
  createdAt?: string;
  updatedAt?: string;
}

export function StatusPanel({ status, onStatusChange, currentStep, totalSteps, createdAt, updatedAt }: StatusPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Em Andamento">Em Andamento</SelectItem>
            <SelectItem value="Finalizado">Finalizado</SelectItem>
          </SelectContent>
        </Select>
        {createdAt && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">Criado em</p>
            <p className="text-sm font-medium">{new Date(createdAt).toLocaleDateString("pt-BR")}</p>
          </div>
        )}
        {updatedAt && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">Última atualização</p>
            <p className="text-sm font-medium">{new Date(updatedAt).toLocaleDateString("pt-BR")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}