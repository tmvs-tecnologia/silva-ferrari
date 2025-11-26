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

import { FIELD_TO_DOCUMENT_NAME } from "@/lib/supabase";

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
    "Cadastro Documentos",
    "Emissão da Guia Judicial",
    "Elaboração Procuração",
    "Aguardar procuração assinada",
    "Peticionar",
    "À Protocolar",
    "Processo Protocolado",
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
  dataExameDna?: string;
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
  const [status, setStatus] = useState("Em Andamento");
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
  const [assignments, setAssignments] = useState<Record<number, { responsibleName?: string; dueDate?: string }>>({});
  const [stepObservations, setStepObservations] = useState<Record<number, string>>({});
  const [dnaExamDate, setDnaExamDate] = useState("");
  const [dnaExamTime, setDnaExamTime] = useState("");

  // Load case data
  useEffect(() => {
    const loadCase = async () => {
      try {
        const response = await fetch(`/api/acoes-civeis/${id}`);
        if (response.ok) {
          const data = await response.json();
          setCaseData(data);
          setStatus(data.status || "Em Andamento");
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

  useEffect(() => {
    const loadAssignments = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/step-assignments?moduleType=acoes_civeis&recordId=${id}`);
        if (res.ok) {
          const data = await res.json();
          const map: Record<number, { responsibleName?: string; dueDate?: string }> = {};
          (data || []).forEach((a: any) => { map[a.stepIndex] = { responsibleName: a.responsibleName, dueDate: a.dueDate }; });
          setAssignments(map);
        }
      } catch (e) {
        console.error("Erro ao carregar assignments:", e);
      }
    };
    loadAssignments();
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

  const refreshDocuments = async () => {
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

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    setCaseData(prev => prev ? { ...prev, status: newStatus } : prev);
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
            const msg = `Status atualizado para "${newStatus}" em ${caseData?.clientName || ''} - ${caseData?.type || ''}`;
            await fetch(`/api/alerts`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ moduleType: "Ações Cíveis", recordId: id, alertFor: "admin", message: msg, isRead: false })
            });
            try { localStorage.setItem('alerts-updated', JSON.stringify({ t: Date.now() })); } catch {}
            window.dispatchEvent(new Event('alerts-updated'));
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
        try { localStorage.setItem('alerts-updated', JSON.stringify({ t: Date.now() })); } catch {}
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('alerts-updated'));
        try { localStorage.setItem('acoes-civeis-case-update', JSON.stringify({ id, currentStep: stepIndex + 1, t: Date.now() })); } catch {}
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('acoes-civeis-case-updated', { detail: { id, currentStep: stepIndex + 1 } }));
      }
    } catch (error) {
      console.error("Erro ao atualizar etapa:", error);
    }
  };

  const handleUncompleteStep = async (stepIndex: number) => {
    try {
      const response = await fetch(`/api/acoes-civeis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStep: stepIndex }),
      });
      if (response.ok) {
        const updatedCase = { ...caseData!, currentStep: stepIndex };
        setCaseData(updatedCase);
        setExpandedStep(null);
        try { localStorage.setItem('acoes-civeis-case-update', JSON.stringify({ id, currentStep: stepIndex, t: Date.now() })); } catch {}
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('acoes-civeis-case-updated', { detail: { id, currentStep: stepIndex } }));
      }
    } catch (error) {
      console.error("Erro ao desfazer conclusão da etapa:", error);
    }
  };


  const safeJson = async (res: Response) => {
    try {
      return await res.json();
    } catch {
      return { ok: res.ok, status: res.status } as any;
    }
  };

  const handleSaveAssignment = async (index: number, responsibleName?: string, dueDate?: string) => {
    try {
      const res = await fetch(`/api/step-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleType: "acoes_civeis", recordId: id, stepIndex: index, responsibleName, dueDate })
      });
      if (res.ok) {
        setAssignments(prev => ({ ...prev, [index]: { responsibleName, dueDate } }));
        const steps = getProcessFlowSteps(caseData?.type || "");
        const stepTitle = steps[index] || `Etapa ${index + 1}`;
        const dueBR = dueDate ? (() => { const [y, m, d] = dueDate.split("-"); return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`; })() : "—";
        const message = `Tarefa "${stepTitle}" atribuída a ${responsibleName || "—"} com prazo ${dueBR} para: ${caseData?.clientName || ""} - ${caseData?.type || ""}`;
        try {
          await fetch(`/api/alerts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ moduleType: "Ações Cíveis", recordId: id, alertFor: "admin", message, isRead: false })
          });
          try { localStorage.setItem('alerts-updated', JSON.stringify({ t: Date.now() })); } catch {}
          if (typeof window !== 'undefined') window.dispatchEvent(new Event('alerts-updated'));
        } catch {}
        try { localStorage.setItem('step-assignments-update', JSON.stringify({ moduleType: 'acoes_civeis', recordId: id, stepIndex: index, responsibleName, dueDate, t: Date.now() })); } catch {}
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('step-assignments-updated', { detail: { moduleType: 'acoes_civeis', recordId: id, stepIndex: index, responsibleName, dueDate } }));
        return true;
      } else {
        const err = await safeJson(res);
        console.error("Falha ao salvar assignment:", err);
        return false;
      }
    } catch (e) {
      console.error("Erro ao salvar assignment:", e);
      return false;
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

  const uploadCaseFile = async (file: File, fieldName: string) => {
    if (!file) return;
    setUploadingFile(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("caseId", id);
    formData.append("fieldName", fieldName);
    formData.append("clientName", caseData?.clientName || "");
    formData.append("moduleType", "acoes_civeis");
    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        await refreshDocuments();
        const displayName = FIELD_TO_DOCUMENT_NAME[fieldName] || fieldName;
        const msg = `Documento "${displayName}" anexado em ${caseData?.clientName || ''} - ${caseData?.type || ''}`;
        try {
          await fetch(`/api/alerts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ moduleType: "Ações Cíveis", recordId: id, alertFor: "admin", message: msg, isRead: false })
          });
          try { localStorage.setItem('alerts-updated', JSON.stringify({ t: Date.now() })); } catch {}
          if (typeof window !== 'undefined') window.dispatchEvent(new Event('alerts-updated'));
        } catch {}
      }
    } catch (error) {
      console.error("Erro ao fazer upload do arquivo:", error);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDnaResultUpload = async (file: File) => {
    if (!file) return;
    setUploadingFile(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("caseId", id);
    formData.append("fieldName", "resultadoExameDnaFile");
    formData.append("clientName", caseData?.clientName || "");
    formData.append("moduleType", "acoes_civeis");
    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        const result = await response.json();
        if (result?.fileUrl) {
          setDocuments(prev => [...prev, {
            id: result.document?.id,
            module_type: "acoes_civeis",
            record_id: parseInt(id),
            client_name: caseData?.clientName || "",
            field_name: "resultadoExameDnaFile",
            document_name: "Resultado do Exame de DNA",
            file_name: result.fileName,
            file_path: result.fileUrl,
            file_type: file.type,
            file_size: file.size,
            uploaded_at: new Date().toISOString(),
          } as any]);
          const msg = `Documento "Resultado do Exame de DNA" anexado em ${caseData?.clientName || ''} - ${caseData?.type || ''}`;
          try {
            await fetch(`/api/alerts`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ moduleType: "Ações Cíveis", recordId: id, alertFor: "admin", message: msg, isRead: false })
            });
            try { localStorage.setItem('alerts-updated', JSON.stringify({ t: Date.now() })); } catch {}
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('alerts-updated'));
          } catch {}
        }
      }
    } catch (error) {
      console.error("Erro ao fazer upload do exame de DNA:", error);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSaveDnaSchedule = async () => {
    const combined = dnaExamDate && dnaExamTime ? `${dnaExamDate} ${dnaExamTime}` : dnaExamDate || "";
    try {
      const response = await fetch(`/api/acoes-civeis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataExameDna: combined }),
      });
      if (response.ok) {
        setCaseData(prev => prev ? { ...prev, dataExameDna: combined } : prev);
      }
    } catch (error) {
      console.error("Erro ao salvar agendamento do exame de DNA:", error);
    }
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

  const getProcessFlowSteps = (type: string) => {
    const STANDARD_CIVIL_STEPS = [
      "Cadastro Documentos",
      "Agendar Exame DNA",
      "Elaboração Procuração",
      "Aguardar procuração assinada",
      "À Protocolar",
      "Processo Protocolado",
      "Processo Finalizado",
    ];
    const EXAME_DNA_STEPS = [
      "Cadastro Documentos",
      "Agendar Exame DNA",
      "Elaboração Procuração",
      "Aguardar procuração assinada",
      "À Protocolar",
      "Processo Protocolado",
      "Processo Finalizado",
    ];
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
    return type === "Exame DNA"
      ? EXAME_DNA_STEPS
      : (type === "Alteração de Nome" || type === "Guarda" || type === "Acordos de Guarda")
      ? ALTERACAO_NOME_STEPS
      : STANDARD_CIVIL_STEPS;
  };

  const handleObservationChange = (index: number, value: string) => {
    setStepObservations(prev => ({ ...prev, [index]: value }));
  };

  const handleSaveStepObservation = async (index: number) => {
    const stepTitle = getProcessFlowSteps(caseData?.type || "")[index] || `Etapa ${index + 1}`;
    const currentText = stepObservations[index] || "";
    const existing = notes || "";
    const divider = existing ? "\n" : "";
    const newNotes = `${existing}${divider}[${stepTitle}] ${currentText}`;
    setNotes(newNotes);
    try {
      const response = await fetch(`/api/acoes-civeis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: newNotes }),
      });
      if (response.ok) {
        const data = await response.json();
        setCaseData(prev => prev ? { ...prev, notes: data.notes } : prev);
      }
    } catch (error) {
      console.error("Erro ao salvar observações da etapa:", error);
    }
  };

  const patchCaseField = async (payload: Record<string, any>) => {
    try {
      const response = await fetch(`/api/acoes-civeis/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const data = await response.json();
        setCaseData(prev => prev ? { ...prev, ...payload } : prev);
      }
    } catch (error) {
      console.error('Erro ao salvar campo:', error);
    }
  };

  const renderStepContent = (stepIndex: number) => {
    const isCurrent = stepIndex === caseData?.currentStep;
    const isCompleted = stepIndex < (caseData?.currentStep || 0);

    switch (stepIndex) {
      case 0:
        if (caseData?.type === 'Exame DNA') {
          return (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900">Cadastro de Documentos</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Cliente</Label>
                  <Input value={caseData?.clientName || ''} readOnly className="bg-white" />
                </div>
                <div className="space-y-1">
                  <Label>Tipo de Ação</Label>
                  <Input value={caseData?.type || ''} readOnly className="bg-white" />
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  <h4 className="text-base font-semibold">Dados de nomes</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Nome da Mãe</Label>
                      <Input
                        className="bg-white"
                        value={String((caseData as any).nomeMae || '')}
                        onChange={(e) => setCaseData(prev => prev ? { ...prev, nomeMae: e.target.value } : prev)}
                        onBlur={(e) => patchCaseField({ nomeMae: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Nome do Pai Registral</Label>
                      <Input
                        className="bg-white"
                        value={String((caseData as any).nomePaiRegistral || '')}
                        onChange={(e) => setCaseData(prev => prev ? { ...prev, nomePaiRegistral: e.target.value } : prev)}
                        onBlur={(e) => patchCaseField({ nomePaiRegistral: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Nome do Suposto Pai</Label>
                      <Input
                        className="bg-white"
                        value={String((caseData as any).nomeSupostoPai || '')}
                        onChange={(e) => setCaseData(prev => prev ? { ...prev, nomeSupostoPai: e.target.value } : prev)}
                        onBlur={(e) => patchCaseField({ nomeSupostoPai: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Nome da Criança</Label>
                      <Input
                        className="bg-white"
                        value={String((caseData as any).nomeCrianca || '')}
                        onChange={(e) => setCaseData(prev => prev ? { ...prev, nomeCrianca: e.target.value } : prev)}
                        onBlur={(e) => patchCaseField({ nomeCrianca: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-semibold">Documentos de identificação (RNM / RNE / RG)</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>RNM / RNE / RG Mãe</Label>
                      <Input
                        className="bg-white"
                        value={String(caseData.rnmMae || '')}
                        onChange={(e) => setCaseData(prev => prev ? { ...prev, rnmMae: e.target.value } : prev)}
                        onBlur={(e) => patchCaseField({ rnmMae: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>RNM / RNE / RG Pai</Label>
                      <Input
                        className="bg-white"
                        value={String(caseData.rnmPai || '')}
                        onChange={(e) => setCaseData(prev => prev ? { ...prev, rnmPai: e.target.value } : prev)}
                        onBlur={(e) => patchCaseField({ rnmPai: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>RNM / RNE / RG Suposto Pai</Label>
                      <Input
                        className="bg-white"
                        value={String(caseData.rnmSupostoPai || '')}
                        onChange={(e) => setCaseData(prev => prev ? { ...prev, rnmSupostoPai: e.target.value } : prev)}
                        onBlur={(e) => patchCaseField({ rnmSupostoPai: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-semibold">Documentos da Criança</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Certidão de Nascimento da Criança</Label>
                      <Input
                        className="bg-white"
                        value={String(caseData.certidaoNascimento || '')}
                        onChange={(e) => setCaseData(prev => prev ? { ...prev, certidaoNascimento: e.target.value } : prev)}
                        onBlur={(e) => patchCaseField({ certidaoNascimento: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-semibold">Documentos de Residência</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Comprovante de Endereço</Label>
                      <Input
                        className="bg-white"
                        value={String(caseData.comprovanteEndereco || '')}
                        onChange={(e) => setCaseData(prev => prev ? { ...prev, comprovanteEndereco: e.target.value } : prev)}
                        onBlur={(e) => patchCaseField({ comprovanteEndereco: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-semibold">Passaportes</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Passaporte da Mãe</Label>
                      <Input type="file" className="bg-white" accept=".pdf,.jpg,.jpeg,.png"
                        aria-label="Selecionar documento de passaporte da mãe"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadCaseFile(f, 'passaporteMaeFile');
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Passaporte do Pai Registral</Label>
                      <Input type="file" className="bg-white" accept=".pdf,.jpg,.jpeg,.png"
                        aria-label="Selecionar documento de passaporte do pai registral"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadCaseFile(f, 'passaportePaiRegistralFile');
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Passaporte do Suposto Pai</Label>
                      <Input type="file" className="bg-white" accept=".pdf,.jpg,.jpeg,.png"
                        aria-label="Selecionar documento de passaporte do suposto pai"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadCaseFile(f, 'passaporteSupostoPaiFile');
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-semibold">Outros</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>CPF da Mãe</Label>
                      <Input
                        className="bg-white"
                        value={String(caseData.cpfMae || '')}
                        onChange={(e) => setCaseData(prev => prev ? { ...prev, cpfMae: e.target.value } : prev)}
                        onBlur={(e) => patchCaseField({ cpfMae: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>CPF do Pai Registral</Label>
                      <Input
                        className="bg-white"
                        value={String(caseData.cpfPai || '')}
                        onChange={(e) => setCaseData(prev => prev ? { ...prev, cpfPai: e.target.value } : prev)}
                        onBlur={(e) => patchCaseField({ cpfPai: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    className="flex-1"
                    accept=".pdf,.jpg,.jpeg,.png"
                    aria-label="Selecionar arquivo para anexar"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        handleDrop([f]);
                      }
                    }}
                  />
                </div>
                <p className="text-sm text-slate-600">Formatos aceitos: PDF, JPG, PNG</p>
              </div>
            </div>
          );
        }
        if (caseData?.type === 'Alteração de Nome' || caseData?.type === 'Guarda' || caseData?.type === 'Acordos de Guarda') {
          return (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900">Cadastro de Documentos</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Cliente</Label>
                  <Input value={caseData?.clientName || ''} readOnly className="bg-white" />
                </div>
                <div className="space-y-1">
                  <Label>Tipo de Ação</Label>
                  <Input value={caseData?.type || ''} readOnly className="bg-white" />
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  <h4 className="text-base font-semibold">Dados da Família</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1">
                      <Label>Nome da Mãe</Label>
                      <Input className="bg-white" value={String((caseData as any).nomeMae || '')}
                        onChange={(e) => setCaseData(prev => prev ? { ...prev, nomeMae: e.target.value } : prev)}
                        onBlur={(e) => patchCaseField({ nomeMae: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Nome do Pai</Label>
                      <Input className="bg-white" value={String((caseData as any).nomePaiRegistral || '')}
                        onChange={(e) => setCaseData(prev => prev ? { ...prev, nomePaiRegistral: e.target.value } : prev)}
                        onBlur={(e) => patchCaseField({ nomePaiRegistral: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Nome da Criança</Label>
                      <Input className="bg-white" value={String((caseData as any).nomeCrianca || '')}
                        onChange={(e) => setCaseData(prev => prev ? { ...prev, nomeCrianca: e.target.value } : prev)}
                        onBlur={(e) => patchCaseField({ nomeCrianca: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-semibold">Documentos dos Responsáveis</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>RNM / RNE / RG Mãe</Label>
                      <Input className="bg-white" value={String(caseData.rnmMae || '')}
                        onChange={(e) => setCaseData(prev => prev ? { ...prev, rnmMae: e.target.value } : prev)}
                        onBlur={(e) => patchCaseField({ rnmMae: e.target.value })}
                      />
                      <Input type="file" className="bg-white" accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCaseFile(f, 'rnmMaeFile'); }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>RNM / RNE / RG Pai</Label>
                      <Input className="bg-white" value={String(caseData.rnmPai || '')}
                        onChange={(e) => setCaseData(prev => prev ? { ...prev, rnmPai: e.target.value } : prev)}
                        onBlur={(e) => patchCaseField({ rnmPai: e.target.value })}
                      />
                      <Input type="file" className="bg-white" accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCaseFile(f, 'rnmPaiFile'); }}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>CPF Mãe</Label>
                      <Input className="bg-white" value={String(caseData.cpfMae || '')}
                        onChange={(e) => setCaseData(prev => prev ? { ...prev, cpfMae: e.target.value } : prev)}
                        onBlur={(e) => patchCaseField({ cpfMae: e.target.value })}
                      />
                      <Input type="file" className="bg-white" accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCaseFile(f, 'cpfMaeFile'); }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>CPF Pai</Label>
                      <Input className="bg-white" value={String(caseData.cpfPai || '')}
                        onChange={(e) => setCaseData(prev => prev ? { ...prev, cpfPai: e.target.value } : prev)}
                        onBlur={(e) => patchCaseField({ cpfPai: e.target.value })}
                      />
                      <Input type="file" className="bg-white" accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCaseFile(f, 'cpfPaiFile'); }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-semibold">Documentos da Criança</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Certidão de Nascimento da Criança</Label>
                      <Input className="bg-white" value={String(caseData.certidaoNascimento || '')}
                        onChange={(e) => setCaseData(prev => prev ? { ...prev, certidaoNascimento: e.target.value } : prev)}
                        onBlur={(e) => patchCaseField({ certidaoNascimento: e.target.value })}
                      />
                      <Input type="file" className="bg-white" accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCaseFile(f, 'certidaoNascimentoFile'); }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-semibold">Comprovação de Residência</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Comprovante de Endereço</Label>
                      <Input className="bg-white" value={String(caseData.comprovanteEndereco || '')}
                        onChange={(e) => setCaseData(prev => prev ? { ...prev, comprovanteEndereco: e.target.value } : prev)}
                        onBlur={(e) => patchCaseField({ comprovanteEndereco: e.target.value })}
                      />
                      <Input type="file" className="bg-white" accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCaseFile(f, 'comprovanteEnderecoFile'); }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-semibold">Passaportes</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1">
                      <Label>Passaporte da Mãe</Label>
                      <Input type="file" className="bg-white" accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCaseFile(f, 'passaporteMaeFile'); }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Passaporte do Pai</Label>
                      <Input type="file" className="bg-white" accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCaseFile(f, 'passaportePaiRegistralFile'); }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Passaporte da Criança</Label>
                      <Input type="file" className="bg-white" accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCaseFile(f, 'passaporteFile'); }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Input type="file" className="flex-1" accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleDrop([f]); } }}
                  />
                </div>
                <p className="text-sm text-slate-600">Formatos aceitos: PDF, JPG, PNG</p>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-900">Cadastro de Documentos</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Cliente</Label>
                <Input value={caseData?.clientName || ''} readOnly className="bg-white" />
              </div>
              <div className="space-y-1">
                <Label>Tipo de Ação</Label>
                <Input value={caseData?.type || ''} readOnly className="bg-white" />
              </div>
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
                  <Input type="date" className="bg-white" value={dnaExamDate} onChange={(e) => setDnaExamDate(e.target.value)} />
                </div>
                <div>
                  <Label>Hora do Exame</Label>
                  <Input type="time" className="bg-white" value={dnaExamTime} onChange={(e) => setDnaExamTime(e.target.value)} />
                </div>
                <div>
                  <Label>Local do Exame</Label>
                  <Input type="text" placeholder="Nome do laboratório" className="bg-white" />
                </div>
                <div>
                  <Label>Arquivo do Exame de DNA</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="bg-white"
                    aria-label="Selecionar arquivo do exame de DNA"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleDnaResultUpload(f);
                    }}
                  />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea placeholder="Informações adicionais sobre o agendamento..." className="bg-white" rows={3} />
                </div>
                <div>
                  <Button onClick={handleSaveDnaSchedule}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Agendamento
                  </Button>
                </div>
              </div>
            </div>
          );
        }
        if (caseData?.type === "Alteração de Nome" || caseData?.type === "Guarda" || caseData?.type === "Acordos de Guarda") {
          return (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900">Emissão da Guia Judicial</h4>
              <div className="grid gap-3">
                <div>
                  <Label>Guia Judicial</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="bg-white"
                    aria-label="Selecionar arquivo da guia judicial"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadCaseFile(f, 'guiaPagaFile');
                    }}
                  />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea
                    placeholder="Informações sobre a guia judicial..."
                    className="bg-white"
                    rows={3}
                    value={stepObservations[1] || ''}
                    onChange={(e) => handleObservationChange(1, e.target.value)}
                  />
                </div>
                <div>
                  <Button onClick={() => handleSaveStepObservation(1)}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Observações
                  </Button>
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
      
      case 2:
        return (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-900">Elaboração Procuração</h4>
            <div className="grid gap-3">
              <div>
                <Label>Procuração</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="bg-white"
                  aria-label="Selecionar arquivo de procuração"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadCaseFile(f, 'procuracaoAnexadaFile');
                  }}
                />
              </div>
            </div>
            <div className="grid gap-3">
              <div>
                <Label>Observações</Label>
                <Textarea
                  placeholder="Adicione observações sobre esta etapa..."
                  className="bg-white"
                  rows={3}
                  value={stepObservations[2] || ''}
                  onChange={(e) => handleObservationChange(2, e.target.value)}
                />
              </div>
              <div>
                <Button onClick={() => handleSaveStepObservation(2)}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Observações
                </Button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-900">Aguardar Procuração Assinada</h4>
            <div className="grid gap-3">
              <div>
                <Label>Procuração Assinada</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="bg-white"
                  aria-label="Selecionar arquivo da procuração assinada"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadCaseFile(f, 'procuracaoAnexadaFile');
                  }}
                />
              </div>
            </div>
            <div className="grid gap-3">
              <div>
                <Label>Observações</Label>
                <Textarea
                  placeholder="Adicione observações sobre esta etapa..."
                  className="bg-white"
                  rows={3}
                  value={stepObservations[3] || ''}
                  onChange={(e) => handleObservationChange(3, e.target.value)}
                />
              </div>
              <div>
                <Button onClick={() => handleSaveStepObservation(3)}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Observações
                </Button>
              </div>
            </div>
          </div>
        );

      case 4:
        if (caseData?.type === "Alteração de Nome" || caseData?.type === "Guarda" || caseData?.type === "Acordos de Guarda") {
          return (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900">Peticionar</h4>
              <div className="grid gap-3">
                <div>
                  <Label>Petição</Label>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="bg-white"
                    aria-label="Selecionar arquivo da petição"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadCaseFile(f, 'peticaoAnexadaFile');
                    }}
                  />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea
                    placeholder="Adicione observações sobre esta etapa..."
                    className="bg-white"
                    rows={3}
                    value={stepObservations[4] || ''}
                    onChange={(e) => handleObservationChange(4, e.target.value)}
                  />
                </div>
                <div>
                  <Button onClick={() => handleSaveStepObservation(4)}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Observações
                  </Button>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-900">À Protocolar</h4>
            <div className="grid gap-3">
              <div>
                <Label>Processo</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="bg-white"
                  aria-label="Selecionar arquivo do processo"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadCaseFile(f, 'processoAnexadoFile');
                  }}
                />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  placeholder="Adicione observações sobre esta etapa..."
                  className="bg-white"
                  rows={3}
                  value={stepObservations[4] || ''}
                  onChange={(e) => handleObservationChange(4, e.target.value)}
                />
              </div>
              <div>
                <Button onClick={() => handleSaveStepObservation(4)}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Observações
                </Button>
              </div>
            </div>
          </div>
        );

      case 5:
        if (caseData?.type === "Alteração de Nome" || caseData?.type === "Guarda" || caseData?.type === "Acordos de Guarda") {
          return (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900">À Protocolar</h4>
              <div className="grid gap-3">
                <div>
                  <Label>Processo</Label>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="bg-white"
                    aria-label="Selecionar arquivo do processo"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadCaseFile(f, 'processoAnexadoFile');
                    }}
                  />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea
                    placeholder="Adicione observações sobre esta etapa..."
                    className="bg-white"
                    rows={3}
                    value={stepObservations[5] || ''}
                    onChange={(e) => handleObservationChange(5, e.target.value)}
                  />
                </div>
                <div>
                  <Button onClick={() => handleSaveStepObservation(5)}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Observações
                  </Button>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-900">Protocolado</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Documento Protocolado</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="bg-white"
                  aria-label="Selecionar documento protocolado"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadCaseFile(f, 'processoAnexadoFile');
                  }}
                />
              </div>
              <div>
                <Label>Número do Protocolo</Label>
                <Input
                  type="text"
                  placeholder="Digite o número do protocolo"
                  className="bg-white"
                  value={String(caseData?.numeroProtocolo || '')}
                  onChange={(e) => setCaseData(prev => prev ? { ...prev, numeroProtocolo: e.target.value } : prev)}
                  onBlur={async (e) => {
                    try {
                      await fetch(`/api/acoes-civeis/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ numeroProtocolo: e.target.value }),
                      });
                    } catch (error) {
                      console.error('Erro ao salvar número de protocolo:', error);
                    }
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Adicione observações sobre esta etapa..."
                  className="bg-white"
                  rows={3}
                  value={stepObservations[5] || ''}
                  onChange={(e) => handleObservationChange(5, e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Button onClick={() => handleSaveStepObservation(5)}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Observações
                </Button>
              </div>
            </div>
          </div>
        );

      case 6:
        if (caseData?.type === "Alteração de Nome" || caseData?.type === "Guarda" || caseData?.type === "Acordos de Guarda") {
          return (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900">Processo Protocolado</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label>Documento Protocolado</Label>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="bg-white"
                    aria-label="Selecionar documento protocolado"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadCaseFile(f, 'processoAnexadoFile');
                    }}
                  />
                </div>
                <div>
                  <Label>Número do Protocolo</Label>
                  <Input
                    type="text"
                    placeholder="Digite o número do protocolo"
                    className="bg-white"
                    value={String(caseData?.numeroProtocolo || '')}
                    onChange={(e) => setCaseData(prev => prev ? { ...prev, numeroProtocolo: e.target.value } : prev)}
                    onBlur={async (e) => {
                      try {
                        await fetch(`/api/acoes-civeis/${id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ numeroProtocolo: e.target.value }),
                        });
                      } catch (error) {
                        console.error('Erro ao salvar número de protocolo:', error);
                      }
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea
                    placeholder="Adicione observações sobre esta etapa..."
                    className="bg-white"
                    rows={3}
                    value={stepObservations[6] || ''}
                    onChange={(e) => handleObservationChange(6, e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Button onClick={() => handleSaveStepObservation(6)}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Observações
                  </Button>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-900">Processo Finalizado</h4>
            <div className="grid gap-3">
              <div>
                <Label>Documento Final</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="bg-white"
                  aria-label="Selecionar documento de finalização"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadCaseFile(f, 'documentosProcessoFinalizadoFile');
                  }}
                />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  placeholder="Adicione observações sobre a finalização..."
                  className="bg-white"
                  rows={3}
                  value={stepObservations[6] || ''}
                  onChange={(e) => handleObservationChange(6, e.target.value)}
                />
              </div>
              <div>
                <Button onClick={() => handleSaveStepObservation(6)}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Observações
                </Button>
              </div>
            </div>
          </div>
        );

      case 7:
        if (caseData?.type === "Alteração de Nome" || caseData?.type === "Guarda") {
          return (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900">Processo Finalizado</h4>
              <div className="grid gap-3">
                <div>
                  <Label>Documento Final</Label>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="bg-white"
                    aria-label="Selecionar documento de finalização"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadCaseFile(f, 'documentosProcessoFinalizadoFile');
                    }}
                  />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea
                    placeholder="Adicione observações sobre a finalização..."
                    className="bg-white"
                    rows={3}
                    value={stepObservations[7] || ''}
                    onChange={(e) => handleObservationChange(7, e.target.value)}
                  />
                </div>
                <div>
                  <Button onClick={() => handleSaveStepObservation(7)}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Observações
                  </Button>
                </div>
              </div>
            </div>
          );
        }
        return null;
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
                {(caseData.status || '').toLowerCase() === 'em andamento' ? 'Em Andamento' : caseData.status}
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
              onStepUncomplete={handleUncompleteStep}
              renderStepContent={renderStepContent}
              assignments={assignments}
              onSaveAssignment={handleSaveAssignment}
            />
        }
        right={
          <div className="space-y-6">
            <StatusPanel
              status={status}
              onStatusChange={handleStatusChange}
              currentStep={(caseData.currentStep ?? 0) + 1}
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
