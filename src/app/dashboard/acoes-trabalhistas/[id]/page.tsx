"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Save,
  Trash2,
  FileUp,
  ChevronDown,
  ChevronUp,
  Upload,
  FileText,
  Download,
  Edit2,
  CheckCircle,
  ChevronRight,
  X,
  Mail,
  Plus,
  Globe,
  Eye,
  Calendar,
  User,
  Clock,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailLayout } from "@/components/detail/DetailLayout";
import { StepItem } from "@/components/detail/StepItem";
import { StatusPanel } from "@/components/detail/StatusPanel";
import { DocumentPanel } from "@/components/detail/DocumentPanel";
import { NotesPanel } from "@/components/detail/NotesPanel";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import "react-day-picker/dist/style.css";
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
import { supabase } from "@/lib/supabase";

// Workflow sections para Ações Trabalhistas
const WORKFLOWS = {
  "Ação Trabalhista": [
    "Cadastro de Documentos",
    "Resumo",
    "Acompanhamento",
    "Processo Finalizado",
  ],
};

const RESPONSAVEIS = [
  "Secretária – Jessica Cavallaro",
  "Advogada – Jailda Silva",
  "Advogada – Adriana Roder",
  "Advogado – Fábio Ferrari",
  "Advogado – Guilherme Augusto",
  "Estagiário – Wendel Macriani",
];

interface CaseData {
  id: string;
  clientName: string;
  type: string;
  status: string;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  autorName?: string | null;
  reuName?: string | null;
  numeroProcesso?: string | null;
  responsavelName?: string | null;
  responsavelDate?: string | null;
  resumo?: string | null;
  acompanhamento?: string | null;
  contratado?: string | null;
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
  const [isEditingGeral, setIsEditingGeral] = useState(false);
  const [isEditingCadastro, setIsEditingCadastro] = useState(false);
  const [isEditingResumo, setIsEditingResumo] = useState(false);
  const [isEditingAcompanhamento, setIsEditingAcompanhamento] = useState(false);
  const [isEditingFinalizado, setIsEditingFinalizado] = useState(false);
  const CASE_TYPES = [
    "Rescisão Indireta",
    "Horas Extras",
    "Adicional Noturno",
    "Insalubridade",
    "Periculosidade",
    "FGTS",
    "Seguro Desemprego",
    "Acidente de Trabalho",
    "Assédio Moral",
    "Discriminação",
    "Outros"
  ];

  const handleCaseFieldChange = (key: keyof CaseData, value: any) => {
    setCaseData(prev => prev ? { ...prev, [key]: value } as CaseData : prev);
  };

