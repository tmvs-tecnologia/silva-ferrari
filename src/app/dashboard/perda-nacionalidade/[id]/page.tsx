"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { documentDeleteButtonClassName, documentGridClassName, documentIconClassName, documentLinkClassName, documentNameClassName, documentTileClassName } from "@/components/ui/document-style";
import {
  ArrowLeft,
  Save,
  Trash2,
  FileText,
  Upload,
  Download,
  Eye,
  Calendar,
  User,
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
  ChevronRight,
  X,
  Plus,
  Mail,
  Edit
} from "lucide-react";
import { toast } from "sonner";
import { DocumentChip } from "@/components/ui/document-chip";
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
import { PendingDocumentsList, PendingDocument } from "@/components/detail/PendingDocumentsList";
import { formatDateBR } from "@/lib/date";
import { subscribeTable, unsubscribe } from "@/lib/realtime";

// Workflow específico de Perda de Nacionalidade
const WORKFLOW_STEPS = [
  "Cadastro de Documento",
  "Fazer a Procuração e o Pedido de Perda",
  "Colher assinaturas nas Procurações e Pedidos",
  "Protocolar no SEI",
  "Processo Protocolado",
  "Processo Deferido",
  "Passaporte Chinês",
  "Manifesto",
  "Protocolar no SEI",
  "Processo Ratificado",
  "Processo Finalizado"
] as const;

interface StepData {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  url: string;
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
}

