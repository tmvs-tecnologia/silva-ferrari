"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, Circle, Save, Trash2, FileUp, ChevronDown, ChevronUp, Upload, FileText, Download, Edit2 } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailLayout } from "@/components/detail/DetailLayout";
import { StatusPanel } from "@/components/detail/StatusPanel";
import { DocumentPanel } from "@/components/detail/DocumentPanel";
import { NotesPanel } from "@/components/detail/NotesPanel";
import { ProcessFlow } from "@/components/detail/ProcessFlow";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Workflow steps for each case type
const WORKFLOWS = {
  "Exame DNA": [
    "Cadastro dos Documentos",
    "Agendar Exame de DNA",
    "Aguardar Resultado e Fazer Procuração (JAILDA → MARRONE)",
    "Petição de Declaração de Paternidade (WENDEL/GUILHERME/FÁBIO)",
    "Protocolar Processo (WENDEL/GUILHERME/FÁBIO)",
    "Exigências do Juiz",
    "Processo Finalizado",
  ],
  "Alteração de Nome": [
    "Cadastro dos Documentos",
    "Fazer Procuração (WENDEL/GUILHERME/FÁBIO)",
    "Enviar Procuração (JESSICA → JAILDA)",
    "Petição (WENDEL/GUILHERME/FÁBIO)",
    "Protocolar Processo (WENDEL/GUILHERME/FÁBIO)",
    "Exigências do Juiz",
    "Processo Finalizado",
  ],
  "Guarda": [
    "Cadastro dos Documentos",
    "Fazer Procuração (WENDEL/GUILHERME/FÁBIO)",
    "Enviar Procuração (JESSICA → JAILDA)",
    "Procuração e Acordo Assinados (WENDEL/GUILHERME/FÁBIO)",
    "Verificar se há Petição",
    "Protocolar Processo (WENDEL/GUILHERME/FÁBIO)",
    "Exigências do Juiz",
    "Processo Finalizado",
  ],
  "Acordos de Guarda": [
    "Cadastro dos Documentos",
    "Fazer a Procuração e o Acordo de Guarda (WENDEL/GUILHERME/FÁBIO)",
    "Enviar a procuração e o acordo de guarda e cobrar as assinaturas (JESSICA → JAILDA → MARRONE)",
    "Com a Procuração e o Acordo assinados, seguir com a Petição (WENDEL/GUILHERME/FÁBIO)",
    "Verificar se há Petição",
    "Protocolar Processo (WENDEL/GUILHERME/FÁBIO)",
    "Exigências do Juiz",
    "Processo Finalizado",
  ],
  "Divórcio Consensual": [
    "Cadastro dos Documentos",
    "Petição Conjunta",
    "Termo de Partilhas",
    "Guarda (se tiver filhos)",
    "Procuração",
    "Processo Finalizado",
  ],
  "Divórcio Litígio": [
    "Cadastro dos Documentos",
    "Petição Cliente",
    "Procuração Cliente",
    "Custas",
    "Processo Finalizado",
  ],
  "Usucapião": [
    "Petição Inicial",
    "Matrícula do Imóvel / Transcrição",
    "Procuração",
    "Publicação no Diário",
    "Citação",
    "Sentença",
    "Custas",
    "Processo Finalizado",
  ],
  "Pensão Alimentícia": [
    "Cadastro dos Documentos",
    "Petição Inicial",
    "Citação",
    "Contestação",
    "Procuração",
    "Sentença",
    "Custas",
    "Processo Finalizado",
  ],
  "Ação de Alimentos": [
    "Cadastro dos Documentos",
    "Petição Inicial",
    "Citação",
    "Contestação",
    "Procuração",
    "Sentença",
    "Custas",
    "Processo Finalizado",
  ],
};

// Workflow steps are now centralized in ProcessFlow component

interface CaseData {
  id: string;
  clientName: string;
  type: string;
  status: string;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  nomeMae?: string;
  nomePaiRegistral?: string;
  nomeSupostoPai?: string;
  rnmMae?: string;
  rnmPai?: string;
  rnmSupostoPai?: string;
  cpfMae?: string;
  cpfPai?: string;
  certidaoNascimento?: string;
  comprovanteEndereco?: string;
  passaporte?: string;
  numeroProtocolo?: string;
}

