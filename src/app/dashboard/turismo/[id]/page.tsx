"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Calendar,
  User,
  CheckCircle,
  Circle,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Mail,
  Edit,
  AlertCircle,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { DocumentChip } from "@/components/ui/document-chip";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

const TURISMO_WORKFLOW = [
  "Cadastro de Documentos",
  "Agendar no Consulado",
  "Preencher Formulário",
  "Preparar Documentação",
  "Aguardar Aprovação",
  "Processo Finalizado"
];

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
  field_name?: string;
  fieldName?: string;
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

const SectionHeader = ({
  title,
  isEditing,
  onEdit,
  onCancel,
  onSave
}: {
  title: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}) => {
  return (
    <div className="px-4 py-3 md:px-6 md:py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
      <h2 className="text-base md:text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
        {title}
      </h2>
      {!isEditing ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 min-h-[44px] min-w-[44px] md:min-h-9 md:min-w-0 md:h-9 md:px-3"
          title="Editar seção"
        >
          <Edit className="w-5 h-5 md:w-4 md:h-4" />
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onCancel} 
            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 min-h-[44px] md:min-h-9"
          >
            Cancelar
          </Button>
          <Button 
            size="sm" 
            onClick={onSave} 
            className="bg-green-600 hover:bg-green-700 text-white min-h-[44px] md:min-h-9"
          >
            Concluir
          </Button>
        </div>
      )}
    </div>
  );
};

