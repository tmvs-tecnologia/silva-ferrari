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
  Globe, 
  Edit, 
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
  Mail
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
import { DetailLayout } from "@/components/detail/DetailLayout";
import { StatusPanel } from "@/components/detail/StatusPanel";
import { formatDateBR } from "@/lib/date";
import { subscribeTable, unsubscribe } from "@/lib/realtime";

// Definindo os workflows para Vistos
const WORKFLOWS = {
  "Visto de Trabalho": [
    "Cadastro de Documentos",
    "Agendar no Consulado",
    "Preencher Formulário",
    "Preparar Documentação",
    "Aguardar Aprovação",
    "Processo Finalizado"
  ],
  "Visto de Turismo": [
    "Cadastro de Documentos",
    "Agendar no Consulado",
    "Preencher Formulário",
    "Preparar Documentação",
    "Aguardar Aprovação",
    "Processo Finalizado"
  ],
  "Visto de Estudante": [
    "Cadastro de Documentos",
    "Agendar no Consulado",
    "Preencher Formulário",
    "Preparar Documentação",
    "Aguardar Aprovação",
    "Processo Finalizado"
  ],
  "Visto de Reunião Familiar": [
    "Cadastro de Documentos",
    "Agendar no Consulado",
    "Preencher Formulário",
    "Preparar Documentação",
    "Aguardar Aprovação",
    "Processo Finalizado"
  ]
} as const;

type VistoType = keyof typeof WORKFLOWS;

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