interface Document {
  id: string | number;
  document_name?: string;
  file_name?: string;
  file_path: string;
  uploaded_at: string;
  field_name?: string;
}

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Em andamento");
  const [notes, setNotes] = useState("");
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState<string | number | null>(null);
  const [editingDocumentName, setEditingDocumentName] = useState("");

  // Load case data
  useEffect(() => {
    const loadCase = async () => {
      try {
        const response = await fetch(`/api/acoes-civeis/${id}`);
        if (response.ok) {
          const data = await response.json();
          setCaseData(data);
          setStatus(data.status || "Em andamento");
          setNotes(data.notes || "");
        }
      } catch (error) {
        console.error("Erro ao carregar caso:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadCase();
    }
  }, [id]);

  // Load documents
  useEffect(() => {
    const loadDocuments = async () => {
      if (!id) return;
      
      setLoadingDocuments(true);
      try {
        const response = await fetch(`/api/documents/${id}`);
        if (response.ok) {
          const data = await response.json();
          setDocuments(data || []);
        }
      } catch (error) {
        console.error("Erro ao carregar documentos:", error);
      } finally {
        setLoadingDocuments(false);
      }
    };

    loadDocuments();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      const response = await fetch(`/api/acoes-civeis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('acoes-civeis-status-update', JSON.stringify({ id, status: newStatus, t: Date.now() }));
            window.dispatchEvent(new CustomEvent('acoes-civeis-status-updated', { detail: { id, status: newStatus } }));
          } catch {}
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setExpandedStep(expandedStep === stepIndex ? null : stepIndex);
  };

  const handleCompleteStep = async (stepIndex: number) => {
    try {
      const response = await fetch(`/api/acoes-civeis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStep: stepIndex + 1 }),
      });
      
      if (response.ok) {
        const updatedCase = { ...caseData!, currentStep: stepIndex + 1 };
        setCaseData(updatedCase);
        setExpandedStep(null);
      }
    } catch (error) {
      console.error("Erro ao atualizar etapa:", error);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/acoes-civeis/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        router.push("/dashboard/acoes-civeis");
      }
    } catch (error) {
      console.error("Erro ao excluir caso:", error);
    }
  };

  const handleSaveNotes = async () => {
    try {
      const response = await fetch(`/api/acoes-civeis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (response.ok) {
        console.log("Observações salvas com sucesso");
      }
    } catch (error) {
      console.error("Erro ao salvar observações:", error);
    }
  };

  const handleDrop = async (files: File[]) => {
    if (files.length === 0) return;

    setUploadingFile(true);
    
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("caseId", id);
      formData.append("name", file.name);

      try {
        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          setDocuments(prev => [...prev, result.document]);
        }
      } catch (error) {
        console.error("Erro ao fazer upload do arquivo:", error);
      }
    }
    
    setUploadingFile(false);
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDocumentDownload = (document: Document) => {
    if (typeof window !== 'undefined') {
      window.open(document.file_path, '_blank');
    }
  };

  const handleDocumentDelete = async (document: Document) => {
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== document.id));
        setDeleteDialogOpen(false);
        setDocumentToDelete(null);
      }
    } catch (error) {
      console.error("Erro ao excluir documento:", error);
    }
  };

  const handleDocumentNameChange = (name: string) => {
    setEditingDocumentName(name);
  };

  const handleDocumentNameSave = async () => {
    if (!editingDocumentId || !editingDocumentName.trim()) return;

    try {
      const response = await fetch(`/api/documents/${editingDocumentId}/name`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingDocumentName }),
      });
      
      if (response.ok) {
        setDocuments(prev => prev.map(doc => 
          doc.id === editingDocumentId 
            ? { ...doc, document_name: editingDocumentName, file_name: editingDocumentName }
            : doc
        ));
        setEditingDocumentId(null);
        setEditingDocumentName("");
      }
    } catch (error) {
      console.error("Erro ao atualizar nome do documento:", error);
    }
  };

  const handleDocumentNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDocumentNameSave();
    } else if (e.key === 'Escape') {
      setEditingDocumentId(null);
      setEditingDocumentName("");
    }
  };

  const handleDocumentDoubleClick = (document: Document) => {
    setEditingDocumentId(document.id);
    setEditingDocumentName(document.document_name || document.file_name || '');
  };

  const renderStepContent = (stepIndex: number) => {
    const isCurrent = stepIndex === caseData?.currentStep;
    const isCompleted = stepIndex < (caseData?.currentStep || 0);
    
    // Only render content for current and completed steps
    if (!isCurrent && !isCompleted) {
      return null;
    }

    switch (stepIndex) {
      case 0:
        return (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-900">Cadastro de Documentos</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Cliente</Label>
                <Input value={caseData?.clientName || ""} readOnly className="bg-white" />
              </div>
              <div className="space-y-1">
                <Label>Tipo de Ação</Label>
                <Input value={caseData?.type || ""} readOnly className="bg-white" />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Input value={(caseData?.status || "").toLowerCase() === "em andamento" ? "Em andamento" : caseData?.status || ""} readOnly className="bg-white" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Observações</Label>
                <Textarea value={notes || ""} readOnly className="bg-white" rows={3} />
              </div>
              {caseData?.rnmMae !== undefined && (
                <div className="space-y-1">
                  <Label>RNM Mãe</Label>
                  <Input value={String(caseData.rnmMae || "")} readOnly className="bg-white" />
                </div>
              )}
              {caseData?.nomeMae !== undefined && (
                <div className="space-y-1">
                  <Label>Nome da Mãe</Label>
                  <Input value={String((caseData as any).nomeMae || "")} readOnly className="bg-white" />
                </div>
              )}
              {caseData?.rnmPai !== undefined && (
                <div className="space-y-1">
                  <Label>RNM Pai</Label>
                  <Input value={String(caseData.rnmPai || "")} readOnly className="bg-white" />
                </div>
              )}
              {caseData?.nomePaiRegistral !== undefined && (
                <div className="space-y-1">
                  <Label>Nome do Pai Registral</Label>
                  <Input value={String((caseData as any).nomePaiRegistral || "")} readOnly className="bg-white" />
                </div>
              )}
              {caseData?.rnmSupostoPai !== undefined && (
                <div className="space-y-1">
                  <Label>RNM Suposto Pai</Label>
                  <Input value={String(caseData.rnmSupostoPai || "")} readOnly className="bg-white" />
                </div>
              )}
              {caseData?.nomeSupostoPai !== undefined && (
                <div className="space-y-1">
                  <Label>Nome do Suposto Pai</Label>
                  <Input value={String((caseData as any).nomeSupostoPai || "")} readOnly className="bg-white" />
                </div>
              )}
              {caseData?.certidaoNascimento !== undefined && (
                <div className="space-y-1">
                  <Label>Certidão de Nascimento</Label>
                  <Input value={String(caseData.certidaoNascimento || "")} readOnly className="bg-white" />
                </div>
              )}
              {caseData?.comprovanteEndereco !== undefined && (
                <div className="space-y-1">
                  <Label>Comprovante de Endereço</Label>
                  <Input value={String(caseData.comprovanteEndereco || "")} readOnly className="bg-white" />
                </div>
              )}
              {caseData?.passaporte !== undefined && (
                <div className="space-y-1">
                  <Label>Passaporte</Label>
                  <Input value={String(caseData.passaporte || "")} readOnly className="bg-white" />
                </div>
              )}
              {caseData?.cpfMae !== undefined && (
                <div className="space-y-1">
                  <Label>CPF da Mãe</Label>
                  <Input value={String(caseData.cpfMae || "")} readOnly className="bg-white" />
                </div>
              )}
              {caseData?.cpfPai !== undefined && (
                <div className="space-y-1">
                  <Label>CPF do Pai</Label>
                  <Input value={String(caseData.cpfPai || "")} readOnly className="bg-white" />
                </div>
              )}
              {caseData?.numeroProtocolo !== undefined && (
                <div className="space-y-1">
                  <Label>Número de Protocolo</Label>
                  <Input value={String(caseData.numeroProtocolo || "")} readOnly className="bg-white" />
                </div>
              )}
            </div>
            <div className="border-t pt-4 space-y-2">
              <h5 className="font-semibold text-slate-900">Anexos</h5>
              <div className="space-y-2">
                {documents.length === 0 ? (
                  <p className="text-sm text-slate-600">Nenhum documento anexado ainda.</p>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 border rounded-md bg-white">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-600" />
                        <span className="text-sm font-medium">{doc.document_name || doc.file_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleDocumentDownload(doc as any)}>
                          <Download className="h-4 w-4 mr-1" /> Download
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <Input type="file" className="flex-1" accept=".pdf,.jpg,.jpeg,.png" />
                <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
                  <Upload className="h-4 w-4 mr-2" />
                  Anexar
                </Button>
              </div>
              <p className="text-sm text-slate-600">Formatos aceitos: PDF, JPG, PNG</p>
            </div>
          </div>
        );
      
      case 1:
        if (caseData?.type === "Exame DNA") {
          return (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900">Agendamento do Exame de DNA</h4>
              <div className="grid gap-3">
                <div>
                  <Label>Data do Exame</Label>
                  <Input type="date" className="bg-white" />
                </div>
                <div>
                  <Label>Local do Exame</Label>
                  <Input type="text" placeholder="Nome do laboratório" className="bg-white" />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea placeholder="Informações adicionais sobre o agendamento..." className="bg-white" rows={3} />
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-900">Próximas Ações</h4>
            <p className="text-slate-600">Aguarde instruções para prosseguir com o processo.</p>
          </div>
        );
      
      default:
        return (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-900">Informações do Passo</h4>
            <p className="text-slate-600">Detalhes específicos desta etapa do processo.</p>
            <div className="grid gap-3">
              <div>
                <Label>Observações</Label>
                <Textarea placeholder="Adicione observações sobre este passo..." className="bg-white" rows={3} />
              </div>
              <div>
                <Label>Data Prevista</Label>
                <Input type="date" className="bg-white" />
              </div>
            </div>
          </div>
        );
    }
  };

  if (loading) {
  return (
    <div className="space-y-6">
      {caseData && (
        <Card className="border-2 shadow-md">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold">{caseData.clientName}</CardTitle>
              <Badge className="border-blue-200 text-blue-700">
                {(caseData.status || '').toLowerCase() === 'em andamento' ? 'Em andamento' : caseData.status}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground mt-1">{caseData.type}</div>
          </CardHeader>
        </Card>
      )}
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!caseData) {
    return <div>Ação não encontrada</div>;
  }

  const workflow = WORKFLOWS[caseData.type as keyof typeof WORKFLOWS] || [];

  return (
    <>
      <DetailLayout
        backHref="/dashboard/acoes-civeis"
        title={caseData.clientName}
        subtitle={caseData.type}
        onDelete={handleDelete}
        left={
          <ProcessFlow
            caseType={caseData.type}
            currentStep={caseData.currentStep}
            expandedStep={expandedStep}
            onStepToggle={handleStepClick}
            onStepComplete={handleCompleteStep}
            renderStepContent={renderStepContent}
          />
        }
        right={
          <div className="space-y-6">
            <StatusPanel
              status={status}
              onStatusChange={handleStatusChange}
              currentStep={caseData.currentStep + 1}
              totalSteps={workflow.length}
              createdAt={caseData.createdAt}
              updatedAt={caseData.updatedAt}
            />
            
            <DocumentPanel
              onDropFiles={handleDrop}
              uploading={uploadingFile}
              documents={documents}
              loadingDocuments={loadingDocuments}
              isDragOver={isDragOver}
              onDocumentDownload={handleDocumentDownload}
              onDocumentDelete={(doc) => {
                setDocumentToDelete(doc);
                setDeleteDialogOpen(true);
              }}
              editingDocumentId={editingDocumentId}
              editingDocumentName={editingDocumentName}
              onDocumentNameChange={handleDocumentNameChange}
              onDocumentNameSave={handleDocumentNameSave}
              onDocumentNameKeyPress={handleDocumentNameKeyPress}
              onDocumentDoubleClick={handleDocumentDoubleClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            />
            
            <NotesPanel
              notes={notes}
              onChange={setNotes}
              onSave={handleSaveNotes}
            />
          </div>
        }
      />

      {/* Document Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o documento "{documentToDelete?.document_name || documentToDelete?.file_name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => documentToDelete && handleDocumentDelete(documentToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}