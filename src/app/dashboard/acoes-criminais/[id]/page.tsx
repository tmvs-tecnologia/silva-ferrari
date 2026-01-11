"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Save,
  Trash2,
  Upload,
  FileText,
  CheckCircle,
  ChevronRight,
  X,
  Mail,
  Check,
  ChevronsUpDown,
  Edit2,
  Plus,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPanel } from "@/components/detail/StatusPanel";
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
import { supabase } from "@/lib/supabase";

// Workflow sections para Ações Criminais
const WORKFLOWS = {
  "Ação Criminal": [
    "Cadastro de Documentos",
    "Resumo",
    "Acompanhamento",
    "Processo Finalizado",
  ],
};

const CRIMINAL_TYPES = [
  "Habeas Corpus",
  "Relaxamento de Prisão",
  "Liberdade Provisória",
  "Revogação de Prisão Preventiva",
  "Defesa Prévia",
  "Resposta à Acusação",
  "Memoriais",
  "Apelação",
  "Recurso em Sentido Estrito",
  "Agravo em Execução",
  "Revisão Criminal",
  "Queixa-Crime",
  "Acompanhamento de Inquérito",
  "Audiência de Custódia",
  "Outro"
];

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
  acompanhamento?: string | null; // Stores JSON history
  contratado?: string | null;
  fotoNotificacaoDoc?: string;
  finalizadoText?: string;
  actionSubtype?: string;
}

interface CaseDocument {
  id: string;
  name?: string;
  document_name?: string;
  file_name?: string;
  file_path: string;
  uploaded_at: string;
  // Metadata fields (can be inferred or stored in notes if DB doesn't support)
  responsible?: string;
  status?: string;
}

