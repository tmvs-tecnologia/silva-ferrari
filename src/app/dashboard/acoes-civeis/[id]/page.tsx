"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, 
  Save, 
  Trash2, 
  Edit, 
  FileText, 
  Upload,
  CheckCircle,
  Circle,
  ChevronRight,
  X,
  Mail,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  Eye,
  Download
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import "react-day-picker/dist/style.css";
import { StatusPanel } from "@/components/detail/StatusPanel";
import { formatDateBR } from "@/lib/date";
import { subscribeTable, unsubscribe } from "@/lib/realtime";
import { toast } from "sonner";

// Workflow steps for each case type (Civil Actions)
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
    "Cadastro de Documentos",
    "Procuração, Petição e Guia Judicial",
    "À Protocolar",
    "Processo Finalizado",
  ],
  "Usucapião": [
    "Cadastro de Documentos",
    "Elaboração da Procuração",
    "Contratação de um Engenheiro",
    "Elaboração da Petição Inicial",
    "Emissão da Guia Judicial",
    "À Protocolar",
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
} as const;

type AcaoType = keyof typeof WORKFLOWS;

interface StepData {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

interface Document {
  id: string | number;
  document_name?: string;
  name?: string;
  file_name?: string;
  type?: string;
  size?: number;
  uploaded_at?: string;
  uploadedAt?: string;
  url?: string;
  file_path?: string;
  field_name?: string;
  fieldName?: string;
  stepId?: number;
}

interface CaseData {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  clientName: string;
  description: string;
  steps: StepData[];
  currentStep: number;
  // Specific fields for Ações Cíveis
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
  localExameDna?: string;
  observacoesExameDna?: string;
  stepNotes?: Record<number, string>;
  ownerName?: string;
  ownerCpf?: string;
  ownerRnm?: string;
  endereco?: string;
  statusFinal?: string;
  statusFinalOutro?: string;
  notes?: string; // JSON string for history
}

const RESPONSAVEIS = [
  "Secretária – Jessica Cavallaro",
  "Advogada – Jailda Silva",
  "Advogada – Adriana Roder",
  "Advogado – Fábio Ferrari",
  "Advogado – Guilherme Augusto",
  "Estagiário – Wendel Macriani",
];

export default function AcoesCiveisDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<{ [key: number]: string }>({}); // Current text input for each step
  const [status, setStatus] = useState("");
  const [expandedSteps, setExpandedSteps] = useState<{ [key: number]: boolean }>({});
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({});
  
  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [newDocumentName, setNewDocumentName] = useState("");
  const [showNotesModal, setShowNotesModal] = useState(false);

  // Assignments
  const [assignments, setAssignments] = useState<Record<number, { responsibleName?: string; dueDate?: string }>>({});
  const [assignOpenStep, setAssignOpenStep] = useState<number | null>(null);
  const [assignResp, setAssignResp] = useState<string>("");
  const [assignDue, setAssignDue] = useState<string>("");

  // Specific States for Ações Cíveis Logic
  const [dnaExamDate, setDnaExamDate] = useState("");
  const [dnaExamTime, setDnaExamTime] = useState("");
  const [dnaExamLocation, setDnaExamLocation] = useState("");
  const [dnaExamNotes, setDnaExamNotes] = useState("");
  const [dnaSaveSuccess, setDnaSaveSuccess] = useState(false);
  const [obsSaveSuccess, setObsSaveSuccess] = useState<Record<number, boolean>>({});
  const [saveMessages, setSaveMessages] = useState<{ [key: number]: string }>({});

  // Helper: Parse Notes History
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

