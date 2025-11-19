"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StepItem } from "./StepItem";

interface ProcessFlowProps {
  caseType: string;
  currentStep: number;
  expandedStep: number | null;
  onStepToggle: (index: number) => void;
  onStepComplete: (index: number) => void;
  renderStepContent: (index: number) => React.ReactNode;
}

// Standard process flow steps for all civil actions
const STANDARD_CIVIL_STEPS = [
  "Cadastro de Informações",
  "Agendar Exame DNA", 
  "Elaboração Procuração",
  "Aguardar procuração assinada",
  "À Protocolar",
  "Protocolado",
  "Processo Finalizado",
];

// Custom steps for specific case types
const EXAME_DNA_STEPS = [
  "Cadastro Documentos",
  "Agendar Exame DNA",
  "Elaboração Procuração", 
  "Aguardar procuração assinada",
  "À Protocolar",
  "Protocolado",
  "Processo Finalizado",
];

export function ProcessFlow({ 
  caseType, 
  currentStep, 
  expandedStep, 
  onStepToggle, 
  onStepComplete, 
  renderStepContent 
}: ProcessFlowProps) {
  // Determine which steps to use based on case type
  const steps = caseType === "Exame DNA" ? EXAME_DNA_STEPS : STANDARD_CIVIL_STEPS;

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
            >
              {renderStepContent(index)}
            </StepItem>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}