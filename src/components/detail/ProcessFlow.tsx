"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StepItem } from "./StepItem";

interface ProcessFlowProps {
  caseType: string;
  currentStep: number;
  expandedStep: number | null;
  onStepToggle: (index: number) => void;
  onStepComplete: (index: number) => void;
  onStepUncomplete?: (index: number) => void;
  renderStepContent: (index: number) => React.ReactNode;
  assignments?: Record<number, { responsibleName?: string; dueDate?: string }>;
  onSaveAssignment?: (index: number, responsibleName?: string, dueDate?: string) => boolean | Promise<boolean>;
}

// Standard process flow steps (fallback)
const STANDARD_CIVIL_STEPS = [
  "Cadastro Documentos",
  "Agendar Exame DNA", 
  "Elaboração Procuração",
  "Aguardar procuração assinada",
  "À Protocolar",
  "Processo Protocolado",
  "Processo Finalizado",
];

// Custom steps for specific case types
const EXAME_DNA_STEPS = [
  "Cadastro Documentos",
  "Agendar Exame DNA",
  "Elaboração Procuração", 
  "Aguardar procuração assinada",
  "À Protocolar",
  "Processo Protocolado",
  "Processo Finalizado",
];

// Alteração de Nome steps
const ALTERACAO_NOME_STEPS = [
  "Cadastro Documentos",
  "Emissão da Guia Judicial",
  "Elaboração Procuração",
  "Aguardar procuração assinada",
  "Peticionar",
  "À Protocolar",
  "Processo Protocolado",
  "Processo Finalizado",
];

export function ProcessFlow({ 
  caseType, 
  currentStep, 
  expandedStep, 
  onStepToggle, 
  onStepComplete, 
  onStepUncomplete,
  renderStepContent,
  assignments,
  onSaveAssignment,
}: ProcessFlowProps) {
  // Determine which steps to use based on case type
  const steps = caseType === "Exame DNA"
    ? EXAME_DNA_STEPS
    : (caseType === "Alteração de Nome" || caseType === "Guarda" || caseType === "Acordos de Guarda")
      ? ALTERACAO_NOME_STEPS
      : STANDARD_CIVIL_STEPS;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo do Processo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {steps.map((stepTitle, index) => (
            <StepItem
              key={index}
              index={index}
              title={stepTitle}
              isCurrent={index === currentStep}
              isCompleted={index < currentStep}
              isPending={index > currentStep}
              expanded={expandedStep === index}
              onToggle={() => onStepToggle(index)}
              onMarkComplete={() => onStepComplete(index)}
              onMarkIncomplete={() => onStepUncomplete?.(index)}
              assignment={assignments?.[index]}
              onSaveAssignment={async (a) => onSaveAssignment ? await onSaveAssignment(index, a.responsibleName, a.dueDate) : true}
              canAssign={!stepTitle.toLowerCase().includes("cadastro")}
            >
              {renderStepContent(index)}
            </StepItem>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