export default function PerdaNacionalidadeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<{ [key: number]: string }>({});
  const [status, setStatus] = useState("");
  const [perdaData, setPerdaData] = useState<any>(null);
  
  const showWorkflow = true;
  const [expandedSteps, setExpandedSteps] = useState<{ [key: number]: boolean }>({});
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({});
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [newDocumentName, setNewDocumentName] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isEditingDocuments, setIsEditingDocuments] = useState(false);
  
  // Estados para dados específicos de cada etapa
  const [stepData, setStepData] = useState<{ [key: number]: any }>({});

  // Estados para uploads de arquivos específicos
  const [fileUploads, setFileUploads] = useState<{ [key: string]: File | null }>({});
  const [assignments, setAssignments] = useState<Record<number, { responsibleName?: string; dueDate?: string }>>({});
  const [saveMessages, setSaveMessages] = useState<{ [key: number]: string }>({});
  const [assignOpenStep, setAssignOpenStep] = useState<number | null>(null);
  const [assignResp, setAssignResp] = useState<string>("");
  const [assignDue, setAssignDue] = useState<string>("");
  const [showNotesModal, setShowNotesModal] = useState(false);

  // Helper for requirements
  const getDocRequirements = (): PendingDocument[] => {
    return [
       // Etapa 0
       { key: "rnmMaeDoc", label: "RNM da Mãe", group: WORKFLOW_STEPS[0], stepId: 0, required: true },
       { key: "cpfMaeDoc", label: "CPF da Mãe", group: WORKFLOW_STEPS[0], stepId: 0, required: true },
       { key: "rnmPaiDoc", label: "RNM do Pai", group: WORKFLOW_STEPS[0], stepId: 0, required: true },
       { key: "cpfPaiDoc", label: "CPF do Pai", group: WORKFLOW_STEPS[0], stepId: 0, required: true },
       { key: "passaporteDoc", label: "Passaportes", group: WORKFLOW_STEPS[0], stepId: 0, required: true },
       { key: "certidaoNascimentoDoc", label: "Certidão de Nascimento", group: WORKFLOW_STEPS[0], stepId: 0, required: true },
       { key: "comprovanteEnderecoDoc", label: "Comprovante de Endereço", group: WORKFLOW_STEPS[0], stepId: 0, required: true },
       { key: "documentoChinesDoc", label: "Documento Chinês", group: WORKFLOW_STEPS[0], stepId: 0 },
       { key: "traducaoJuramentadaDoc", label: "Tradução Juramentada", group: WORKFLOW_STEPS[0], stepId: 0 },
       
       // Etapa 1
       { key: "procuracaoDoc", label: "Procuração", group: WORKFLOW_STEPS[1], stepId: 1, required: true },
       { key: "pedidoPerdaDoc", label: "Pedido de Perda", group: WORKFLOW_STEPS[1], stepId: 1, required: true },

       // Etapa 2
       { key: "procuracaoAssinadaDoc", label: "Procuração Assinada", group: WORKFLOW_STEPS[2], stepId: 2, required: true },
       { key: "pedidoAssinadoDoc", label: "Pedido Assinado", group: WORKFLOW_STEPS[2], stepId: 2, required: true },

       // Etapa 3
       { key: "protocoloSeiDoc", label: "Protocolo no SEI", group: WORKFLOW_STEPS[3], stepId: 3, required: true },

       // Etapa 4
       { key: "comprovanteProtocoladoDoc", label: "Comprovante de Protocolo", group: WORKFLOW_STEPS[4], stepId: 4 },

       // Etapa 5
       { key: "douDoc", label: "DOU (Deferimento)", group: WORKFLOW_STEPS[5], stepId: 5, required: true },

       // Etapa 6
       { key: "passaporteChinesDoc", label: "Passaporte Chinês", group: WORKFLOW_STEPS[6], stepId: 6, required: true },
       { key: "portariaDoc", label: "Portaria", group: WORKFLOW_STEPS[6], stepId: 6, required: true },

       // Etapa 7
       { key: "manifestoDoc", label: "Manifesto", group: WORKFLOW_STEPS[7], stepId: 7, required: true },

       // Etapa 8
       { key: "protocoloManifestoDoc", label: "Protocolo do Manifesto", group: WORKFLOW_STEPS[8], stepId: 8, required: true },

       // Etapa 9
       { key: "douRatificacaoDoc", label: "DOU (Ratificação)", group: WORKFLOW_STEPS[9], stepId: 9, required: true },
    ];
  };

  const pendingDocs = getDocRequirements().filter(req => 
    !documents.some(doc => (doc.fieldName === req.key || (doc as any).field_name === req.key))
  ).map(doc => ({
      ...doc,
      priority: doc.required ? "high" : "medium" as any,
      status: "pending" as any
  }));
  
  const totalDocs = getDocRequirements().length;
  const completedDocs = totalDocs - pendingDocs.length;

  const parseNotesArray = (notesStr?: string) => {
    try {
      const v = (notesStr || '').trim();
      if (!v) return [] as Array<{ id: string; stepId?: number; content: string; timestamp: string }>;
      const arr = JSON.parse(v);
      if (Array.isArray(arr)) return arr as any;
      return [] as any;
    } catch { return [] as any; }
  };
  
  const notesArray = parseNotesArray(perdaData?.notes);
  
  const deleteNote = async (noteId: string) => {
    const next = (notesArray || []).filter((n) => n.id !== noteId);
    try {
      await fetch(`/api/perda-nacionalidade?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: JSON.stringify(next) })
      });
      setPerdaData((prev: any) => ({ ...(prev || {}), notes: JSON.stringify(next) }));
      setCaseData((prev) => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev);
      console.log('Nota excluída', { noteId });
    } catch (e) { console.error('Erro ao excluir nota:', e); }
  };

  const RESPONSAVEIS = [
    "Secretária – Jessica Cavallaro",
    "Advogada – Jailda Silva",
    "Advogada – Adriana Roder",
    "Advogado – Fábio Ferrari",
    "Advogado – Guilherme Augusto",
    "Estagiário – Wendel Macriani",
  ];

  useEffect(() => {
    if (params.id) {
      fetchCaseData();
      fetchDocuments();
      const loadAssignments = async () => {
        try {
          const res = await fetch(`/api/step-assignments?moduleType=perda_nacionalidade&recordId=${params.id}`);
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

      const idNum = Number(params.id);
      const chPerda = subscribeTable({
        channelName: `rt-perda-${idNum}`,
        table: 'perda_nacionalidade',
        events: ['update'],
        filter: `id=eq.${idNum}`,
        onChange: (payload) => {
          const next = payload?.new;
          if (next && next.id === idNum) {
            setPerdaData((prev: any) => ({ ...(prev || {}), ...next }));
            setCaseData((prev) => prev ? { ...prev, ...(next || {}) } : prev);
          }
        }
      });
      
      const chDocsInsert = subscribeTable({
        channelName: `rt-docs-insert-perda-${idNum}`,
        table: 'documents',
        events: ['insert'],
        filter: `record_id=eq.${idNum}`,
        onChange: () => { fetchDocuments(); }
      });
      
      const chDocsDelete = subscribeTable({
        channelName: `rt-docs-delete-perda-${idNum}`,
        table: 'documents',
        events: ['delete'],
        filter: `record_id=eq.${idNum}`,
        onChange: () => { fetchDocuments(); }
      });

      return () => {
        unsubscribe(chPerda);
        unsubscribe(chDocsInsert);
        unsubscribe(chDocsDelete);
      };
    }
  }, [params.id]);

  const fetchCaseData = async () => {
    try {
      const res = await fetch(`/api/perda-nacionalidade?id=${params.id}`);
      if (res.ok) {
        const record = await res.json();
        setPerdaData(record);
        setStepData(record.stepData || {});
        
        const steps: StepData[] = WORKFLOW_STEPS.map((title: string, index: number) => ({
          id: index,
          title,
          description: `Etapa ${index + 1}: ${title}`,
          completed: false,
          notes: "",
        }));

        const recordCurrentStep = Number(record.currentStep ?? 0);
        const initialCurrentStep = recordCurrentStep < 0 ? 0 : recordCurrentStep;
        
        const completedFromServer = (() => {
          const v = (record.completedSteps ?? []) as any;
          if (Array.isArray(v)) return v as number[];
          if (typeof v === 'string') { try { const parsed = JSON.parse(v); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
          return [];
        })();

        if (completedFromServer.length) {
          for (let i = 0; i < steps.length; i++) {
            steps[i].completed = completedFromServer.includes(i);
          }
        } else {
          for (let i = 0; i < steps.length; i++) {
            steps[i].completed = i < initialCurrentStep;
          }
        }

        let contiguousIndex = initialCurrentStep;

        const data: CaseData = {
          id: String(record.id),
          title: `Processo ${record.id}`,
          type: "Perda de Nacionalidade",
          status: record.status || "Em Andamento",
          createdAt: record.createdAt || record.created_at,
          updatedAt: record.updatedAt || record.updated_at,
          clientName: record.clientName || record.client_name,
          description: "Processo de Perda de Nacionalidade",
          steps,
          currentStep: contiguousIndex,
        };

        setCaseData(data);
        setStatus(data.status);
      }
    } catch (error) {
      console.error("Erro ao buscar dados do caso:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/documents/${params.id}?moduleType=perda_nacionalidade`);
      if (res.ok) {
        const docs = await res.json();
        setDocuments(docs || []);
      }
    } catch (error) {
      console.error("Erro ao buscar documentos:", error);
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
        await fetchDocuments();
        setShowDeleteDialog(false);
        setDocumentToDelete(null);
      }
    } catch (error) {
      console.error("Erro ao deletar documento:", error);
    }
  };

  const handleRenameDocument = (document: Document) => {
    setEditingDocument(document);
    setNewDocumentName(document.name);
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

  const handleFileUpload = async (files: FileList | File[] | null, stepId?: number) => {
    const arr = !files ? [] : Array.isArray(files) ? files : Array.from(files);
    if (!arr.length) return;
    const uploadKey = stepId !== undefined ? `step-${stepId}` : 'general';
    setUploadingFiles(prev => ({ ...prev, [uploadKey]: true }));
    try {
      const getErrorMessage = async (res: Response, fallback: string) => {
        try {
          const data = await res.json().catch(() => ({} as any));
          return String(data?.error || data?.message || fallback);
        } catch {
          return fallback;
        }
      };
      for (const file of arr) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('caseId', String(params.id));
        fd.append('moduleType', 'perda_nacionalidade');
        fd.append('fieldName', 'documentoAnexado');
        fd.append('clientName', caseData?.clientName || 'Cliente');
        const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
        if (!res.ok) throw new Error(await getErrorMessage(res, 'Erro ao fazer upload do documento'));
        const payload = await res.json();
        const newDoc = payload?.document;
        if (newDoc) setDocuments(prev => [newDoc, ...prev]);
        toast.success(`Upload concluído: ${file.name}`);
      }
      await fetchDocuments();
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao realizar upload.");
    } finally {
      setUploadingFiles(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleSpecificFileUpload = async (file: File, fieldKey: string, stepId: number) => {
    const uploadKey = `${fieldKey}-${stepId}`;
    setUploadingFiles(prev => ({ ...prev, [uploadKey]: true }));
    try {
      const getErrorMessage = async (res: Response, fallback: string) => {
        try {
          const data = await res.json().catch(() => ({} as any));
          return String(data?.error || data?.message || fallback);
        } catch {
          return fallback;
        }
      };
      const fd = new FormData();
      fd.append('file', file);
      fd.append('caseId', String(params.id));
      fd.append('moduleType', 'perda_nacionalidade');
      fd.append('fieldName', fieldKey);
      fd.append('clientName', caseData?.clientName || 'Cliente');
      const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(await getErrorMessage(res, 'Erro ao fazer upload do documento'));
      const payload = await res.json();
      const newDoc = payload?.document;
      if (newDoc) setDocuments(prev => [newDoc, ...prev]);
      await fetchDocuments();
      setFileUploads(prev => ({ ...prev, [uploadKey]: null }));
      toast.success(`Upload concluído: ${file.name}`);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao realizar upload.");
    } finally {
      setUploadingFiles(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const renderDocLinks = (fieldKey: string) => {
    const list = (documents || []).filter((d: any) => (d.field_name || d.fieldName) === fieldKey);
    if (!list.length) return null as any;
    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {list.map((doc: any) => (
          <DocumentChip
            key={String(doc.id)}
            name={doc.document_name || doc.name || doc.file_name || "Documento"}
            href={doc.file_path || doc.url}
            onDelete={() => handleDeleteDocument(doc as any)}
            className="bg-white hover:bg-gray-50 border-gray-200"
          />
        ))}
      </div>
    );
  };

  const UploadDocBlock = ({ inputId, disabledKey, onSelect }: { inputId: string; disabledKey: string; onSelect: (f: File) => void }) => (
    <div className="space-y-3">
      <Label>Upload de Documentos</Label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          id={inputId}
          className="hidden"
          multiple
          onChange={(e) => {
            const list = Array.from(e.target.files || []);
            list.forEach((f) => onSelect(f));
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
          Fazer Upload de Arquivos
        </Button>
      </div>
    </div>
  );

  const toggleStepExpansion = (stepId: number) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const handleStepCompletion = (stepId: number) => {
    if (!caseData) return;
    setCaseData(prev => {
      if (!prev) return prev;
      const isCurrentlyCompleted = prev.steps.find(s => s.id === stepId)?.completed;
      const updatedSteps = prev.steps.map(step => {
        if (isCurrentlyCompleted) {
          if (step.id >= stepId) {
            return { ...step, completed: false, completedAt: undefined };
          }
          return step;
        } else {
          if (step.id <= stepId) {
            return { ...step, completed: true, completedAt: step.completed ? step.completedAt : new Date().toISOString() };
          }
          return step;
        }
      });
      const completedStepsArr = updatedSteps.filter(s => s.completed).map(s => s.id);
      const newCurrent = isCurrentlyCompleted 
        ? Math.min(stepId, updatedSteps.length - 1)
        : Math.min(stepId + 1, updatedSteps.length - 1);
      
      (async () => {
        try {
          await fetch(`/api/perda-nacionalidade?id=${params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentStep: newCurrent, completedSteps: completedStepsArr })
          });
          setCaseData((prev2) => prev2 ? { ...prev2, updatedAt: new Date().toISOString() } : prev2);
          try {
            await fetch(`/api/step-assignments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ moduleType: 'perda_nacionalidade', recordId: params.id as string, currentIndex: newCurrent })
            });
          } catch {}
        } catch (e) {
          console.error('Erro ao persistir currentStep:', e);
        }
      })();
      return { ...prev, steps: updatedSteps, currentStep: newCurrent };
    });
  };

  const saveStepData = async (stepId: number, data: any) => {
    const next = { ...stepData, [stepId]: { ...(stepData[stepId] || {}), ...data } };
    setStepData(next);
    
    try {
      const res = await fetch(`/api/perda-nacionalidade?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepData: next })
      });
      if (res.ok) {
        setSaveMessages(prev => ({ ...prev, [stepId]: 'Salvo' }));
        setCaseData((prev) => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev);
      }
    } catch (e) {
      console.error('Erro ao salvar stepData:', e);
    }
  };

  const saveStepNotes = async (stepId: number) => {
    const text = (notes[stepId] || '').trim();
    if (!text) return;
    const iso = new Date().toISOString();
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const arr = parseNotesArray(perdaData?.notes);
    const assigned = assignments[stepId] || assignments[caseData?.currentStep || 0] || {};
    const assignedName = assigned.responsibleName || '';
    const suggestion = RESPONSAVEIS.find((r) => r.includes(assignedName || '')) || '';
    const role = suggestion ? suggestion.split(' – ')[0] : '';
    const next = [...arr, { id, stepId, content: text, timestamp: iso, authorName: assignedName || 'Equipe', authorRole: role }];
    
    try {
      const res = await fetch(`/api/perda-nacionalidade?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: JSON.stringify(next) })
      });
      if (res.ok) {
        setSaveMessages(prev => ({ ...prev, [stepId]: 'Salvo' }));
        setCaseData((prev) => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev);
        setPerdaData((prev: any) => ({ ...(prev || {}), notes: JSON.stringify(next) }));
        setNotes((prev) => ({ ...prev, [stepId]: '' }));
      }
    } catch (error) {
      console.error('Erro ao salvar notas da etapa:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      await fetch(`/api/perda-nacionalidade?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setCaseData((prev) => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev);
    } catch (e) {
      console.error('Erro ao atualizar status:', e);
    }
  };

  const handleFieldChange = async (field: string, value: string) => {
    setPerdaData((prev: any) => ({ ...(prev || {}), [field]: value }));
    if (field === 'clientName') {
      setCaseData((prev) => prev ? { ...prev, clientName: value } : prev);
    }
    try {
      await fetch(`/api/perda-nacionalidade?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      setCaseData((prev) => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev);
    } catch (e) {
      console.error('Erro ao atualizar campo:', e);
    }
  };

  const handleSaveAssignment = async (index: number, responsibleName?: string, dueDate?: string) => {
    try {
      const stepTitle = WORKFLOW_STEPS[index] || `Etapa ${index + 1}`;
      const res = await fetch(`/api/step-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleType: "perda_nacionalidade", recordId: params.id as string, stepIndex: index, responsibleName, dueDate, workflowName: stepTitle, clientName: caseData?.clientName || "Cliente" })
      });
      if (res.ok) {
        setAssignments(prev => ({ ...prev, [index]: { responsibleName, dueDate } }));
        setCaseData((prev) => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev);
        const dueBR = dueDate ? (() => { const [y, m, d] = dueDate.split("-"); return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`; })() : "—";
        const message = `Tarefa "${stepTitle}" atribuída a ${responsibleName || "—"} com prazo ${dueBR} para: ${caseData?.clientName || ""} - Perda de Nacionalidade`;
        try {
          await fetch(`/api/alerts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ moduleType: "PerdaNacionalidade", recordId: params.id as string, alertFor: "admin", message, isRead: false })
          });
        } catch {}
        return true;
      }
      return false;
    } catch (e) {
      console.error("Erro ao salvar assignment:", e);
      return false;
    }
  };

  const renderStepContent = (step: StepData) => {
    if (!caseData) return null;
    const stepId = step.id;
    const currentStepData = stepData[stepId] || {};

    const renderField = (label: string, fieldKey?: string, docKey?: string, hideReadView?: boolean) => (
      <div className="space-y-2">
        {isEditingDocuments ? (
          <Label htmlFor={`${(fieldKey || docKey || '').replace(/Doc$/, '')}-${stepId}`}>{label}</Label>
        ) : null}
        {fieldKey ? (
          isEditingDocuments ? (
            <Input
              id={`${fieldKey}-${stepId}`}
              value={String((perdaData || {})[fieldKey] || '')}
              onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
              placeholder={"Informação"}
            />
          ) : (
            hideReadView ? null : (
              <div className="text-xs leading-snug">
                <span className="font-medium">{label}:</span> {String((perdaData || {})[fieldKey] || '') || '-'}
              </div>
            )
          )
        ) : null}
        {docKey ? (
          isEditingDocuments ? (
            <div className="flex items-center gap-2">
              <input type="file" id={`${docKey}-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, docKey, stepId); }} />
              <Button variant="outline" size="sm" onClick={() => document.getElementById(`${docKey}-${stepId}`)?.click()} disabled={uploadingFiles[`${docKey}-${stepId}`]}>
                {uploadingFiles[`${docKey}-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload
              </Button>
            </div>
          ) : (
            <div className="text-xs leading-snug">
              <span className="font-medium">{label}:</span> {((documents || []) as any[]).some((d: any) => (d.field_name || d.fieldName) === docKey) ? 'Anexado' : '-'}
            </div>
          )
        ) : null}
        {docKey ? renderDocLinks(docKey) : null}
      </div>
    );

    // Etapa 0: Cadastro de Documento
    if (stepId === 0) {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-end">
            {isEditingDocuments ? (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => { setIsEditingDocuments(false); fetchCaseData(); }}>
                  <Save className="w-4 h-4" />
                  Salvar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingDocuments(false)}>
                  Cancelar
                </Button>
              </div>
            ) : null}
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-base">Informações do Cliente</h4>
              {!isEditingDocuments ? (
                <Button size="icon" variant="outline" className="h-7 w-7 p-0" onClick={() => setIsEditingDocuments(true)}>
                  <Edit className="w-4 h-4" />
                </Button>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
              {renderField('Nome do Cliente', 'clientName')}
              {renderField('Nome da Mãe', 'nomeMae')}
              {renderField('Nome do Pai', 'nomePaiRegistral')}
              {renderField('Nome da Criança', 'nomeCrianca')}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-base">Documentos dos Pais</h4>
              {!isEditingDocuments ? (
                <Button size="icon" variant="outline" className="h-7 w-7 p-0" onClick={() => setIsEditingDocuments(true)}>
                  <Edit className="w-4 h-4" />
                </Button>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
              {renderField('RNM da Mãe', 'rnmMae', 'rnmMaeDoc')}
              {renderField('CPF da Mãe', 'cpfMae', 'cpfMaeDoc')}
              {renderField('RNM do Pai', 'rnmPai', 'rnmPaiDoc')}
              {renderField('CPF do Pai', 'cpfPai', 'cpfPaiDoc')}
              {renderField('Passaportes', 'passaportes', 'passaporteDoc')}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-base">Outros Documentos</h4>
              {!isEditingDocuments ? (
                <Button size="icon" variant="outline" className="h-7 w-7 p-0" onClick={() => setIsEditingDocuments(true)}>
                  <Edit className="w-4 h-4" />
                </Button>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
              {renderField('Certidão de Nascimento', 'certidaoNascimento', 'certidaoNascimentoDoc')}
              {renderField('Comprovante de Endereço', 'comprovanteEndereco', 'comprovanteEnderecoDoc')}
              {renderField('Documento Chinês', 'documentoChines', 'documentoChinesDoc')}
              {renderField('Tradução Juramentada', 'traducaoJuramentada', 'traducaoJuramentadaDoc')}
            </div>
          </div>
        </div>
      );
    }

    // Etapa 1: Procuração e Pedido
    if (stepId === 1) {
      return (
        <div className="space-y-4">
           {[
             { key: 'procuracaoDoc', label: 'Procuração' },
             { key: 'pedidoPerdaDoc', label: 'Pedido de Perda de Nacionalidade' }
           ].map(({ key, label }) => (
             <div key={key} className="space-y-2">
               <Label>{label}</Label>
               <UploadDocBlock
                 inputId={`${key}-${stepId}`}
                 disabledKey={`${key}-${stepId}`}
                 onSelect={(f) => handleSpecificFileUpload(f, key, stepId)}
               />
               {renderDocLinks(key)}
             </div>
           ))}
           <div>
            <Label htmlFor={`observacoes-${stepId}`}>Observações</Label>
            <Textarea
              id={`observacoes-${stepId}`}
              value={notes[stepId] || ""}
              onChange={(e) => setNotes(prev => ({ ...prev, [stepId]: e.target.value }))}
              placeholder="Adicione observações para esta etapa..."
              rows={3}
            />
          </div>
          <Button onClick={() => saveStepNotes(stepId)} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Salvar Observações
          </Button>
        </div>
      );
    }

    // Etapa 2: Colher assinaturas
    if (stepId === 2) {
      return (
        <div className="space-y-4">
           <div className="space-y-2">
              <Label>Data da Coleta de Assinaturas</Label>
              <Input
                type="date"
                value={currentStepData.dataColetaAssinaturas || ""}
                onChange={(e) => saveStepData(stepId, { dataColetaAssinaturas: e.target.value })}
              />
           </div>
           {[
             { key: 'procuracaoAssinadaDoc', label: 'Procuração Assinada' },
             { key: 'pedidoAssinadoDoc', label: 'Pedido Assinado' }
           ].map(({ key, label }) => (
             <div key={key} className="space-y-2">
               <Label>{label}</Label>
               <UploadDocBlock
                 inputId={`${key}-${stepId}`}
                 disabledKey={`${key}-${stepId}`}
                 onSelect={(f) => handleSpecificFileUpload(f, key, stepId)}
               />
               {renderDocLinks(key)}
             </div>
           ))}
           <Button onClick={() => saveStepData(stepId, currentStepData)} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      );
    }

    // Etapa 3, 4, 8, 9: Protocolos e SEI
    if ([3, 4, 8, 9].includes(stepId)) {
      const isManifesto = stepId === 8 || stepId === 9;
      // Step 3: Protocolar no SEI
      // Step 4: Processo Protocolado (Waiting?)
      // Step 7: Manifesto (step index 7)
      // Step 8: Protocolar no SEI (step index 8)
      
      const docKey = stepId === 7 ? 'manifestoDoc' : (stepId === 8 ? 'protocoloManifestoDoc' : (stepId === 3 ? 'protocoloSeiDoc' : 'comprovanteProtocoladoDoc'));
      const label = stepId === 7 ? 'Manifesto' : (stepId === 8 ? 'Protocolo do Manifesto' : (stepId === 3 ? 'Protocolo no SEI' : 'Comprovante de Protocolo'));

      // If Step 7 (Manifesto)
      if (stepId === 7) {
          return (
            <div className="space-y-4">
               <div className="space-y-2">
                 <Label>Manifesto</Label>
                 <UploadDocBlock
                   inputId={`manifestoDoc-${stepId}`}
                   disabledKey={`manifestoDoc-${stepId}`}
                   onSelect={(f) => handleSpecificFileUpload(f, 'manifestoDoc', stepId)}
                 />
                 {renderDocLinks('manifestoDoc')}
               </div>
               <Button onClick={() => saveStepData(stepId, currentStepData)} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
          );
      }

      return (
        <div className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Número do Protocolo</Label>
                <Input
                  value={currentStepData.numeroProtocolo || ""}
                  onChange={(e) => saveStepData(stepId, { numeroProtocolo: e.target.value })}
                  placeholder="Número do protocolo"
                />
             </div>
             <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={currentStepData.dataProtocolo || ""}
                  onChange={(e) => saveStepData(stepId, { dataProtocolo: e.target.value })}
                />
             </div>
           </div>

           <div className="space-y-2">
             <Label>{label}</Label>
             <UploadDocBlock
               inputId={`${docKey}-${stepId}`}
               disabledKey={`${docKey}-${stepId}`}
               onSelect={(f) => handleSpecificFileUpload(f, docKey, stepId)}
             />
             {renderDocLinks(docKey)}
           </div>
           
           <Button onClick={() => saveStepData(stepId, currentStepData)} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      );
    }

    // Etapa 5 (Deferido), 6 (Passaporte Chinês), 9 (Ratificado)
    if ([5, 6, 9, 10].includes(stepId)) { 
       // 5: Processo Deferido
       // 6: Passaporte Chinês
       // 9: Processo Ratificado
       // 10: Processo Finalizado

       if (stepId === 6) { // Passaporte Chinês
          return (
             <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Número da Portaria</Label>
                  <Input
                    value={currentStepData.numeroPortaria || ""}
                    onChange={(e) => saveStepData(stepId, { numeroPortaria: e.target.value })}
                    placeholder="Número da portaria"
                  />
                </div>
                {[
                  { key: 'passaporteChinesDoc', label: 'Passaporte Chinês' },
                  { key: 'portariaDoc', label: 'Portaria' }
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <UploadDocBlock
                      inputId={`${key}-${stepId}`}
                      disabledKey={`${key}-${stepId}`}
                      onSelect={(f) => handleSpecificFileUpload(f, key, stepId)}
                    />
                    {renderDocLinks(key)}
                  </div>
                ))}
                <Button onClick={() => saveStepData(stepId, currentStepData)} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
             </div>
          );
       }

       if (stepId === 10) { // Finalizado
          return (
             <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Finalização</Label>
                    <Input
                      type="date"
                      value={currentStepData.dataFinalizacao || ""}
                      onChange={(e) => saveStepData(stepId, { dataFinalizacao: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status Final</Label>
                    <Select
                      value={currentStepData.statusFinal || ""}
                      onValueChange={(val) => saveStepData(stepId, { statusFinal: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Concluído">Concluído</SelectItem>
                        <SelectItem value="Arquivado">Arquivado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                   <Label>Observações Finais</Label>
                   <Textarea
                     value={currentStepData.observacoesFinais || ""}
                     onChange={(e) => saveStepData(stepId, { observacoesFinais: e.target.value })}
                     rows={4}
                   />
                </div>
                <Button onClick={() => saveStepData(stepId, currentStepData)} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Finalização
                </Button>
             </div>
          );
       }

       // 5 (Deferido) e 9 (Ratificado)
       return (
        <div className="space-y-4">
           <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={currentStepData.dataRegistro || ""}
                onChange={(e) => saveStepData(stepId, { dataRegistro: e.target.value })}
              />
           </div>
           <div className="space-y-2">
             <Label>Documento (DOU/Decisão)</Label>
             <UploadDocBlock
               inputId={`doc-${stepId}`}
               disabledKey={`doc-${stepId}`}
               onSelect={(f) => handleSpecificFileUpload(f, stepId === 5 ? 'douDoc' : 'douRatificacaoDoc', stepId)}
             />
             {renderDocLinks(stepId === 5 ? 'douDoc' : 'douRatificacaoDoc')}
           </div>
           <Button onClick={() => saveStepData(stepId, currentStepData)} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
       );
    }

    // Default Upload Block
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Upload de Documentos</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              id={`file-upload-${stepId}`}
              className="hidden"
              multiple
              onChange={(e) => handleFileUpload(e.target.files, stepId)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById(`file-upload-${stepId}`)?.click()}
              disabled={uploadingFiles[`step-${stepId}`]}
            >
              {uploadingFiles[`step-${stepId}`] ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Fazer Upload de Arquivos
            </Button>
          </div>
          {renderDocLinks('documentoAnexado')}
        </div>
        
        <div>
          <Label htmlFor={`observacoes-${stepId}`}>Observações</Label>
          <Textarea
            id={`observacoes-${stepId}`}
            value={notes[stepId] || ""}
            onChange={(e) => setNotes(prev => ({ ...prev, [stepId]: e.target.value }))}
            placeholder="Adicione observações para esta etapa..."
            rows={3}
          />
        </div>
        <Button onClick={() => saveStepNotes(stepId)} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Salvar Observações
        </Button>
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
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Caso não encontrado</h1>
          <p className="text-gray-600 mb-6">O caso solicitado não foi encontrado.</p>
          <Link href="/dashboard/perda-nacionalidade">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Perda de Nacionalidade
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleDeleteCase = async () => {
    try {
      await fetch(`/api/perda-nacionalidade?id=${params.id}`, { method: 'DELETE' });
      router.push('/dashboard/perda-nacionalidade');
    } catch (error) {
      console.error('Erro ao deletar caso:', error);
    }
  };

  const currentStepIndex = caseData.currentStep;

  return (
    <div className="w-full p-4 space-y-6 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/perda-nacionalidade">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{caseData.clientName}</h1>
            <p className="text-muted-foreground">Perda de Nacionalidade</p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex flex-col gap-8 lg:flex-[2] min-w-0">
          {showWorkflow && (
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
                            <div
                              className="h-12 w-12 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center z-10 cursor-pointer hover:scale-105 transition"
                              onClick={() => handleStepCompletion(step.id)}
                              role="button"
                              aria-label="Desfazer conclusão"
                              title="Desfazer conclusão"
                            >
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                          ) : isCurrent ? (
                            <div
                              className="h-12 w-12 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center z-10 shadow-md cursor-pointer hover:scale-105 transition"
                              onClick={() => handleStepCompletion(step.id)}
                              role="button"
                              aria-label="Marcar como concluído"
                              title="Marcar como concluído"
                            >
                              <div className="h-4 w-4 rounded-full bg-blue-500" />
                            </div>
                          ) : (
                            <div
                              className="h-12 w-12 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center z-10 cursor-pointer hover:scale-105 transition"
                              onClick={() => handleStepCompletion(step.id)}
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
                              <h3 className={`${isCurrent ? 'text-blue-600 font-bold' : 'font-semibold'} text-base`}>{step.title}</h3>
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
                          <Popover open={assignOpenStep === step.id} onOpenChange={(open) => setAssignOpenStep(open ? step.id : null)}>
                              <PopoverTrigger asChild>
                                <button className="text-xs text-gray-600 border border-gray-300 rounded px-3 py-1 bg-white">Definir Responsável</button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[420px] max-w-[95vw]">
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <Label>Responsável</Label>
                                    <Input
                                      value={assignResp}
                                      onChange={(e) => setAssignResp(e.target.value)}
                                      placeholder="Selecione ou digite o responsável"
                                    />
                                    <div className="rounded-md border mt-2 bg-white">
                                      {RESPONSAVEIS.map((r) => (
                                        <button
                                          key={r}
                                          type="button"
                                          className="w-full text-left px-2 py-1 text-sm hover:bg-slate-100"
                                          onClick={() => setAssignResp(r)}
                                        >
                                          {r}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <Label>Data limite</Label>
                                    <div className="rounded-md border p-2 overflow-hidden">
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
                                        captionLayout="label"
                                      />
                                    </div>
                                    <Input
                                      value={assignDue ? (() => { const p = assignDue.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; })() : ''}
                                      readOnly
                                      placeholder="Nenhuma data selecionada"
                                    />
                                  </div>
                                  <div className="flex items-center justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => { setAssignResp(''); setAssignDue(''); setAssignOpenStep(null); }}>Cancelar</Button>
                                    <Button size="sm" onClick={async () => {
                                      await handleSaveAssignment(index, assignResp || undefined, assignDue || undefined);
                                      setAssignOpenStep(null);
                                    }}>Salvar</Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                            <button
                              className="text-gray-500"
                              onClick={() => toggleStepExpansion(step.id)}
                              aria-label="Alternar conteúdo"
                            >
                              {expandedSteps[step.id] ? <ChevronRight className="w-5 h-5 rotate-90" /> : <ChevronRight className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                        {expandedSteps[step.id] ? (
                          <div className="mt-3">
                            {renderStepContent(step)}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <Card className="rounded-xl border-gray-200 shadow-sm">
            <CardHeader className="px-2.5">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2.5">
              <div className="grid grid-cols-1 gap-4">
                <div className={`border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center ${uploadingFiles['general'] ? 'opacity-50 pointer-events-none' : ''} hover:bg-gray-50`}
                     onDragOver={(e) => { e.preventDefault(); }}
                     onDrop={(e) => { e.preventDefault(); const files = Array.from(e.dataTransfer.files); handleFileUpload(files as any); }}>
                  <div className="p-3 bg-blue-50 rounded-full mb-3">
                    <Upload className="h-6 w-6 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Arraste e solte arquivos aqui para anexar</p>
                  <p className="text-xs text-gray-500 mt-1">Ou use os botões de envio nas etapas acima</p>
                </div>

                {(documents as any[]).length > 0 ? (
                  <div className={documentGridClassName}>
                    {(documents as any[]).map((doc: any) => {
                      const displayName = doc.document_name || doc.file_name || doc.name || "Documento";
                      return (
                        <div key={String(doc.id)} className="min-w-0 flex flex-col items-center">
                          <div className={documentTileClassName}>
                            <a
                              href={doc.file_path || doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={displayName}
                              className={documentLinkClassName}
                            >
                              <FileText className={`${documentIconClassName} text-blue-600`} />
                            </a>
                            <button
                              type="button"
                              aria-label="Excluir"
                              title="Excluir"
                              className={documentDeleteButtonClassName}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteDocument(doc as any);
                              }}
                            >
                              <X className="h-3 w-3 text-gray-600" />
                            </button>
                          </div>
                          <div className={documentNameClassName} title={displayName}>
                            {displayName}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum documento anexado ainda</p>
                    <p className="text-xs mt-1">Arraste arquivos para esta área ou use os botões de upload nas etapas</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-8 lg:flex-[1] min-w-0">
          <StatusPanel
            status={status}
            onStatusChange={handleStatusChange}
            currentStep={currentStepIndex + 1}
            totalSteps={caseData.steps.length}
            currentStepTitle={caseData.steps[currentStepIndex]?.title || "Finalizado"}
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
              <Textarea rows={6} placeholder="Adicione observações..." value={notes[0] || ''} onChange={(e) => setNotes(prev => ({ ...prev, 0: e.target.value }))} className="flex-1 border-none bg-slate-50 resize-none mb-2" />
              <div className="flex justify-end">
                  <Button size="sm" className="bg-slate-900" onClick={() => saveStepNotes(0)}>Salvar Nota</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Notas */}
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
              {notesArray.length ? notesArray.map((n) => {
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

      {/* Edit Document Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear documento</DialogTitle>
            <DialogDescription>
              Digite o novo nome para o documento.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-document-name">Nome do documento</Label>
            <Input
              id="new-document-name"
              value={newDocumentName}
              onChange={(e) => setNewDocumentName(e.target.value)}
              placeholder="Digite o novo nome"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmRenameDocument}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