export default function AcaoCriminalDetailPage() {
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
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
  const [assignments, setAssignments] = useState<Record<number, { responsibleName?: string; dueDate?: string }>>({});
  
  // States for new features
  const [isEditingCadastro, setIsEditingCadastro] = useState(false);
  const [actionTypeOpen, setActionTypeOpen] = useState(false);
  
  // Resumo
  const [isEditingResumo, setIsEditingResumo] = useState(false);
  const [resumoText, setResumoText] = useState("");
  
  // Acompanhamento
  const [acompanhamentoText, setAcompanhamentoText] = useState("");
  const [isEditingAcompanhamento, setIsEditingAcompanhamento] = useState(false);
  
  // Finalizado
  const [finalizadoText, setFinalizadoText] = useState("");
  const [confirmFinalizeOpen, setConfirmFinalizeOpen] = useState(false);

  // Document Editing
  const [editingDoc, setEditingDoc] = useState<CaseDocument | null>(null);
  const [isEditingDocOpen, setIsEditingDocOpen] = useState(false);
  const [editDocName, setEditDocName] = useState("");

  const handleCaseFieldChange = (key: keyof CaseData, value: any) => {
    setCaseData(prev => prev ? { ...prev, [key]: value } as CaseData : prev);
  };

  const saveGenericField = async (field: string, value: any) => {
    if (!caseData) return;
    try {
      // Optimistic update
      setCaseData(prev => prev ? { ...prev, [field]: value } : prev);
      
      const payload: any = { [field]: value };
      
      // If saving history, ensure it's JSON string
      if (field === 'acompanhamento' && typeof value !== 'string') {
        payload[field] = JSON.stringify(value);
      }

      await fetch(`/api/acoes-criminais?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error(`Erro ao salvar ${field}:`, error);
    }
  };

  // Load case data
  useEffect(() => {
    const loadCase = async () => {
      try {
        const response = await fetch(`/api/acoes-criminais?id=${id}`);
        if (response.ok) {
          const data = await response.json();
          // Normaliza dados caso venham em snake_case da API
          const normalizedData = {
            ...data,
            clientName: data.clientName || data.client_name,
            autorName: data.autorName || data.autor_name,
            reuName: data.reuName || data.reu_name,
            numeroProcesso: data.numeroProcesso || data.numero_processo || data.processNumber,
            responsavelName: data.responsavelName || data.responsavel_name,
            responsavelDate: data.responsavelDate || data.responsavel_date,
            resumo: data.resumo,
            acompanhamento: data.acompanhamento,
          };
          setCaseData(normalizedData);
          setStatus(data.status || "Em andamento");
          setNotes("");
          setResumoText(data.resumo || "");
          
          // Try to parse finalizadoText from notes if stored there
          try {
             const parsedNotes = JSON.parse(data.notes || "[]");
             const finalNote = parsedNotes.find((n: any) => n.type === 'finalizado_text');
             if (finalNote) setFinalizadoText(finalNote.content);
          } catch {}

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
        const res = await fetch(`/api/step-assignments?moduleType=acoes_criminais&recordId=${id}`);
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
        .from('acoes_criminais')
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
        .from('acoes_criminais')
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
      const steps = WORKFLOWS["Ação Criminal"] || [];
      const stepTitle = steps[index] || `Etapa ${index + 1}`;
      
      const res = await fetch(`/api/step-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          moduleType: "acoes_criminais", 
          recordId: id, 
          stepIndex: index, 
          responsibleName, 
          dueDate,
          workflowName: stepTitle, // Passando o nome correto da etapa
          clientName: caseData?.clientName || "Cliente"
        })
      });
      if (res.ok) {
        setAssignments(prev => ({ ...prev, [index]: { responsibleName, dueDate } }));
        const dueBR = dueDate ? (() => { const [y, m, d] = dueDate.split("-"); return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`; })() : "—";
        const message = `Tarefa "${stepTitle}" atribuída a ${responsibleName || "—"} com prazo ${dueBR} para: ${caseData?.clientName || ""} - ${caseData?.type || ""}`;
        try {
          await fetch(`/api/alerts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ moduleType: "Ações Criminais", recordId: id, alertFor: "admin", message, isRead: false })
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
        const response = await fetch(`/api/documents/${id}?moduleType=acoes_criminais`);
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
    const adjustedIdx = idx === 0 ? 1 : idx;
    return Math.min(Math.max(adjustedIdx, 0), (WORKFLOWS["Ação Criminal"] || []).length);
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      const response = await fetch(`/api/acoes-criminais?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('acoes-criminais-status-update', JSON.stringify({ id, status: newStatus, t: Date.now() }));
            window.dispatchEvent(new CustomEvent('acoes-criminais-status-updated', { detail: { id, status: newStatus } }));
            const msg = `Status atualizado para "${newStatus}"`;
            await fetch(`/api/alerts`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ moduleType: "Ações Criminais", recordId: id, alertFor: "admin", message: msg, isRead: false })
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
    const nextCurrent = isCurrentlyCompleted ? stepIndex : Math.min(stepIndex + 1, (WORKFLOWS["Ação Criminal"] || []).length);
    console.log("nextCurrent", nextCurrent);
    try {
      const { error } = await supabase
        .from('acoes_criminais')
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
              body: JSON.stringify({ moduleType: 'acoes_criminais', recordId: id, currentIndex: nextCurrent })
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
      const response = await fetch(`/api/acoes-criminais?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        router.push("/dashboard/acoes-criminais");
      }
    } catch (error) {
      console.error("Erro ao excluir caso:", error);
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
      formData.append("moduleType", "acoes_criminais");
      if (caseData?.clientName) {
        formData.append("clientName", caseData.clientName);
      }
      try {
        const response = await fetch("/api/documents/upload", { method: "POST", body: formData });
        if (response.ok) {
          const result = await response.json();
          // Update documents list
          const loadDocuments = async () => {
            const response = await fetch(`/api/documents/${id}?moduleType=acoes_criminais`);
            if (response.ok) {
              const data = await response.json();
              setDocuments(data || []);
            }
          };
          await loadDocuments();

          try {
            await fetch(`/api/alerts`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ moduleType: "Ações Criminais", recordId: id, alertFor: "admin", message: `Documento anexado: ${file.name}`, isRead: false })
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFields(prev => ({ ...prev, [fieldName]: true }));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("caseId", id);
    formData.append("fieldName", fieldName);
    formData.append("moduleType", "acoes_criminais");
    if (caseData?.clientName) {
      formData.append("clientName", caseData.clientName);
    }

    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const updatedCaseData = {
          ...caseData,
          [fieldName]: data.fileName
        } as CaseData;
        setCaseData(updatedCaseData);
        
        const loadDocuments = async () => {
          const response = await fetch(`/api/documents/${id}?moduleType=acoes_criminais`);
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
            body: JSON.stringify({ moduleType: "Ações Criminais", recordId: id, alertFor: "admin", message: `Documento anexado: ${file.name}`, isRead: false })
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

  const handleAddAcompanhamento = async () => {
    if (!acompanhamentoText.trim()) return;
    const newEntry = {
      id: (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : Date.now().toString(),
      date: new Date().toISOString(),
      content: acompanhamentoText,
      author: "Usuário", 
    };
    let history: any[] = [];
    try { history = JSON.parse(caseData?.acompanhamento || "[]"); } catch {}
    if (!Array.isArray(history)) history = [];
    const updated = [...history, newEntry];
    await saveGenericField('acompanhamento', JSON.stringify(updated));
    setAcompanhamentoText("");
    setIsEditingAcompanhamento(false);
  };

  const handleFinalizeProcess = async () => {
    if (!finalizadoText.trim()) {
        alert("Por favor, insira as considerações finais.");
        return;
    }
    const noteEntry = {
        id: Date.now().toString(),
        content: `CONSIDERAÇÕES FINAIS: ${finalizadoText}`,
        type: 'finalizado_text',
        timestamp: new Date().toISOString(),
        authorName: "Sistema"
    };
    const currentNotes = parseNotesArray(caseData?.notes);
    const nextNotes = [...currentNotes, noteEntry];
    
    try {
      await fetch(`/api/acoes-criminais?id=${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: 'Finalizado', notes: JSON.stringify(nextNotes) }),
      });
      setConfirmFinalizeOpen(false);
      setStatus('Finalizado');
      setCaseData(prev => prev ? ({ ...prev, status: 'Finalizado', notes: JSON.stringify(nextNotes) }) : prev);
    } catch (e) {
      console.error(e);
    }
  };

  const renderSectionContent = (sectionIndex: number) => {
    if (!caseData) return null;
    const isCurrent = sectionIndex === caseData.currentStep;
    const isCompleted = sectionIndex < caseData.currentStep;
    // Allow viewing previous steps even if completed
    if (!isCurrent && !isCompleted && sectionIndex > caseData.currentStep) return null;

    if (sectionIndex === 0) { // Cadastro de Documentos
      return (
        <div className="space-y-6 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          {/* Dropdown de Ações Criminais */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Classificação da Ação</Label>
            <Popover open={actionTypeOpen} onOpenChange={setActionTypeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={actionTypeOpen}
                  className="w-full justify-between"
                >
                  {caseData.type && caseData.type !== "Ação Criminal"
                    ? caseData.type
                    : "Selecione o tipo de ação..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar tipo de ação..." />
                  <CommandList>
                    <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                    <CommandGroup>
                      {CRIMINAL_TYPES.map((type) => (
                        <CommandItem
                          key={type}
                          value={type}
                          onSelect={(currentValue) => {
                            saveGenericField("type", currentValue);
                            setActionTypeOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              caseData.type === type ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {type}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Cadastro de Documentos (Tabela) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
               <Label className="text-base font-semibold">Documentos Cadastrados</Label>
               <div className="flex items-center gap-2">
                  <Input type="file" id="doc-upload-0" className="hidden" onChange={(e) => handleFileUpload(e, "documento_geral")} />
                  <Button size="sm" variant="outline" onClick={() => document.getElementById('doc-upload-0')?.click()}>
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Documento
                  </Button>
               </div>
            </div>
            
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr className="border-b">
                    <th className="h-10 px-4 text-left font-medium text-slate-500">Nome do Documento</th>
                    <th className="h-10 px-4 text-left font-medium text-slate-500">Data</th>
                    <th className="h-10 px-4 text-left font-medium text-slate-500">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="h-24 text-center text-slate-500">Nenhum documento cadastrado</td>
                    </tr>
                  ) : (
                    documents.map((doc) => (
                      <tr key={doc.id} className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-4 font-medium">
                           <div className="flex items-center gap-2">
                             <FileText className="h-4 w-4 text-blue-500" />
                             <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="hover:underline">
                               {doc.document_name || doc.name || doc.file_name}
                             </a>
                           </div>
                        </td>
                        <td className="p-4 text-slate-500">
                          {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setDocumentToDelete(doc); setDeleteDialogOpen(true); }}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (sectionIndex === 1) { // Resumo
      return (
        <div className="space-y-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
           <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-900 dark:text-white">Resumo do Caso</h4>
              {!isEditingResumo && (
                <Button size="sm" variant="ghost" onClick={() => setIsEditingResumo(true)}>
                  <Edit2 className="h-4 w-4 mr-2" /> Editar
                </Button>
              )}
           </div>
           
           {isEditingResumo ? (
             <div className="space-y-3">
               <Textarea 
                 value={resumoText} 
                 onChange={(e) => setResumoText(e.target.value)} 
                 placeholder="Escreva o resumo do caso..."
                 className="min-h-[150px]"
               />
               <div className="flex justify-end gap-2">
                 <Button variant="ghost" size="sm" onClick={() => setIsEditingResumo(false)}>Cancelar</Button>
                 <Button size="sm" onClick={async () => {
                   await saveGenericField('resumo', resumoText);
                   setIsEditingResumo(false);
                 }}>Salvar</Button>
               </div>
             </div>
           ) : (
             <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-300">
               {caseData.resumo ? (
                 <p className="whitespace-pre-wrap">{caseData.resumo}</p>
               ) : (
                 <p className="italic text-slate-400">Nenhum resumo cadastrado.</p>
               )}
             </div>
           )}
           
           <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Label className="text-sm font-medium mb-2 block">Documentos Relacionados</Label>
              <div className="flex items-center gap-2">
                <Input type="file" onChange={(e) => handleFileUpload(e, "resumo_docs")} disabled={uploadingFields.resumo_docs} className="flex-1" />
                {uploadingFields.resumo_docs && <Upload className="h-4 w-4 animate-spin" />}
              </div>
              {renderDocLinks("resumo_docs")}
           </div>
        </div>
      );
    }

    if (sectionIndex === 2) { // Acompanhamento
      const history = (() => {
        try { return JSON.parse(caseData.acompanhamento || "[]"); } catch { return []; }
      })();
      
      return (
        <div className="space-y-6 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
           <div className="flex items-center justify-between">
             <h4 className="font-semibold">Histórico de Acompanhamento</h4>
             <Button size="sm" variant="outline" onClick={() => setIsEditingAcompanhamento(!isEditingAcompanhamento)}>
               {isEditingAcompanhamento ? "Fechar Editor" : "Adicionar Registro"}
             </Button>
           </div>

           {isEditingAcompanhamento && (
             <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-md space-y-3 animate-in fade-in slide-in-from-top-2">
               <Label>Novo Registro</Label>
               <Textarea 
                 value={acompanhamentoText} 
                 onChange={(e) => setAcompanhamentoText(e.target.value)}
                 placeholder="Descreva o andamento..."
                 className="min-h-[100px]"
               />
               <div className="flex items-center gap-2">
                  <Input type="file" onChange={(e) => handleFileUpload(e, "temp_acompanhamento_doc")} className="text-xs" />
                  <span className="text-xs text-muted-foreground">Opcional: Anexar documento</span>
               </div>
               <div className="flex justify-end">
                 <Button size="sm" onClick={handleAddAcompanhamento}>Salvar Registro</Button>
               </div>
             </div>
           )}

           <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {history.length === 0 && !isEditingAcompanhamento && (
                <p className="text-center text-sm text-slate-500 py-4">Nenhum acompanhamento registrado.</p>
              )}
              {history.map((item: any, idx: number) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <History className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <time className="font-medium text-xs text-slate-500">{new Date(item.date).toLocaleString('pt-BR')}</time>
                      <span className="text-xs font-bold text-slate-700">{item.author || "Usuário"}</span>
                    </div>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{item.content}</p>
                  </div>
                </div>
              ))}
           </div>
        </div>
      );
    }

    if (sectionIndex === 3) { // Processo Finalizado
      return (
        <div className="space-y-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
           <h4 className="font-semibold text-slate-900">Finalização do Processo</h4>
           <div className="space-y-3">
             <div className="space-y-1">
               <Label>Considerações Finais *</Label>
               <Textarea 
                 value={finalizadoText}
                 onChange={(e) => setFinalizadoText(e.target.value)}
                 placeholder="Descreva o desfecho do caso, sentença, etc."
                 className="min-h-[120px]"
                 disabled={status === 'Finalizado'}
               />
             </div>
             <div className="space-y-1">
               <Label>Upload de Documentos Finais</Label>
               <div className="flex items-center gap-2">
                 <Input type="file" onChange={(e) => handleFileUpload(e, "final_docs")} disabled={uploadingFields.final_docs || status === 'Finalizado'} className="flex-1" />
                 {uploadingFields.final_docs && <Upload className="h-4 w-4 animate-spin" />}
               </div>
               {renderDocLinks("final_docs")}
             </div>
             
             {status !== 'Finalizado' && (
               <div className="pt-4 flex justify-end">
                 <AlertDialog open={confirmFinalizeOpen} onOpenChange={setConfirmFinalizeOpen}>
                   <AlertDialogTrigger asChild>
                     <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                       <CheckCircle className="w-4 h-4 mr-2" />
                       Concluir Processo
                     </Button>
                   </AlertDialogTrigger>
                   <AlertDialogContent>
                     <AlertDialogHeader>
                       <AlertDialogTitle>Concluir Processo Criminal?</AlertDialogTitle>
                       <AlertDialogDescription>
                         Esta ação marcará o processo como Finalizado e salvará as considerações finais. Certifique-se de que todos os documentos foram anexados.
                       </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                       <AlertDialogCancel>Cancelar</AlertDialogCancel>
                       <AlertDialogAction onClick={handleFinalizeProcess} className="bg-emerald-600 hover:bg-emerald-700">
                         Confirmar Conclusão
                       </AlertDialogAction>
                     </AlertDialogFooter>
                   </AlertDialogContent>
                 </AlertDialog>
               </div>
             )}
           </div>
        </div>
      );
    }

    return null;
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

  const workflow = WORKFLOWS["Ação Criminal"] || [];
  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="w-full p-4 space-y-6 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/acoes-criminais">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{caseData.clientName || "Nome do Cliente"}</h1>
            <p className="text-muted-foreground">{(caseData.type || "Ação Criminal")} - Ação Criminal</p>
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
                  {(WORKFLOWS["Ação Criminal"] || []).map((step, idx) => (
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