export default function VistoDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<{ [key: number]: string }>({});
  const [status, setStatus] = useState("");
  const [visto, setVisto] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<{ documentosPessoais: boolean; comprovacaoFinanceira: boolean; outrosDocumentos: boolean }>({ documentosPessoais: true, comprovacaoFinanceira: true, outrosDocumentos: true });
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };
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
  const parseNotesArray = (notesStr?: string) => {
    try {
      const v = (notesStr || '').trim();
      if (!v) return [] as Array<{ id: string; stepId?: number; content: string; timestamp: string }>;
      const arr = JSON.parse(v);
      if (Array.isArray(arr)) return arr as any;
      return [] as any;
    } catch { return [] as any; }
  };
  const notesArray = parseNotesArray(visto?.notes);
  const deleteNote = async (noteId: string) => {
    const next = (notesArray || []).filter((n) => n.id !== noteId);
    try {
      await fetch(`/api/vistos?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: JSON.stringify(next) })
      });
      setVisto((prev: any) => ({ ...(prev || {}), notes: JSON.stringify(next) }));
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
          const res = await fetch(`/api/step-assignments?moduleType=vistos&recordId=${params.id}`);
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
      const chVistos = subscribeTable({
        channelName: `rt-vistos-${idNum}`,
        table: 'vistos',
        events: ['update'],
        filter: `id=eq.${idNum}`,
        onChange: (payload) => {
          const next = payload?.new;
          if (next && next.id === idNum) {
            setVisto((prev: any) => ({ ...(prev || {}), ...next }));
            setCaseData((prev) => prev ? { ...prev, ...(next || {}) } : prev);
          }
        }
      });
      const chDocsInsert = subscribeTable({
        channelName: `rt-docs-insert-${idNum}`,
        table: 'documents',
        events: ['insert'],
        filter: `record_id=eq.${idNum}`,
        onChange: () => { fetchDocuments(); }
      });
      const chDocsDelete = subscribeTable({
        channelName: `rt-docs-delete-${idNum}`,
        table: 'documents',
        events: ['delete'],
        filter: `record_id=eq.${idNum}`,
        onChange: () => { fetchDocuments(); }
      });

      return () => {
        unsubscribe(chVistos);
        unsubscribe(chDocsInsert);
        unsubscribe(chDocsDelete);
      };
    }
  }, [params.id]);

  const fetchCaseData = async () => {
    try {
      const res = await fetch(`/api/vistos?id=${params.id}`);
      if (res.ok) {
        const record = await res.json();
        setVisto(record);
        const rawTypeStr = String(record.type || "");
        const lowerType = rawTypeStr.toLowerCase();
        let flowType: VistoType = "Visto de Trabalho";
        if (lowerType.includes("turismo")) flowType = "Visto de Turismo";
        else if (lowerType.includes("estudante")) flowType = "Visto de Estudante";
        else if (lowerType.includes("reuni") && lowerType.includes("familiar")) flowType = "Visto de Reunião Familiar";
        const steps: StepData[] = (WORKFLOWS[flowType] || WORKFLOWS["Visto de Trabalho"]).map((title: string, index: number) => ({
          id: index,
          title,
          description: `Descrição da etapa ${title}`,
          completed: false,
          notes: "",
        }));
        const recordCurrentStep = Number(record.currentStep ?? 0);
        const initialCurrentStep = recordCurrentStep < 1 ? 1 : recordCurrentStep;
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
        let contiguousIndex = 0;
        while (contiguousIndex < steps.length && steps[contiguousIndex].completed) contiguousIndex++;
        const data: CaseData = {
          id: String(record.id),
          title: `Visto ${record.id}`,
          type: flowType,
          status: record.status || "Em Andamento",
          createdAt: record.createdAt || record.created_at,
          updatedAt: record.updatedAt || record.updated_at,
          clientName: record.clientName || record.client_name,
          description: `Processo de ${flowType}`,
          steps,
          // usar currentStep para refletir etapa atual (0-based para Vistos)
          // garante que "Cadastro de Documentos" (0) fica concluída por padrão
          // ao abrir os detalhes quando o caso é novo
          // nota: o componente StatusPanel já adiciona +1 para exibição
          currentStep: contiguousIndex,
        };
        setCaseData(data);
        setStatus(data.status);
        if (recordCurrentStep < 1) {
          try {
            await fetch(`/api/vistos?id=${params.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ currentStep: 1 })
            });
          } catch {}
        }
        // Parse aggregated notes into step map if present
        const initialNotes: { [key: number]: string } = {};
        if (record.notes) {
          const text = String(record.notes);
          (steps || []).forEach((s) => {
            const header = `[${s.title}]`;
            const idx = text.indexOf(header);
            if (idx >= 0) {
              const nextIdx = text.indexOf("[", idx + header.length);
              const block = text.substring(idx + header.length).slice(0, nextIdx > idx ? nextIdx - (idx + header.length) : undefined).trim();
              initialNotes[s.id] = block;
            }
          });
        }
        setNotes(initialNotes);
      }
    } catch (error) {
      console.error("Erro ao buscar dados do caso:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/documents/${params.id}?moduleType=vistos`);
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
      for (const file of arr) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('caseId', String(params.id));
        fd.append('moduleType', 'vistos');
        fd.append('fieldName', 'documentoAnexado');
        fd.append('clientName', caseData?.clientName || 'Cliente');
        const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
        if (res.ok) {
          const payload = await res.json();
          const newDoc = payload?.document;
          if (newDoc) {
            setDocuments(prev => [newDoc, ...prev]);
          }
        }
      }
      await fetchDocuments();
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
    } finally {
      setUploadingFiles(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleSpecificFileUpload = async (file: File, fieldKey: string, stepId: number) => {
    const uploadKey = `${fieldKey}-${stepId}`;
    setUploadingFiles(prev => ({ ...prev, [uploadKey]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('caseId', String(params.id));
      fd.append('moduleType', 'vistos');
      fd.append('fieldName', fieldKey);
      fd.append('clientName', caseData?.clientName || 'Cliente');
      const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const payload = await res.json();
        const newDoc = payload?.document;
        if (newDoc) {
          setDocuments(prev => [newDoc, ...prev]);
        }
        await fetchDocuments();
        setFileUploads(prev => ({ ...prev, [uploadKey]: null }));
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
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
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteDocument(doc as any); }}
            >
              <X className="h-3 w-3 text-gray-600" />
            </button>
          </div>
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
          // Desfazer conclusão a partir desta etapa: manter prefixo concluído
          if (step.id >= stepId) {
            return { ...step, completed: false, completedAt: undefined };
          }
          return step;
        } else {
          // Concluir etapa e todas anteriores para garantir continuidade
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
          await fetch(`/api/vistos?id=${params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentStep: newCurrent, completedSteps: completedStepsArr })
          });
          setCaseData((prev2) => prev2 ? { ...prev2, updatedAt: new Date().toISOString() } : prev2);
          try {
            await fetch(`/api/step-assignments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ moduleType: 'vistos', recordId: params.id as string, currentIndex: newCurrent })
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
    // persistir todo o stepData após merge para manter alterações após recarga
    try {
      const res = await fetch(`/api/vistos?id=${params.id}`, {
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
    const typeKey = (caseData?.type || 'Visto de Trabalho') as VistoType;
    const stepTitle = (WORKFLOWS[typeKey] || [])[stepId] || `Etapa ${stepId + 1}`;
    const entries = Object.entries(data || {})
      .filter(([_, v]) => typeof v === 'string' && v.trim() !== '')
      .map(([k, v]) => `- ${k}: ${v}`);
    if (entries.length) {
      const block = `\n[${stepTitle}]\n${entries.join('\n')}\n`;
      try {
        await fetch(`/api/vistos?id=${params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: `${block}` })
        });
        setCaseData((prev) => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev);
      } catch (e) {
        console.error('Erro ao persistir dados da etapa:', e);
      }
    }
    // Persistir campos de statusFinal no registro para uso em listas
    try {
      const payload: any = {};
      if (Object.prototype.hasOwnProperty.call(data, 'statusFinal')) payload.statusFinal = data.statusFinal;
      if (Object.prototype.hasOwnProperty.call(data, 'statusFinalOutro')) payload.statusFinalOutro = data.statusFinalOutro;
      if (Object.keys(payload).length) {
        await fetch(`/api/vistos?id=${params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        setCaseData((prev) => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev);
      }
    } catch (e) {
      console.error('Erro ao atualizar statusFinal do registro:', e);
    }
  };

  const saveStepNotes = async (stepId: number) => {
    const text = (notes[stepId] || '').trim();
    if (!text) return;
    const iso = new Date().toISOString();
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const arr = parseNotesArray(visto?.notes);
    const assigned = assignments[stepId] || assignments[currentStepIndex] || {};
    const assignedName = assigned.responsibleName || '';
    const suggestion = RESPONSAVEIS.find((r) => r.includes(assignedName || '')) || '';
    const role = suggestion ? suggestion.split(' – ')[0] : '';
    const next = [...arr, { id, stepId, content: text, timestamp: iso, authorName: assignedName || 'Equipe', authorRole: role }];
    try {
      const res = await fetch(`/api/vistos?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: JSON.stringify(next) })
      });
      if (res.ok) {
        setSaveMessages(prev => ({ ...prev, [stepId]: 'Salvo' }));
        setCaseData((prev) => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev);
        setVisto((prev: any) => ({ ...(prev || {}), notes: JSON.stringify(next) }));
        setNotes((prev) => ({ ...prev, [stepId]: '' }));
        console.log('Nota salva', { id, stepId, authorName: assignedName || 'Equipe', timestamp: iso });
      }
    } catch (error) {
      console.error('Erro ao salvar notas da etapa:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      await fetch(`/api/vistos?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setCaseData((prev) => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev);
    } catch (e) {
      console.error('Erro ao atualizar status:', e);
    }
  };

  const handleVistoFieldChange = async (field: string, value: string) => {
    setVisto((prev: any) => ({ ...(prev || {}), [field]: value }));
    if (field === 'clientName') {
      setCaseData((prev) => prev ? { ...prev, clientName: value } : prev);
    }
    try {
      await fetch(`/api/vistos?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      setCaseData((prev) => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev);
    } catch (e) {
      console.error('Erro ao atualizar campo do visto:', e);
    }
  };

  const handleSaveAssignment = async (index: number, responsibleName?: string, dueDate?: string) => {
    try {
      const typeKey = (caseData?.type || "Visto de Trabalho") as VistoType;
      const stepTitle = (caseData?.steps?.[index]?.title) || ((WORKFLOWS[typeKey] || [])[index]) || `Etapa ${index + 1}`;
      const res = await fetch(`/api/step-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleType: "vistos", recordId: params.id as string, stepIndex: index, responsibleName, dueDate, workflowName: stepTitle, clientName: caseData?.clientName || "Cliente" })
      });
      if (res.ok) {
        setAssignments(prev => ({ ...prev, [index]: { responsibleName, dueDate } }));
        setCaseData((prev) => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev);
        const dueBR = dueDate ? (() => { const [y, m, d] = dueDate.split("-"); return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`; })() : "—";
        const message = `Tarefa "${stepTitle}" atribuída a ${responsibleName || "—"} com prazo ${dueBR} para: ${caseData?.clientName || ""} - ${caseData?.type || ""}`;
        try {
          await fetch(`/api/alerts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ moduleType: "Vistos", recordId: params.id as string, alertFor: "admin", message, isRead: false })
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

  const renderStepContent = (step: StepData) => {
    if (!caseData) return null;

    if (step.id === 0 || step.title?.toLowerCase().includes('cadastro')) {
      switch (caseData.type) {
        case "Visto de Trabalho":
          return renderVistoTrabalhoStepContent(step);
        case "Visto de Turismo":
          return renderVistoTurismoStepContent(step);
        case "Visto de Estudante":
          return renderVistoEstudanteStepContent(step);
        case "Visto de Reunião Familiar":
          return renderVistoReuniaoFamiliarStepContent(step);
        default:
          return renderDefaultStepContent(step);
      }
    }

    switch (caseData.type) {
      case "Visto de Trabalho":
        return renderVistoTrabalhoStepContent(step);
      case "Visto de Turismo":
        return renderVistoTurismoStepContent(step);
      case "Visto de Estudante":
        return renderVistoEstudanteStepContent(step);
      case "Visto de Reunião Familiar":
        return renderVistoReuniaoFamiliarStepContent(step);
      default:
        return renderDefaultStepContent(step);
    }
  };

  const renderVistoTrabalhoStepContent = (step: StepData) => {
    const stepId = step.id;
    const currentStepData = stepData[stepId] || {};

  switch (stepId) {
      case 0: // Cadastro de Documentos
        const renderField = (label: string, fieldKey?: string, docKey?: string, hideReadView?: boolean) => (
          <div className="space-y-2">
            {isEditingDocuments ? (
              <Label htmlFor={`${(fieldKey || docKey || '').replace(/Doc$/, '')}-${stepId}`}>{label}</Label>
            ) : null}
            {fieldKey ? (
              isEditingDocuments ? (
                <Input
                  id={`${fieldKey}-${stepId}`}
                  value={String((visto || {})[fieldKey] || '')}
                  onChange={(e) => handleVistoFieldChange(fieldKey, e.target.value)}
                  placeholder={"Status ou informações do documento"}
                />
              ) : (
                hideReadView ? null : (
                  <div className="text-xs leading-snug">
                    <span className="font-medium">{label}:</span> {String((visto || {})[fieldKey] || '') || '-'}
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
        const rawTypeStr = String(visto?.type || caseData?.type || '');
        const t = rawTypeStr.toLowerCase();
        const countryStr = String(visto?.country || (caseData as any)?.country || '').toLowerCase();
        const showBrasil = (
          (t.includes('trabalho') && (t.includes('brasil') || countryStr.includes('brasil'))) ||
          Boolean(
            (visto?.certidaoNascimento && String(visto.certidaoNascimento).trim()) ||
            (visto?.declaracaoCompreensao && String(visto.declaracaoCompreensao).trim()) ||
            (visto?.declaracoesEmpresa && String(visto.declaracoesEmpresa).trim()) ||
            (visto?.procuracaoEmpresa && String(visto.procuracaoEmpresa).trim()) ||
            (visto?.formularioRn01 && String(visto.formularioRn01).trim()) ||
            (visto?.guiaPaga && String(visto.guiaPaga).trim()) ||
            (visto?.publicacaoDou && String(visto.publicacaoDou).trim())
          )
        );
        const showResidenciaPrevia = t.includes('trabalho') && (t.includes('resid') || t.includes('prévia') || t.includes('previ'));
        const showInvestidor = t.includes('invest');
        const showTrabalhistas = t.includes('trabalhistas');
        const showFormacao = t.includes('forma');
        const showRenovacao = t.includes('renov') || t.includes('1 ano');
        const showIndeterminado = t.includes('indeterminado');
        const showMudancaEmpregador = t.includes('mudan') && t.includes('empregador');
        const isTurismo = t.includes('turismo');

        return (
          <div className="space-y-3">
            <div className="flex items-center justify-end">
              {isEditingDocuments ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => { saveStepData(stepId, currentStepData); setIsEditingDocuments(false); fetchCaseData(); }}>
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
                <h4 className="font-semibold text-base">Dados do Cliente</h4>
                {!isEditingDocuments ? (
                  <Button size="icon" variant="outline" className="h-7 w-7 p-0" onClick={() => setIsEditingDocuments(true)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
                <div className="space-y-2">
                  {isEditingDocuments ? (<Label htmlFor={`clientName-${stepId}`}>Nome do Cliente</Label>) : null}
                  {isEditingDocuments ? (
                    <Input
                      id={`clientName-${stepId}`}
                      value={String(visto?.clientName || caseData?.clientName || (visto as any)?.client_name || '')}
                      onChange={(e) => handleVistoFieldChange('clientName', e.target.value)}
                      placeholder="Nome completo"
                    />
                  ) : (
                    <div className="text-xs"><span className="font-medium">Nome do Cliente:</span> {String(caseData?.clientName || visto?.clientName || (visto as any)?.client_name || '-')}</div>
                  )}
                </div>

                <div className="space-y-2">
                  {isEditingDocuments ? (<Label htmlFor={`type-${stepId}`}>Tipo do Visto</Label>) : null}
                  {isEditingDocuments ? (
                    <Select
                      value={String(visto?.type || caseData?.type || '')}
                      onValueChange={(val) => handleVistoFieldChange('type', val)}
                    >
                      <SelectTrigger id={`type-${stepId}`} className="h-9 w-full border-2 focus:border-cyan-500">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Visto de Trabalho">Visto de Trabalho</SelectItem>
                        <SelectItem value="Visto de Turismo">Visto de Turismo</SelectItem>
                        <SelectItem value="Visto de Estudante">Visto de Estudante</SelectItem>
                        <SelectItem value="Visto de Reunião Familiar">Visto de Reunião Familiar</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-xs"><span className="font-medium">Tipo do Visto:</span> {String(visto?.type || caseData?.type || '-')}</div>
                  )}
                </div>

                <div className="space-y-2">
                  {isEditingDocuments ? (<Label htmlFor={`statusFinal-${stepId}`}>Status Final</Label>) : null}
                  {isEditingDocuments ? (
                    <Select
                      value={String((visto as any)?.statusFinal || '')}
                      onValueChange={(val) => handleVistoFieldChange('statusFinal', val)}
                    >
                      <SelectTrigger id={`statusFinal-${stepId}`} className="h-9 w-full border-2 focus:border-cyan-500">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    <SelectContent>
                      {String((visto?.type || caseData?.type || '')).toLowerCase().includes('turismo') ? (
                        <>
                          <SelectItem value="Aprovado">Aprovado</SelectItem>
                          <SelectItem value="Negado">Negado</SelectItem>
                          <SelectItem value="Aguardando">Aguardando</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="Deferido">Deferido</SelectItem>
                          <SelectItem value="Indeferido">Indeferido</SelectItem>
                          {t.includes('trabalho') && t.includes('brasil') ? (
                            <SelectItem value="Aguardando">Aguardando</SelectItem>
                          ) : null}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  ) : (
                    <div className="text-xs"><span className="font-medium">Status Final:</span> {String((visto as any)?.statusFinal || '-')}</div>
                  )}
                </div>

                {!showBrasil ? (
                  <div className="space-y-2">
                    {isEditingDocuments ? (<Label htmlFor={`travelStartDate-${stepId}`}>Data Inicial da Viagem</Label>) : null}
                    {isEditingDocuments ? (
                      <Input
                        id={`travelStartDate-${stepId}`}
                        type="date"
                        value={String((visto as any)?.travelStartDate || '')}
                        onChange={(e) => handleVistoFieldChange('travelStartDate', e.target.value)}
                      />
                    ) : (
                      <div className="text-xs"><span className="font-medium">Data Inicial da Viagem:</span> {formatDateBR((visto as any)?.travelStartDate)}</div>
                    )}
                  </div>
                ) : null}

                {!showBrasil ? (
                  <div className="space-y-2">
                    {isEditingDocuments ? (<Label htmlFor={`travelEndDate-${stepId}`}>Data Final da Viagem</Label>) : null}
                    {isEditingDocuments ? (
                      <Input
                        id={`travelEndDate-${stepId}`}
                        type="date"
                        value={String((visto as any)?.travelEndDate || '')}
                        onChange={(e) => handleVistoFieldChange('travelEndDate', e.target.value)}
                      />
                    ) : (
                      <div className="text-xs"><span className="font-medium">Data Final da Viagem:</span> {formatDateBR((visto as any)?.travelEndDate)}</div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
            {!showBrasil ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-base">Documentos Pessoais</h4>
                  {!isEditingDocuments ? (
                    <Button size="icon" variant="outline" className="h-7 w-7 p-0" onClick={() => setIsEditingDocuments(true)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
                  <div className="space-y-2">
                    {isEditingDocuments ? (<Label htmlFor={`country-${stepId}`}>País do Visto</Label>) : null}
                    {isEditingDocuments ? (
                      <Select
                        value={String(visto?.country || "")}
                        onValueChange={(val) => handleVistoFieldChange('country', val)}
                      >
                        <SelectTrigger id={`country-${stepId}`} className="h-9 w-full border-2 focus:border-cyan-500">
                          <SelectValue placeholder="Selecione o país" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Brasil">Brasil</SelectItem>
                          <SelectItem value="China">China</SelectItem>
                          <SelectItem value="Estados Unidos">Estados Unidos</SelectItem>
                          <SelectItem value="Canadá">Canadá</SelectItem>
                          <SelectItem value="Reino Unido">Reino Unido</SelectItem>
                          <SelectItem value="Portugal">Portugal</SelectItem>
                          <SelectItem value="França">França</SelectItem>
                          <SelectItem value="Alemanha">Alemanha</SelectItem>
                          <SelectItem value="Itália">Itália</SelectItem>
                          <SelectItem value="Espanha">Espanha</SelectItem>
                          <SelectItem value="Austrália">Austrália</SelectItem>
                          <SelectItem value="Japão">Japão</SelectItem>
                          <SelectItem value="Irlanda">Irlanda</SelectItem>
                          <SelectItem value="Holanda">Holanda</SelectItem>
                          <SelectItem value="Suíça">Suíça</SelectItem>
                          <SelectItem value="Suécia">Suécia</SelectItem>
                          <SelectItem value="Noruega">Noruega</SelectItem>
                          <SelectItem value="Dinamarca">Dinamarca</SelectItem>
                          <SelectItem value="Bélgica">Bélgica</SelectItem>
                          <SelectItem value="Áustria">Áustria</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-xs"><span className="font-medium">País do Visto:</span> {String(visto?.country || '') || '-'}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {isEditingDocuments ? (<Label htmlFor={`cpf-${stepId}`}>CPF</Label>) : null}
                    {isEditingDocuments ? (
                      <Input
                        id={`cpf-${stepId}`}
                        value={visto?.cpf || ""}
                        onChange={(e) => handleVistoFieldChange('cpf', e.target.value)}
                        placeholder="000.000.000-00"
                      />
                    ) : (
                      <div className="text-xs"><span className="font-medium">CPF:</span> {String(visto?.cpf || '') || '-'}</div>
                    )}
                    {isEditingDocuments ? (
                      <div className="flex items-center gap-2">
                        <input type="file" id={`cpfDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'cpfDoc', stepId); }} />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById(`cpfDoc-${stepId}`)?.click()} disabled={uploadingFiles[`cpfDoc-${stepId}`]}>
                          {uploadingFiles[`cpfDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                          Upload CPF
                        </Button>
                      </div>
                    ) : null}
                    {renderDocLinks('cpfDoc')}
                  </div>
                  <div className="space-y-2">
                    {isEditingDocuments ? (<Label htmlFor={`rnm-${stepId}`}>RNM</Label>) : null}
                    {isEditingDocuments ? (
                      <Input id={`rnm-${stepId}`} value={visto?.rnm || ""} onChange={(e) => handleVistoFieldChange('rnm', e.target.value)} placeholder="Número RNM" />
                    ) : (
                      <div className="text-xs"><span className="font-medium">RNM:</span> {String(visto?.rnm || '') || '-'}</div>
                    )}
                    {isEditingDocuments ? (
                      <div className="flex items-center gap-2">
                        <input type="file" id={`rnmDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'rnmDoc', stepId); }} />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById(`rnmDoc-${stepId}`)?.click()} disabled={uploadingFiles[`rnmDoc-${stepId}`]}>
                          {uploadingFiles[`rnmDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                          Upload RNM
                        </Button>
                      </div>
                    ) : null}
                    {renderDocLinks('rnmDoc')}
                  </div>
                  <div className="space-y-2">
                    {isEditingDocuments ? (<Label htmlFor={`passaporte-${stepId}`}>Passaporte</Label>) : null}
                    {isEditingDocuments ? (
                      <Input id={`passaporte-${stepId}`} value={visto?.passaporte || ""} onChange={(e) => handleVistoFieldChange('passaporte', e.target.value)} placeholder="Número do passaporte" />
                    ) : (
                      <div className="text-xs"><span className="font-medium">Passaporte:</span> {String(visto?.passaporte || '') || '-'}</div>
                    )}
                    {isEditingDocuments ? (
                      <div className="flex items-center gap-2">
                        <input type="file" id={`passaporteDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'passaporteDoc', stepId); }} />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById(`passaporteDoc-${stepId}`)?.click()} disabled={uploadingFiles[`passaporteDoc-${stepId}`]}>
                          {uploadingFiles[`passaporteDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                          Upload Passaporte
                        </Button>
                      </div>
                    ) : null}
                    {renderDocLinks('passaporteDoc')}
                  </div>
                  <div className="space-y-2">
                    {isEditingDocuments ? (<Label htmlFor={`comprovanteEndereco-${stepId}`}>Comprovante de Endereço</Label>) : null}
                    {isEditingDocuments ? (
                      <Input id={`comprovanteEndereco-${stepId}`} value={visto?.comprovanteEndereco || ""} onChange={(e) => handleVistoFieldChange('comprovanteEndereco', e.target.value)} placeholder="Informe endereço / declaração" />
                    ) : (
                      <div className="text-xs"><span className="font-medium">Comprovante de Endereço:</span> {String(visto?.comprovanteEndereco || '') || '-'}</div>
                    )}
                    {isEditingDocuments ? (
                      <div className="flex items-center gap-2">
                        <input type="file" id={`comprovanteEnderecoDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'comprovanteEnderecoDoc', stepId); }} />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById(`comprovanteEnderecoDoc-${stepId}`)?.click()} disabled={uploadingFiles[`comprovanteEnderecoDoc-${stepId}`]}>
                          {uploadingFiles[`comprovanteEnderecoDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                          Upload Endereço
                        </Button>
                      </div>
                    ) : null}
                    {renderDocLinks('comprovanteEnderecoDoc')}
                    {isEditingDocuments ? (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <input type="file" id={`declaracaoResidenciaDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'declaracaoResidenciaDoc', stepId); }} />
                          <Button variant="outline" size="sm" onClick={() => document.getElementById(`declaracaoResidenciaDoc-${stepId}`)?.click()} disabled={uploadingFiles[`declaracaoResidenciaDoc-${stepId}`]}>
                            {uploadingFiles[`declaracaoResidenciaDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                            Upload Declaração
                          </Button>
                        </div>
                        {renderDocLinks('declaracaoResidenciaDoc')}
                      </div>
                    ) : null}
                  </div>
                  {renderField('Foto digital 3x4', undefined, 'foto3x4Doc')}
                  <div className="space-y-2">
                    {isEditingDocuments ? (<Label htmlFor={`documentoChines-${stepId}`}>Documento Chinês (quando aplicável)</Label>) : null}
                    {isEditingDocuments ? (
                      <Input id={`documentoChines-${stepId}`} value={visto?.documentoChines || ""} onChange={(e) => handleVistoFieldChange('documentoChines', e.target.value)} placeholder="Descrição do documento" />
                    ) : (
                      <div className="text-xs"><span className="font-medium">Documento Chinês (quando aplicável):</span> {String(visto?.documentoChines || '') || '-'}</div>
                    )}
                    {isEditingDocuments ? (
                      <div className="flex items-center gap-2">
                        <input type="file" id={`documentoChinesDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'documentoChinesDoc', stepId); }} />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById(`documentoChinesDoc-${stepId}`)?.click()} disabled={uploadingFiles[`documentoChinesDoc-${stepId}`]}>
                          {uploadingFiles[`documentoChinesDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                          Upload Documento Chinês
                        </Button>
                      </div>
                    ) : null}
                    {renderDocLinks('documentoChinesDoc')}
                  </div>
                  {!showBrasil ? (
                    <div className="space-y-2">
                      {isEditingDocuments ? (<Label htmlFor={`antecedentesCriminais-${stepId}`}>Antecedentes Criminais</Label>) : null}
                      {isEditingDocuments ? (
                        <Input id={`antecedentesCriminais-${stepId}`} value={visto?.antecedentesCriminais || ""} onChange={(e) => handleVistoFieldChange('antecedentesCriminais', e.target.value)} placeholder="Número/Status" />
                      ) : (
                        <div className="text-xs"><span className="font-medium">Antecedentes Criminais:</span> {String(visto?.antecedentesCriminais || '') || '-'}</div>
                      )}
                      {isEditingDocuments ? (
                        <div className="flex items-center gap-2">
                          <input type="file" id={`antecedentesCriminaisDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'antecedentesCriminaisDoc', stepId); }} />
                          <Button variant="outline" size="sm" onClick={() => document.getElementById(`antecedentesCriminaisDoc-${stepId}`)?.click()} disabled={uploadingFiles[`antecedentesCriminaisDoc-${stepId}`]}>
                            {uploadingFiles[`antecedentesCriminaisDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                            Upload Antecedentes
                          </Button>
                        </div>
                      ) : null}
                      {renderDocLinks('antecedentesCriminaisDoc')}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {!showBrasil ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-base">Comprovação Financeira PF</h4>
                  {!isEditingDocuments ? (
                    <Button size="icon" variant="outline" className="h-7 w-7 p-0" onClick={() => setIsEditingDocuments(true)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
                  <div className="space-y-2">
                    {isEditingDocuments ? (<Label htmlFor={`certidaoNascimentoFilhos-${stepId}`}>Filhos (Certidão de Nascimento)</Label>) : null}
                    {isEditingDocuments ? (
                      <Input id={`certidaoNascimentoFilhos-${stepId}`} value={visto?.certidaoNascimentoFilhos || ""} onChange={(e) => handleVistoFieldChange('certidaoNascimentoFilhos', e.target.value)} placeholder="Informações" />
                    ) : (
                      <div className="text-xs"><span className="font-medium">Filhos (Certidão de Nascimento):</span> {String(visto?.certidaoNascimentoFilhos || '') || '-'}</div>
                    )}
                    {isEditingDocuments ? (
                      <div className="flex items-center gap-2">
                        <input type="file" id={`certidaoNascimentoFilhosDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'certidaoNascimentoFilhosDoc', stepId); }} />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById(`certidaoNascimentoFilhosDoc-${stepId}`)?.click()} disabled={uploadingFiles[`certidaoNascimentoFilhosDoc-${stepId}`]}>
                          {uploadingFiles[`certidaoNascimentoFilhosDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                          Upload Certidão
                        </Button>
                      </div>
                    ) : null}
                    {renderDocLinks('certidaoNascimentoFilhosDoc')}
                  </div>
                  <div className="space-y-2">
                    {isEditingDocuments ? (<Label htmlFor={`cartaoCnpj-${stepId}`}>Empresa: Cartão CNPJ</Label>) : null}
                    {isEditingDocuments ? (
                      <Input id={`cartaoCnpj-${stepId}`} value={visto?.cartaoCnpj || ""} onChange={(e) => handleVistoFieldChange('cartaoCnpj', e.target.value)} placeholder="CNPJ" />
                    ) : (
                      <div className="text-xs"><span className="font-medium">Empresa: Cartão CNPJ:</span> {String(visto?.cartaoCnpj || '') || '-'}</div>
                    )}
                    {isEditingDocuments ? (
                      <div className="flex items-center gap-2">
                        <input type="file" id={`cartaoCnpjDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'cartaoCnpjDoc', stepId); }} />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById(`cartaoCnpjDoc-${stepId}`)?.click()} disabled={uploadingFiles[`cartaoCnpjDoc-${stepId}`]}>
                          {uploadingFiles[`cartaoCnpjDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                          Upload CNPJ
                        </Button>
                      </div>
                    ) : null}
                    {renderDocLinks('cartaoCnpjDoc')}
                  </div>
                  <div className="space-y-2">
                    {isEditingDocuments ? (<Label htmlFor={`contratoEmpresa-${stepId}`}>Contrato Social</Label>) : null}
                    {isEditingDocuments ? (
                      <Input id={`contratoEmpresa-${stepId}`} value={visto?.contratoEmpresa || ""} onChange={(e) => handleVistoFieldChange('contratoEmpresa', e.target.value)} placeholder="Contrato Social" />
                    ) : (
                      <div className="text-xs leading-snug"><span className="font-medium">Contrato Social:</span> {String(visto?.contratoEmpresa || '') || '-'}</div>
                    )}
                    {isEditingDocuments ? (
                      <div className="flex items-center gap-2">
                        <input type="file" id={`contratoEmpresaDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'contratoEmpresaDoc', stepId); }} />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById(`contratoEmpresaDoc-${stepId}`)?.click()} disabled={uploadingFiles[`contratoEmpresaDoc-${stepId}`]}>
                          {uploadingFiles[`contratoEmpresaDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                          Upload Contrato
                        </Button>
                      </div>
                    ) : null}
                    {renderDocLinks('contratoEmpresaDoc')}
                  </div>
                  <div className="space-y-2">
                    {isEditingDocuments ? (<Label htmlFor={`escrituraImoveis-${stepId}`}>Imóveis (Escritura/Matrícula)</Label>) : null}
                    {isEditingDocuments ? (
                      <Input id={`escrituraImoveis-${stepId}`} value={visto?.escrituraImoveis || ""} onChange={(e) => handleVistoFieldChange('escrituraImoveis', e.target.value)} placeholder="Imóveis" />
                    ) : (
                      <div className="text-xs leading-snug"><span className="font-medium">Imóveis (Escritura/Matrícula):</span> {String(visto?.escrituraImoveis || '') || '-'}</div>
                    )}
                    {isEditingDocuments ? (
                      <div className="flex items-center gap-2">
                        <input type="file" id={`escrituraImoveisDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'escrituraImoveisDoc', stepId); }} />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById(`escrituraImoveisDoc-${stepId}`)?.click()} disabled={uploadingFiles[`escrituraImoveisDoc-${stepId}`]}>
                          {uploadingFiles[`escrituraImoveisDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                          Upload Escritura
                        </Button>
                      </div>
                    ) : null}
                    {renderDocLinks('escrituraImoveisDoc')}
                  </div>
                  <div className="space-y-2">
                    {isEditingDocuments ? (<Label htmlFor={`extratosBancarios-${stepId}`}>Últimos 3 extratos bancários</Label>) : null}
                    {isEditingDocuments ? (
                      <Input id={`extratosBancarios-${stepId}`} value={visto?.extratosBancarios || ""} onChange={(e) => handleVistoFieldChange('extratosBancarios', e.target.value)} placeholder="Extratos" />
                    ) : (
                      <div className="text-xs leading-snug"><span className="font-medium">Últimos 3 extratos bancários:</span> {String(visto?.extratosBancarios || '') || '-'}</div>
                    )}
                    {isEditingDocuments ? (
                      <div className="flex items-center gap-2">
                        <input type="file" id={`extratosBancariosDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'extratosBancariosDoc', stepId); }} />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById(`extratosBancariosDoc-${stepId}`)?.click()} disabled={uploadingFiles[`extratosBancariosDoc-${stepId}`]}>
                          {uploadingFiles[`extratosBancariosDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                          Upload Extratos
                        </Button>
                      </div>
                    ) : null}
                    {renderDocLinks('extratosBancariosDoc')}
                  </div>
                  <div className="space-y-2">
                    {isEditingDocuments ? (<Label htmlFor={`impostoRenda-${stepId}`}>Imposto de Renda</Label>) : null}
                    {isEditingDocuments ? (
                      <Input id={`impostoRenda-${stepId}`} value={visto?.impostoRenda || ""} onChange={(e) => handleVistoFieldChange('impostoRenda', e.target.value)} placeholder="IR" />
                    ) : (
                      <div className="text-xs leading-snug"><span className="font-medium">Imposto de Renda:</span> {String(visto?.impostoRenda || '') || '-'}</div>
                    )}
                    {isEditingDocuments ? (
                      <div className="flex items-center gap-2">
                        <input type="file" id={`impostoRendaDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'impostoRendaDoc', stepId); }} />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById(`impostoRendaDoc-${stepId}`)?.click()} disabled={uploadingFiles[`impostoRendaDoc-${stepId}`]}>
                          {uploadingFiles[`impostoRendaDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                          Upload IR
                        </Button>
                      </div>
                    ) : null}
                    {renderDocLinks('impostoRendaDoc')}
                  </div>
                </div>
              </div>
            ) : null}

            {isTurismo ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-base">Outros Documentos</h4>
                  {!isEditingDocuments ? (
                    <Button size="icon" variant="outline" className="h-7 w-7 p-0" onClick={() => setIsEditingDocuments(true)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
                  <div className="space-y-2">
                    {isEditingDocuments ? (<Label htmlFor={`reservasPassagens-${stepId}`}>Reservas de Passagens</Label>) : null}
                    {isEditingDocuments ? (
                      <Input id={`reservasPassagens-${stepId}`} value={visto?.reservasPassagens || ""} onChange={(e) => handleVistoFieldChange('reservasPassagens', e.target.value)} placeholder="Detalhes" />
                    ) : (
                      <div className="text-xs"><span className="font-medium">Reservas de Passagens:</span> {String(visto?.reservasPassagens || '') || '-'}</div>
                    )}
                    {isEditingDocuments ? (
                      <div className="flex items-center gap-2">
                        <input type="file" id={`reservasPassagensDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'reservasPassagensDoc', stepId); }} />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById(`reservasPassagensDoc-${stepId}`)?.click()} disabled={uploadingFiles[`reservasPassagensDoc-${stepId}`]}>
                          {uploadingFiles[`reservasPassagensDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                          Upload Passagens
                        </Button>
                      </div>
                    ) : null}
                    {renderDocLinks('reservasPassagensDoc')}
                  </div>
                  <div className="space-y-2">
                    {isEditingDocuments ? (<Label htmlFor={`reservasHotel-${stepId}`}>Reservas de Hotel</Label>) : null}
                    {isEditingDocuments ? (
                      <Input id={`reservasHotel-${stepId}`} value={visto?.reservasHotel || ""} onChange={(e) => handleVistoFieldChange('reservasHotel', e.target.value)} placeholder="Detalhes" />
                    ) : (
                      <div className="text-xs"><span className="font-medium">Reservas de Hotel:</span> {String(visto?.reservasHotel || '') || '-'}</div>
                    )}
                    {isEditingDocuments ? (
                      <div className="flex items-center gap-2">
                        <input type="file" id={`reservasHotelDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'reservasHotelDoc', stepId); }} />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById(`reservasHotelDoc-${stepId}`)?.click()} disabled={uploadingFiles[`reservasHotelDoc-${stepId}`]}>
                          {uploadingFiles[`reservasHotelDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                          Upload Hotel
                        </Button>
                      </div>
                    ) : null}
                    {renderDocLinks('reservasHotelDoc')}
                  </div>
                  <div className="space-y-2">
                    {isEditingDocuments ? (<Label htmlFor={`seguroViagem-${stepId}`}>Seguro Viagem</Label>) : null}
                    {isEditingDocuments ? (
                      <Input id={`seguroViagem-${stepId}`} value={visto?.seguroViagem || ""} onChange={(e) => handleVistoFieldChange('seguroViagem', e.target.value)} placeholder="Detalhes" />
                    ) : (
                      <div className="text-xs"><span className="font-medium">Seguro Viagem:</span> {String(visto?.seguroViagem || '') || '-'}</div>
                    )}
                    {isEditingDocuments ? (
                      <div className="flex items-center gap-2">
                        <input type="file" id={`seguroViagemDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'seguroViagemDoc', stepId); }} />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById(`seguroViagemDoc-${stepId}`)?.click()} disabled={uploadingFiles[`seguroViagemDoc-${stepId}`]}>
                          {uploadingFiles[`seguroViagemDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                          Upload Seguro
                        </Button>
                      </div>
                    ) : null}
                    {renderDocLinks('seguroViagemDoc')}
                  </div>
                  <div className="space-y-2">
                    {isEditingDocuments ? (<Label htmlFor={`roteiroViagem-${stepId}`}>Roteiro de Viagem Detalhado</Label>) : null}
                    {isEditingDocuments ? (
                      <Input id={`roteiroViagem-${stepId}`} value={visto?.roteiroViagem || ""} onChange={(e) => handleVistoFieldChange('roteiroViagem', e.target.value)} placeholder="Detalhes" />
                    ) : (
                      <div className="text-xs"><span className="font-medium">Roteiro de Viagem Detalhado:</span> {String(visto?.roteiroViagem || '') || '-'}</div>
                    )}
                    {isEditingDocuments ? (
                      <div className="flex items-center gap-2">
                        <input type="file" id={`roteiroViagemDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'roteiroViagemDoc', stepId); }} />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById(`roteiroViagemDoc-${stepId}`)?.click()} disabled={uploadingFiles[`roteiroViagemDoc-${stepId}`]}>
                          {uploadingFiles[`roteiroViagemDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                          Upload Roteiro
                        </Button>
                      </div>
                    ) : null}
                    {renderDocLinks('roteiroViagemDoc')}
                  </div>
                  <div className="space-y-2">
                    {isEditingDocuments ? (<Label htmlFor={`taxa-${stepId}`}>Taxa Consular</Label>) : null}
                    {isEditingDocuments ? (
                      <Input id={`taxa-${stepId}`} value={visto?.taxa || ""} onChange={(e) => handleVistoFieldChange('taxa', e.target.value)} placeholder="Valor/Status" />
                    ) : (
                      <div className="text-xs"><span className="font-medium">Taxa Consular:</span> {String(visto?.taxa || '') || '-'}</div>
                    )}
                    {isEditingDocuments ? (
                      <div className="flex items-center gap-2">
                        <input type="file" id={`taxaDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'taxaDoc', stepId); }} />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById(`taxaDoc-${stepId}`)?.click()} disabled={uploadingFiles[`taxaDoc-${stepId}`]}>
                          {uploadingFiles[`taxaDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                          Upload Taxa
                        </Button>
                      </div>
                    ) : null}
                    {renderDocLinks('taxaDoc')}
                  </div>
                  <div className="space-y-2">
                    {isEditingDocuments ? (<Label htmlFor={`formularioConsulado-${stepId}`}>Formulário do Consulado preenchido</Label>) : null}
                    {isEditingDocuments ? (
                      <Input id={`formularioConsulado-${stepId}`} value={visto?.formularioConsulado || ""} onChange={(e) => handleVistoFieldChange('formularioConsulado', e.target.value)} placeholder="Detalhes" />
                    ) : (
                      <div className="text-xs"><span className="font-medium">Formulário do Consulado preenchido:</span> {String(visto?.formularioConsulado || '') || '-'}</div>
                    )}
                    {isEditingDocuments ? (
                      <div className="flex items-center gap-2">
                        <input type="file" id={`formularioConsuladoDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'formularioConsuladoDoc', stepId); }} />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById(`formularioConsuladoDoc-${stepId}`)?.click()} disabled={uploadingFiles[`formularioConsuladoDoc-${stepId}`]}>
                          {uploadingFiles[`formularioConsuladoDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                          Upload Formulário
                        </Button>
                      </div>
                    ) : null}
                    {renderDocLinks('formularioConsuladoDoc')}
                  </div>
                </div>
              </div>
            ) : null}

            {showBrasil ? (
              <div className="space-y-6 mt-8">
                <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-base">Identificação</h4>
                  {!isEditingDocuments ? (
                    <Button size="icon" variant="outline" className="h-7 w-7 p-0" onClick={() => setIsEditingDocuments(true)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  ) : null}
                </div>
                  <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
                    {renderField('Passaporte', 'passaporte', 'passaporteDoc', true)}
                    {renderField('Certidão de Nascimento', 'certidaoNascimento', 'certidaoNascimentoDoc', true)}
                    {renderField('Declaração de Compreensão', 'declaracaoCompreensao', 'declaracaoCompreensaoDoc', true)}
                  </div>
                </div>

                <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-base">Documentos da Empresa</h4>
                  {!isEditingDocuments ? (
                    <Button size="icon" variant="outline" className="h-7 w-7 p-0" onClick={() => setIsEditingDocuments(true)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  ) : null}
                </div>
                  <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
                    {renderField('Contrato Social', 'contratoEmpresa', 'contratoEmpresaDoc', true)}
                    {renderField('CNPJ', 'cartaoCnpj', 'cartaoCnpjDoc', true)}
                    {renderField('Declarações da Empresa', 'declaracoesEmpresa', 'declaracoesEmpresaDoc', true)}
                    {renderField('Procuração da empresa', 'procuracaoEmpresa', 'procuracaoEmpresaDoc', true)}
                    {renderField('Formulário RN 01', 'formularioRn01', 'formularioRn01Doc', true)}
                    {renderField('Guia paga', 'guiaPaga', 'guiaPagaDoc', true)}
                    {renderField('Publicação no DOU', 'publicacaoDou', 'publicacaoDouDoc', true)}
                    {renderField('Protocolado', 'protocolado', 'protocoladoDoc', true)}
                  </div>
                </div>

                <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-base">Documentos Trabalhistas</h4>
                  {!isEditingDocuments ? (
                    <Button size="icon" variant="outline" className="h-7 w-7 p-0" onClick={() => setIsEditingDocuments(true)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  ) : null}
                </div>
                  <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
                    {renderField('Contrato de trabalho', 'contratoTrabalho', 'contratoTrabalhoDoc', true)}
                    {renderField('Folha de pagamento (últimas)', 'folhaPagamento', 'folhaPagamentoDoc', true)}
                    {renderField('Comprovante de vínculo anterior (se houver)', 'comprovanteVinculoAnterior', 'comprovanteVinculoAnteriorDoc', true)}
                  </div>
                </div>

                <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-base">Histórico e Segurança</h4>
                  {!isEditingDocuments ? (
                    <Button size="icon" variant="outline" className="h-7 w-7 p-0" onClick={() => setIsEditingDocuments(true)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  ) : null}
                </div>
                  <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
                    {renderField('Antecedentes Criminais', 'antecedentesCriminais', 'antecedentesCriminaisDoc', true)}
                    {renderField('Declaração de Antecedentes Criminais', 'declaracaoAntecedentesCriminais', 'declaracaoAntecedentesCriminaisDoc', true)}
                  </div>
                </div>

                <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-base">Formação Acadêmica</h4>
                  {!isEditingDocuments ? (
                    <Button size="icon" variant="outline" className="h-7 w-7 p-0" onClick={() => setIsEditingDocuments(true)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  ) : null}
                </div>
                  <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
                    {renderField('Diploma', 'diploma', 'diplomaDoc', true)}
                  </div>
                </div>
              </div>
            ) : null}

              {showResidenciaPrevia ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-base">Residência Prévia</h4>
                  {!isEditingDocuments ? (
                    <Button size="icon" variant="outline" className="h-7 w-7 p-0" onClick={() => setIsEditingDocuments(true)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
                  {renderField('Formulário RN02', 'formularioRn02', 'formularioRn02Doc')}
                  {renderField('Comprovante Residência Prévia', 'comprovanteResidenciaPrevia', 'comprovanteResidenciaPreviaDoc')}
                  {renderField('Comprovante de Atividade', 'comprovanteAtividade', 'comprovanteAtividadeDoc')}
                  {renderField('Protocolado', 'protocolado', 'protocoladoDoc')}
                </div>
              </div>
            ) : null}

              {showInvestidor ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-base">Investidor</h4>
                  {!isEditingDocuments ? (
                    <Button size="icon" variant="outline" className="h-7 w-7 p-0" onClick={() => setIsEditingDocuments(true)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted rounded-lg">
                  {renderField('Comprovante de Investimento', 'comprovanteInvestimento', 'comprovanteInvestimentoDoc')}
                  {renderField('Plano de Investimentos', 'planoInvestimentos', 'planoInvestimentosDoc')}
                  {renderField('Formulário de Requerimento', 'formularioRequerimento', 'formularioRequerimentoDoc')}
                  {renderField('Protocolado', 'protocolado', 'protocoladoDoc')}
                </div>
              </div>
            ) : null}

            {(showTrabalhistas || showMudancaEmpregador) ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-base">Trabalhistas</h4>
                  {!isEditingDocuments ? (
                    <Button size="icon" variant="outline" className="h-7 w-7 p-0" onClick={() => setIsEditingDocuments(true)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted rounded-lg">
                  {renderField('Contrato de Trabalho', 'contratoTrabalho', 'contratoTrabalhoDoc')}
                  {renderField('Folha de Pagamento', 'folhaPagamento', 'folhaPagamentoDoc')}
                  {renderField('Comprovante de Vínculo Anterior', 'comprovanteVinculoAnterior', 'comprovanteVinculoAnteriorDoc')}
                  {renderField('Justificativa Mudança de Empregador', 'justificativaMudancaEmpregador', 'justificativaMudancaEmpregadorDoc')}
                  {renderField('Declaração de Antecedentes Criminais', 'declaracaoAntecedentesCriminais', 'declaracaoAntecedentesCriminaisDoc')}
                  {renderField('Protocolado', 'protocolado', 'protocoladoDoc')}
                </div>
              </div>
            ) : null}

            {showFormacao ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-lg">Formação</h4>
                  {!isEditingDocuments ? (
                    <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setIsEditingDocuments(true)}>Editar</Button>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted rounded-lg">
                  {renderField('Diploma', 'diploma', 'diplomaDoc')}
                </div>
              </div>
            ) : null}

            {showRenovacao ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-lg">Renovação 1 ano</h4>
                  {!isEditingDocuments ? (
                    <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setIsEditingDocuments(true)}>Editar</Button>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted rounded-lg">
                  {renderField('CTPS', 'ctps', 'ctpsDoc')}
                  {renderField('Contrato de Trabalho Anterior', 'contratoTrabalhoAnterior', 'contratoTrabalhoAnteriorDoc')}
                  {renderField('Contrato de Trabalho Atual', 'contratoTrabalhoAtual', 'contratoTrabalhoAtualDoc')}
                  {renderField('Formulário de Prorrogação', 'formularioProrrogacao', 'formularioProrrogacaoDoc')}
                  {renderField('Protocolado', 'protocolado', 'protocoladoDoc')}
                </div>
              </div>
            ) : null}

            {showIndeterminado ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-lg">Indeterminado</h4>
                  {!isEditingDocuments ? (
                    <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setIsEditingDocuments(true)}>Editar</Button>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted rounded-lg">
                  {renderField('Contrato de Trabalho Indeterminado', 'contratoTrabalhoIndeterminado', 'contratoTrabalhoIndeterminadoDoc')}
                  {renderField('Protocolado', 'protocolado', 'protocoladoDoc')}
                </div>
              </div>
            ) : null}

            
          </div>
        );


      case 3: // Preparação da Documentação
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor={`status-preparacao-${stepId}`}>Status da Preparação</Label>
                <Select
                  value={currentStepData.statusPreparacao || ""}
                  onValueChange={(value) => saveStepData(stepId, { statusPreparacao: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iniciada">Iniciada</SelectItem>
                    <SelectItem value="em-andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Documentação Preparada:</h4>
              
              {[
                { key: 'formulario-visto', label: 'Formulário de Visto Preenchido' },
                { key: 'documentos-traduzidos', label: 'Documentos Traduzidos' },
                { key: 'documentos-autenticados', label: 'Documentos Autenticados' }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id={`${key}-${stepId}`}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleSpecificFileUpload(file, key, stepId);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`${key}-${stepId}`)?.click()}
                      disabled={uploadingFiles[`${key}-${stepId}`]}
                    >
                      {uploadingFiles[`${key}-${stepId}`] ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Upload
                    </Button>
                  </div>
                  {renderDocLinks(key)}
                </div>
              ))}
            </div>

          <Button onClick={() => saveStepData(stepId, currentStepData)} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Salvar Preparação
          </Button>
          {saveMessages[stepId] ? (
            <div className="text-green-600 text-sm mt-2">{saveMessages[stepId]}</div>
          ) : null}
        </div>
      );

      case 1: // Agendar no Consulado
        return (
          <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white border rounded-lg shadow-xs p-3">
              <div>
                <Label htmlFor={`data-agendamento-${stepId}`}>Data do Agendamento</Label>
                <Input
                  id={`data-agendamento-${stepId}`}
                  type="date"
                  value={currentStepData.dataAgendamento || ""}
                  onChange={(e) => saveStepData(stepId, { dataAgendamento: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor={`horario-agendamento-${stepId}`}>Hora do Agendamento</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={(String(currentStepData.horarioAgendamento || '').split(':')[0] || undefined) as undefined | string}
                    onValueChange={(h) =>
                      saveStepData(stepId, {
                        horarioAgendamento: `${h}:${String(currentStepData.horarioAgendamento || '').split(':')[1] || '00'}`,
                      })
                    }
                  >
                    <SelectTrigger id={`horario-agendamento-${stepId}`} className="h-9 w-full border-2 focus:border-cyan-500">
                      <SelectValue placeholder="Hora" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={(String(currentStepData.horarioAgendamento || '').split(':')[1] || undefined) as undefined | string}
                    onValueChange={(m) =>
                      saveStepData(stepId, {
                        horarioAgendamento: `${String(currentStepData.horarioAgendamento || '').split(':')[0] || '00'}:${m}`,
                      })
                    }
                  >
                    <SelectTrigger className="h-9 w-full border-2 focus:border-cyan-500">
                      <SelectValue placeholder="Minuto" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {[
                { key: 'comprovante-agendamento' }
              ].map(({ key }) => (
                <div key={key} className="space-y-2">
                  <UploadDocBlock
                    inputId={`${key}-${stepId}`}
                    disabledKey={`${key}-${stepId}`}
                    onSelect={(f) => handleSpecificFileUpload(f, key, stepId)}
                  />
                  {renderDocLinks(key)}
                </div>
              ))}
            </div>

            <div>
              <Label htmlFor={`observacoes-agendamento-${stepId}`}>Observações</Label>
              <Textarea
                id={`observacoes-agendamento-${stepId}`}
                value={currentStepData.observacoesAgendamento || ""}
                onChange={(e) => saveStepData(stepId, { observacoesAgendamento: e.target.value })}
                placeholder="Adicione observações para esta etapa..."
                rows={3}
              />
            </div>

            <Button onClick={() => saveStepData(stepId, currentStepData)} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Salvar Agendamento
            </Button>
          </div>
        );

      

      

      

      case 5: // Processo Finalizado
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`data-finalizacao-${stepId}`}>Data de Finalização</Label>
                <Input
                  id={`data-finalizacao-${stepId}`}
                  type="date"
                  value={currentStepData.dataFinalizacao || ""}
                  onChange={(e) => saveStepData(stepId, { dataFinalizacao: e.target.value })}
                />
              </div>
              <div>
                <Label>Status do Processo</Label>
                <Select
                  value={currentStepData.statusFinal || ""}
                  onValueChange={(val) => {
                    const isOutro = val === "Outro";
                    saveStepData(stepId, { statusFinal: val, statusFinalOutro: isOutro ? (currentStepData.statusFinalOutro || "") : "" })
                  }}
                >
                  <SelectTrigger className="h-9 w-full border-2 focus:border-cyan-500">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {((caseData?.type || "").toLowerCase().includes("turismo")
                      ? ["Aprovado", "Negado", "Aguardando"]
                      : ["Deferido", "Indeferido", "Outro"]).map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {String(currentStepData.statusFinal || "") === "Outro" && (
                  <div className="mt-2">
                    <Label htmlFor={`status-final-outro-${stepId}`}>Descrever Status</Label>
                    <Input
                      id={`status-final-outro-${stepId}`}
                      value={currentStepData.statusFinalOutro || ""}
                      onChange={(e) => saveStepData(stepId, { statusFinalOutro: e.target.value })}
                      placeholder="Digite o status"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor={`observacoes-finais-${stepId}`}>Observações Finais</Label>
              <Textarea
                id={`observacoes-finais-${stepId}`}
                value={currentStepData.observacoesFinais || ""}
                onChange={(e) => saveStepData(stepId, { observacoesFinais: e.target.value })}
                placeholder="Observações finais do processo"
                rows={4}
              />
            </div>

            <div className="space-y-4">
              {[
                { key: 'processo-finalizado' },
                { key: 'relatorio-final' }
              ].map(({ key }) => (
                <div key={key} className="space-y-2">
                  <UploadDocBlock
                    inputId={`${key}-${stepId}`}
                    disabledKey={`${key}-${stepId}`}
                    onSelect={(f) => handleSpecificFileUpload(f, key, stepId)}
                  />
                  {renderDocLinks(key)}
                </div>
              ))}
            </div>

            <Button onClick={() => saveStepData(stepId, currentStepData)} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Salvar Finalização
            </Button>
          </div>
        );

      default:
        return renderDefaultStepContent(step);
    }
  };

  const renderVistoTurismoStepContent = (step: StepData) => {
    if (step.id === 0 || step.id === 1) return renderVistoTrabalhoStepContent(step);
    return renderDefaultStepContent(step);
  };

  const renderVistoEstudanteStepContent = (step: StepData) => {
    if (step.id === 0 || step.id === 1) return renderVistoTrabalhoStepContent(step);
    return renderDefaultStepContent(step);
  };

  const renderVistoReuniaoFamiliarStepContent = (step: StepData) => {
    if (step.id === 0 || step.id === 1) return renderVistoTrabalhoStepContent(step);
    return renderDefaultStepContent(step);
  };

  const renderDefaultStepContent = (step: StepData) => {
    const stepId = step.id;
    const title = (step.title || "").toLowerCase();
    const currentStepData = stepData[stepId] || {};

    // Preencher Formulário
    if (title.includes("preencher") && title.includes("formul")) {
      return (
        <div className="space-y-4">
          <UploadDocBlock
            inputId={`formulario-visto-${stepId}`}
            disabledKey={`formulario-visto-${stepId}`}
            onSelect={(f) => handleSpecificFileUpload(f, 'formulario-visto', stepId)}
          />
          {renderDocLinks('formulario-visto')}
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
          {saveMessages[stepId] ? (
            <div className="text-green-600 text-sm mt-2">{saveMessages[stepId]}</div>
          ) : null}
        </div>
      );
    }

    // Preparar Documentação
    if (title.includes("preparar") && title.includes("documenta")) {
      return (
        <div className="space-y-4">
          {[
            { key: 'documentacao-original' },
            { key: 'documentacao-copia' },
          ].map(({ key }) => (
            <div key={key} className="space-y-2">
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
          {saveMessages[stepId] ? (
            <div className="text-green-600 text-sm mt-2">{saveMessages[stepId]}</div>
          ) : null}
        </div>
      );
    }

    // Aguardar Aprovação
    if (title.includes("aguardar") && title.includes("aprova")) {
      return (
        <div className="space-y-4">
          <UploadDocBlock
            inputId={`comprovante-aprovacao-${stepId}`}
            disabledKey={`comprovante-aprovacao-${stepId}`}
            onSelect={(f) => handleSpecificFileUpload(f, 'comprovante-aprovacao', stepId)}
          />
          {renderDocLinks('comprovante-aprovacao')}
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

    // Fallback genérico
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Status do Processo</Label>
          <Select
            value={String(currentStepData.statusFinal || "")}
            onValueChange={(val) => {
              const isOutro = val === "Outro";
              saveStepData(stepId, { statusFinal: val, statusFinalOutro: isOutro ? (currentStepData.statusFinalOutro || "") : "" });
            }}
          >
            <SelectTrigger className="h-9 w-full border-2 focus:border-cyan-500">
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Deferido">Deferido</SelectItem>
              <SelectItem value="Indeferido">Indeferido</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
          {String(currentStepData.statusFinal || "") === "Outro" && (
            <div className="mt-2">
              <Label htmlFor={`status-final-outro-${stepId}`}>Descrever Status</Label>
              <Input
                id={`status-final-outro-${stepId}`}
                value={String(currentStepData.statusFinalOutro || "")}
                onChange={(e) => saveStepData(stepId, { statusFinalOutro: e.target.value })}
                placeholder="Digite o status"
              />
            </div>
          )}
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
        <Button onClick={() => saveStepNotes(stepId)} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Salvar Observações
        </Button>
        {saveMessages[stepId] ? (
          <div className="text-green-600 text-sm mt-2">{saveMessages[stepId]}</div>
        ) : null}
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
          <Link href="/dashboard/vistos">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Vistos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleDeleteCase = async () => {
    try {
      // Simulate API call to delete case
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/dashboard/vistos');
    } catch (error) {
      console.error('Erro ao deletar caso:', error);
    }
  };

  const getCurrentStepIndex = () => {
    if (!caseData) return 0;
    const idx = Number(caseData.currentStep ?? 0);
    return Math.min(Math.max(idx, 0), caseData.steps.length - 1);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="w-full p-4 space-y-6 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/vistos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{caseData.clientName}</h1>
            <p className="text-muted-foreground">{(visto?.type || caseData.type || '').replace(/:/g, ' - ')}</p>
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
        <div className="lg:col-span-8">
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
                            {isCurrent ? (
                              <p className="text-sm text-gray-500 mt-1">Aguardando agendamento pelo cliente.</p>
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
        </div>

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
              <Textarea rows={12} placeholder="Adicione observações..." value={notes[0] || ''} onChange={(e) => setNotes(prev => ({ ...prev, 0: e.target.value }))} className="flex-1 border-none bg-transparent" />
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
        <div className="lg:col-span-8">
          <Card className="rounded-xl border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`col-span-1 md:col-span-2 border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center ${uploadingFiles['general'] ? 'opacity-50 pointer-events-none' : ''} hover:bg-gray-50`}
                     onDragOver={(e) => { e.preventDefault(); }}
                     onDrop={(e) => { e.preventDefault(); const files = Array.from(e.dataTransfer.files); handleFileUpload(files as any); }}>
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
                          title={doc.document_name || doc.file_name}
                          className="block w-full h-full rounded-md border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"
                        >
                          <FileText className="h-5 w-5 text-blue-600" />
                        </a>
                        <button
                          type="button"
                          aria-label="Excluir"
                          title="Excluir"
                          className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition bg-white border border-gray-300 rounded-full p-0.5 shadow"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteDocument(doc as any); }}
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

        <div className="lg:col-span-4">
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
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o documento "{documentToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDocument} className="bg-white text-red-600 border border-red-500 hover:bg-red-50 hover:text-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