  // Helper: Delete Note
  const deleteNote = async (noteId: string) => {
    const next = (notesArray || []).filter((n) => n.id !== noteId);
    try {
      await fetch(`/api/acoes-civeis/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: JSON.stringify(next) })
      });
      setCaseData((prev) => prev ? { ...prev, notes: JSON.stringify(next), updatedAt: new Date().toISOString() } : prev);
    } catch (e) { console.error('Erro ao excluir nota:', e); }
  };

  // Helper: Save Note (Global or Step)
  const saveStepNotes = async (stepId: number) => {
    const text = (notes[stepId] || '').trim();
    if (!text) return;
    const iso = new Date().toISOString();
    const noteId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const arr = parseNotesArray(caseData?.notes);
    
    // Determine Author
    const assigned = assignments[stepId] || assignments[caseData?.currentStep || 0] || {};
    const assignedName = assigned.responsibleName || '';
    const suggestion = RESPONSAVEIS.find((r) => r.includes(assignedName || '')) || '';
    const role = suggestion ? suggestion.split(' – ')[0] : '';
    
    const next = [...arr, { 
        id: noteId, 
        stepId, 
        content: text, 
        timestamp: iso, 
        authorName: assignedName || 'Equipe', 
        authorRole: role 
    }];

    try {
      const res = await fetch(`/api/acoes-civeis/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: JSON.stringify(next) })
      });
      if (res.ok) {
        setSaveMessages(prev => ({ ...prev, [stepId]: 'Salvo' }));
        setTimeout(() => setSaveMessages(prev => ({ ...prev, [stepId]: '' })), 3000);
        
        setCaseData((prev) => prev ? { ...prev, notes: JSON.stringify(next), updatedAt: new Date().toISOString() } : prev);
        setNotes((prev) => ({ ...prev, [stepId]: '' }));
      }
    } catch (error) {
      console.error('Erro ao salvar notas da etapa:', error);
    }
  };

  // Parsing DNA Date
  useEffect(() => {
    const raw = caseData?.dataExameDna || "";
    if (!raw) return;
    if (typeof raw === 'string') {
      const iso = raw.replace('T', ' ');
      const m = iso.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
      if (m) {
        setDnaExamDate(m[1]);
        setDnaExamTime(m[2]);
        return;
      }
      try {
        const d = new Date(raw);
        const pad = (n: number) => String(n).padStart(2, '0');
        const yyyy = d.getFullYear();
        const mm = pad(d.getMonth() + 1);
        const dd = pad(d.getDate());
        const hh = pad(d.getHours());
        const mi = pad(d.getMinutes());
        setDnaExamDate(`${yyyy}-${mm}-${dd}`);
        setDnaExamTime(`${hh}:${mi}`);
      } catch {}
    }
  }, [caseData?.dataExameDna]);

  useEffect(() => {
    setDnaExamLocation(caseData?.localExameDna || '');
    setDnaExamNotes(caseData?.observacoesExameDna || '');
  }, [caseData?.localExameDna, caseData?.observacoesExameDna]);

  // Load Initial Data
  useEffect(() => {
    if (id) {
      fetchCaseData();
      fetchDocuments();
      loadAssignments();
      
      const idNum = Number(id);
      // Realtime subscriptions
      const chCase = subscribeTable({
        channelName: `rt-acoes-${idNum}`,
        table: 'acoes_civeis',
        events: ['update'],
        filter: `id=eq.${idNum}`,
        onChange: (payload) => {
          const next = payload?.new;
          if (next && next.id === idNum) {
            setCaseData((prev) => prev ? { ...prev, ...next } : prev);
          }
        }
      });
      const chDocsInsert = subscribeTable({
        channelName: `rt-docs-ac-insert-${idNum}`,
        table: 'documents',
        events: ['insert'],
        filter: `record_id=eq.${idNum}`,
        onChange: () => { fetchDocuments(); }
      });
      const chDocsDelete = subscribeTable({
        channelName: `rt-docs-ac-delete-${idNum}`,
        table: 'documents',
        events: ['delete'],
        filter: `record_id=eq.${idNum}`,
        onChange: () => { fetchDocuments(); }
      });

      return () => {
        unsubscribe(chCase);
        unsubscribe(chDocsInsert);
        unsubscribe(chDocsDelete);
      };
    }
  }, [id]);

  const fetchCaseData = async () => {
    try {
      const res = await fetch(`/api/acoes-civeis/${id}`);
      if (res.ok) {
        const record = await res.json();
        
        // Map steps based on workflow
        const flowType = (record.type as AcaoType) || "Exame DNA";
        const workflowSteps = WORKFLOWS[flowType] || WORKFLOWS["Exame DNA"];
        
        const steps: StepData[] = workflowSteps.map((title: string, index: number) => ({
          id: index,
          title,
          description: `Etapa ${index + 1}: ${title}`,
          completed: false,
          notes: "", // Note content is now centralized in `notes` JSON but we can keep structure
        }));

        // Determine completion
        const recordCurrentStep = Number(record.currentStep ?? 0);
        for (let i = 0; i < steps.length; i++) {
          steps[i].completed = i < recordCurrentStep;
        }

        const data: CaseData = {
          ...record,
          id: String(record.id),
          title: `Ação ${record.id}`,
          description: `Processo de ${flowType}`,
          steps,
          currentStep: recordCurrentStep,
        };

        setCaseData(data);
        setStatus(data.status || "Em Andamento");
      }
    } catch (error) {
      console.error("Erro ao buscar dados do caso:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/documents/${id}?moduleType=acoes_civeis`);
      if (res.ok) {
        const docs = await res.json();
        setDocuments(docs || []);
      }
    } catch (error) {
      console.error("Erro ao buscar documentos:", error);
    }
  };

  const loadAssignments = async () => {
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

  // --- Handlers ---

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    setCaseData(prev => prev ? { ...prev, status: newStatus } : prev);
    try {
      await fetch(`/api/acoes-civeis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (typeof window !== 'undefined') {
        const msg = `Status atualizado para "${newStatus}" em ${caseData?.clientName || ''} - ${caseData?.type || ''}`;
        await fetch(`/api/alerts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moduleType: "Ações Cíveis", recordId: id, alertFor: "admin", message: msg, isRead: false })
        });
        window.dispatchEvent(new Event('alerts-updated'));
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const toggleStepExpansion = (stepId: number) => {
    setExpandedSteps(prev => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const handleStepCompletion = async (stepId: number) => {
    if (!caseData) return;

    // Validation for Step 0 (Cadastro de Documentos)
    if (stepId === 0 && !caseData.steps[0].completed) {
      const type = caseData.type as AcaoType;
      let required: string[] = [];

      // Logic matching novo/page.tsx
      if (type === "Exame DNA") {
        required = ["rnmMae", "rnmPai", "rnmSupostoPai", "cpfMae", "cpfPai", "cpfSupostoPai", "certidaoNascimento", "comprovanteEndereco", "passaporteMae", "passaportePaiRegistral", "passaporteSupostoPai"];
      } else if (type === "Alteração de Nome" || type === "Guarda" || type === "Acordos de Guarda") {
        required = ["rnmMae", "rnmPai", "cpfMae", "cpfPai", "certidaoNascimento", "comprovanteEndereco", "passaporteMae", "passaportePai", "passaporteCrianca"];
      } else if (type === "Divórcio Consensual") {
        required = ["rnmMae", "rnmPai", "cpfMae", "cpfPai", "certidaoNascimento", "comprovanteEndereco", "peticaoConjunta", "termoPartilhas", "guarda", "procuracao"];
      } else if (type === "Divórcio Litígio") {
        required = ["rnmMae", "rnmPai", "cpfMae", "cpfPai", "certidaoNascimento", "comprovanteEndereco", "termoPartilhas", "guarda"];
      } else if (type === "Usucapião") {
        required = ["ownerRnm", "ownerCpf", "comprovanteEndereco", "declaracaoVizinhos", "matriculaImovel", "contaAgua", "contaLuz", "iptu", "peticaoInicial"];
      } else {
        // Default minimal requirements
        required = ["rnmMae", "rnmPai", "certidaoNascimento", "comprovanteEndereco"];
      }

      // Filter required docs that are NOT in the documents list
      const missing = required.filter(req => 
        !documents.some(d => d.field_name === req || d.fieldName === req)
      );

      if (missing.length > 0) {
        toast.error("Para concluir esta etapa, anexe todos os documentos obrigatórios.");
        // Optional: List missing docs in a more detailed toast or console
        // toast.error(`Faltam: ${missing.join(", ")}`);
        return;
      }
    }
    
    const isCurrentlyCompleted = caseData.steps[stepId].completed;
    let newCurrentStep = stepId;
    if (!isCurrentlyCompleted) {
        newCurrentStep = stepId + 1;
    }

    try {
        const response = await fetch(`/api/acoes-civeis/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentStep: newCurrentStep }),
        });

        if (response.ok) {
            const updatedSteps = caseData.steps.map((s, idx) => ({
                ...s,
                completed: idx < newCurrentStep
            }));
            setCaseData(prev => prev ? { ...prev, steps: updatedSteps, currentStep: newCurrentStep } : prev);
            
             try {
                await fetch(`/api/step-assignments`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ moduleType: 'acoes_civeis', recordId: id, currentIndex: newCurrentStep })
                });
              } catch {}
        }
    } catch (error) {
        console.error("Erro ao atualizar etapa:", error);
    }
  };

  const handleSaveAssignment = async (index: number, responsibleName?: string, dueDate?: string) => {
    try {
      const stepTitle = caseData?.steps[index]?.title || `Etapa ${index + 1}`;
      const res = await fetch(`/api/step-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleType: "acoes_civeis", recordId: id, stepIndex: index, responsibleName, dueDate, workflowName: stepTitle, clientName: caseData?.clientName || "Cliente" })
      });
      if (res.ok) {
        setAssignments(prev => ({ ...prev, [index]: { responsibleName, dueDate } }));
        const dueBR = dueDate ? (() => { const [y, m, d] = dueDate.split("-"); return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`; })() : "—";
        const message = `Tarefa "${stepTitle}" atribuída a ${responsibleName || "—"} com prazo ${dueBR} para: ${caseData?.clientName || ""} - ${caseData?.type || ""}`;
        await fetch(`/api/alerts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ moduleType: "Ações Cíveis", recordId: id, alertFor: "admin", message, isRead: false })
        });
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('alerts-updated'));
        return true;
      }
      return false;
    } catch (e) {
      console.error("Erro ao salvar assignment:", e);
      return false;
    }
  };

  const handleFileUpload = async (files: FileList | File[] | null, stepId?: number, fieldName: string = 'documentoAnexado') => {
    const arr = !files ? [] : Array.isArray(files) ? files : Array.from(files);
    if (!arr.length) return;
    
    const uploadKey = stepId !== undefined ? `step-${stepId}` : 'general';
    if (fieldName !== 'documentoAnexado') {
        const file = arr[0];
        const key = `${fieldName}-${stepId}`;
        setUploadingFiles(prev => ({ ...prev, [key]: true }));
        
        const fd = new FormData();
        fd.append('file', file);
        fd.append('caseId', id);
        fd.append('moduleType', 'acoes_civeis');
        fd.append('fieldName', fieldName);
        fd.append('clientName', caseData?.clientName || 'Cliente');

        try {
            const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
            if (res.ok) {
                const payload = await res.json();
                if (payload?.document) {
                    setDocuments(prev => [payload.document, ...prev]);
                } else {
                     await fetchDocuments();
                }
                
                const msg = `Documento "${fieldName}" anexado em ${caseData?.clientName || ''}`;
                await fetch(`/api/alerts`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ moduleType: "Ações Cíveis", recordId: id, alertFor: "admin", message: msg, isRead: false })
                });
                if (typeof window !== 'undefined') window.dispatchEvent(new Event('alerts-updated'));
            }
        } catch (error) {
            console.error("Erro ao fazer upload:", error);
        } finally {
            setUploadingFiles(prev => ({ ...prev, [key]: false }));
        }

    } else {
        setUploadingFiles(prev => ({ ...prev, [uploadKey]: true }));
        try {
            for (const file of arr) {
                const fd = new FormData();
                fd.append('file', file);
                fd.append('caseId', id);
                fd.append('moduleType', 'acoes_civeis');
                fd.append('fieldName', 'documentoAnexado');
                fd.append('clientName', caseData?.clientName || 'Cliente');
                
                const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
                if (res.ok) {
                    const payload = await res.json();
                    if (payload?.document) setDocuments(prev => [payload.document, ...prev]);
                }
            }
            await fetchDocuments();
        } catch (error) {
            console.error("Erro ao fazer upload:", error);
        } finally {
            setUploadingFiles(prev => ({ ...prev, [uploadKey]: false }));
        }
    }
  };

  const handleDeleteDocument = async (document: Document) => {
    setDocumentToDelete(document);
    setShowDeleteDialog(true);
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;
    try {
      const res = await fetch(`/api/documents/delete/${documentToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== documentToDelete.id));
        setShowDeleteDialog(false);
        setDocumentToDelete(null);
      }
    } catch (error) {
      console.error("Erro ao deletar documento:", error);
    }
  };

  const handleRenameDocument = (document: Document) => {
    setEditingDocument(document);
    setNewDocumentName(document.document_name || document.name || document.file_name || "");
    setShowEditDialog(true);
  };

  const confirmRenameDocument = async () => {
    if (!editingDocument || !newDocumentName.trim()) return;
    try {
      const res = await fetch(`/api/documents/rename/${editingDocument.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_name: newDocumentName.trim() })
      });
      if (res.ok) {
        await fetchDocuments();
        setShowEditDialog(false);
        setEditingDocument(null);
        setNewDocumentName("");
      }
    } catch (error) {
      console.error("Erro ao renomear documento:", error);
    }
  };

  const handleDeleteCase = async () => {
    try {
      await fetch(`/api/acoes-civeis/${id}`, { method: 'DELETE' });
      router.push('/dashboard/acoes-civeis');
    } catch (error) {
      console.error('Erro ao deletar caso:', error);
    }
  };

  // --- Logic for Civil Actions Specifics ---

  const patchCaseField = async (payload: Record<string, any>) => {
    try {
      const response = await fetch(`/api/acoes-civeis/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setCaseData(prev => prev ? { ...prev, ...payload } : prev);
      }
    } catch (error) {
      console.error('Erro ao salvar campo:', error);
    }
  };

  const handleSaveDnaSchedule = async () => {
    const combined = dnaExamDate && dnaExamTime ? `${dnaExamDate} ${dnaExamTime}` : dnaExamDate || "";
    try {
      const response = await fetch(`/api/acoes-civeis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataExameDna: combined || null,
          localExameDna: dnaExamLocation || null,
          observacoesExameDna: dnaExamNotes || null,
        }),
      });
      if (response.ok) {
        const updated = await response.json();
        setCaseData(prev => prev ? { ...prev, ...updated } : prev);
        setDnaSaveSuccess(true);
        setTimeout(() => setDnaSaveSuccess(false), 4000);
      }
    } catch (error) {
      console.error("Erro ao salvar agendamento DNA:", error);
    }
  };

  // --- Render Helpers ---

  const renderDocLinks = (fieldKey: string) => {
    const list = documents.filter((d) => (d.field_name === fieldKey || d.fieldName === fieldKey));
    if (!list.length) return null;
    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {list.map((doc) => (
          <div key={String(doc.id)} className="group relative w-8 h-8">
            <a
              href={doc.file_path || doc.url}
              target="_blank"
              rel="noopener noreferrer"
              title={doc.document_name || doc.name || doc.file_name || 'Documento'}
              className="block w-full h-full rounded-md border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"
            >
              <FileText className="h-4 w-4 text-blue-600" />
            </a>
            <button
              type="button"
              aria-label="Excluir"
              title="Excluir"
              className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition bg-white border border-gray-300 rounded-full p-0.5 shadow"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteDocument(doc); }}
            >
              <X className="h-3 w-3 text-gray-600" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const UploadDocBlock = ({ inputId, disabledKey, onSelect, label = "Upload", showLabel = true }: { inputId: string; disabledKey: string; onSelect: (f: File) => void, label?: string, showLabel?: boolean }) => (
    <div className="space-y-1">
      {showLabel && <Label>{label}</Label>}
      <div className="flex items-center gap-2">
        <input
          type="file"
          id={inputId}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onSelect(f);
          }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById(inputId)?.click()}
          disabled={uploadingFiles[disabledKey]}
        >
          {uploadingFiles[disabledKey] ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {label}
        </Button>
      </div>
    </div>
  );

  // --- Main Render Step Logic (Ported from Ações Cíveis, styled like Vistos) ---

  const renderStepContent = (step: StepData) => {
    if (!caseData) return null;
    const stepIndex = step.id;
    const type = caseData.type;

    // Common blocks
    const NotesBlock = () => (
      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea 
          placeholder="Adicione observações sobre esta etapa..." 
          className="bg-white" 
          rows={3} 
          value={notes[stepIndex] || ""}
          onChange={(e) => setNotes(prev => ({ ...prev, [stepIndex]: e.target.value }))}
        />
        <div className="flex justify-end">
            <Button size="sm" onClick={() => saveStepNotes(stepIndex)}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Observações
            </Button>
            {saveMessages[stepIndex] && (
                <span className="text-green-600 text-xs flex items-center ml-2"><CheckCircle2 className="h-3 w-3 mr-1"/> Salvo</span>
            )}
        </div>
      </div>
    );

    const ProtocoladoBlock = () => (
        <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
            <div className="md:col-span-2">
                <UploadDocBlock 
                    inputId={`processo-${stepIndex}`} 
                    disabledKey={`processoAnexadoFile-${stepIndex}`}
                    label="Documento Protocolado"
                    onSelect={(f) => handleFileUpload([f], stepIndex, 'processoAnexadoFile')} 
                />
                {renderDocLinks('processoAnexadoFile')}
            </div>
            <div>
                <Label>Número do Protocolo</Label>
                <Input
                    className="bg-white"
                    placeholder="Digite o número"
                    value={caseData.numeroProtocolo || ""}
                    onChange={(e) => setCaseData(prev => prev ? { ...prev, numeroProtocolo: e.target.value } : prev)}
                    onBlur={(e) => patchCaseField({ numeroProtocolo: e.target.value })}
                />
            </div>
        </div>
    );

    // --- Switch Logic ---

    if (stepIndex === 0) { // Cadastro Documentos (Most complex)
        if (type === 'Exame DNA') {
            return (
                <div className="space-y-4">
                    <h4 className="font-semibold text-slate-900">Dados de Nomes</h4>
                    <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
                        <div className="space-y-1"><Label>Nome da Mãe</Label><Input value={caseData.nomeMae || ""} onChange={e => setCaseData(prev => prev ? {...prev, nomeMae: e.target.value} : prev)} onBlur={e => patchCaseField({nomeMae: e.target.value})} /></div>
                        <div className="space-y-1"><Label>Nome Pai Registral</Label><Input value={caseData.nomePaiRegistral || ""} onChange={e => setCaseData(prev => prev ? {...prev, nomePaiRegistral: e.target.value} : prev)} onBlur={e => patchCaseField({nomePaiRegistral: e.target.value})} /></div>
                        <div className="space-y-1"><Label>Nome Suposto Pai</Label><Input value={caseData.nomeSupostoPai || ""} onChange={e => setCaseData(prev => prev ? {...prev, nomeSupostoPai: e.target.value} : prev)} onBlur={e => patchCaseField({nomeSupostoPai: e.target.value})} /></div>
                        <div className="space-y-1"><Label>Nome da Criança</Label><Input value={(caseData as any).nomeCrianca || ""} onChange={e => setCaseData(prev => prev ? {...prev, nomeCrianca: (e.target.value as any)} : prev)} onBlur={e => patchCaseField({nomeCrianca: e.target.value})} /></div>
                    </div>

                    <h4 className="font-semibold text-slate-900">Documentos de Identificação</h4>
                    <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
                        <div className="space-y-1"><Label>RNM/RG Mãe</Label><Input value={caseData.rnmMae || ""} onChange={e => setCaseData(prev => prev ? {...prev, rnmMae: e.target.value} : prev)} onBlur={e => patchCaseField({rnmMae: e.target.value})} /></div>
                        <div className="space-y-1"><Label>RNM/RG Pai</Label><Input value={caseData.rnmPai || ""} onChange={e => setCaseData(prev => prev ? {...prev, rnmPai: e.target.value} : prev)} onBlur={e => patchCaseField({rnmPai: e.target.value})} /></div>
                        <div className="space-y-1"><Label>RNM/RG Suposto Pai</Label><Input value={caseData.rnmSupostoPai || ""} onChange={e => setCaseData(prev => prev ? {...prev, rnmSupostoPai: e.target.value} : prev)} onBlur={e => patchCaseField({rnmSupostoPai: e.target.value})} /></div>
                        <div className="space-y-1"><Label>Certidão Nascimento Criança</Label><Input value={caseData.certidaoNascimento || ""} onChange={e => setCaseData(prev => prev ? {...prev, certidaoNascimento: e.target.value} : prev)} onBlur={e => patchCaseField({certidaoNascimento: e.target.value})} /></div>
                    </div>

                    <h4 className="font-semibold text-slate-900">Uploads</h4>
                    <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
                        <div><UploadDocBlock inputId={`passaporteMae-${stepIndex}`} disabledKey={`passaporteMaeFile-${stepIndex}`} label="Passaporte Mãe" onSelect={f => handleFileUpload([f], stepIndex, 'passaporteMaeFile')} />{renderDocLinks('passaporteMaeFile')}</div>
                        <div><UploadDocBlock inputId={`passaportePai-${stepIndex}`} disabledKey={`passaportePaiRegistralFile-${stepIndex}`} label="Passaporte Pai" onSelect={f => handleFileUpload([f], stepIndex, 'passaportePaiRegistralFile')} />{renderDocLinks('passaportePaiRegistralFile')}</div>
                        <div><UploadDocBlock inputId={`passaporteSup-${stepIndex}`} disabledKey={`passaporteSupostoPaiFile-${stepIndex}`} label="Passaporte Suposto Pai" onSelect={f => handleFileUpload([f], stepIndex, 'passaporteSupostoPaiFile')} />{renderDocLinks('passaporteSupostoPaiFile')}</div>
                    </div>
                </div>
            );
        } else if (type === 'Usucapião') {
            return (
                <div className="space-y-4">
                     <h4 className="font-semibold text-slate-900">Dono do Imóvel</h4>
                     <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
                        <div className="space-y-1"><Label>Nome Completo</Label><Input value={caseData.ownerName || ""} onChange={e => setCaseData(prev => prev ? {...prev, ownerName: e.target.value} : prev)} onBlur={e => patchCaseField({ownerName: e.target.value})} /></div>
                        <div className="space-y-1"><Label>CPF</Label><Input value={caseData.ownerCpf || ""} onChange={e => setCaseData(prev => prev ? {...prev, ownerCpf: e.target.value} : prev)} onBlur={e => patchCaseField({ownerCpf: e.target.value})} /></div>
                        <div className="space-y-1"><Label>RNM</Label><Input value={caseData.ownerRnm || ""} onChange={e => setCaseData(prev => prev ? {...prev, ownerRnm: e.target.value} : prev)} onBlur={e => patchCaseField({ownerRnm: e.target.value})} /></div>
                        <div><UploadDocBlock inputId={`ownerRnm-${stepIndex}`} disabledKey={`ownerRnmFile-${stepIndex}`} label="RNM (Documento)" onSelect={f => handleFileUpload([f], stepIndex, 'ownerRnmFile')} />{renderDocLinks('ownerRnmFile')}</div>
                     </div>
                     <h4 className="font-semibold text-slate-900">Endereço e Documentos</h4>
                     <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
                        <div className="md:col-span-2 space-y-1"><Label>Endereço</Label><Input value={caseData.endereco || ""} onChange={e => setCaseData(prev => prev ? {...prev, endereco: e.target.value} : prev)} onBlur={e => patchCaseField({endereco: e.target.value})} /></div>
                        <div><UploadDocBlock inputId={`compEnd-${stepIndex}`} disabledKey={`comprovanteEnderecoFile-${stepIndex}`} label="Comprovante Endereço" onSelect={f => handleFileUpload([f], stepIndex, 'comprovanteEnderecoFile')} />{renderDocLinks('comprovanteEnderecoFile')}</div>
                        <div><UploadDocBlock inputId={`decViz-${stepIndex}`} disabledKey={`declaracaoVizinhosFile-${stepIndex}`} label="Declaração Vizinhos" onSelect={f => handleFileUpload([f], stepIndex, 'declaracaoVizinhosFile')} />{renderDocLinks('declaracaoVizinhosFile')}</div>
                        <div><UploadDocBlock inputId={`matImovel-${stepIndex}`} disabledKey={`matriculaImovelFile-${stepIndex}`} label="Matrícula Imóvel" onSelect={f => handleFileUpload([f], stepIndex, 'matriculaImovelFile')} />{renderDocLinks('matriculaImovelFile')}</div>
                        <div><UploadDocBlock inputId={`contaAgua-${stepIndex}`} disabledKey={`contaAguaFile-${stepIndex}`} label="Conta de Água" onSelect={f => handleFileUpload([f], stepIndex, 'contaAguaFile')} />{renderDocLinks('contaAguaFile')}</div>
                        <div><UploadDocBlock inputId={`contaLuz-${stepIndex}`} disabledKey={`contaLuzFile-${stepIndex}`} label="Conta de Luz" onSelect={f => handleFileUpload([f], stepIndex, 'contaLuzFile')} />{renderDocLinks('contaLuzFile')}</div>
                        <div><UploadDocBlock inputId={`iptu-${stepIndex}`} disabledKey={`iptuFile-${stepIndex}`} label="IPTU" onSelect={f => handleFileUpload([f], stepIndex, 'iptuFile')} />{renderDocLinks('iptuFile')}</div>
                     </div>
                </div>
            );
        } else {
            // Default generic fields for other types
             return (
                <div className="space-y-4">
                     <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
                        <div className="space-y-1"><Label>Cliente</Label><Input value={caseData.clientName} readOnly /></div>
                        <div className="space-y-1"><Label>Tipo</Label><Input value={caseData.type} readOnly /></div>
                        <div className="space-y-1"><Label>Nome Mãe</Label><Input value={caseData.nomeMae || ""} onChange={e => setCaseData(prev => prev ? {...prev, nomeMae: e.target.value} : prev)} onBlur={e => patchCaseField({nomeMae: e.target.value})} /></div>
                        <div className="space-y-1"><Label>Nome Pai</Label><Input value={caseData.nomePaiRegistral || ""} onChange={e => setCaseData(prev => prev ? {...prev, nomePaiRegistral: e.target.value} : prev)} onBlur={e => patchCaseField({nomePaiRegistral: e.target.value})} /></div>
                        <div><UploadDocBlock inputId={`rnmMae-${stepIndex}`} disabledKey={`rnmMaeFile-${stepIndex}`} label="RNM/RG Mãe" onSelect={f => handleFileUpload([f], stepIndex, 'rnmMaeFile')} />{renderDocLinks('rnmMaeFile')}</div>
                        <div><UploadDocBlock inputId={`rnmPai-${stepIndex}`} disabledKey={`rnmPaiFile-${stepIndex}`} label="RNM/RG Pai" onSelect={f => handleFileUpload([f], stepIndex, 'rnmPaiFile')} />{renderDocLinks('rnmPaiFile')}</div>
                        <div><UploadDocBlock inputId={`cpfMae-${stepIndex}`} disabledKey={`cpfMaeFile-${stepIndex}`} label="CPF Mãe" onSelect={f => handleFileUpload([f], stepIndex, 'cpfMaeFile')} />{renderDocLinks('cpfMaeFile')}</div>
                        <div><UploadDocBlock inputId={`cpfPai-${stepIndex}`} disabledKey={`cpfPaiFile-${stepIndex}`} label="CPF Pai" onSelect={f => handleFileUpload([f], stepIndex, 'cpfPaiFile')} />{renderDocLinks('cpfPaiFile')}</div>
                        <div><UploadDocBlock inputId={`certNasc-${stepIndex}`} disabledKey={`certidaoNascimentoFile-${stepIndex}`} label="Certidão Nascimento" onSelect={f => handleFileUpload([f], stepIndex, 'certidaoNascimentoFile')} />{renderDocLinks('certidaoNascimentoFile')}</div>
                        <div><UploadDocBlock inputId={`compEnd-${stepIndex}`} disabledKey={`comprovanteEnderecoFile-${stepIndex}`} label="Comprovante Endereço" onSelect={f => handleFileUpload([f], stepIndex, 'comprovanteEnderecoFile')} />{renderDocLinks('comprovanteEnderecoFile')}</div>
                     </div>
                </div>
             );
        }
    }

    // Agendar Exame DNA
    if (type === 'Exame DNA' && stepIndex === 1) {
        return (
            <div className="space-y-4">
                <div className="grid gap-3 p-3 bg-white border rounded-lg shadow-xs">
                    <div className="grid md:grid-cols-2 gap-3">
                        <div className="space-y-1"><Label>Data</Label><Input type="date" value={dnaExamDate} onChange={e => setDnaExamDate(e.target.value)} /></div>
                        <div className="space-y-1"><Label>Hora</Label><Input type="time" value={dnaExamTime} onChange={e => setDnaExamTime(e.target.value)} /></div>
                    </div>
                    <div className="space-y-1"><Label>Local</Label><Input value={dnaExamLocation} onChange={e => setDnaExamLocation(e.target.value)} placeholder="Laboratório" /></div>
                    <div className="space-y-1"><Label>Observações do Exame</Label><Textarea value={dnaExamNotes} onChange={e => setDnaExamNotes(e.target.value)} rows={2} /></div>
                    <div><UploadDocBlock inputId={`dnaRes-${stepIndex}`} disabledKey={`resultadoExameDnaFile-${stepIndex}`} label="Resultado do Exame (Arquivo)" onSelect={f => handleFileUpload([f], stepIndex, 'resultadoExameDnaFile')} />{renderDocLinks('resultadoExameDnaFile')}</div>
                    
                    <div className="flex justify-end pt-2">
                         <Button size="sm" onClick={handleSaveDnaSchedule}>
                            <Save className="h-4 w-4 mr-2" />
                            Salvar Agendamento
                        </Button>
                         {dnaSaveSuccess && <span className="text-green-600 text-xs flex items-center ml-2"><CheckCircle2 className="h-3 w-3 mr-1"/> Salvo</span>}
                    </div>
                </div>
            </div>
        );
    }

    // Steps involving Procuração, Petição, Guia
    const titleLower = step.title.toLowerCase();
    if (titleLower.includes('procuração') || titleLower.includes('petição') || titleLower.includes('guia') || titleLower.includes('peticionar')) {
        return (
            <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
                    {titleLower.includes('procuração') && (
                        <div><UploadDocBlock inputId={`proc-${stepIndex}`} disabledKey={`procuracaoAnexadaFile-${stepIndex}`} label="Procuração" onSelect={f => handleFileUpload([f], stepIndex, 'procuracaoAnexadaFile')} />{renderDocLinks('procuracaoAnexadaFile')}</div>
                    )}
                    {(titleLower.includes('petição') || titleLower.includes('peticionar')) && (
                        <div><UploadDocBlock inputId={`pet-${stepIndex}`} disabledKey={`peticaoAnexadaFile-${stepIndex}`} label="Petição" onSelect={f => handleFileUpload([f], stepIndex, 'peticaoAnexadaFile')} />{renderDocLinks('peticaoAnexadaFile')}</div>
                    )}
                    {titleLower.includes('guia') && (
                        <div><UploadDocBlock inputId={`guia-${stepIndex}`} disabledKey={`guiaPagaFile-${stepIndex}`} label="Guia Judicial" onSelect={f => handleFileUpload([f], stepIndex, 'guiaPagaFile')} />{renderDocLinks('guiaPagaFile')}</div>
                    )}
                </div>
                <NotesBlock />
            </div>
        );
    }

    // Protocolar
    if (titleLower.includes('protocolar')) {
        return (
            <div className="space-y-4">
                <ProtocoladoBlock />
                <NotesBlock />
            </div>
        );
    }

    // Finalizado
    if (titleLower.includes('finalizado') || titleLower.includes('sentença')) {
         return (
            <div className="space-y-4">
                <div className="grid gap-3 p-3 bg-white border rounded-lg shadow-xs">
                    <div className="space-y-1">
                        <Label>Status Final</Label>
                        <Select value={caseData.statusFinal || ""} onValueChange={v => { setCaseData(p => p ? {...p, statusFinal: v} : p); patchCaseField({statusFinal: v}); if(v !== 'Outro') handleStatusChange('Finalizado'); }}>
                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Deferido">Deferido</SelectItem>
                                <SelectItem value="Indeferido">Indeferido</SelectItem>
                                <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {caseData.statusFinal === 'Outro' && (
                        <div className="space-y-1"><Label>Descrição Status</Label><Input value={caseData.statusFinalOutro || ""} onChange={e => setCaseData(p => p ? {...p, statusFinalOutro: e.target.value} : p)} onBlur={e => patchCaseField({statusFinalOutro: e.target.value})} /></div>
                    )}
                     <div><UploadDocBlock inputId={`docFinal-${stepIndex}`} disabledKey={`documentosProcessoFinalizadoFile-${stepIndex}`} label="Documento Final / Sentença" onSelect={f => handleFileUpload([f], stepIndex, 'documentosProcessoFinalizadoFile')} />{renderDocLinks('documentosProcessoFinalizadoFile')}</div>
                </div>
                <NotesBlock />
            </div>
        );
    }

    // Default Fallback
    return (
        <div className="space-y-4">
             <div className="p-3 bg-white border rounded-lg shadow-xs">
                 <UploadDocBlock inputId={`genDoc-${stepIndex}`} disabledKey={`step-${stepIndex}`} label="Anexar Documento" onSelect={f => handleFileUpload([f], stepIndex)} />
                 {renderDocLinks('documentoAnexado')}
             </div>
             <NotesBlock />
        </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
             <Skeleton className="h-32 w-full" />
             <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return <div>Caso não encontrado.</div>;
  }

  const currentStepIndex = caseData.currentStep;

  return (
    <div className="w-full p-4 space-y-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/acoes-civeis">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{caseData.clientName}</h1>
            <p className="text-muted-foreground">{caseData.type}</p>
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
                <AlertDialogAction onClick={handleDeleteCase} className="bg-white text-red-600 border border-red-500 hover:bg-red-50 hover:text-red-700">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Workflow */}
        <div className="lg:col-span-8">
            <Card className="rounded-xl border-gray-200 shadow-sm min-h-[560px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Fluxo do Processo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {caseData.steps.map((step, index) => {
                  const isCurrent = index === currentStepIndex;
                  const isCompleted = step.completed;
                  const showConnector = index < caseData.steps.length - 1;
                  
                  return (
                    <div key={step.id} className="flex group relative pb-10">
                      {showConnector ? (
                        <div className={`absolute left-6 top-8 bottom-0 w-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                      ) : null}
                      <div className="flex-shrink-0 mr-4">
                        {isCompleted ? (
                           <div className="h-12 w-12 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center z-10 cursor-pointer hover:scale-105 transition" onClick={() => handleStepCompletion(step.id)}>
                             <CheckCircle className="w-6 h-6 text-green-600" />
                           </div>
                        ) : isCurrent ? (
                           <div className="h-12 w-12 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center z-10 shadow-md cursor-pointer hover:scale-105 transition" onClick={() => handleStepCompletion(step.id)}>
                             <div className="h-4 w-4 rounded-full bg-blue-500" />
                           </div>
                        ) : (
                           <div className="h-12 w-12 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center z-10 cursor-pointer hover:scale-105 transition" onClick={() => handleStepCompletion(step.id)}>
                             <Circle className="w-6 h-6 text-gray-400" />
                           </div>
                        )}
                      </div>
                      
                      <div className={`flex-grow pt-2 ${isCurrent ? 'p-4 bg-blue-50 rounded-lg border border-blue-100' : isCompleted ? '' : 'opacity-60'}`}>
                        <div className="flex justify-between items-start">
                           <div>
                              <div className="flex items-center gap-2">
                                <h3 className={`${isCurrent ? 'text-blue-600 font-bold' : 'font-semibold'} text-base`}>{step.title}</h3>
                                {isCurrent && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Atual</span>}
                                {isCompleted && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Concluído</span>}
                              </div>
                              {assignments[index]?.responsibleName && (
                                <div className="mt-1 text-xs text-gray-600">
                                   <span className="font-medium">Responsável:</span> {assignments[index].responsibleName}
                                   {assignments[index].dueDate && <span> · Prazo: {formatDateBR(assignments[index].dueDate)}</span>}
                                </div>
                              )}
                           </div>
                           <div className="flex items-center gap-2">
                              {/* Assignment Popover */}
                              <Popover open={assignOpenStep === step.id} onOpenChange={(open) => setAssignOpenStep(open ? step.id : null)}>
                                <PopoverTrigger asChild>
                                  <button className="text-xs text-gray-600 border border-gray-300 rounded px-3 py-1 bg-white">Definir Responsável</button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[420px] max-w-[95vw]">
                                  <div className="space-y-3">
                                     <div className="space-y-1">
                                        <Label>Responsável</Label>
                                        <Input value={assignResp} onChange={e => setAssignResp(e.target.value)} placeholder="Nome" />
                                        <div className="rounded-md border mt-2 bg-white max-h-32 overflow-y-auto">
                                            {RESPONSAVEIS.map(r => (
                                                <button key={r} className="w-full text-left px-2 py-1 text-sm hover:bg-slate-100" onClick={() => setAssignResp(r)}>{r}</button>
                                            ))}
                                        </div>
                                     </div>
                                     <div className="space-y-1">
                                        <Label>Prazo</Label>
                                        <Input type="date" value={assignDue} onChange={e => setAssignDue(e.target.value)} />
                                     </div>
                                     <div className="flex justify-end gap-2">
                                        <Button size="sm" onClick={() => handleSaveAssignment(index, assignResp, assignDue).then(() => setAssignOpenStep(null))}>Salvar</Button>
                                     </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                              
                              <button className="text-gray-500" onClick={() => toggleStepExpansion(step.id)}>
                                {expandedSteps[step.id] ? <ChevronRight className="w-5 h-5 rotate-90" /> : <ChevronRight className="w-5 h-5" />}
                              </button>
                           </div>
                        </div>
                        
                        {expandedSteps[step.id] && (
                            <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                {renderStepContent(step)}
                            </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
        </div>

        {/* Right Column: Status, Notes, Docs */}
        <div className="lg:col-span-4 flex flex-col min-h-[560px] space-y-4">
             <StatusPanel
                status={status}
                onStatusChange={handleStatusChange}
                currentStep={currentStepIndex + 1}
                totalSteps={caseData.steps.length}
                currentStepTitle={caseData.steps[currentStepIndex]?.title}
                createdAt={caseData.createdAt}
                updatedAt={caseData.updatedAt}
             />

             {/* Notes Card - Matches Vistos Exactly */}
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
                  <Textarea 
                    rows={12} 
                    placeholder="Adicione observações..." 
                    value={notes[0] || ''} 
                    onChange={(e) => setNotes(prev => ({ ...prev, 0: e.target.value }))} 
                    className="flex-1 border-none bg-transparent" 
                  />
                  <div className="flex justify-end items-center px-3 py-2 mt-2">
                    <div className="flex flex-col items-end gap-1 w-full">
                      <Button className="bg-slate-900 text-white" onClick={() => saveStepNotes(0)}>Salvar</Button>
                      {saveMessages[0] ? (
                        <span className="text-green-600 text-xs">Salvo com sucesso!</span>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>

             {/* Documents Card */}
             <Card className="rounded-xl border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Documentos do Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition cursor-pointer" onClick={() => document.getElementById('global-upload')?.click()}>
                        <div className="p-3 bg-blue-50 rounded-full mb-3"><Upload className="h-6 w-6 text-blue-500" /></div>
                        <p className="text-sm font-medium text-gray-700">Arraste ou clique para anexar</p>
                        <input type="file" id="global-upload" className="hidden" multiple onChange={e => handleFileUpload(e.target.files)} />
                     </div>
                     
                     <div className="mt-4 flex flex-wrap gap-2">
                        {documents.map(doc => (
                           <div key={String(doc.id)} className="group relative w-10 h-10">
                                <a href={doc.file_path || doc.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full rounded-md border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50" title={doc.document_name || doc.name}>
                                    <FileText className="h-5 w-5 text-blue-600" />
                                </a>
                                <button className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition bg-white border border-gray-300 rounded-full p-0.5 shadow" onClick={e => {e.preventDefault(); handleDeleteDocument(doc);}}>
                                    <X className="h-3 w-3 text-gray-600" />
                                </button>
                           </div>
                        ))}
                        {documents.length === 0 && <p className="text-xs text-gray-500 w-full text-center">Nenhum documento.</p>}
                     </div>
                </CardContent>
             </Card>
             
             {/* Responsibles Card */}
             <Card className="rounded-xl border-gray-200 shadow-sm h-full">
                <CardHeader><CardTitle>Responsáveis</CardTitle></CardHeader>
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

      {/* Modal de Notas (Matches Vistos) */}
      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent showCloseButton={false}>
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Notas do Processo</h2>
            <DialogClose className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X className="h-5 w-5" />
              <span className="sr-only">Fechar</span>
            </DialogClose>
          </div>
          <div className="p-6 overflow-y-auto flex-grow bg-white dark:bg-gray-800 max-h-[60vh]">
            <div className="space-y-3">
              {notesArray.length ? notesArray.map((n: any) => {
                const d = new Date(n.timestamp);
                const formatted = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={n.id} className="group relative bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-sm leading-snug">
                    <button
                      type="button"
                      aria-label="Excluir"
                      title="Excluir"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition bg-white border border-gray-300 rounded-full p-0.5 shadow"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteNote(n.id); }}
                    >
                      <X className="h-3 w-3 text-gray-600" />
                    </button>
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                      {(() => {
                        const name = String(n.authorName || '').trim();
                        const showName = !!name && name.toLowerCase() !== 'equipe';
                        return `${formatted}${showName ? ` - ${name}${n.authorRole ? ` (${n.authorRole})` : ''}` : ''}`;
                      })()}
                    </div>
                    <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                  </div>
                );
              }) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">Nenhuma nota encontrada.</div>
              )}
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end items-center rounded-b-xl">
            <Button className="bg-slate-900 text-white shadow-md hover:bg-slate-800 hover:shadow-lg transform hover:scale-105 active:scale-95 h-9 px-4 py-2" onClick={() => setShowNotesModal(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Document Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir o documento? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDocument} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       {/* Edit Document Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Renomear documento</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label>Nome do documento</Label>
            <Input value={newDocumentName} onChange={(e) => setNewDocumentName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button onClick={confirmRenameDocument}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