  const saveCaseFields = async () => {
    if (!caseData) return;
    try {
      const response = await fetch(`/api/acoes-trabalhistas?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName: caseData.clientName, type: caseData.type, status }),
      });
      if (response.ok) {
        setIsEditingGeral(false);
      }
    } catch (error) {
      console.error("Erro ao salvar campos gerais:", error);
    }
  };

  // Load case data
  useEffect(() => {
    const loadCase = async () => {
      try {
        const response = await fetch(`/api/acoes-trabalhistas?id=${id}`);
        if (response.ok) {
          const data = await response.json();
          setCaseData(data);
          setStatus(data.status || "Em andamento");
          setNotes("");
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

  const [assignOpenStep, setAssignOpenStep] = useState<number | null>(null);
  const [assignResp, setAssignResp] = useState<string>("");
  const [assignDue, setAssignDue] = useState<string>("");
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [saveMessages, setSaveMessages] = useState<{ [key: number]: string }>({});

  const [showAddResponsibleModal, setShowAddResponsibleModal] = useState(false);
  const [newResponsibleStep, setNewResponsibleStep] = useState<string>("");
  const [newResponsibleName, setNewResponsibleName] = useState<string>("");
  const [newResponsibleDate, setNewResponsibleDate] = useState<string>("");

  const parseNotesArray = (notesStr?: string) => {
    try {
      const v = (notesStr || '').trim();
      if (!v) return [] as Array<{ id: string; stepId?: number; content: string; timestamp: string; authorName?: string; authorRole?: string }>;
      const arr = JSON.parse(v);
      if (Array.isArray(arr)) return arr as any;
      return [] as any;
    } catch { return [] as any; }
  };
  const notesArray = parseNotesArray(caseData?.notes);
  const deleteNote = async (noteId: string) => {
    const next = (notesArray || []).filter((n) => n.id !== noteId);
    try {
      const { error } = await supabase
        .from('acoes_trabalhistas')
        .update({ notes: JSON.stringify(next) })
        .eq('id', Number(id));

      if (!error) {
        setCaseData(prev => prev ? ({ ...prev, notes: JSON.stringify(next) }) as any : prev);
      } else {
        console.error("Erro ao deletar nota via Supabase", error);
      }
    } catch (e) {
      console.error("Erro ao deletar nota:", e);
    }
  };
  const saveStepNotes = async (stepIndex: number) => {
    const text = (notes || '').trim();
    if (!text) return;
    const iso = new Date().toISOString();
    const noteId = (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const existing = parseNotesArray(caseData?.notes);
    const assigned = assignments[stepIndex] || {};
    const assignedName = assigned.responsibleName || 'Equipe';
    const next = [...existing, { id: noteId, stepId: stepIndex, content: text, timestamp: iso, authorName: assignedName }];
    try {
      const { error } = await supabase
        .from('acoes_trabalhistas')
        .update({ notes: JSON.stringify(next) })
        .eq('id', Number(id));

      if (!error) {
        setSaveMessages(prev => ({ ...prev, [stepIndex]: 'Salvo' }));
        setCaseData(prev => prev ? ({ ...prev, notes: JSON.stringify(next) }) as any : prev);
        setNotes("");
      } else {
        console.error("Erro ao salvar nota via Supabase", error);
        alert("Erro ao salvar nota. Tente novamente.");
      }
    } catch (e) {
      console.error("Erro ao salvar nota:", e);
    }
  };

  const handleSaveAssignment = async (index: number, responsibleName?: string, dueDate?: string) => {
    try {
      const steps = WORKFLOWS["Ação Trabalhista"] || [];
      const stepTitle = steps[index] || `Etapa ${index + 1}`;
      const res = await fetch(`/api/step-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleType: "acoes_trabalhistas", recordId: id, stepIndex: index, responsibleName, dueDate, workflowName: stepTitle, clientName: caseData?.clientName || "Cliente" })
      });
      if (res.ok) {
        setAssignments(prev => ({ ...prev, [index]: { responsibleName, dueDate } }));
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

  const getCurrentStepIndex = () => {
    if (!caseData) return 0;
    const idx = Number(caseData.currentStep ?? 0);
    // If currentStep is 0 (default), treat it as 1 to show first step completed
    const adjustedIdx = idx === 0 ? 1 : idx;
    return Math.min(Math.max(adjustedIdx, 0), (WORKFLOWS["Ação Trabalhista"] || []).length);
  };

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

  const handleStepCompletion = async (stepIndex: number) => {
    console.log("handleStepCompletion called", stepIndex);
    const curr = getCurrentStepIndex();
    const isCurrentlyCompleted = stepIndex < curr;
    // If marking as complete, move to next step. If unmarking, move back to this step.
    const nextCurrent = isCurrentlyCompleted ? stepIndex : Math.min(stepIndex + 1, (WORKFLOWS["Ação Trabalhista"] || []).length);
    console.log("nextCurrent", nextCurrent);
    try {
      const { error } = await supabase
        .from('acoes_trabalhistas')
        .update({ current_step: nextCurrent })
        .eq('id', Number(id));

      if (!error) {
        console.log("Step updated successfully via Supabase");
        setCaseData(prev => prev ? ({ ...prev, currentStep: nextCurrent }) : prev as any);
        // Also trigger an assignment update if moving forward
        if (!isCurrentlyCompleted) {
           try {
            await fetch(`/api/step-assignments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ moduleType: 'acoes_trabalhistas', recordId: id, currentIndex: nextCurrent })
            });
          } catch {}
        }
      } else {
        console.error("Failed to update step via Supabase", error);
        alert(`Erro ao atualizar: ${error.message}`);
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
    formData.append("moduleType", "acoes_trabalhistas");
    if (caseData?.clientName) {
      formData.append("clientName", caseData.clientName);
    }

    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData, // fetch automatically sets Content-Type to multipart/form-data
      });

      const data = await response.json();

      if (response.ok) {
        // Update case data with the file URL
        const updatedCaseData = {
          ...caseData,
          [fieldName]: data.fileName
        } as CaseData;
        setCaseData(updatedCaseData);
        
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

  const renderSectionContent = (sectionIndex: number) => {
    if (!caseData) return null;
    const isCurrent = sectionIndex === caseData.currentStep;
    const isCompleted = sectionIndex < caseData.currentStep;
    if (!isCurrent && !isCompleted) return null;
    if (sectionIndex === 0) {
      return (
        <div className="space-y-4 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-900">Dados iniciais</h4>
            <div className="flex items-center gap-2">
              {!isEditingCadastro && (
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setIsEditingCadastro(true)}>Editar</Button>
              )}
              {isEditingCadastro && (
                <>
                  <Button size="sm" variant="secondary" onClick={async () => {
                    await fetch(`/api/acoes-trabalhistas?id=${id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ reuName: caseData.reuName, numeroProcesso: caseData.numeroProcesso, responsavelName: caseData.responsavelName, responsavelDate: caseData.responsavelDate }),
                    });
                    setIsEditingCadastro(false);
                  }}>
                    <Save className="w-4 h-4" />
                    Salvar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingCadastro(false)}>Cancelar</Button>
                </>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid gap-3">
              <div className="grid md:grid-cols-2 gap-4 p-4 bg-white rounded-md border">
                <div className="space-y-1">
                  <Label>Autor</Label>
                  <div className="text-sm">{String(caseData.autorName || caseData.clientName || "-")}</div>
                </div>
              <div className="space-y-1">
                <Label>Réu</Label>
                {isEditingCadastro ? (
                  <Input value={caseData.reuName || ""} onChange={(e) => setCaseData({ ...caseData, reuName: e.target.value })} />
                ) : (
                  <div className="text-sm">{String(caseData.reuName || "-")}</div>
                )}
              </div>
              <div className="space-y-1">
                <Label>Nº do Processo</Label>
                {isEditingCadastro ? (
                  <Input value={caseData.numeroProcesso || ""} onChange={(e) => setCaseData({ ...caseData, numeroProcesso: e.target.value })} />
                ) : (
                  <div className="text-sm">{String(caseData.numeroProcesso || "-")}</div>
                )}
              </div>
              <div className="space-y-1">
                <Label>Responsável</Label>
                {isEditingCadastro ? (
                  <Input value={caseData.responsavelName || ""} onChange={(e) => setCaseData({ ...caseData, responsavelName: e.target.value })} />
                ) : (
                  <div className="text-sm">{String(caseData.responsavelName || "-")}</div>
                )}
              </div>
              <div className="space-y-1">
                <Label>Prazo</Label>
                {isEditingCadastro ? (
                  <Input type="date" value={String(caseData.responsavelDate || "")} onChange={(e) => setCaseData({ ...caseData, responsavelDate: e.target.value })} />
                ) : (
                  <div className="text-sm">{caseData.responsavelDate ? (() => { try { return new Date(String(caseData.responsavelDate)).toLocaleDateString("pt-BR"); } catch { return String(caseData.responsavelDate); } })() : "-"}</div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Upload</Label>
              <div className="flex items-center gap-2">
                <Input type="file" onChange={(e) => handleFileUpload(e, "cadastroDocumentosDoc")} disabled={uploadingFields.cadastroDocumentosDoc} className="flex-1" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                {uploadingFields.cadastroDocumentosDoc && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {renderDocLinks("cadastroDocumentosDoc")}
            </div>
            </div>
          </div>
        </div>
      );
    }
    if (sectionIndex === 1) {
      return (
        <div className="space-y-4 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-900">Resumo</h4>
            <div className="flex items-center gap-2">
              {!isEditingResumo && (
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setIsEditingResumo(true)}>Editar</Button>
              )}
              {isEditingResumo && (
                <>
                  <Button size="sm" variant="secondary" onClick={async () => {
                    await fetch(`/api/acoes-trabalhistas?id=${id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ resumo: caseData.resumo, contratado: caseData.contratado }),
                    });
                    setIsEditingResumo(false);
                  }}>
                    <Save className="w-4 h-4" />
                    Salvar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingResumo(false)}>Cancelar</Button>
                </>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            {isEditingResumo ? (
              <Textarea value={caseData.resumo || ""} onChange={(e) => setCaseData({ ...caseData, resumo: e.target.value })} rows={4} className="bg-white" />
            ) : (
              <div className="text-sm p-3 bg-white rounded-md border">{String(caseData.resumo || "-")}</div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Contratado</Label>
            {isEditingResumo ? (
              <div className="flex items-center gap-3">
                <Button type="button" variant={String(caseData.contratado || "Não") === "Sim" ? "default" : "outline"} onClick={() => setCaseData({ ...caseData, contratado: "Sim" })}>Sim</Button>
                <Button type="button" variant={String(caseData.contratado || "Não") === "Não" ? "default" : "outline"} onClick={() => setCaseData({ ...caseData, contratado: "Não" })}>Não</Button>
              </div>
            ) : (
              <div className="text-sm">{String(caseData.contratado || "Não")}</div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Upload</Label>
            <div className="flex items-center gap-2">
              <Input type="file" onChange={(e) => handleFileUpload(e, "resumoDoc")} disabled={uploadingFields.resumoDoc} className="flex-1" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
              {uploadingFields.resumoDoc && (
                <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {renderDocLinks("resumoDoc")}
          </div>
        </div>
      );
    }
    if (sectionIndex === 2) {
      return (
        <div className="space-y-4 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-900">Acompanhamento</h4>
            <div className="flex items-center gap-2">
              {!isEditingAcompanhamento && (
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setIsEditingAcompanhamento(true)}>Editar</Button>
              )}
              {isEditingAcompanhamento && (
                <>
                  <Button size="sm" variant="secondary" onClick={async () => {
                    await fetch(`/api/acoes-trabalhistas?id=${id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ acompanhamento: caseData.acompanhamento }),
                    });
                    setIsEditingAcompanhamento(false);
                  }}>
                    <Save className="w-4 h-4" />
                    Salvar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingAcompanhamento(false)}>Cancelar</Button>
                </>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            {isEditingAcompanhamento ? (
              <Textarea value={caseData.acompanhamento || ""} onChange={(e) => setCaseData({ ...caseData, acompanhamento: e.target.value })} rows={4} className="bg-white" />
            ) : (
              <div className="text-sm p-3 bg-white rounded-md border">{String(caseData.acompanhamento || "-")}</div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Upload</Label>
            <div className="flex items-center gap-2">
              <Input type="file" onChange={(e) => handleFileUpload(e, "acompanhamentoDoc")} disabled={uploadingFields.acompanhamentoDoc} className="flex-1" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
              {uploadingFields.acompanhamentoDoc && (
                <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {renderDocLinks("acompanhamentoDoc")}
          </div>
        </div>
      );
    }
    if (sectionIndex === 3) {
      return (
        <div className="space-y-4 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-900">Processo Finalizado</h4>
            <div className="flex items-center gap-2">
              {!isEditingFinalizado && (
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setIsEditingFinalizado(true)}>Editar</Button>
              )}
              {isEditingFinalizado && (
                <>
                  <Button size="sm" variant="secondary" onClick={async () => {
                    const existing = String(caseData.notes || "");
                    const obs = localStorage.getItem(`finalizado-${id}-obs`) || "";
                    const blockHeader = "[Processo Finalizado]";
                    const newBlock = `${blockHeader}\n- Observações: ${obs}`;
                    const newNotes = existing.includes(blockHeader)
                      ? existing.replace(new RegExp(`${blockHeader}[\\s\\S]*?($|\\n\\[)`, "m"), `${newBlock}\n$1`).replace("\n$1", "")
                      : `${existing}\n${newBlock}`;
                    await fetch(`/api/acoes-trabalhistas?id=${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes: newNotes }) });
                    setIsEditingFinalizado(false);
                  }}>
                    <Save className="w-4 h-4" />
                    Salvar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingFinalizado(false)}>Cancelar</Button>
                </>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            {isEditingFinalizado ? (
              <Textarea defaultValue={(caseData.notes || "").includes("[Processo Finalizado]") ? (() => {
                const parts = String(caseData.notes || "").split("[Processo Finalizado]");
                const tail = parts[1] || "";
                const line = (tail.split("\n").find((l) => l.trim().startsWith("- Observações:")) || "").replace("- Observações:", "").trim();
                localStorage.setItem(`finalizado-${id}-obs`, line);
                return line;
              })() : ""} onChange={(e) => localStorage.setItem(`finalizado-${id}-obs`, e.target.value)} rows={4} className="bg-white" />
            ) : (
              <div className="text-sm p-3 bg-white rounded-md border">{(() => {
                const s = String(caseData.notes || "");
                if (!s.includes("[Processo Finalizado]")) return "-";
                const tail = s.split("[Processo Finalizado]")[1] || "";
                const line = (tail.split("\n").find((l) => l.trim().startsWith("- Observações:")) || "").replace("- Observações:", "").trim();
                return line || "-";
              })()}</div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Upload</Label>
            <div className="flex items-center gap-2">
              <Input type="file" onChange={(e) => handleFileUpload(e, "finalizadoDoc")} disabled={uploadingFields.finalizadoDoc} className="flex-1" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
              {uploadingFields.finalizadoDoc && (
                <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {renderDocLinks("finalizadoDoc")}
          </div>
        </div>
      );
    }
    return null;
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
  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="w-full p-4 space-y-6 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/acoes-trabalhistas">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{caseData.clientName}</h1>
            <p className="text-muted-foreground">{caseData.type} - Ação Trabalhista</p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta ação? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-white text-red-600 border border-red-500 hover:bg-red-50 hover:text-red-700">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
            <Card className="rounded-xl border-gray-200 shadow-sm min-h-[560px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Fluxo do Processo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {workflow.map((stepTitle, index) => {
                  const isCurrent = index === currentStepIndex;
                  // First step (index 0) is always completed if currentStep is at least 1 (default)
                  const isCompleted = index < currentStepIndex;
                  const showConnector = index < workflow.length - 1;
                  return (
                    <div key={index} className="flex group relative pb-10">
                      {showConnector ? (
                        <div className={`absolute left-6 top-8 bottom-0 w-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                      ) : null}
                        <div className="flex-shrink-0 mr-4">
                          {isCompleted ? (
                            <div
                              className="h-12 w-12 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center z-10 cursor-pointer hover:scale-105 transition"
                              onClick={() => handleStepCompletion(index)}
                              role="button"
                              aria-label="Desfazer conclusão"
                              title="Desfazer conclusão"
                            >
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                          ) : isCurrent ? (
                            <div
                              className="h-12 w-12 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center z-10 shadow-md cursor-pointer hover:scale-105 transition"
                              onClick={() => handleStepCompletion(index)}
                              role="button"
                              aria-label="Marcar como concluído"
                              title="Marcar como concluído"
                            >
                              <div className="h-4 w-4 rounded-full bg-blue-500" />
                            </div>
                          ) : (
                            <div
                              className="h-12 w-12 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center z-10 cursor-pointer hover:scale-105 transition"
                              onClick={() => handleStepCompletion(index)}
                              role="button"
                              aria-label="Marcar como concluído"
                              title="Marcar como concluído"
                            >
                              <Circle className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      <div className={`flex-grow pt-2 ${isCurrent ? 'p-4 bg-blue-50 rounded-lg border border-blue-100' : isCompleted ? '' : 'opacity-60'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className={`${isCurrent ? 'text-blue-600 font-bold' : 'font-semibold'} text-base`}>{stepTitle}</h3>
                              {isCurrent ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Atual</span>
                              ) : isCompleted ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Concluído</span>
                              ) : null}
                            </div>
                            {assignments[index]?.responsibleName || assignments[index]?.dueDate ? (
                              <div className="mt-1 text-xs text-gray-600">
                                <span className="font-medium">Responsável:</span> {assignments[index]?.responsibleName || '—'}
                                {assignments[index]?.dueDate ? (
                                  <span> · Prazo: {(() => { const p = (assignments[index]?.dueDate || '').split('-'); return `${p[2]}/${p[1]}/${p[0]}`; })()}</span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                          <Popover open={assignOpenStep === index} onOpenChange={(open) => setAssignOpenStep(open ? index : null)}>
                              <PopoverTrigger asChild>
                                <button className="text-xs text-gray-600 border border-gray-300 rounded px-3 py-1 bg-white">Definir Responsável</button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[380px] max-w-[90vw] p-0" align="end" side="bottom" sideOffset={5}>
                                <div className="flex flex-col max-h-[400px] overflow-y-auto p-4 space-y-4">
                                  <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold">Responsável</Label>
                                    <Input
                                      value={assignResp}
                                      onChange={(e) => setAssignResp(e.target.value)}
                                      placeholder="Selecione ou digite o responsável"
                                      className="h-8 text-sm"
                                    />
                                    <div className="rounded-md border bg-white max-h-[120px] overflow-y-auto shadow-sm">
                                      {RESPONSAVEIS.map((r) => (
                                        <button
                                          key={r}
                                          type="button"
                                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 transition-colors border-b last:border-0"
                                          onClick={() => setAssignResp(r)}
                                        >
                                          {r}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold">Data limite</Label>
                                    <div className="rounded-md border p-2 flex justify-center bg-white">
                                      <CalendarPicker
                                        mode="single"
                                        selected={assignDue ? (() => { const p = assignDue.split('-').map((v)=>parseInt(v,10)); return new Date(p[0], (p[1]||1)-1, p[2]||1); })() : undefined}
                                        onSelect={(date) => {
                                          if (!date) { setAssignDue(''); return; }
                                          const y = date.getFullYear();
                                          const m = String(date.getMonth() + 1).padStart(2, '0');
                                          const d = String(date.getDate()).padStart(2, '0');
                                          setAssignDue(`${y}-${m}-${d}`);
                                        }}
                                        weekStartsOn={1}
                                        initialFocus
                                        className="p-0"
                                      />
                                    </div>
                                    <Input
                                      value={assignDue ? (() => { const p = assignDue.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; })() : ''}
                                      readOnly
                                      placeholder="Nenhuma data selecionada"
                                      className="h-8 text-sm bg-gray-50"
                                    />
                                  </div>
                                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setAssignResp(''); setAssignDue(''); setAssignOpenStep(null); }}>Cancelar</Button>
                                    <Button size="sm" className="h-8 text-xs bg-slate-900" onClick={async () => {
                                      await handleSaveAssignment(index, assignResp || undefined, assignDue || undefined);
                                      setAssignOpenStep(null);
                                    }}>Salvar</Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                            <button
                              className="text-gray-500"
                              onClick={() => handleStepClick(index)}
                              aria-label="Alternar conteúdo"
                            >
                              {expandedStep === index ? <ChevronRight className="w-5 h-5 rotate-90" /> : <ChevronRight className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                        {expandedStep === index ? (
                          <div className="mt-3">
                            {renderSectionContent(index)}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

          <div className="mt-8">
          <Card className="rounded-xl border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`col-span-1 md:col-span-2 border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center ${uploadingFile ? 'opacity-50 pointer-events-none' : ''} hover:bg-gray-50`}
                     onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                     onDragLeave={() => setIsDragOver(false)}
                     onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const files = Array.from(e.dataTransfer.files); handleDropFiles(files); }}>
                  <div className="p-3 bg-blue-50 rounded-full mb-3">
                    <Upload className="h-6 w-6 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Arraste e solte arquivos aqui para anexar</p>
                  <p className="text-xs text-gray-500 mt-1">Ou use os botões de envio nas etapas acima</p>
                </div>

                {(documents as any[]).length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {(documents as any[]).map((doc: any) => (
                      <div key={String(doc.id)} className="group relative w-10 h-10">
                        <a
                          href={doc.file_path || doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={doc.document_name || doc.file_name || doc.name}
                          className="block w-full h-full rounded-md border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"
                        >
                          <FileText className="h-5 w-5 text-blue-600" />
                        </a>
                        <button
                          type="button"
                          aria-label="Excluir"
                          title="Excluir"
                          className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition bg-white border border-gray-300 rounded-full p-0.5 shadow"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDocumentToDelete(doc); setDeleteDialogOpen(true); }}
                        >
                          <X className="h-3 w-3 text-gray-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="col-span-1 md:col-span-2 text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum documento anexado ainda</p>
                    <p className="text-xs mt-1">Arraste arquivos para esta área ou use os botões de upload nas etapas</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col min-h-[560px] space-y-4">
          <StatusPanel
            status={status}
            onStatusChange={handleStatusChange}
            currentStep={currentStepIndex + 1}
            totalSteps={workflow.length}
            currentStepTitle={workflow[currentStepIndex]}
            createdAt={caseData.createdAt}
            updatedAt={caseData.updatedAt}
          />

          <Card className="rounded-xl border-gray-200 shadow-sm flex-1 flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center w-full justify-between">
                <span className="flex items-center">
                  Observações
                </span>
                <button
                  type="button"
                  className="rounded-md border px-2 py-1 text-xs bg-white hover:bg-slate-100"
                  onClick={() => setShowNotesModal(true)}
                  title="Ver todas as notas"
                >
                  <img src="https://cdn-icons-png.flaticon.com/512/889/889648.png" alt="Notas" className="h-4 w-4" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <Textarea rows={12} placeholder="Adicione observações..." value={notes} onChange={(e) => setNotes(e.target.value)} className="flex-1 border-none bg-transparent" />
              <div className="flex justify-end items-center px-3 py-2 mt-2">
                <div className="flex flex-col items-end gap-1 w-full">
                  <Button className="bg-slate-900 text-white" onClick={() => saveStepNotes(getCurrentStepIndex())}>Salvar</Button>
                  {saveMessages[getCurrentStepIndex()] ? (
                    <span className="text-green-600 text-xs">Salvo com sucesso!</span>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-gray-200 shadow-sm h-full">
            <CardHeader>
              <CardTitle>Responsáveis</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <div className="space-y-4">
                {(() => {
                  const items = Object.entries(assignments)
                    .filter(([_, v]) => v?.responsibleName)
                    .map(([k, v]) => ({ key: k, name: v?.responsibleName as string, role: '', initials: String(v?.responsibleName || '').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase() }));
                  return items.map((m) => (
                    <div key={m.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src="https://cdn-icons-png.flaticon.com/512/3177/3177440.png"
                          alt={m.name}
                          className="h-8 w-8 rounded-full border border-gray-200 object-cover"
                        />
                        <div>
                          <p className="font-medium text-sm">{m.name}</p>
                          <p className="text-xs text-gray-500">{m.role || ''}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Mail className="w-5 h-5 text-gray-500" />
                      </Button>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Document Dialog */}
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

      {/* Notes Modal */}
      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent showCloseButton={false}>
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-white">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Notas do Processo</h2>
            <DialogClose className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="h-5 w-5" />
              <span className="sr-only">Fechar</span>
            </DialogClose>
          </div>
          <div className="p-6 overflow-y-auto flex-grow bg-white max-h-[60vh]">
            <div className="space-y-3">
              {notesArray.length ? notesArray.map((n: any) => {
                const d = new Date(n.timestamp);
                const formatted = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={n.id} className="group relative bg-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm leading-snug">
                    <button
                      type="button"
                      aria-label="Excluir"
                      title="Excluir"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition bg-white border border-gray-300 rounded-full p-0.5 shadow"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteNote(n.id); }}
                    >
                      <X className="h-3 w-3 text-gray-600" />
                    </button>
                    <div className="text-xs font-medium text-gray-600 mb-2">
                      {(() => {
                        const name = String(n.authorName || '').trim();
                        const showName = !!name && name.toLowerCase() !== 'equipe';
                        return `${formatted}${showName ? ` - ${name}${n.authorRole ? ` (${n.authorRole})` : ''}` : ''}`;
                      })()}
                    </div>
                    <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                  </div>
                );
              }) : (
                <div className="text-sm text-gray-500">Nenhuma nota encontrada.</div>
              )}
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-end items-center rounded-b-xl">
            <Button className="bg-slate-900 text-white h-9 px-4 py-2" onClick={() => setShowNotesModal(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Responsible Modal */}
      <Dialog open={showAddResponsibleModal} onOpenChange={setShowAddResponsibleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Responsável</DialogTitle>
            <DialogDescription>
              Atribua um responsável a uma etapa do processo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Etapa</Label>
              <Select value={newResponsibleStep} onValueChange={setNewResponsibleStep}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a etapa" />
                </SelectTrigger>
                <SelectContent>
                  {(WORKFLOWS["Ação Trabalhista"] || []).map((step, idx) => (
                    <SelectItem key={idx} value={String(idx)}>{step}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select value={newResponsibleName} onValueChange={setNewResponsibleName}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Secretária – Jessica Cavallaro",
                    "Advogada – Jailda Silva",
                    "Advogada – Adriana Roder",
                    "Advogado – Fábio Ferrari",
                    "Advogado – Guilherme Augusto",
                    "Estagiário – Wendel Macriani",
                  ].map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prazo (Opcional)</Label>
              <div className="rounded-md border p-2">
                <CalendarPicker
                  mode="single"
                  selected={newResponsibleDate ? (() => { const p = newResponsibleDate.split('-').map((v)=>parseInt(v,10)); return new Date(p[0], (p[1]||1)-1, p[2]||1); })() : undefined}
                  onSelect={(date) => {
                    if (!date) { setNewResponsibleDate(''); return; }
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const d = String(date.getDate()).padStart(2, '0');
                    setNewResponsibleDate(`${y}-${m}-${d}`);
                  }}
                  weekStartsOn={1}
                  captionLayout="label"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddResponsibleModal(false)}>Cancelar</Button>
            <Button onClick={async () => {
              if (!newResponsibleStep || !newResponsibleName) return;
              await handleSaveAssignment(Number(newResponsibleStep), newResponsibleName, newResponsibleDate || undefined);
              setShowAddResponsibleModal(false);
              setNewResponsibleStep("");
              setNewResponsibleName("");
              setNewResponsibleDate("");
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