const DocumentRow = ({
  label,
  field,
  docField,
  placeholder = "Informação do documento",
  isEditing = false,
  vistoValue,
  onTextChange,
  documents,
  onUpload,
  onDeleteDoc,
  isUploading,
  tooltip,
  required
}: {
  label: string;
  field?: string;
  docField: string;
  placeholder?: string;
  isEditing: boolean;
  vistoValue?: string;
  onTextChange?: (val: string) => void;
  documents: Document[];
  onUpload: (f: File) => void;
  onDeleteDoc: (d: Document) => void;
  isUploading: boolean;
  tooltip?: string;
  required?: boolean;
}) => {
  // Coletar arquivos anexados
  const attachedDocs = (documents || []).filter((d: any) => (d.field_name || d.fieldName) === docField);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </Label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-1 -m-1">
                  <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-start">
        {!isEditing ? (
          <div className="flex-1 flex flex-wrap items-center p-3 rounded-md border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm min-h-[44px]">
            {field ? (
              <span className="font-medium text-slate-700 dark:text-slate-200 mr-2 break-all">{vistoValue || '-'}</span>
            ) : null}
            <span className={`text-xs ml-auto ${attachedDocs.length > 0 ? "text-green-600 dark:text-green-400 font-medium" : "italic"} mt-1 sm:mt-0 w-full sm:w-auto text-right`}>
              {attachedDocs.length > 0 ? `${attachedDocs.length} documento(s)` : "Nenhum anexo"}
            </span>
          </div>
        ) : (
          <Input
            value={vistoValue || ""}
            onChange={(e) => onTextChange && onTextChange(e.target.value)}
            className="flex-1 rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm py-3 min-h-[44px]"
            placeholder={placeholder}
            disabled={!field}
          />
        )}

        {isEditing && (
          <div className="relative w-full sm:w-auto">
            <input
              type="file"
              id={`upload-${docField}`}
              className="hidden"
              multiple
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  Array.from(files).forEach((f) => onUpload(f));
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="flex items-center justify-center gap-2 px-4 py-3 w-full sm:w-auto min-h-[44px]"
              onClick={() => document.getElementById(`upload-${docField}`)?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <Upload className="h-4 w-4 text-slate-500" />
              )}
              Upload
            </Button>
          </div>
        )}
      </div>

      {/* Lista de arquivos anexados */}
      {attachedDocs.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {attachedDocs.map((doc: any, idx: number) => (
            <DocumentChip
              key={idx}
              name={doc.document_name || doc.name || doc.file_name || "Documento"}
              href={doc.file_path || doc.url}
              onDelete={isEditing ? () => onDeleteDoc(doc) : undefined}
              className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:border-sky-200 transition-all"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function TurismoDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<{ [key: number]: string }>({});
  const [status, setStatus] = useState("");
  const [visto, setVisto] = useState<any>(null);
  const showWorkflow = true;
  const [expandedSteps, setExpandedSteps] = useState<{ [key: number]: boolean }>({});
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({});
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [newDocumentName, setNewDocumentName] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isEditingDocuments, setIsEditingDocuments] = useState(false);
  const [isPendingDocsOpen, setIsPendingDocsOpen] = useState(false);
  
  // Estados para dados específicos de cada etapa
  const [stepData, setStepData] = useState<{ [key: number]: any }>({});

  // Estados para uploads de arquivos específicos
  const [fileUploads, setFileUploads] = useState<{ [key: string]: File | null }>({});
  const [assignments, setAssignments] = useState<Record<number, { responsibleName?: string; dueDate?: string }>>({});
  const [saveMessages, setSaveMessages] = useState<{ [key: number]: string }>({});
  const [assignOpenStep, setAssignOpenStep] = useState<number | null>(null);
  const [assignResp, setAssignResp] = useState<string>("");
  const [assignDue, setAssignDue] = useState<string>("");
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  
  // Estados adicionados para correção de erro ReferenceError
  const [showResponsibleModal, setShowResponsibleModal] = useState(false);
  const [pendingNote, setPendingNote] = useState<{ stepId: number; text: string } | null>(null);
  const [noteResponsible, setNoteResponsible] = useState("");

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowInfoModal(false);
    };
    if (showInfoModal) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showInfoModal]);

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
      await fetch(`/api/turismo?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: JSON.stringify(next) })
      });
      setVisto((prev: any) => ({ ...(prev || {}), notes: JSON.stringify(next) }));
      setCaseData((prev) => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev);
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
      const res = await fetch(`/api/turismo?id=${params.id}`);
      if (res.ok) {
        const record = await res.json();
        setVisto(record);
        
        const steps: StepData[] = TURISMO_WORKFLOW.map((title: string, index: number) => ({
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
          type: "Visto de Turismo",
          status: record.status || "Em Andamento",
          createdAt: record.createdAt || record.created_at,
          updatedAt: record.updatedAt || record.updated_at,
          clientName: record.clientName || record.client_name,
          description: `Processo de Turismo`,
          steps,
          currentStep: contiguousIndex,
        };
        setCaseData(data);
        setStatus(data.status);
        
        if (recordCurrentStep < 1) {
          try {
            await fetch(`/api/turismo?id=${params.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ currentStep: 1 })
            });
          } catch {}
        }

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
        fd.append('moduleType', 'vistos');
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
      fd.append('moduleType', 'vistos');
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
          await fetch(`/api/turismo?id=${params.id}`, {
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
    try {
      const res = await fetch(`/api/turismo?id=${params.id}`, {
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
    const stepTitle = TURISMO_WORKFLOW[stepId] || `Etapa ${stepId + 1}`;
    const entries = Object.entries(data || {})
      .filter(([_, v]) => typeof v === 'string' && v.trim() !== '')
      .map(([k, v]) => `- ${k}: ${v}`);
    if (entries.length) {
      const block = `\n[${stepTitle}]\n${entries.join('\n')}\n`;
      try {
        await fetch(`/api/turismo?id=${params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: `${block}` })
        });
        setCaseData((prev) => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev);
      } catch (e) {
        console.error('Erro ao persistir dados da etapa:', e);
      }
    }
    try {
      const payload: any = {};
      if (Object.prototype.hasOwnProperty.call(data, 'statusFinal')) payload.statusFinal = data.statusFinal;
      if (Object.prototype.hasOwnProperty.call(data, 'statusFinalOutro')) payload.statusFinalOutro = data.statusFinalOutro;
      if (Object.keys(payload).length) {
        await fetch(`/api/turismo?id=${params.id}`, {
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

  const saveStepNotes = (stepId: number) => {
    const text = (notes[stepId] || '').trim();
    if (!text) return;
    setPendingNote({ stepId, text });
    setNoteResponsible("");
    setShowResponsibleModal(true);
  };

  const confirmSaveNote = async () => {
    if (!pendingNote || !noteResponsible.trim()) return;
    const { stepId, text } = pendingNote;
    const iso = new Date().toISOString();
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const arr = parseNotesArray(visto?.notes);
    
    const suggestion = RESPONSAVEIS.find((r) => r.includes(noteResponsible)) || '';
    const role = suggestion ? suggestion.split(' – ')[0] : '';
    
    const next = [...arr, { id, stepId, content: text, timestamp: iso, authorName: noteResponsible, authorRole: role }];
    try {
      const res = await fetch(`/api/turismo?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: JSON.stringify(next) })
      });
      if (res.ok) {
        setSaveMessages(prev => ({ ...prev, [stepId]: 'Salvo' }));
        setCaseData((prev) => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev);
        setVisto((prev: any) => ({ ...(prev || {}), notes: JSON.stringify(next) }));
        setNotes((prev) => ({ ...prev, [stepId]: '' }));
      }
    } catch (error) {
      console.error('Erro ao salvar notas da etapa:', error);
    }
    setShowResponsibleModal(false);
    setPendingNote(null);
    setNoteResponsible("");
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      await fetch(`/api/turismo?id=${params.id}`, {
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
      await fetch(`/api/turismo?id=${params.id}`, {
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
      const stepTitle = TURISMO_WORKFLOW[index] || `Etapa ${index + 1}`;
      const res = await fetch(`/api/step-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleType: "vistos", recordId: params.id as string, stepIndex: index, responsibleName, dueDate, workflowName: stepTitle, clientName: caseData?.clientName || "Cliente" })
      });
      if (res.ok) {
        setAssignments(prev => ({ ...prev, [index]: { responsibleName, dueDate } }));
        setCaseData((prev) => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev);
        const dueBR = dueDate ? (() => { const [y, m, d] = dueDate.split("-"); return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`; })() : "—";
        const message = `Tarefa "${stepTitle}" atribuída a ${responsibleName || "—"} com prazo ${dueBR} para: ${caseData?.clientName || ""} - Turismo`;
        try {
          await fetch(`/api/alerts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ moduleType: "Vistos", recordId: params.id as string, alertFor: "admin", message, isRead: false })
          });
        } catch {}
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.error("Erro ao salvar assignment:", e);
      return false;
    }
  };

  const renderRow = (stepId: number, label: string, fieldKey?: string, docKey?: string, tooltip?: string, required?: boolean) => (
    <DocumentRow
      label={label}
      field={fieldKey}
      docField={docKey || ''}
      isEditing={isEditingDocuments}
      vistoValue={String((visto || {})[fieldKey || ''] || '')}
      onTextChange={(val) => fieldKey && handleVistoFieldChange(fieldKey, val)}
      documents={documents}
      onUpload={(f) => docKey && handleSpecificFileUpload(f, docKey, stepId)}
      onDeleteDoc={handleDeleteDocument}
      isUploading={!!uploadingFiles[`${docKey}-${stepId}`]}
      tooltip={tooltip}
      required={required}
    />
  );

  const renderHeader = (title: string) => (
    <SectionHeader
      title={title}
      isEditing={isEditingDocuments}
      onEdit={() => setIsEditingDocuments(true)}
      onCancel={() => setIsEditingDocuments(false)}
      onSave={() => { setIsEditingDocuments(false); fetchCaseData(); }}
    />
  );

  const renderStepContent = (step: StepData) => {
    if (!caseData) return null;
    const stepId = step.id;
    const currentStepData = stepData[stepId] || {};

    // 0: Cadastro de Documentos
    if (stepId === 0) {
      return (
        <div className="space-y-6 md:space-y-8 pb-6 md:pb-8">
          {/* 1. Dados do Cliente */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {renderHeader("1. Dados do Cliente")}
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Nome do Cliente */}
              <div className="space-y-2">
                {isEditingDocuments ? (<Label htmlFor={`clientName-${stepId}`}>Nome do Cliente</Label>) : <Label className="block text-sm font-medium text-slate-700">Nome do Cliente</Label>}
                {isEditingDocuments ? (
                  <Input
                    id={`clientName-${stepId}`}
                    value={String(visto?.clientName || caseData?.clientName || '')}
                    onChange={(e) => handleVistoFieldChange('clientName', e.target.value)}
                    placeholder="Nome completo"
                    className="w-full rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5"
                  />
                ) : (
                  <div className="p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px] flex items-center">
                    {String(caseData?.clientName || visto?.clientName || '-')}
                  </div>
                )}
              </div>

              {/* Status Final */}
              <div className="space-y-2">
                {isEditingDocuments ? (<Label htmlFor={`statusFinal-${stepId}`}>Status Final</Label>) : <Label className="block text-sm font-medium text-slate-700">Status Final</Label>}
                {isEditingDocuments ? (
                  <Select
                    value={String((visto as any)?.statusFinal || '')}
                    onValueChange={(val) => handleVistoFieldChange('statusFinal', val)}
                  >
                    <SelectTrigger id={`statusFinal-${stepId}`} className="h-9 w-full border-2 focus:border-cyan-500">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aprovado">Aprovado</SelectItem>
                      <SelectItem value="Negado">Negado</SelectItem>
                      <SelectItem value="Aguardando">Aguardando</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px] flex items-center">
                    {String((visto as any)?.statusFinal || '-')}
                  </div>
                )}
              </div>

              {/* Data Inicial */}
              <div className="space-y-2">
                {isEditingDocuments ? (<Label htmlFor={`travelStartDate-${stepId}`}>Data Inicial da Viagem</Label>) : <Label className="block text-sm font-medium text-slate-700">Data Inicial da Viagem</Label>}
                {isEditingDocuments ? (
                  <Input
                    id={`travelStartDate-${stepId}`}
                    type="date"
                    value={String((visto as any)?.travelStartDate || '')}
                    onChange={(e) => handleVistoFieldChange('travelStartDate', e.target.value)}
                    className="w-full rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5"
                  />
                ) : (
                  <div className="p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px] flex items-center">
                    {formatDateBR((visto as any)?.travelStartDate)}
                  </div>
                )}
              </div>

              {/* Data Final */}
              <div className="space-y-2">
                {isEditingDocuments ? (<Label htmlFor={`travelEndDate-${stepId}`}>Data Final da Viagem</Label>) : <Label className="block text-sm font-medium text-slate-700">Data Final da Viagem</Label>}
                {isEditingDocuments ? (
                  <Input
                    id={`travelEndDate-${stepId}`}
                    type="date"
                    value={String((visto as any)?.travelEndDate || '')}
                    onChange={(e) => handleVistoFieldChange('travelEndDate', e.target.value)}
                    className="w-full rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5"
                  />
                ) : (
                  <div className="p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px] flex items-center">
                    {formatDateBR((visto as any)?.travelEndDate)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Documentos Pessoais */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {renderHeader("2. Documentos Pessoais")}
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                {isEditingDocuments ? (<Label htmlFor={`country-${stepId}`}>País do Visto</Label>) : <Label className="block text-sm font-medium text-slate-700">País do Visto</Label>}
                {isEditingDocuments ? (
                  <Input
                    id={`country-${stepId}`}
                    value={String((visto || {})['country'] || '')}
                    onChange={(e) => handleVistoFieldChange('country', e.target.value)}
                    placeholder="País do Visto"
                    className="w-full rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5"
                  />
                ) : (
                  <div className="p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px] flex items-center">
                    {String((visto || {})['country'] || '') || '-'}
                  </div>
                )}
              </div>
              {renderRow(stepId, "CPF", "cpf", "cpfDoc")}
              {renderRow(stepId, "RNM", "rnm", "rnmDoc")}
              {renderRow(stepId, "Passaporte", "passaporte", "passaporteDoc")}
              {renderRow(stepId, "Comprovante de Endereço", "comprovanteEndereco", "comprovanteEnderecoDoc")}
              {renderRow(stepId, "Declaração de Residência", undefined, "declaracaoResidenciaDoc")}
              {renderRow(stepId, "Foto/Selfie", undefined, "foto3x4Doc")}
              {renderRow(stepId, "Documento Chinês", "documentoChines", "documentoChinesDoc")}
              {renderRow(stepId, "Antecedentes Criminais", "antecedentesCriminais", "antecedentesCriminaisDoc")}
            </div>
          </div>

          {/* 3. Comprovação Financeira */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {renderHeader("3. Comprovação Financeira")}
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {renderRow(stepId, "Certidão Nascimento Filhos", "certidaoNascimentoFilhos", "certidaoNascimentoFilhosDoc")}
              {renderRow(stepId, "CNPJ", "cartaoCnpj", "cartaoCnpjDoc")}
              {renderRow(stepId, "Contrato Social", "contratoEmpresa", "contratoEmpresaDoc")}
              {renderRow(stepId, "Escritura/Matrícula", "escrituraImoveis", "escrituraImoveisDoc")}
              {renderRow(stepId, "Extratos Bancários", "extratosBancarios", "extratosBancariosDoc")}
              {renderRow(stepId, "Imposto de Renda", "impostoRenda", "impostoRendaDoc")}
            </div>
          </div>

          {/* 4. Outros Documentos */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {renderHeader("4. Outros Documentos")}
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {renderRow(stepId, "Reservas de Passagens", "reservasPassagens", "reservasPassagensDoc")}
              {renderRow(stepId, "Reservas de Hotel", "reservasHotel", "reservasHotelDoc")}
              {renderRow(stepId, "Seguro Viagem", "seguroViagem", "seguroViagemDoc")}
              {renderRow(stepId, "Roteiro de Viagem", "roteiroViagem", "roteiroViagemDoc")}
              {renderRow(stepId, "Taxa Consular", "taxa", "taxaDoc")}
              {renderRow(stepId, "Formulário do Consulado", "formularioConsulado", "formularioConsuladoDoc")}
            </div>
          </div>
        </div>
      );
    }

    // 1: Agendar no Consulado
    if (stepId === 1) {
      return (
        <div className="space-y-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {renderHeader("Agendamento")}
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="block text-sm font-medium text-slate-700">Data do Agendamento</Label>
                </div>
                {isEditingDocuments ? (
                  <Input
                    id={`data-agendamento-${stepId}`}
                    type="date"
                    value={currentStepData.dataAgendamento || ""}
                    onChange={(e) => saveStepData(stepId, { dataAgendamento: e.target.value })}
                    className="flex-1 rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5"
                  />
                ) : (
                  <div className="flex items-center p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px]">
                    {currentStepData.dataAgendamento ? formatDateBR(currentStepData.dataAgendamento) : "-"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="block text-sm font-medium text-slate-700">Hora do Agendamento</Label>
                </div>
                {isEditingDocuments ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={(String(currentStepData.horarioAgendamento || '').split(':')[0] || undefined) as undefined | string}
                      onValueChange={(h) =>
                        saveStepData(stepId, {
                          horarioAgendamento: `${h}:${String(currentStepData.horarioAgendamento || '').split(':')[1] || '00'}`,
                        })
                      }
                    >
                      <SelectTrigger className="h-9 w-full border-2 focus:border-cyan-500">
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
                ) : (
                  <div className="flex items-center p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px]">
                    {currentStepData.horarioAgendamento || "-"}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <DocumentRow
                  label="Comprovante de Agendamento"
                  docField="comprovante-agendamento"
                  isEditing={isEditingDocuments}
                  documents={documents}
                  onUpload={(f) => handleSpecificFileUpload(f, 'comprovante-agendamento', stepId)}
                  onDeleteDoc={handleDeleteDocument}
                  isUploading={!!uploadingFiles[`comprovante-agendamento-${stepId}`]}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="block text-sm font-medium text-slate-700">Observações</Label>
                </div>
                {isEditingDocuments ? (
                  <Textarea
                    id={`observacoes-agendamento-${stepId}`}
                    value={currentStepData.observacoesAgendamento || ""}
                    onChange={(e) => saveStepData(stepId, { observacoesAgendamento: e.target.value })}
                    placeholder="Adicione observações para esta etapa..."
                    rows={3}
                    className="w-full rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5"
                  />
                ) : (
                  <div className="p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px] whitespace-pre-wrap">
                    {currentStepData.observacoesAgendamento || "-"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 2: Preencher Formulário
    if (stepId === 2) {
      return (
        <div className="space-y-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {renderHeader("Formulário")}
            <div className="p-4 md:p-6 grid grid-cols-1 gap-4 md:gap-6">
              <DocumentRow
                label="Formulário de Visto"
                docField="formulario-visto"
                isEditing={isEditingDocuments}
                documents={documents}
                onUpload={(f) => handleSpecificFileUpload(f, 'formulario-visto', stepId)}
                onDeleteDoc={handleDeleteDocument}
                isUploading={!!uploadingFiles[`formulario-visto-${stepId}`]}
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="block text-sm font-medium text-slate-700">Observações</Label>
                </div>
                {isEditingDocuments ? (
                  <Textarea
                    id={`observacoes-${stepId}`}
                    value={notes[stepId] || ""}
                    onChange={(e) => setNotes(prev => ({ ...prev, [stepId]: e.target.value }))}
                    placeholder="Adicione observações para esta etapa..."
                    rows={3}
                    className="w-full rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5"
                  />
                ) : (
                  <div className="p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px] whitespace-pre-wrap">
                    {notes[stepId] || "-"}
                  </div>
                )}
              </div>
              {saveMessages[stepId] ? (
                <div className="text-green-600 text-sm mt-2">{saveMessages[stepId]}</div>
              ) : null}
            </div>
          </div>
        </div>
      );
    }

    // 3: Preparar Documentação
    if (stepId === 3) {
      return (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {renderHeader("Documentação Preparada")}
              <div className="p-4 md:p-6 grid grid-cols-1 gap-4 md:gap-6">
                <DocumentRow
                  label="Formulário de Visto Preenchido"
                  docField="formulario-visto"
                  isEditing={isEditingDocuments}
                  documents={documents}
                  onUpload={(f) => handleSpecificFileUpload(f, 'formulario-visto', stepId)}
                  onDeleteDoc={handleDeleteDocument}
                  isUploading={!!uploadingFiles[`formulario-visto-${stepId}`]}
                />
                <DocumentRow
                  label="Documentos Traduzidos"
                  docField="documentos-traduzidos"
                  isEditing={isEditingDocuments}
                  documents={documents}
                  onUpload={(f) => handleSpecificFileUpload(f, 'documentos-traduzidos', stepId)}
                  onDeleteDoc={handleDeleteDocument}
                  isUploading={!!uploadingFiles[`documentos-traduzidos-${stepId}`]}
                />
                <DocumentRow
                  label="Documentos Autenticados"
                  docField="documentos-autenticados"
                  isEditing={isEditingDocuments}
                  documents={documents}
                  onUpload={(f) => handleSpecificFileUpload(f, 'documentos-autenticados', stepId)}
                  onDeleteDoc={handleDeleteDocument}
                  isUploading={!!uploadingFiles[`documentos-autenticados-${stepId}`]}
                />
              </div>
            </div>
          </div>
          {saveMessages[stepId] ? (
            <div className="text-green-600 text-sm mt-2">{saveMessages[stepId]}</div>
          ) : null}
        </div>
      );
    }

    // 4: Aguardar Aprovação
    if (stepId === 4) {
      return (
        <div className="space-y-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {renderHeader("Aprovação")}
            <div className="p-4 md:p-6 grid grid-cols-1 gap-4 md:gap-6">
              <DocumentRow
                label="Comprovante de Aprovação"
                docField="comprovante-aprovacao"
                isEditing={isEditingDocuments}
                documents={documents}
                onUpload={(f) => handleSpecificFileUpload(f, 'comprovante-aprovacao', stepId)}
                onDeleteDoc={handleDeleteDocument}
                isUploading={!!uploadingFiles[`comprovante-aprovacao-${stepId}`]}
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="block text-sm font-medium text-slate-700">Observações</Label>
                </div>
                {isEditingDocuments ? (
                  <Textarea
                    id={`observacoes-${stepId}`}
                    value={notes[stepId] || ""}
                    onChange={(e) => setNotes(prev => ({ ...prev, [stepId]: e.target.value }))}
                    placeholder="Adicione observações para esta etapa..."
                    rows={3}
                    className="w-full rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5"
                  />
                ) : (
                  <div className="p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px] whitespace-pre-wrap">
                    {notes[stepId] || "-"}
                  </div>
                )}
              </div>
              {saveMessages[stepId] ? (
                <div className="text-green-600 text-sm mt-2">{saveMessages[stepId]}</div>
              ) : null}
            </div>
          </div>
        </div>
      );
    }

    // 5: Processo Finalizado
    if (stepId === 5) {
      return (
        <div className="space-y-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {renderHeader("Finalização")}
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <Label className="block text-sm font-medium text-slate-700">Data de Finalização</Label>
                {isEditingDocuments ? (
                  <Input
                    id={`data-finalizacao-${stepId}`}
                    type="date"
                    value={currentStepData.dataFinalizacao || ""}
                    onChange={(e) => saveStepData(stepId, { dataFinalizacao: e.target.value })}
                    className="flex-1 rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5"
                  />
                ) : (
                  <div className="flex items-center p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px]">
                    {currentStepData.dataFinalizacao ? formatDateBR(currentStepData.dataFinalizacao) : "-"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="block text-sm font-medium text-slate-700">Status do Processo</Label>
                {isEditingDocuments ? (
                  <div className="space-y-2">
                    <Select
                      value={currentStepData.statusFinal || ""}
                      onValueChange={(val) => {
                        saveStepData(stepId, { statusFinal: val, statusFinalOutro: "" })
                      }}
                    >
                      <SelectTrigger className="h-9 w-full border-2 focus:border-cyan-500">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aprovado">Aprovado</SelectItem>
                        <SelectItem value="Negado">Negado</SelectItem>
                        <SelectItem value="Aguardando">Aguardando</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="flex items-center p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px]">
                    {currentStepData.statusFinal || "-"}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className="block text-sm font-medium text-slate-700">Observações Finais</Label>
                {isEditingDocuments ? (
                  <Textarea
                    id={`observacoes-finais-${stepId}`}
                    value={currentStepData.observacoesFinais || ""}
                    onChange={(e) => saveStepData(stepId, { observacoesFinais: e.target.value })}
                    placeholder="Observações finais do processo"
                    rows={4}
                    className="w-full rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5"
                  />
                ) : (
                  <div className="p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px] whitespace-pre-wrap">
                    {currentStepData.observacoesFinais || "-"}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-4">
                <DocumentRow
                  label="Processo Finalizado"
                  docField="processo-finalizado"
                  isEditing={isEditingDocuments}
                  documents={documents}
                  onUpload={(f) => handleSpecificFileUpload(f, 'processo-finalizado', stepId)}
                  onDeleteDoc={handleDeleteDocument}
                  isUploading={!!uploadingFiles[`processo-finalizado-${stepId}`]}
                />
                <DocumentRow
                  label="Relatório Final"
                  docField="relatorio-final"
                  isEditing={isEditingDocuments}
                  documents={documents}
                  onUpload={(f) => handleSpecificFileUpload(f, 'relatorio-final', stepId)}
                  onDeleteDoc={handleDeleteDocument}
                  isUploading={!!uploadingFiles[`relatorio-final-${stepId}`]}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default Fallback
    return (
      <div className="space-y-3">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {renderHeader(step.title || "Detalhes")}
          <div className="p-4 md:p-6 grid grid-cols-1 gap-4 md:gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="block text-sm font-medium text-slate-700">Observações</Label>
              </div>
              {isEditingDocuments ? (
                <Textarea
                  id={`observacoes-${stepId}`}
                  value={notes[stepId] || ""}
                  onChange={(e) => setNotes(prev => ({ ...prev, [stepId]: e.target.value }))}
                  placeholder="Adicione observações para esta etapa..."
                  rows={3}
                  className="w-full rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5"
                />
              ) : (
                <div className="p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px] whitespace-pre-wrap">
                  {notes[stepId] || "-"}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="block text-sm font-medium text-slate-700">Upload de Documentos</Label>
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
            {saveMessages[stepId] ? (
              <div className="text-green-600 text-sm mt-2">{saveMessages[stepId]}</div>
            ) : null}
          </div>
        </div>
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
          <Link href="/dashboard/turismo">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Vistos de Turismo
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleDeleteCase = async () => {
    try {
      await fetch(`/api/turismo?id=${params.id}`, { method: 'DELETE' });
      router.push('/dashboard/turismo');
    } catch (error) {
      console.error('Erro ao deletar caso:', error);
    }
  };

  const docRequirements = [
    {
      title: "Documentos Pessoais",
      step: "Cadastro de Documentos",
      fields: [
        { key: "cpfDoc", label: "CPF" },
        { key: "rnmDoc", label: "RNM" },
        { key: "passaporteDoc", label: "Passaporte" },
        { key: "comprovanteEnderecoDoc", label: "Comprovante de Endereço" },
        { key: "declaracaoResidenciaDoc", label: "Declaração de Residência" },
        { key: "foto3x4Doc", label: "Foto/Selfie" },
        { key: "documentoChinesDoc", label: "Documento Chinês" },
        { key: "antecedentesCriminaisDoc", label: "Antecedentes Criminais" },
      ]
    },
    {
      title: "Comprovação Financeira",
      step: "Cadastro de Documentos",
      fields: [
        { key: "certidaoNascimentoFilhosDoc", label: "Certidão Nascimento Filhos" },
        { key: "cartaoCnpjDoc", label: "CNPJ" },
        { key: "contratoEmpresaDoc", label: "Contrato Social" },
        { key: "escrituraImoveisDoc", label: "Escritura/Matrícula" },
        { key: "extratosBancariosDoc", label: "Extratos Bancários" },
        { key: "impostoRendaDoc", label: "Imposto de Renda" },
      ]
    },
    {
      title: "Outros Documentos",
      step: "Cadastro de Documentos",
      fields: [
        { key: "reservasPassagensDoc", label: "Reservas de Passagens" },
        { key: "reservasHotelDoc", label: "Reservas de Hotel" },
        { key: "seguroViagemDoc", label: "Seguro Viagem" },
        { key: "roteiroViagemDoc", label: "Roteiro de Viagem" },
        { key: "taxaDoc", label: "Taxa Consular" },
        { key: "formularioConsuladoDoc", label: "Formulário do Consulado" },
      ]
    },
    {
      title: "Agendamento",
      step: "Agendar no Consulado",
      fields: [
        { key: "comprovante-agendamento", label: "Comprovante de Agendamento" }
      ]
    },
    {
      title: "Formulário",
      step: "Preencher Formulário",
      fields: [
        { key: "formulario-visto", label: "Formulário de Visto" }
      ]
    },
    {
      title: "Documentação Preparada",
      step: "Preparar Documentação",
      fields: [
        { key: "formulario-visto", label: "Formulário de Visto Preenchido" },
        { key: "documentos-traduzidos", label: "Documentos Traduzidos" },
        { key: "documentos-autenticados", label: "Documentos Autenticados" }
      ]
    },
    {
      title: "Aprovação",
      step: "Aguardar Aprovação",
      fields: [
        { key: "comprovante-aprovacao", label: "Comprovante de Aprovação" }
      ]
    },
    {
      title: "Finalização",
      step: "Processo Finalizado",
      fields: [
        { key: "processo-finalizado", label: "Processo Finalizado" },
        { key: "relatorio-final", label: "Relatório Final" }
      ]
    }
  ];

  const pendingDocs = docRequirements.flatMap(group =>
    group.fields
      .filter(f => !documents.some(d => (d.field_name || d.fieldName) === f.key))
      .map(f => ({ ...f, group: group.step || group.title }))
  );

  const totalDocs = docRequirements.reduce((acc, g) => acc + g.fields.length, 0);
  const completedDocs = totalDocs - pendingDocs.length;
  const progress = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

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
          <Link href="/dashboard/turismo">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{caseData.clientName}</h1>
            <p className="text-muted-foreground">Turismo</p>
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


      <div className="flex flex-col gap-6 lg:gap-8 lg:flex-row lg:items-start">
        <div className="flex flex-col gap-6 lg:gap-8 lg:flex-[2] min-w-0">
          {showWorkflow && (
            <Card className="rounded-xl border-gray-200 shadow-sm min-h-[560px] relative">
              <CardHeader>
                <CardTitle className="flex items-center w-full justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Fluxo do Processo
                  </div>
                  <button
                    onClick={() => setShowInfoModal(true)}
                    className="w-6 h-6 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                    title="Informações do Processo"
                  >
                    <img src="https://cdn-icons-png.flaticon.com/512/9195/9195785.png" alt="Info" className="w-full h-full object-contain" />
                  </button>
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
              <div className="mb-8 space-y-6">
                <div
                  className="space-y-2 cursor-pointer group select-none"
                  onClick={() => setIsPendingDocsOpen(!isPendingDocsOpen)}
                  role="button"
                  aria-expanded={isPendingDocsOpen}
                  aria-controls="pending-docs-section"
                >
                  <div className="flex justify-between text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">Progresso da Documentação</span>
                      {pendingDocs.length > 0 && (
                        isPendingDocsOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <span className="text-gray-900">{progress}% ({completedDocs}/{totalDocs})</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                    <div className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {pendingDocs.length > 0 ? (
                  <div
                    id="pending-docs-section"
                    className={`grid transition-all duration-300 ease-in-out ${isPendingDocsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                  >
                    <div className="overflow-hidden">
                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-5 mt-1">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="flex items-center gap-2 text-amber-800 font-semibold">
                            <AlertCircle className="h-5 w-5" />
                            Documentos Pendentes
                          </h4>
                        </div>
                        <p className="text-sm text-amber-700 mb-4">
                          Os documentos abaixos ainda não foram adicionados ao fluxo do processo.
                        </p>
                        <div className="space-y-4">
                          {Object.entries(
                            pendingDocs.reduce((acc, doc) => {
                              if (!acc[doc.group]) acc[doc.group] = [];
                              acc[doc.group].push(doc);
                              return acc;
                            }, {} as Record<string, typeof pendingDocs>)
                          ).map(([group, docs]) => (
                            <div key={group} className="space-y-2">
                              <h5 className="text-sm font-bold text-amber-900 border-b border-amber-200 pb-1">
                                {group}
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                {docs.map((doc) => (
                                  <div key={doc.key} className="flex items-start gap-2.5 text-sm text-amber-700 group">
                                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 group-hover:scale-125 transition-transform" />
                                    <span className="font-medium">{doc.label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-5 flex items-start gap-4 text-green-800 animate-in fade-in duration-500">
                    <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">Documentação Completa!</h4>
                      <p className="text-green-700">Todos os documentos obrigatórios foram anexados com sucesso.</p>
                    </div>
                  </div>
                )}
              </div>

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

        <div className="flex flex-col gap-6 lg:gap-8 lg:flex-[1] min-w-0">
          <div className="flex flex-col min-h-[560px] space-y-4">
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
            <CardContent className="flex-1 flex flex-col min-h-[400px]">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 max-h-[400px] scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                {notesArray.length > 0 ? (
                  [...notesArray].reverse().map((n) => {
                    const d = new Date(n.timestamp);
                    const formatted = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const name = String(n.authorName || '').trim();
                    const showName = !!name && name.toLowerCase() !== 'equipe';
                    
                    return (
                      <div key={n.id} className="group relative bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            {formatted}
                            {showName && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="text-slate-600 dark:text-slate-400">{name}</span>
                              </>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); deleteNote(n.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-600 rounded transition-all text-slate-400"
                            title="Excluir nota"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-center space-y-2">
                    <div className="p-3 bg-slate-50 rounded-full">
                      <FileText className="h-6 w-6 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-500">Nenhuma observação registrada.</p>
                    <p className="text-xs text-slate-400">Utilize o campo abaixo para adicionar.</p>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="relative">
                  <Textarea 
                    rows={3} 
                    placeholder="Adicione uma nova observação..." 
                    value={notes[0] || ''} 
                    onChange={(e) => setNotes(prev => ({ ...prev, 0: e.target.value }))} 
                    className="w-full resize-none pr-12 min-h-[80px]" 
                  />
                  <div className="absolute bottom-2 right-2 flex items-center gap-2">
                    {saveMessages[0] && (
                      <span className="text-green-600 text-xs font-medium animate-in fade-in slide-in-from-right-2 bg-white/80 px-2 py-1 rounded">
                        Salvo!
                      </span>
                    )}
                    <Button 
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-sm" 
                      onClick={() => saveStepNotes(0)}
                      disabled={!notes[0]?.trim()}
                      title="Salvar observação"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>

          <div>
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

      {/* Process Flow Info Modal */}
      {showInfoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowInfoModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Documentos Pendentes
              </h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                aria-label="Fechar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Os documentos abaixo ainda não foram adicionados ao fluxo do processo.
              </p>
              <div className="space-y-4">
                {pendingDocs.length > 0 ? (
                  Object.entries(
                    pendingDocs.reduce((acc, doc) => {
                      if (!acc[doc.group]) acc[doc.group] = [];
                      acc[doc.group].push(doc);
                      return acc;
                    }, {} as Record<string, typeof pendingDocs>)
                  ).map(([group, docs]) => (
                    <div key={group} className="space-y-2">
                      <h5 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-1">
                        {group}
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                        {docs.map((doc) => (
                          <div key={doc.key} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300 group">
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 group-hover:scale-125 transition-transform" />
                            <span className="font-medium">{doc.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-5 flex items-start gap-4 text-green-800 animate-in fade-in duration-500">
                    <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">Documentação Completa!</h4>
                      <p className="text-green-700">Todos os documentos obrigatórios foram anexados com sucesso.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end items-center rounded-b-xl">
              <Button className="bg-slate-900 text-white shadow-md hover:bg-slate-800 hover:shadow-lg transform hover:scale-105 active:scale-95 h-9 px-4 py-2" onClick={() => setShowInfoModal(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

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

      {/* Modal de Responsável */}
      <Dialog open={showResponsibleModal} onOpenChange={setShowResponsibleModal}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-6 overflow-hidden gap-6">
          <DialogHeader className="mb-0">
            <DialogTitle className="text-xl font-semibold flex items-center gap-3 text-slate-900 dark:text-slate-100">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              Responsável pela Observação
            </DialogTitle>
            <DialogDescription className="text-base text-slate-500 dark:text-slate-400 mt-2 ml-1">
              Identifique quem está registrando esta observação para manter o histórico do processo organizado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="responsible" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                Nome do Responsável
              </Label>
              <div className="relative group">
                <User className="absolute left-3.5 top-3 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  id="responsible"
                  value={noteResponsible}
                  onChange={(e) => setNoteResponsible(e.target.value)}
                  className="pl-11 h-11 text-base bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all shadow-sm hover:border-blue-400 dark:hover:border-blue-600"
                  placeholder="Digite ou selecione abaixo..."
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                Seleção Rápida
              </Label>
              <div className="flex flex-wrap gap-2">
                {RESPONSAVEIS.map((resp) => {
                  const name = resp.split(' – ')[1] || resp;
                  const isSelected = noteResponsible === name;
                  return (
                    <button
                      key={resp}
                      type="button"
                      onClick={() => setNoteResponsible(name)}
                      className={`
                        group flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 border
                        ${isSelected 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-[1.02]' 
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'}
                      `}
                    >
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 animate-in zoom-in duration-200" />}
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-0 -mx-6 -mb-6 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button 
              variant="ghost" 
              onClick={() => setShowResponsibleModal(false)}
              className="h-10 px-4 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              onClick={confirmSaveNote} 
              disabled={!noteResponsible.trim()}
              className="h-10 px-6 bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg shadow-lg shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Confirmar e Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
