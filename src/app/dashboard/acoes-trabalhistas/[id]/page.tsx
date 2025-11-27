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
import { StepItem } from "@/components/detail/StepItem";
import { StatusPanel } from "@/components/detail/StatusPanel";
import { DocumentPanel } from "@/components/detail/DocumentPanel";
import { NotesPanel } from "@/components/detail/NotesPanel";
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

// Workflow steps for Ações Trabalhistas
const WORKFLOWS = {
  "Ação Trabalhista": [
    "Análise Inicial",
    "Petição Inicial",
    "Citação",
    "Contestação",
    "Audiência Inicial",
    "Instrução Processual",
    "Alegações Finais",
    "Sentença",
    "Execução/Recurso",
  ],
};

interface CaseData {
  id: string;
  clientName: string;
  type: string;
  status: string;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  // Trabalhista specific fields
  documentosIniciais?: string;
  documentosIniciaisFile?: string;
  contratoTrabalho?: string;
  contratoTrabalhoFile?: string;
  carteiraTrabalhista?: string;
  carteiraTrabalhistaFile?: string;
  comprovantesSalariais?: string;
  comprovantesSalariaisFile?: string;
  peticaoInicial?: string;
  peticaoInicialFile?: string;
  procuracaoTrabalhista?: string;
  procuracaoTrabalhistaFile?: string;
  citacaoEmpregador?: string;
  citacaoEmpregadorFile?: string;
  contestacaoRecebida?: string;
  contestacaoRecebidaFile?: string;
  ataAudienciaInicial?: string;
  ataAudienciaInicialFile?: string;
  provasTestemunhas?: string;
  provasTestemunhasFile?: string;
  alegacoesFinais?: string;
  alegacoesFinaisFile?: string;
  sentencaTrabalhista?: string;
  sentencaTrabalhistaFile?: string;
  execucaoRecurso?: string;
  execucaoRecursoFile?: string;
}

interface CaseDocument {
  id: string;
  name?: string;
  document_name?: string;
  file_name?: string;
  file_path: string;
  uploaded_at: string;
}

export default function AcaoTrabalhistaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Em andamento");
  const [notes, setNotes] = useState("");
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<CaseDocument | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editingDocumentName, setEditingDocumentName] = useState("");
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
  const [assignments, setAssignments] = useState<Record<number, { responsibleName?: string; dueDate?: string }>>({});

  // Load case data
  useEffect(() => {
    const loadCase = async () => {
      try {
        const response = await fetch(`/api/acoes-trabalhistas?id=${id}`);
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

  useEffect(() => {
    const loadAssignments = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/step-assignments?moduleType=acoes_trabalhistas&recordId=${id}`);
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

  const handleSaveAssignment = async (index: number, responsibleName?: string, dueDate?: string) => {
    try {
      const res = await fetch(`/api/step-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleType: "acoes_trabalhistas", recordId: id, stepIndex: index, responsibleName, dueDate })
      });
      if (res.ok) {
        setAssignments(prev => ({ ...prev, [index]: { responsibleName, dueDate } }));
        const steps = WORKFLOWS["Ação Trabalhista"] || [];
        const stepTitle = steps[index] || `Etapa ${index + 1}`;
        const dueBR = dueDate ? (() => { const [y, m, d] = dueDate.split("-"); return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`; })() : "—";
        const message = `Tarefa "${stepTitle}" atribuída a ${responsibleName || "—"} com prazo ${dueBR} para: ${caseData?.clientName || ""} - ${caseData?.type || ""}`;
        try {
          await fetch(`/api/alerts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ moduleType: "Ações Trabalhistas", recordId: id, alertFor: "admin", message, isRead: false })
          });
        } catch {}
        return true;
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Falha ao salvar assignment:", err);
        return false;
      }
    } catch (e) {
      console.error("Erro ao salvar assignment:", e);
      return false;
    }
  };

  // Load documents
  useEffect(() => {
    const loadDocuments = async () => {
      if (!id) return;
      
      setLoadingDocuments(true);
      try {
        const response = await fetch(`/api/documents/${id}?moduleType=acoes_trabalhistas`);
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
      const response = await fetch(`/api/acoes-trabalhistas?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('acoes-trabalhistas-status-update', JSON.stringify({ id, status: newStatus, t: Date.now() }));
            window.dispatchEvent(new CustomEvent('acoes-trabalhistas-status-updated', { detail: { id, status: newStatus } }));
            const msg = `Status atualizado para "${newStatus}"`;
            await fetch(`/api/alerts`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ moduleType: "Ações Trabalhistas", recordId: id, alertFor: "admin", message: msg, isRead: false })
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

  const handleCompleteStep = async (stepIndex: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const response = await fetch(`/api/acoes-trabalhistas?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStep: stepIndex + 1 }),
      });
      
      if (response.ok) {
        const updatedCase = { ...caseData!, currentStep: stepIndex + 1 };
        setCaseData(updatedCase);
        setExpandedStep(null);
        try { localStorage.setItem('alerts-updated', JSON.stringify({ t: Date.now() })); } catch {}
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('alerts-updated'));
      }
    } catch (error) {
      console.error("Erro ao atualizar etapa:", error);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/acoes-trabalhistas?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        router.push("/dashboard/acoes-trabalhistas");
      }
    } catch (error) {
      console.error("Erro ao excluir caso:", error);
    }
  };

  const handleSaveNotes = async () => {
    try {
      const response = await fetch(`/api/acoes-trabalhistas?id=${id}`, {
        method: "PUT",
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

  const handleDropFiles = async (files: File[]) => {
    setIsDragOver(false);
    if (!files.length) return;
    setUploadingFile(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("caseId", id);
      formData.append("moduleType", "acoes_trabalhistas");
      try {
        const response = await fetch("/api/documents/upload", { method: "POST", body: formData });
        if (response.ok) {
          const result = await response.json();
          setDocuments(prev => [...prev, result.document]);
          try {
            await fetch(`/api/alerts`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ moduleType: "Ações Trabalhistas", recordId: id, alertFor: "admin", message: `Documento anexado: ${file.name}`, isRead: false })
            });
            try { localStorage.setItem('alerts-updated', JSON.stringify({ t: Date.now() })); } catch {}
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('alerts-updated'));
          } catch {}
        }
      } catch (error) {
        console.error("Erro ao fazer upload do arquivo:", error);
      }
    }
    setUploadingFile(false);
  };

  const handleDocumentDownload = (document: any) => {
    if (typeof window !== 'undefined') {
      const url = document.file_path || document.url;
      if (url) window.open(url, '_blank');
    }
  };

  const handleDocumentDelete = async (document: any) => {
    try {
      const response = await fetch(`/api/documents/delete/${document.id}`, { method: "DELETE" });
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
      const response = await fetch(`/api/documents/rename/${editingDocumentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_name: editingDocumentName }),
      });
      if (response.ok) {
        setDocuments(prev => prev.map(doc => 
          doc.id === editingDocumentId 
            ? { ...doc, name: editingDocumentName }
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

  const handleDocumentDoubleClick = (document: any) => {
    setEditingDocumentId(document.id);
    setEditingDocumentName(document.document_name || document.name || document.file_name || "");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFields(prev => ({ ...prev, [fieldName]: true }));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("caseId", id);
    formData.append("fieldName", fieldName);

    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Update case data with the file URL
        const updatedCaseData = {
          ...caseData,
          [fieldName]: data.fileName
        } as CaseData;
        setCaseData(updatedCaseData);
        
        // Save to database immediately after upload
        await fetch(`/api/acoes-trabalhistas?id=${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [fieldName]: data.fileName }),
        });
        
        // Refresh documents list
        const loadDocuments = async () => {
          const response = await fetch(`/api/documents/${id}?moduleType=acoes_trabalhistas`);
          if (response.ok) {
            const data = await response.json();
            setDocuments(data || []);
          }
        };
        await loadDocuments();
        
        alert("✅ Arquivo enviado e salvo com sucesso!");
        try {
          await fetch(`/api/alerts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ moduleType: "Ações Trabalhistas", recordId: id, alertFor: "admin", message: `Documento anexado: ${file.name}`, isRead: false })
          });
          try { localStorage.setItem('alerts-updated', JSON.stringify({ t: Date.now() })); } catch {}
          if (typeof window !== 'undefined') window.dispatchEvent(new Event('alerts-updated'));
        } catch {}
      } else {
        console.error("Erro no upload:", data);
        alert(`❌ Erro ao enviar arquivo: ${data.error}`);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("❌ Erro ao enviar arquivo");
    } finally {
      setUploadingFields(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const renderDocLinks = (fieldKey: string) => {
    const list = (documents || []).filter((d: any) => (d.field_name || (d as any).fieldName) === fieldKey);
    if (!list.length) return null as any;
    return (
      <div className="mt-2">
        <Label>Documento anexado</Label>
        <ul className="list-disc pl-5">
          {list.map((doc: any) => (
            <li key={String(doc.id)}>
              <a href={doc.file_path || doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {doc.document_name || doc.name || doc.file_name || "Documento"}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderStepContent = (stepIndex: number) => {
    if (!caseData) return null;
    
    const isCurrent = stepIndex === caseData.currentStep;
    const isCompleted = stepIndex < caseData.currentStep;
    
    // Only render content for current and completed steps
    if (!isCurrent && !isCompleted) {
      return null;
    }

    switch (stepIndex) {
      case 0: // Análise Inicial
        return (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-900">Documentos Iniciais:</h4>
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label>Documentos Iniciais</Label>
                <Input
                  value={caseData.documentosIniciais || ""}
                  onChange={(e) => setCaseData({...caseData, documentosIniciais: e.target.value})}
                  placeholder="Status dos documentos iniciais"
                  className="bg-white"
                />
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => handleFileUpload(e, "documentosIniciaisFile")}
                  disabled={uploadingFields.documentosIniciaisFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.documentosIniciaisFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {caseData.documentosIniciaisFile && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {caseData.documentosIniciaisFile}
                </p>
              )}
              {renderDocLinks("documentosIniciaisFile")}
            </div>

              <div className="space-y-2">
                <Label>Contrato de Trabalho</Label>
                <Input
                  value={caseData.contratoTrabalho || ""}
                  onChange={(e) => setCaseData({...caseData, contratoTrabalho: e.target.value})}
                  placeholder="Status do contrato de trabalho"
                  className="bg-white"
                />
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => handleFileUpload(e, "contratoTrabalhoFile")}
                  disabled={uploadingFields.contratoTrabalhoFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.contratoTrabalhoFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {caseData.contratoTrabalhoFile && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {caseData.contratoTrabalhoFile}
                </p>
              )}
              {renderDocLinks("contratoTrabalhoFile")}
            </div>

              <div className="space-y-2">
                <Label>Carteira de Trabalho</Label>
                <Input
                  value={caseData.carteiraTrabalhista || ""}
                  onChange={(e) => setCaseData({...caseData, carteiraTrabalhista: e.target.value})}
                  placeholder="Status da carteira de trabalho"
                  className="bg-white"
                />
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => handleFileUpload(e, "carteiraTrabalhistaFile")}
                  disabled={uploadingFields.carteiraTrabalhistaFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.carteiraTrabalhistaFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {caseData.carteiraTrabalhistaFile && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {caseData.carteiraTrabalhistaFile}
                </p>
              )}
              {renderDocLinks("carteiraTrabalhistaFile")}
            </div>

              <div className="space-y-2">
                <Label>Comprovantes Salariais</Label>
                <Input
                  value={caseData.comprovantesSalariais || ""}
                  onChange={(e) => setCaseData({...caseData, comprovantesSalariais: e.target.value})}
                  placeholder="Status dos comprovantes salariais"
                  className="bg-white"
                />
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => handleFileUpload(e, "comprovantesSalariaisFile")}
                  disabled={uploadingFields.comprovantesSalariaisFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.comprovantesSalariaisFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {caseData.comprovantesSalariaisFile && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {caseData.comprovantesSalariaisFile}
                </p>
              )}
              {renderDocLinks("comprovantesSalariaisFile")}
            </div>
            </div>
            <Button 
              onClick={() => {
                // Save all step data
                fetch(`/api/acoes-trabalhistas?id=${id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    documentosIniciais: caseData.documentosIniciais,
                    contratoTrabalho: caseData.contratoTrabalho,
                    carteiraTrabalhista: caseData.carteiraTrabalhista,
                    comprovantesSalariais: caseData.comprovantesSalariais,
                  }),
                }).then(() => alert("Dados salvos com sucesso!"));
              }} 
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        );

      case 1: // Petição Inicial
        return (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-900">Petição Inicial:</h4>
            <div className="space-y-2">
              <Label>Petição Inicial</Label>
              <Input
                value={caseData.peticaoInicial || ""}
                onChange={(e) => setCaseData({...caseData, peticaoInicial: e.target.value})}
                placeholder="Status da petição inicial"
                className="bg-white"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => handleFileUpload(e, "peticaoInicialFile")}
                  disabled={uploadingFields.peticaoInicialFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.peticaoInicialFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {caseData.peticaoInicialFile && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {caseData.peticaoInicialFile}
                </p>
              )}
              {renderDocLinks("peticaoInicialFile")}
            </div>
            <div className="space-y-2">
              <Label>Procuração</Label>
              <Input
                value={caseData.procuracaoTrabalhista || ""}
                onChange={(e) => setCaseData({...caseData, procuracaoTrabalhista: e.target.value})}
                placeholder="Status da procuração"
                className="bg-white"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => handleFileUpload(e, "procuracaoTrabalhistaFile")}
                  disabled={uploadingFields.procuracaoTrabalhistaFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.procuracaoTrabalhistaFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {caseData.procuracaoTrabalhistaFile && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {caseData.procuracaoTrabalhistaFile}
                </p>
              )}
              {renderDocLinks("procuracaoTrabalhistaFile")}
            </div>
            <Button 
              onClick={() => {
                fetch(`/api/acoes-trabalhistas?id=${id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    peticaoInicial: caseData.peticaoInicial,
                    procuracaoTrabalhista: caseData.procuracaoTrabalhista,
                  }),
                }).then(() => alert("Dados salvos com sucesso!"));
              }} 
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Informações
            </Button>
          </div>
        );

      case 2: // Citação
        return (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-900">Citação do Empregador:</h4>
            <div className="space-y-2">
              <Label>Citação do Empregador</Label>
              <Input
                value={caseData.citacaoEmpregador || ""}
                onChange={(e) => setCaseData({...caseData, citacaoEmpregador: e.target.value})}
                placeholder="Status da citação"
                className="bg-white"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => handleFileUpload(e, "citacaoEmpregadorFile")}
                  disabled={uploadingFields.citacaoEmpregadorFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.citacaoEmpregadorFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {caseData.citacaoEmpregadorFile && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {caseData.citacaoEmpregadorFile}
                </p>
              )}
              {renderDocLinks("citacaoEmpregadorFile")}
            </div>
            <Button 
              onClick={() => {
                fetch(`/api/acoes-trabalhistas?id=${id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    citacaoEmpregador: caseData.citacaoEmpregador,
                  }),
                }).then(() => alert("Dados salvos com sucesso!"));
              }} 
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Informações
            </Button>
          </div>
        );

      case 3: // Contestação
        return (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-900">Contestação Recebida:</h4>
            <div className="space-y-2">
              <Label>Contestação Recebida</Label>
              <Input
                value={caseData.contestacaoRecebida || ""}
                onChange={(e) => setCaseData({...caseData, contestacaoRecebida: e.target.value})}
                placeholder="Status da contestação"
                className="bg-white"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => handleFileUpload(e, "contestacaoRecebidaFile")}
                  disabled={uploadingFields.contestacaoRecebidaFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.contestacaoRecebidaFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {caseData.contestacaoRecebidaFile && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {caseData.contestacaoRecebidaFile}
                </p>
              )}
              {renderDocLinks("contestacaoRecebidaFile")}
            </div>
            <Button 
              onClick={() => {
                fetch(`/api/acoes-trabalhistas?id=${id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    contestacaoRecebida: caseData.contestacaoRecebida,
                  }),
                }).then(() => alert("Dados salvos com sucesso!"));
              }} 
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Informações
            </Button>
          </div>
        );

      case 4: // Audiência Inicial
        return (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-900">Ata da Audiência Inicial:</h4>
            <div className="space-y-2">
              <Label>Ata da Audiência Inicial</Label>
              <Input
                value={caseData.ataAudienciaInicial || ""}
                onChange={(e) => setCaseData({...caseData, ataAudienciaInicial: e.target.value})}
                placeholder="Status da ata da audiência"
                className="bg-white"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => handleFileUpload(e, "ataAudienciaInicialFile")}
                  disabled={uploadingFields.ataAudienciaInicialFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.ataAudienciaInicialFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {caseData.ataAudienciaInicialFile && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {caseData.ataAudienciaInicialFile}
                </p>
              )}
              {renderDocLinks("ataAudienciaInicialFile")}
            </div>
            <Button 
              onClick={() => {
                fetch(`/api/acoes-trabalhistas?id=${id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ataAudienciaInicial: caseData.ataAudienciaInicial,
                  }),
                }).then(() => alert("Dados salvos com sucesso!"));
              }} 
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Informações
            </Button>
          </div>
        );

      case 5: // Instrução Processual
        return (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-900">Provas e Testemunhas:</h4>
            <div className="space-y-2">
              <Label>Provas e Testemunhas</Label>
              <Input
                value={caseData.provasTestemunhas || ""}
                onChange={(e) => setCaseData({...caseData, provasTestemunhas: e.target.value})}
                placeholder="Status das provas e testemunhas"
                className="bg-white"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => handleFileUpload(e, "provasTestemunhasFile")}
                  disabled={uploadingFields.provasTestemunhasFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.provasTestemunhasFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {caseData.provasTestemunhasFile && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {caseData.provasTestemunhasFile}
                </p>
              )}
              {renderDocLinks("provasTestemunhasFile")}
            </div>
            <Button 
              onClick={() => {
                fetch(`/api/acoes-trabalhistas?id=${id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    provasTestemunhas: caseData.provasTestemunhas,
                  }),
                }).then(() => alert("Dados salvos com sucesso!"));
              }} 
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Informações
            </Button>
          </div>
        );

      case 6: // Alegações Finais
        return (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-900">Alegações Finais:</h4>
            <div className="space-y-2">
              <Label>Alegações Finais</Label>
              <Textarea
                value={caseData.alegacoesFinais || ""}
                onChange={(e) => setCaseData({...caseData, alegacoesFinais: e.target.value})}
                placeholder="Descreva as alegações finais"
                rows={4}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Upload de Alegações Finais</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => handleFileUpload(e, "alegacoesFinaisFile")}
                  disabled={uploadingFields.alegacoesFinaisFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.alegacoesFinaisFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {caseData.alegacoesFinaisFile && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {caseData.alegacoesFinaisFile}
                </p>
              )}
              {renderDocLinks("alegacoesFinaisFile")}
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF, DOC, DOCX, JPG, PNG
              </p>
            </div>
            <Button 
              onClick={() => {
                fetch(`/api/acoes-trabalhistas?id=${id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    alegacoesFinais: caseData.alegacoesFinais,
                  }),
                }).then(() => alert("Dados salvos com sucesso!"));
              }} 
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Documentos
            </Button>
          </div>
        );

      case 7: // Sentença
        return (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-900">Sentença:</h4>
            <div className="space-y-2">
              <Label>Sentença</Label>
              <Textarea
                value={caseData.sentencaTrabalhista || ""}
                onChange={(e) => setCaseData({...caseData, sentencaTrabalhista: e.target.value})}
                placeholder="Descreva a sentença trabalhista"
                rows={4}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Upload da Sentença</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => handleFileUpload(e, "sentencaTrabalhistaFile")}
                  disabled={uploadingFields.sentencaTrabalhistaFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.sentencaTrabalhistaFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {caseData.sentencaTrabalhistaFile && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {caseData.sentencaTrabalhistaFile}
                </p>
              )}
              {renderDocLinks("sentencaTrabalhistaFile")}
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF, DOC, DOCX, JPG, PNG
              </p>
            </div>
            <Button 
              onClick={() => {
                fetch(`/api/acoes-trabalhistas?id=${id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    sentencaTrabalhista: caseData.sentencaTrabalhista,
                  }),
                }).then(() => alert("Dados salvos com sucesso!"));
              }} 
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Documentos
            </Button>
          </div>
        );

      case 8: // Execução/Recurso
        return (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-900">Execução/Recurso:</h4>
            <div className="space-y-2">
              <Label>Execução/Recurso</Label>
              <Textarea
                value={caseData.execucaoRecurso || ""}
                onChange={(e) => setCaseData({...caseData, execucaoRecurso: e.target.value})}
                placeholder="Descreva a execução ou recurso"
                rows={4}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Upload de Documentos</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => handleFileUpload(e, "execucaoRecursoFile")}
                  disabled={uploadingFields.execucaoRecursoFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.execucaoRecursoFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {caseData.execucaoRecursoFile && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {caseData.execucaoRecursoFile}
                </p>
              )}
              {renderDocLinks("execucaoRecursoFile")}
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF, DOC, DOCX, JPG, PNG
              </p>
            </div>
            <Button 
              onClick={() => {
                fetch(`/api/acoes-trabalhistas?id=${id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    execucaoRecurso: caseData.execucaoRecurso,
                  }),
                }).then(() => alert("Dados salvos com sucesso!"));
              }} 
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Documentos
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!caseData) {
    return <div>Ação não encontrada</div>;
  }

  const workflow = WORKFLOWS["Ação Trabalhista"] || [];

  return (
    <>
      <DetailLayout
        backHref="/dashboard/acoes-trabalhistas"
        title={caseData.clientName}
        subtitle="Ação Trabalhista"
        onDelete={handleDelete}
        left={
          <div className="space-y-4">
            {workflow.map((step, index) => (
              <StepItem
                key={index}
                index={index}
                title={step}
                isCurrent={index === caseData.currentStep}
                isCompleted={index < caseData.currentStep}
                isPending={index > caseData.currentStep}
                expanded={expandedStep === index}
                onToggle={() => handleStepClick(index)}
                onMarkComplete={() => handleCompleteStep(index, new Event('click') as any)}
                assignment={assignments[index]}
                onSaveAssignment={(a) => handleSaveAssignment(index, a.responsibleName, a.dueDate)}
              >
                {renderStepContent(index)}
              </StepItem>
            ))}
          </div>
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
              onDropFiles={handleDropFiles}
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
              onDragOver={() => setIsDragOver(true)}
              onDragLeave={() => setIsDragOver(false)}
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
              Tem certeza que deseja excluir o documento "{documentToDelete?.document_name || documentToDelete?.name || documentToDelete?.file_name}"? Esta ação não pode ser desfeita.
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
