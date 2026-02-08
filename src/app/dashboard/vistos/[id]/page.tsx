"use client";

import { useEffect, useState, useRef } from "react";
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
  ChevronUp,
  ChevronDown,
  X,
  Plus,
  Mail,
  Info,
  Hash
} from "lucide-react";
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
import { DetailLayout } from "@/components/detail/DetailLayout";
import { StatusPanel } from "@/components/detail/StatusPanel";
import { formatDateBR, formatISODateLocal } from "@/lib/date";
import { DocumentChip } from "@/components/ui/document-chip";
import { subscribeTable, unsubscribe } from "@/lib/realtime";
import { toast } from "sonner";
import { RESPONSAVEIS } from "@/constants/responsibles";
import { ObservationResponsibleModal } from "@/components/modals/ObservationResponsibleModal";

import { getVistosDocRequirements, computePendingByFlow, extractDocumentsFromRecord } from "@/lib/pending-documents";

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
  "Visto de Trabalho - Brasil": [
    "Cadastro de Documentos",
    "Documentos para Protocolo",
    "Protocolo",
    "Exigências",
    "Processo Finalizado"
  ],
  "Visto de Residência Prévia": [
    "Cadastro de Documentos",
    "Documentos para Protocolo",
    "Protocolo",
    "Exigências",
    "Processo Finalizado"
  ],
  "Visto de Trabalho - Renovação 1 ano": [
    "Cadastro de Documentos",
    "Documentos para Protocolo",
    "Protocolo",
    "Exigências",
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
    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
        {title}
      </h2>
      {!isEditing ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          className="text-slate-500 hover:text-blue-600"
          title="Editar seção"
        >
          <Edit className="w-4 h-4" />
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onCancel} className="text-red-500">
            Cancelar
          </Button>
          <Button size="sm" onClick={onSave} className="bg-green-600 hover:bg-green-700 text-white">
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

  const handlePreview = async (doc: any) => {
    // Tenta abrir direto primeiro, se falhar, tenta fallback
    const loadingToast = toast.loading("Gerando link seguro...");

    try {
      const res = await fetch('/api/documents/sign-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: doc.file_path || doc.url })
      });

      toast.dismiss(loadingToast);

      if (res.ok) {
        const { signedUrl } = await res.json();
        if (signedUrl) {
          const newWindow = window.open(signedUrl, '_blank');
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            // Popup bloqueado
            toast.error("Popup bloqueado. Clique aqui para abrir.", {
              action: {
                label: "Abrir Documento",
                onClick: () => window.open(signedUrl, '_blank')
              },
              duration: 5000
            });
          }
          return;
        }
      }

      // Fallback para URL original se falhar
      console.warn("Falha ao gerar URL assinada, usando original");
      const originalUrl = doc.file_path || doc.url;
      const fallbackWindow = window.open(originalUrl, '_blank');
      if (!fallbackWindow || fallbackWindow.closed || typeof fallbackWindow.closed === 'undefined') {
        toast.error("Popup bloqueado. Clique para abrir.", {
          action: {
            label: "Abrir",
            onClick: () => window.open(originalUrl, '_blank')
          }
        });
      }

    } catch (e) {
      console.error("Erro ao gerar preview:", e);
      toast.dismiss(loadingToast);
      const originalUrl = doc.file_path || doc.url;
      window.open(originalUrl, '_blank');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="block text-sm font-medium text-slate-700">
          {label}
        </Label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex gap-3 items-start">
        {!isEditing ? (
          <div className="flex-1 flex items-center p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm">
            {field ? (
              <span className="font-medium text-slate-700 mr-2">{vistoValue || '-'}</span>
            ) : null}
            <span className={`text-xs ml-auto ${attachedDocs.length > 0 ? "text-green-600 font-medium" : "italic"}`}>
              {attachedDocs.length > 0 ? `${attachedDocs.length} documento(s)` : "Nenhum anexo"}
            </span>
          </div>
        ) : (
          <Input
            value={vistoValue || ""}
            onChange={(e) => onTextChange && onTextChange(e.target.value)}
            className="flex-1 rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5"
            placeholder={placeholder}
            disabled={!field}
          />
        )}

        {isEditing && !!docField && (
          <div className="relative">
            <input
              type="file"
              id={`upload-${docField}`}
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.txt,.rtf"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  Array.from(files).forEach((f) => onUpload(f));
                  e.target.value = '';
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2 px-4 py-2.5"
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
              onOpen={() => handlePreview(doc)}
              onDelete={isEditing ? () => onDeleteDoc(doc) : undefined}
              className="bg-slate-100 border-slate-200 hover:bg-sky-50 hover:border-sky-200 transition-all"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function VistoDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<{ [key: number]: string }>({});
  const [status, setStatus] = useState("");
  const [visto, setVisto] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
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
  const [isPendingDocsOpen, setIsPendingDocsOpen] = useState(false);


  // Estados para dados específicos de cada etapa
  const [stepData, setStepData] = useState<{ [key: number]: any }>({});

  // Refs para debounce
  const fieldDebounceRef = useRef<NodeJS.Timeout>(null);
  const stepDebounceRefs = useRef<{ [key: number]: NodeJS.Timeout }>({});

  // Estados para uploads de arquivos específicos
  const [fileUploads, setFileUploads] = useState<{ [key: string]: File | null }>({});
  const [assignments, setAssignments] = useState<Record<number, { responsibleName?: string; dueDate?: string }>>({});
  const [saveMessages, setSaveMessages] = useState<{ [key: number]: string }>({});
  const [assignOpenStep, setAssignOpenStep] = useState<number | null>(null);
  const [assignResp, setAssignResp] = useState<string>("");
  const [assignDue, setAssignDue] = useState<string>("");
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showResponsibleModal, setShowResponsibleModal] = useState(false);
  const [pendingNote, setPendingNote] = useState<{ stepId: number; text: string } | null>(null);
  const [noteResponsible, setNoteResponsible] = useState("");
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Pending Documents State
  const [pendingDocs, setPendingDocs] = useState<any[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [completedDocs, setCompletedDocs] = useState(0);

  useEffect(() => {
    if (visto && documents) {
      const requirements = getVistosDocRequirements({ type: visto.type, country: visto.country });

      const uploaded = new Set<string>();
      // Add existing docs
      documents.forEach(d => {
        const k = (d as any).field_name || (d as any).fieldName || (d as any).document_type;
        if (k) uploaded.add(k);
      });
      // Add record fields
      const recordDocs = extractDocumentsFromRecord(visto);
      recordDocs.forEach(k => uploaded.add(k));

      const { pending, totalCount, missingCount } = computePendingByFlow(requirements, uploaded);

      // Flatten pending for the list component
      const flatPending: any[] = [];
      pending.forEach(group => {
        group.docs.forEach(doc => {
          flatPending.push({
            key: doc.key,
            label: doc.label,
            group: group.flow,
            status: "pending", // You might want more sophisticated status logic here
            priority: "medium"
          });
        });
      });

      setPendingDocs(flatPending);
      setTotalDocs(totalCount);
      setCompletedDocs(totalCount - missingCount);
    }
  }, [visto, documents]);

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
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed as any;
      if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).entries)) return (parsed as any).entries as any;
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
            setCaseData((prev) => {
              if (!prev) return prev;

              // Normalize fields from snake_case (DB) to camelCase (App)
              const currentStep = Number(next.current_step ?? next.currentStep ?? prev.currentStep);
              const status = next.status ?? prev.status;
              const clientName = next.client_name ?? next.clientName ?? prev.clientName;
              const updatedAt = next.updated_at ?? next.updatedAt ?? new Date().toISOString();

              // Update steps completion if provided
              let newSteps = prev.steps;
              if (next.completed_steps || next.completedSteps) {
                const raw = next.completed_steps ?? next.completedSteps;
                let completedArr: number[] = [];
                if (Array.isArray(raw)) completedArr = raw;
                else if (typeof raw === 'string') {
                  try {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) completedArr = parsed;
                  } catch { }
                }

                newSteps = prev.steps.map(s => ({
                  ...s,
                  completed: completedArr.includes(s.id)
                }));
              }

              return {
                ...prev,
                ...next,
                currentStep,
                status,
                clientName,
                updatedAt,
                steps: newSteps
              };
            });
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
      if (!params.id) {
        console.error("ID do visto não fornecido");
        return;
      }
      const res = await fetch(`/api/vistos?id=${params.id}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ao buscar visto: ${res.status} ${res.statusText}`);
      }
      const record = await res.json();
      if (!record) throw new Error("Visto não encontrado");

      setVisto(record);

      const rawTypeStr = String(record.type || "");
      const lowerType = rawTypeStr.toLowerCase();
      let flowType: VistoType = "Visto de Trabalho";
      if (lowerType.includes("trabalho") && (lowerType.includes("brasil") || String(record.country || "").toLowerCase().includes("brasil"))) {
        flowType = "Visto de Trabalho - Brasil" as any;
      } else if (lowerType.includes("trabalho") && lowerType.includes("residência prévia")) {
        flowType = "Visto de Residência Prévia" as any;
      } else if (lowerType.includes("renov") && lowerType.includes("1 ano")) {
        flowType = "Visto de Trabalho - Renovação 1 ano" as any;
      } else if (lowerType.includes("turismo")) flowType = "Visto de Turismo";
      else if (lowerType.includes("estudante")) flowType = "Visto de Estudante";
      else if (lowerType.includes("reuni") && lowerType.includes("familiar")) flowType = "Visto de Reunião Familiar";

      // Initialize stepData with values from DB record
      const initialStepData: { [key: number]: any } = {};

      // Map fields from record to stepData
      // Find "Processo Finalizado" step index
      const workflowSteps = WORKFLOWS[flowType as keyof typeof WORKFLOWS] || WORKFLOWS["Visto de Trabalho"];
      const finalizadoIndex = workflowSteps.findIndex((s: string) => s === "Processo Finalizado");

      if (finalizadoIndex !== -1) {
        const stepDataFromRecord =
          record?.stepData && typeof record.stepData === 'object'
            ? (record.stepData[finalizadoIndex] ?? record.stepData[String(finalizadoIndex)] ?? {})
            : {};

        const fallbackFromRoot = {
          cargo: record.cargo,
          salario: record.salario,
          dataFinalizacao: record.dataFinalizacao,
          statusFinal: record.statusFinal,
          statusFinalOutro: record.statusFinalOutro,
          observacoesFinais: record.observacoesFinais,
          dataAgendamentoPf: record.dataAgendamentoPf,
          publicacaoDou: record.publicacaoDou,
        } as Record<string, any>;

        Object.keys(fallbackFromRoot).forEach((k) => {
          if (fallbackFromRoot[k] === undefined) delete fallbackFromRoot[k];
        });

        initialStepData[finalizadoIndex] = {
          ...(stepDataFromRecord && typeof stepDataFromRecord === 'object' ? stepDataFromRecord : {}),
          ...fallbackFromRoot,
        };
      }

      setStepData(prev => {
        // Merge with existing stepData to avoid losing transient state if any
        const merged = { ...(record?.stepData && typeof record.stepData === 'object' ? record.stepData : {}), ...prev };
        Object.keys(initialStepData).forEach(key => {
          const k = Number(key);
          merged[k] = { ...merged[k], ...initialStepData[k] };
        });
        return merged;
      });

      const steps: StepData[] = workflowSteps.map((title: string, index: number) => ({
        id: index,
        title,
        description: `Descrição da etapa ${title}`,
        completed: false,
        notes: "",
      }));
      const recordCurrentStep = Number(record.currentStep ?? 0);
      const initialCurrentStep = recordCurrentStep;
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

    } catch (error: any) {
      console.error("Erro ao buscar dados do caso:", error);
      setError(error.message || "Ocorreu um erro ao carregar os dados do visto.");
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

  const validateFile = (file: File) => {
    // Valid types
    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'text/plain', // .txt
      'application/rtf' // .rtf
    ];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (file.size === 0) {
      toast.error(`Arquivo vazio: ${file.name}.`);
      return false;
    }

    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|doc|docx|xls|xlsx|txt|rtf)$/i)) {
      toast.error(`Formato inválido: ${file.name}.`);
      return false;
    }

    if (file.size > maxSize) {
      toast.error(`Arquivo muito grande: ${file.name}. Máximo 50MB.`);
      return false;
    }
    return true;
  };

  const handleFileUpload = async (files: FileList | File[] | null, stepId?: number) => {
    const arr = !files ? [] : Array.isArray(files) ? files : Array.from(files);
    if (!arr.length) return;

    const validFiles = arr.filter(validateFile);
    if (validFiles.length === 0) return;

    const uploadKey = stepId !== undefined ? `step-${stepId}` : 'general';
    setUploadingFiles(prev => ({ ...prev, [uploadKey]: true }));

    try {
      for (const file of validFiles) {
        await processUpload(file, 'documentoAnexado', stepId);
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
    if (!validateFile(file)) return;

    const uploadKey = `${fieldKey}-${stepId}`;
    setUploadingFiles(prev => ({ ...prev, [uploadKey]: true }));
    try {
      await processUpload(file, fieldKey, stepId);
      await fetchDocuments();
    } catch (error) {
      console.error("Erro ao fazer upload específico:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao realizar upload.");
    } finally {
      setUploadingFiles(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const processUpload = async (file: File, fieldName: string, stepId?: number) => {
    const contentType = file.type || 'application/octet-stream';
    const getErrorMessage = async (res: Response, fallback: string) => {
      try {
        const data = await res.json().catch(() => ({} as any));
        return String(data?.error || data?.message || fallback);
      } catch {
        return fallback;
      }
    };

    // 1. Get Signed URL
    const signRes = await fetch('/api/documents/upload/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: contentType,
        caseId: params.id,
        moduleType: 'vistos',
        fieldName: fieldName,
        clientName: caseData?.clientName || 'Cliente'
      })
    });

    if (!signRes.ok) {
      throw new Error(await getErrorMessage(signRes, 'Erro ao gerar URL de upload'));
    }

    const { signedUrl, publicUrl } = await signRes.json();

    // 2. Upload with Retry
    await uploadWithRetry(signedUrl, file);

    // 3. Register Metadata
    const regRes = await fetch('/api/documents/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filePath: publicUrl,
        fileName: file.name,
        fileType: contentType,
        fileSize: file.size,
        caseId: params.id,
        moduleType: 'vistos',
        fieldName: fieldName,
        clientName: caseData?.clientName || 'Cliente'
      })
    });

    if (regRes.ok) {
      const payload = await regRes.json();
      if (payload?.document) {
        setDocuments(prev => [payload.document, ...prev]);
        toast.success(`Upload concluído: ${file.name}`);
      }
    } else {
      throw new Error(await getErrorMessage(regRes, 'Erro ao registrar metadados'));
    }
  };

  const uploadWithRetry = async (url: string, file: File, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', url);
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response);
            else reject(new Error(`Status ${xhr.status}`));
          };
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(file);
        });
        return;
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i))); // Exponential backoff
      }
    }
  };



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
          } catch { }
        } catch (e) {
          console.error('Erro ao persistir currentStep:', e);
        }
      })();
      return { ...prev, steps: updatedSteps, currentStep: newCurrent };
    });
  };

  const saveStepData = async (stepId: number, data: any) => {
    // 1. Atualização Otimista Imediata
    const next = { ...stepData, [stepId]: { ...(stepData[stepId] || {}), ...data } };
    setStepData(next);

    // 2. Debounce da persistência (1000ms delay)
    if (stepDebounceRefs.current[stepId]) {
      clearTimeout(stepDebounceRefs.current[stepId]);
    }

    stepDebounceRefs.current[stepId] = setTimeout(async () => {
      // persistir todo o stepData após merge para manter alterações após recarga
      try {
        const payload: any = { stepData: next };
        // Lift specific fields to top level if present in this update
        if (data.cargo !== undefined) payload.cargo = data.cargo;
        if (data.salario !== undefined) payload.salario = data.salario;
        if (data.dataFinalizacao !== undefined) payload.dataFinalizacao = data.dataFinalizacao;
        if (data.observacoesFinais !== undefined) payload.observacoesFinais = data.observacoesFinais;
        if (data.dataAgendamentoPf !== undefined) payload.dataAgendamentoPf = data.dataAgendamentoPf;
        if (data.statusFinal !== undefined) payload.statusFinal = data.statusFinal;
        if (data.statusFinalOutro !== undefined) payload.statusFinalOutro = data.statusFinalOutro;

        const res = await fetch(`/api/vistos?id=${params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setSaveMessages(prev => ({ ...prev, [stepId]: 'Salvo' }));
          setCaseData((prev) => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev);
        }
      } catch (e) {
        console.error('Erro ao salvar stepData:', e);
      }

      // Lógica de notas (title/entries) - mantida dentro do debounce para evitar flood
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
    }, 1000); // 1 segundo de espera
  };

  const saveStepNotes = (stepId: number) => {
    const text = (notes[stepId] || '').trim();
    if (!text) return;
    setPendingNote({ stepId, text });
    setNoteResponsible("");
    setShowResponsibleModal(true);
  };

  const confirmSaveNote = async (responsibleName?: string) => {
    const finalResponsible = responsibleName || noteResponsible;
    if (!pendingNote || !finalResponsible.trim()) return;

    const { stepId, text } = pendingNote;
    const iso = new Date().toISOString();
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const arr = parseNotesArray(visto?.notes);

    const suggestion = RESPONSAVEIS.find((r) => r.includes(finalResponsible)) || '';
    const role = suggestion ? suggestion.split(' – ')[0] : '';

    const next = [...arr, { id, stepId, content: text, timestamp: iso, authorName: finalResponsible, authorRole: role }];
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
        console.log('Nota salva', { id, stepId, authorName: finalResponsible, timestamp: iso });
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
    // 1. Atualização Otimista
    setVisto((prev: any) => ({ ...(prev || {}), [field]: value }));
    if (field === 'clientName') {
      setCaseData((prev) => prev ? { ...prev, clientName: value } : prev);
    }

    // 2. Debounce
    if (fieldDebounceRef.current) {
      clearTimeout(fieldDebounceRef.current);
    }

    fieldDebounceRef.current = setTimeout(async () => {
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
    }, 1000);
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
        } catch { }
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
        case "Visto de Trabalho - Brasil" as any:
          return renderVistoTrabalhoStepContent(step);
        case "Trabalho:Brasil":
          return renderVistoTrabalhoStepContent(step);
        case "Visto de Residência Prévia" as any:
          return renderVistoTrabalhoStepContent(step);
        case "Trabalho:Residência Prévia":
          return renderVistoTrabalhoStepContent(step);
        case "Visto de Trabalho - Renovação 1 ano" as any:
          return renderVistoTrabalhoStepContent(step);
        case "Trabalho:Renovação 1 ano":
          return renderVistoTrabalhoStepContent(step);
        default:
          return renderDefaultStepContent(step);
      }
    }

    switch (caseData.type) {
      case "Visto de Trabalho":
        return renderVistoTrabalhoStepContent(step);
      case "Visto de Trabalho - Brasil" as any:
        return renderVistoTrabalhoStepContent(step);
      case "Trabalho:Brasil":
        return renderVistoTrabalhoStepContent(step);
      case "Visto de Residência Prévia" as any:
        return renderVistoTrabalhoStepContent(step);
      case "Trabalho:Residência Prévia":
        return renderVistoTrabalhoStepContent(step);
      case "Visto de Trabalho - Renovação 1 ano" as any:
        return renderVistoTrabalhoStepContent(step);
      case "Trabalho:Renovação 1 ano":
        return renderVistoTrabalhoStepContent(step);
      case "Visto de Turismo":
        return renderVistoTurismoStepContent(step);
      case "Visto de Estudante":
        return renderVistoEstudanteStepContent(step);
      case "Visto de Reunião Familiar":
        return renderVistoReuniaoFamiliarStepContent(step);
      default:
        // Check if it's a generic Residência Prévia case
        if (caseData?.type?.includes("Residência Prévia")) {
          return renderVistoTrabalhoStepContent(step);
        }
        return renderDefaultStepContent(step);
    }
  };

  const handleSaveVisto = async () => {
    try {
      setLoading(true);

      // Extract cargo and salario from stepData if available to ensure persistence even if debounce hasn't fired
      let additionalFields: any = {};
      Object.values(stepData).forEach((s: any) => {
        if (s?.cargo) additionalFields.cargo = s.cargo;
        if (s?.salario) additionalFields.salario = s.salario;
        if (s?.dataFinalizacao) additionalFields.dataFinalizacao = s.dataFinalizacao;
        if (s?.observacoesFinais) additionalFields.observacoesFinais = s.observacoesFinais;
        if (s?.dataAgendamentoPf) additionalFields.dataAgendamentoPf = s.dataAgendamentoPf;
        if (s?.statusFinal) additionalFields.statusFinal = s.statusFinal;
        if (s?.statusFinalOutro) additionalFields.statusFinalOutro = s.statusFinalOutro;
        if (s?.publicacaoDou) additionalFields.publicacaoDou = s.publicacaoDou;
      });

      const response = await fetch(`/api/vistos?id=${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Campos gerais
          type: visto?.type,
          country: visto?.country,
          travelStartDate: visto?.travelStartDate,
          travelEndDate: visto?.travelEndDate,

          // Campos específicos do Visto de Trabalho - Brasil
          numeroProcesso: visto?.numeroProcesso,

          // Preservar outros campos
          ...visto,

          // Override with latest step data
          ...additionalFields,
          stepData
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar dados do visto');
      }

      const updatedVisto = await response.json();
      setVisto(updatedVisto);

      // Atualizar o passo atual para concluído se necessário
      // ou apenas notificar sucesso
      alert("Dados salvos com sucesso!");

    } catch (error) {
      console.error('Erro ao salvar:', error);
      // alert("Erro ao salvar dados. Tente novamente.");
    } finally {
      setLoading(false);
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
      onSave={async () => {
        setIsEditingDocuments(false);
        await handleSaveVisto();
        await fetchCaseData();
      }}
    />
  );

  const renderVistoTrabalhoStepContent = (step: StepData) => {
    const stepId = step.id;
    const currentStepData = stepData[stepId] || {};

    switch (stepId) {
      case 0: { // Cadastro de Documentos
        // Implementação do fluxo de documentos para "Trabalho - Brasil" e "Residência Prévia" e "Renovação 1 ano"
        const isBrasil = (caseData?.type as string) === "Visto de Trabalho - Brasil" ||
          (caseData?.type as string)?.includes("Trabalho:Brasil") ||
          (caseData?.type as string) === "Visto de Trabalho - Renovação 1 ano" ||
          (caseData?.type as string)?.includes("Renovação 1 ano");
        const isResidenciaPrevia = (caseData?.type as string) === "Visto de Residência Prévia" || (caseData?.type as string)?.includes("Residência Prévia");

        if (isBrasil || isResidenciaPrevia) {
          return (
            <div className="space-y-8 pb-8">
              {/* 1. Identificação */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {renderHeader("1. Identificação")}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderRow(stepId, "Passaporte", "passaporte", "passaporteDoc")}
                  {renderRow(stepId, "CPF", "cpf", "cpfDoc")}
                  {renderRow(stepId, "RNM", "rnm", "rnmDoc")}
                </div>
              </div>

              {/* 2. Documentos da Empresa */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {renderHeader("2. Documentos da Empresa")}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderRow(stepId, "Contrato Social", "contratoEmpresa", "contratoEmpresaDoc")}
                  {renderRow(stepId, "CNPJ", "cartaoCnpj", "cartaoCnpjDoc")}
                  {renderRow(stepId, "GFIP", "gfip", "gfipDoc")}
                </div>
              </div>

              {/* 3. Certidões do País de Origem */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {renderHeader("3. Certidões do País de Origem")}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderRow(stepId, "Certidão Criminal", "antecedentesCriminais", "antecedentesCriminaisDoc")}
                  {renderRow(stepId, "Certificado de Trabalho", "certificadoTrabalho", "certificadoTrabalhoDoc")}
                  {renderRow(stepId, "Diploma", "diploma", "diplomaDoc")}
                  {renderRow(stepId, "Certidão de Nascimento", "certidaoNascimento", "certidaoNascimentoDoc")}
                </div>
              </div>

              {/* 4. Traduções Juramentadas */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {renderHeader("4. Traduções Juramentadas")}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderRow(stepId, "Tradução Certidão Criminal", "traducaoAntecedentesCriminais", "traducaoAntecedentesCriminaisDoc")}
                  {renderRow(stepId, "Tradução Certificado de Trabalho", "traducaoCertificadoTrabalho", "traducaoCertificadoTrabalhoDoc")}
                  {renderRow(stepId, "Tradução Diploma", "traducaoDiploma", "traducaoDiplomaDoc")}
                  {renderRow(stepId, "Tradução Certidão de Nascimento", "traducaoCertidaoNascimento", "traducaoCertidaoNascimentoDoc")}
                </div>
              </div>

              {/* 5. Procurações */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {renderHeader("5. Procurações")}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderRow(stepId, "Procuração Empresa", "procuracaoEmpresa", "procuracaoEmpresaDoc")}
                  {renderRow(stepId, "Procuração Empresa Assinada", "procuracaoEmpresaAssinada", "procuracaoEmpresaAssinadaDoc")}
                  {renderRow(stepId, "Procuração Imigrante", "procuracaoImigrante", "procuracaoImigranteDoc")}
                  {renderRow(stepId, "Procuração Imigrante Assinada", "procuracaoImigranteAssinada", "procuracaoImigranteAssinadaDoc")}
                </div>
              </div>

            </div>
          );
        }

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

        if (isTurismo) {
          return (
            <div className="space-y-8 pb-8">
              {/* 1. Dados do Cliente */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {renderHeader("1. Dados do Cliente")}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome do Cliente */}
                  <div className="space-y-2">
                    {isEditingDocuments ? (<Label htmlFor={`clientName-${stepId}`}>Nome do Cliente</Label>) : <Label className="block text-sm font-medium text-slate-700">Nome do Cliente</Label>}
                    {isEditingDocuments ? (
                      <Input
                        id={`clientName-${stepId}`}
                        value={String(visto?.clientName || caseData?.clientName || (visto as any)?.client_name || '')}
                        onChange={(e) => handleVistoFieldChange('clientName', e.target.value)}
                        placeholder="Nome completo"
                        className="w-full rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5"
                      />
                    ) : (
                      <div className="p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px] flex items-center">
                        {String(caseData?.clientName || visto?.clientName || (visto as any)?.client_name || '-')}
                      </div>
                    )}
                  </div>

                  {/* Tipo do Visto */}
                  <div className="space-y-2">
                    {isEditingDocuments ? (<Label htmlFor={`type-${stepId}`}>Tipo do Visto</Label>) : <Label className="block text-sm font-medium text-slate-700">Tipo do Visto</Label>}
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
                      <div className="p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px] flex items-center">
                        {String(visto?.type || caseData?.type || '-')}
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
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderRow(stepId, "Passaporte", "passaporte", "passaporteDoc")}
                  {renderRow(stepId, "CPF", "cpf", "cpfDoc")}
                  {renderRow(stepId, "RNM", "rnm", "rnmDoc")}
                  {renderRow(stepId, "Comprovante de Endereço", "comprovanteEndereco", "comprovanteEnderecoDoc")}
                  {renderRow(stepId, "Foto/Selfie", undefined, "foto3x4Doc")}
                  {renderRow(stepId, "Antecedentes Criminais", "antecedentesCriminais", "antecedentesCriminaisDoc")}
                </div>
              </div>

              {/* 3. Comprovação Financeira */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {renderHeader("3. Comprovação Financeira")}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderRow(stepId, "Empresa: Cartão CNPJ", "cartaoCnpj", "cartaoCnpjDoc")}
                  {renderRow(stepId, "Contrato Social", "contratoEmpresa", "contratoEmpresaDoc")}
                </div>
              </div>

              {/* 4. Histórico e Segurança */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {renderHeader("4. Histórico e Segurança")}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderRow(stepId, "Declaração de Antecedentes Criminais", "declaracaoAntecedentesCriminais", "declaracaoAntecedentesCriminaisDoc")}
                </div>
              </div>

              {/* 5. Formação Acadêmica */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {renderHeader("5. Formação Acadêmica")}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderRow(stepId, "Diploma", "diploma", "diplomaDoc")}
                </div>
              </div>

              {/* 6. Formulários */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {renderHeader("6. Formulários")}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderRow(stepId, "Formulário de Visto", undefined, "formulario-visto")}
                </div>
              </div>
            </div>
          );
        }

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
                        {isTurismo ? (
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
                  {renderRow('País do Visto', 'country', '')}
                  {renderRow('CPF', 'cpf', 'cpfDoc')}
                  {renderRow('RNM', 'rnm', 'rnmDoc')}
                  {renderRow('Passaporte', 'passaporte', 'passaporteDoc')}
                  {renderRow('Comprovante de Endereço', 'comprovanteEndereco', 'comprovanteEnderecoDoc')}
                  {renderRow('Foto/Selfie', undefined, 'foto3x4Doc')}
                  {renderRow('Documento Chinês (quando aplicável)', 'documentoChines', 'documentoChinesDoc')}
                  {!showBrasil && renderRow('Antecedentes Criminais', 'antecedentesCriminais', 'antecedentesCriminaisDoc')}
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
                  {renderRow('Filhos (Certidão de Nascimento)', 'certidaoNascimentoFilhos', 'certidaoNascimentoFilhosDoc')}
                  {renderRow('Empresa: Cartão CNPJ', 'cartaoCnpj', 'cartaoCnpjDoc')}
                  {renderRow('Contrato Social', 'contratoEmpresa', 'contratoEmpresaDoc')}
                </div>
              </div>
            ) : null}

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
                {renderRow('Antecedentes Criminais', 'antecedentesCriminais', 'antecedentesCriminaisDoc')}
                {renderRow('Declaração de Antecedentes Criminais', 'declaracaoAntecedentesCriminais', 'declaracaoAntecedentesCriminaisDoc')}
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
                {renderRow('Diploma', 'diploma', 'diplomaDoc')}
              </div>
            </div>

            {showResidenciaPrevia ? (
              <div className="space-y-4" >
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-base">Residência Prévia</h4>
                  {!isEditingDocuments ? (
                    <Button size="icon" variant="outline" className="h-7 w-7 p-0" onClick={() => setIsEditingDocuments(true)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
                  {renderRow('Formulário RN02', 'formularioRn02', 'formularioRn02Doc')}
                  {renderRow('Comprovante Residência Prévia', 'comprovanteResidenciaPrevia', 'comprovanteResidenciaPreviaDoc')}
                  {renderRow('Comprovante de Atividade', 'comprovanteAtividade', 'comprovanteAtividadeDoc')}
                  {renderRow('Protocolado', 'protocolado', 'protocoladoDoc')}
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
                  {renderRow('Comprovante de Investimento', 'comprovanteInvestimento', 'comprovanteInvestimentoDoc')}
                  {renderRow('Plano de Investimentos', 'planoInvestimentos', 'planoInvestimentosDoc')}
                  {renderRow('Formulário de Requerimento', 'formularioRequerimento', 'formularioRequerimentoDoc')}
                  {renderRow('Protocolado', 'protocolado', 'protocoladoDoc')}
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
                  {renderRow('Contrato de Trabalho', 'contratoTrabalho', 'contratoTrabalhoDoc')}
                  {renderRow('Folha de Pagamento', 'folhaPagamento', 'folhaPagamentoDoc')}
                  {renderRow('Comprovante de Vínculo Anterior', 'comprovanteVinculoAnterior', 'comprovanteVinculoAnteriorDoc')}
                  {renderRow('Justificativa Mudança de Empregador', 'justificativaMudancaEmpregador', 'justificativaMudancaEmpregadorDoc')}
                  {renderRow('Declaração de Antecedentes Criminais', 'declaracaoAntecedentesCriminais', 'declaracaoAntecedentesCriminaisDoc')}
                  {renderRow('Protocolado', 'protocolado', 'protocoladoDoc')}
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
                  {renderRow('Diploma', 'diploma', 'diplomaDoc')}
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
                  {renderRow('CTPS', 'ctps', 'ctpsDoc')}
                  {renderRow('Contrato de Trabalho Anterior', 'contratoTrabalhoAnterior', 'contratoTrabalhoAnteriorDoc')}
                  {renderRow('Contrato de Trabalho Atual', 'contratoTrabalhoAtual', 'contratoTrabalhoAtualDoc')}
                  {renderRow('Formulário de Prorrogação', 'formularioProrrogacao', 'formularioProrrogacaoDoc')}
                  {renderRow('Protocolado', 'protocolado', 'protocoladoDoc')}
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
                  {renderRow('Contrato de Trabalho Indeterminado', 'contratoTrabalhoIndeterminado', 'contratoTrabalhoIndeterminadoDoc')}
                  {renderRow('Protocolado', 'protocolado', 'protocoladoDoc')}
                </div>
              </div>
            ) : null}
          </div>
        );
      }

      case 1: { // Agendar no Consulado
        // Implementação do fluxo de documentos para protocolo (Renovação 1 ano)
        const isRenovacao1Ano = (caseData?.type as string) === "Visto de Trabalho - Renovação 1 ano" ||
          (caseData?.type as string)?.includes("Renovação 1 ano");

        if (isRenovacao1Ano) {
          return (
            <div className="space-y-8 pb-8">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {renderHeader("Documentos para Protocolo")}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderRow(stepId, "Contrato Social", "contratoEmpresa", "contratoEmpresaDoc")}
                  {renderRow(stepId, "CTPS", "ctps", "ctpsDoc")}
                  {renderRow(stepId, "RNM", "rnm", "rnmDoc")}
                  {renderRow(stepId, "Contrato de trabalho anterior", "contratoTrabalhoAnterior", "contratoTrabalhoAnteriorDoc")}
                  {renderRow(stepId, "Declaração de Antecedentes", "antecedentesCriminais", "antecedentesCriminaisDoc")}
                  {renderRow(stepId, "Formulário prorrogação", "formularioProrrogacao", "formularioProrrogacaoDoc")}
                  {renderRow(stepId, "Contrato de trabalho atual", "contratoTrabalho", "contratoTrabalhoDoc")}
                  {renderRow(stepId, "Procuração empresa", "procuracaoEmpresa", "procuracaoEmpresaDoc")}
                </div>
              </div>
            </div>
          );
        }

        // Implementação do fluxo de documentos para protocolo (Brasil e Residência Prévia)
        const isBrasil = (caseData?.type as string) === "Visto de Trabalho - Brasil" ||
          (caseData?.type as string)?.includes("Trabalho:Brasil");
        const isResidenciaPrevia = (caseData?.type as string) === "Visto de Residência Prévia" || (caseData?.type as string)?.includes("Residência Prévia");

        if (isBrasil) {
          return (
            <div className="space-y-8 pb-8">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {renderHeader("Documentos para Protocolo")}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderRow(stepId, "Formulário RN 01/2017", "formularioRn01", "formularioRn01Doc")}
                  {renderRow(stepId, "Declaração de Compreensão", "declaracaoCompreensao", "declaracaoCompreensaoDoc")}
                  {renderRow(stepId, "Declaração de Não Antecedentes", "declaracaoNaoAntecedentes", "declaracaoNaoAntecedentesDoc")}
                  {renderRow(stepId, "Declarações da Empresa", "declaracoesEmpresa", "declaracoesEmpresaDoc")}
                  {renderRow(stepId, "Convenção Coletiva da Categoria", "convencaoColetiva", "convencaoColetivaDoc")}
                  {renderRow(stepId, "Contrato de Trabalho", "contratoTrabalho", "contratoTrabalhoDoc")}
                  {renderRow(stepId, "GRU", "gru", "gruDoc")}
                  {renderRow(stepId, "Comprovante de Pagamento GRU", "comprovantePagamentoGru", "comprovantePagamentoGruDoc")}
                  {renderRow(stepId, "I1 Criminal", "i1Criminal", "i1CriminalDoc", "Arquivo contendo certidão do país de origem, tradução juramentada e certidões do TJ do estado e do TJF")}
                  {renderRow(stepId, "I2 Trabalho", "i2Trabalho", "i2TrabalhoDoc", "Arquivo contendo declaração de trabalho do país de origem e tradução juramentada")}
                  {renderRow(stepId, "I3 Diploma", "i3Diploma", "i3DiplomaDoc", "Arquivo contendo declaração de trabalho do país de origem e tradução juramentada")}
                  {renderRow(stepId, "I6 Nascimento", "i6Nascimento", "i6NascimentoDoc", "Arquivo contendo declaração de trabalho do país de origem e tradução juramentada")}
                </div>
              </div>
            </div>
          );
        }

        if (isResidenciaPrevia) {
          return (
            <div className="space-y-8 pb-8">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {renderHeader("Documentos para Protocolo")}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderRow(stepId, "Contrato Social", "contratoEmpresa", "contratoEmpresaDoc")}
                  {renderRow(stepId, "Formulário RN 02", "formularioRn02", "formularioRn02Doc")}
                  {renderRow(stepId, "CNPJ", "cartaoCnpj", "cartaoCnpjDoc")}
                  {renderRow(stepId, "Folha de Pagamento", "folhaPagamento", "folhaPagamentoDoc")}
                  {renderRow(stepId, "Declarações da Empresa", "declaracoesEmpresa", "declaracoesEmpresaDoc")}
                  {renderRow(stepId, "Procuração Empresa", "procuracaoEmpresa", "procuracaoEmpresaDoc")}
                  {renderRow(stepId, "Trabalho", "trabalho", "trabalhoDoc")}
                  {renderRow(stepId, "Diploma", "diploma", "diplomaDoc")}
                  {renderRow(stepId, "Contrato de trabalho", "contratoTrabalho", "contratoTrabalhoDoc")}
                  {renderRow(stepId, "Passaporte", "passaporte", "passaporteDoc")}
                  {renderRow(stepId, "GUIA PAGA", "guiaPaga", "guiaPagaDoc")}
                  {renderRow(stepId, "Declaração de Compreensão", "declaracaoCompreensao", "declaracaoCompreensaoDoc")}
                </div>
              </div>
            </div>
          );
        }

        if (!step.title.toLowerCase().includes("agendar")) {
          return renderDefaultStepContent(step);
        }
        return (
          <div className="space-y-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {renderHeader("Agendamento")}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
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










      case 2: { // Protocolo
        // Implementação do fluxo de Protocolo (Brasil e Residência Prévia e Renovação 1 ano)
        const isBrasil = (caseData?.type as string) === "Visto de Trabalho - Brasil" ||
          (caseData?.type as string)?.includes("Trabalho:Brasil") ||
          (caseData?.type as string) === "Visto de Trabalho - Renovação 1 ano" ||
          (caseData?.type as string)?.includes("Renovação 1 ano");
        const isResidenciaPrevia = (caseData?.type as string) === "Visto de Residência Prévia" || (caseData?.type as string)?.includes("Residência Prévia");

        if (isBrasil || isResidenciaPrevia) {
          return (
            <div className="space-y-8 pb-8">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {renderHeader("Protocolo")}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Campo 1: Comprovante de Protocolo (Upload) */}
                  {renderRow(stepId, "Comprovante de Protocolo", undefined, "comprovanteProtocolo")}

                  {/* Campo 2: Número do Processo (Input) */}
                  {renderRow(stepId, "Número do Processo", "numeroProcesso", undefined)}
                </div>
              </div>
            </div>
          );
        }

        if (!step.title.toLowerCase().includes("protocolo")) {
          return renderDefaultStepContent(step);
        }
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
              {renderDefaultStepContent(step)}
            </div>
          </div>
        );
      }

      case 3: { // Exigências
        // Implementação do fluxo de Exigências (Brasil e Residência Prévia e Renovação 1 ano)
        const isBrasil = (caseData?.type as string) === "Visto de Trabalho - Brasil" ||
          (caseData?.type as string)?.includes("Trabalho:Brasil") ||
          (caseData?.type as string) === "Visto de Trabalho - Renovação 1 ano" ||
          (caseData?.type as string)?.includes("Renovação 1 ano");
        const isResidenciaPrevia = (caseData?.type as string) === "Visto de Residência Prévia" || (caseData?.type as string)?.includes("Residência Prévia");

        if (isBrasil || isResidenciaPrevia) {
          return (
            <div className="space-y-8 pb-8">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {renderHeader("Exigências")}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 1. Carta de Exigência (Upload Múltiplo) */}
                  {renderRow(stepId, "Carta de Exigência", undefined, "cartaExigencia", "Faça upload da carta de exigência recebida (PDF, Imagens).")}

                  {/* 2. Documentos Exigidos (Upload Múltiplo) */}
                  {renderRow(stepId, "Documentos Exigidos", undefined, "documentosExigidos", "Anexe todos os documentos solicitados na exigência.")}

                  {/* 3. Prazo de Cumprimento (Data) */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="block text-sm font-medium text-slate-700">
                        Prazo de Cumprimento
                      </Label>
                    </div>
                    {isEditingDocuments ? (
                      <Input
                        type="date"
                        value={currentStepData.prazoCumprimento || ""}
                        min={formatISODateLocal()}
                        onChange={(e) => saveStepData(stepId, { prazoCumprimento: e.target.value })}
                        className="flex-1 rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5"
                      />
                    ) : (
                      <div className="flex items-center p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px]">
                        {currentStepData.prazoCumprimento ? formatDateBR(currentStepData.prazoCumprimento) : "-"}
                      </div>
                    )}
                  </div>

                  {/* 4. Carta Resposta (Upload) */}
                  {renderRow(stepId, "Carta Resposta", undefined, "cartaResposta", "Anexe a carta resposta ou petição de cumprimento.")}

                  {/* 5. Data Protocolo (Data) */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="block text-sm font-medium text-slate-700">
                        Data Protocolo
                      </Label>
                    </div>
                    {isEditingDocuments ? (
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={currentStepData.dataProtocolo || ""}
                          onChange={(e) => saveStepData(stepId, { dataProtocolo: e.target.value })}
                          className="flex-1 rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => saveStepData(stepId, { dataProtocolo: formatISODateLocal() })}
                          className="px-3"
                          title="Definir data de hoje"
                        >
                          Hoje
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px]">
                        {currentStepData.dataProtocolo ? formatDateBR(currentStepData.dataProtocolo) : "-"}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          );
        }
        return renderDefaultStepContent(step);
      }

      case 4: {
        const isBrasil = (caseData?.type as string) === "Visto de Trabalho - Brasil" ||
          (caseData?.type as string)?.includes("Trabalho:Brasil") ||
          (caseData?.type as string) === "Visto de Trabalho - Renovação 1 ano" ||
          (caseData?.type as string)?.includes("Renovação 1 ano");
        const isResidenciaPrevia = (caseData?.type as string) === "Visto de Residência Prévia" || (caseData?.type as string)?.includes("Residência Prévia");

        if (isBrasil || isResidenciaPrevia) {
          return (
            <div className="space-y-8 pb-8">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {renderHeader("Processo Finalizado")}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 1. Status Final */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="block text-sm font-medium text-slate-700">
                        Status
                      </Label>
                    </div>
                    {isEditingDocuments ? (
                      <div className="space-y-2">
                        <Select
                          value={String(currentStepData.statusFinal || "")}
                          onValueChange={(val) => {
                            const isOutro = val === "Outro";
                            saveStepData(stepId, { statusFinal: val, statusFinalOutro: isOutro ? (currentStepData.statusFinalOutro || "") : "" });
                          }}
                        >
                          <SelectTrigger className="w-full rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5 h-auto">
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Deferido">Deferido</SelectItem>
                            <SelectItem value="Indeferido">Indeferido</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        {String(currentStepData.statusFinal || "") === "Outro" && (
                          <Input
                            value={String(currentStepData.statusFinalOutro || "")}
                            onChange={(e) => saveStepData(stepId, { statusFinalOutro: e.target.value })}
                            placeholder="Digite o status..."
                            className="w-full rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px]">
                        {currentStepData.statusFinal === "Outro"
                          ? (currentStepData.statusFinalOutro || "Outro")
                          : (currentStepData.statusFinal || "-")}
                      </div>
                    )}
                  </div>

                  {/* 2. Observações */}
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center gap-2">
                      <Label className="block text-sm font-medium text-slate-700">
                        Observações
                      </Label>
                    </div>
                    {isEditingDocuments ? (
                      <Textarea
                        value={currentStepData.observacoesFinais || ""}
                        onChange={(e) => saveStepData(stepId, { observacoesFinais: e.target.value })}
                        placeholder="Adicione observações finais..."
                        className="w-full rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5 min-h-[80px]"
                        maxLength={500}
                      />
                    ) : (
                      <div className="flex items-start p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px] whitespace-pre-wrap">
                        {currentStepData.observacoesFinais || "-"}
                      </div>
                    )}
                  </div>

                  {/* 3. Publicação D.O.U (Upload) */}
                  {renderRow(stepId, "Publicação D.O.U", undefined, "publicacaoDou", "Anexe o arquivo de publicação no Diário Oficial (PDF, DOC).")}

                  {/* 4. Cargo */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="block text-sm font-medium text-slate-700">
                        Cargo
                      </Label>
                    </div>
                    {isEditingDocuments ? (
                      <Input
                        value={currentStepData.cargo || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^[a-zA-Z\s]*$/.test(val)) {
                            saveStepData(stepId, { cargo: val });
                          }
                        }}
                        placeholder="Digite o cargo (apenas letras)"
                        className="w-full rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5"
                      />
                    ) : (
                      <div className="flex items-center p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px]">
                        {currentStepData.cargo || "-"}
                      </div>
                    )}
                  </div>

                  {/* 5. Salário */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="block text-sm font-medium text-slate-700">
                        Salário
                      </Label>
                    </div>
                    {isEditingDocuments ? (
                      <Input
                        value={currentStepData.salario || ""}
                        onChange={(e) => {
                          // Simple mask logic for R$ currency could be improved with a library
                          // For now, accept raw input and format on blur or simple replace
                          const val = e.target.value.replace(/[^0-9,.]/g, '');
                          saveStepData(stepId, { salario: `R$ ${val}` });
                        }}
                        placeholder="R$ 0,00"
                        className="w-full rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5"
                      />
                    ) : (
                      <div className="flex items-center p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px]">
                        {currentStepData.salario || "-"}
                      </div>
                    )}
                  </div>

                  {/* 6. Agendamento PF (Composto: Upload + Data) */}
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center gap-2">
                      <Label className="block text-sm font-medium text-slate-700">
                        Agendamento PF
                      </Label>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                      {/* Upload */}
                      {renderRow(stepId, "Comprovante de Agendamento", undefined, "agendamentoPfDoc", "Anexe o comprovante (PDF, Imagem).")}

                      {/* Data */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-600">Data do Agendamento</Label>
                        {isEditingDocuments ? (
                          <div className="flex gap-2">
                            <Input
                              type="date"
                              value={currentStepData.dataAgendamentoPf || ""}
                              min={formatISODateLocal()}
                              onChange={(e) => saveStepData(stepId, { dataAgendamentoPf: e.target.value })}
                              className="flex-1 rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => saveStepData(stepId, { dataAgendamentoPf: "" })}
                              className="px-3"
                              title="Limpar data"
                            >
                              Limpar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center p-2.5 rounded-md border border-dashed border-slate-200 bg-white text-slate-500 text-sm min-h-[42px]">
                            {currentStepData.dataAgendamentoPf ? formatDateBR(currentStepData.dataAgendamentoPf) : "-"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        }

        if (step.title.toLowerCase().includes("finalizado")) {
          return renderFinalizadoStepContent(step);
        }
        return renderDefaultStepContent(step);
      }

      case 5: // Processo Finalizado
        return renderFinalizadoStepContent(step);


      default:
        return renderDefaultStepContent(step);
    }
  };

  const renderFinalizadoStepContent = (step: StepData) => {
    const stepId = step.id;
    const currentStepData = stepData[stepId] || {};
    return (
      <div className="space-y-3">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <SectionHeader
            title="Finalização"
            isEditing={isEditingDocuments}
            onEdit={() => setIsEditingDocuments(true)}
            onCancel={() => setIsEditingDocuments(false)}
            onSave={() => { setIsEditingDocuments(false); saveStepData(stepId, currentStepData); }}
          />
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <Input
                      value={currentStepData.statusFinalOutro || ""}
                      onChange={(e) => saveStepData(stepId, { statusFinalOutro: e.target.value })}
                      placeholder="Digite o status"
                      className="w-full rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5"
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-center p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px]">
                  {currentStepData.statusFinal === "Outro"
                    ? (currentStepData.statusFinalOutro || "Outro")
                    : (currentStepData.statusFinal || "-")}
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
        <div className="space-y-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <SectionHeader
              title="Formulário"
              isEditing={isEditingDocuments}
              onEdit={() => setIsEditingDocuments(true)}
              onCancel={() => setIsEditingDocuments(false)}
              onSave={() => { setIsEditingDocuments(false); saveStepNotes(stepId); }}
            />
            <div className="p-6 grid grid-cols-1 gap-6">
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

    // Preparar Documentação
    if (title.includes("preparar") && title.includes("documenta")) {
      return (
        <div className="space-y-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <SectionHeader
              title="Documentação"
              isEditing={isEditingDocuments}
              onEdit={() => setIsEditingDocuments(true)}
              onCancel={() => setIsEditingDocuments(false)}
              onSave={() => { setIsEditingDocuments(false); saveStepNotes(stepId); }}
            />
            <div className="p-6 grid grid-cols-1 gap-6">
              <DocumentRow
                label="Documentação Original"
                docField="documentacao-original"
                isEditing={isEditingDocuments}
                documents={documents}
                onUpload={(f) => handleSpecificFileUpload(f, 'documentacao-original', stepId)}
                onDeleteDoc={handleDeleteDocument}
                isUploading={!!uploadingFiles[`documentacao-original-${stepId}`]}
              />
              <DocumentRow
                label="Cópia da Documentação"
                docField="documentacao-copia"
                isEditing={isEditingDocuments}
                documents={documents}
                onUpload={(f) => handleSpecificFileUpload(f, 'documentacao-copia', stepId)}
                onDeleteDoc={handleDeleteDocument}
                isUploading={!!uploadingFiles[`documentacao-copia-${stepId}`]}
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

    // Aguardar Aprovação
    if (title.includes("aguardar") && title.includes("aprova")) {
      return (
        <div className="space-y-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <SectionHeader
              title="Aprovação"
              isEditing={isEditingDocuments}
              onEdit={() => setIsEditingDocuments(true)}
              onCancel={() => setIsEditingDocuments(false)}
              onSave={() => { setIsEditingDocuments(false); saveStepNotes(stepId); }}
            />
            <div className="p-6 grid grid-cols-1 gap-6">
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

    // Fallback genérico
    if (title.includes("finalizado") || title.includes("processo finalizado")) {
      return renderFinalizadoStepContent(step);
    }

    return (
      <div className="space-y-3">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <SectionHeader
            title={step.title || "Detalhes"}
            isEditing={isEditingDocuments}
            onEdit={() => setIsEditingDocuments(true)}
            onCancel={() => setIsEditingDocuments(false)}
            onSave={() => { setIsEditingDocuments(false); saveStepNotes(stepId); }}
          />
          <div className="p-6 grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label className="block text-sm font-medium text-slate-700">Status do Processo</Label>
              {isEditingDocuments ? (
                <div className="space-y-2">
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
                    <Input
                      value={String(currentStepData.statusFinalOutro || "")}
                      onChange={(e) => saveStepData(stepId, { statusFinalOutro: e.target.value })}
                      placeholder="Digite o status"
                      className="w-full rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5"
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-center p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px]">
                  {currentStepData.statusFinal === "Outro"
                    ? (currentStepData.statusFinalOutro || "Outro")
                    : (currentStepData.statusFinal || "-")}
                </div>
              )}
            </div>

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

            <DocumentRow
              label="Documento Anexado"
              docField="documentoAnexado"
              isEditing={isEditingDocuments}
              documents={documents}
              onUpload={(f) => handleFileUpload([f], stepId)}
              onDeleteDoc={handleDeleteDocument}
              isUploading={!!uploadingFiles[`step-${stepId}`]}
            />

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

  if (error) {
    return (
      <DetailLayout title="Erro" backHref="/dashboard/vistos">
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm max-w-md w-full">
            <div className="flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">Erro ao carregar visto</h3>
            <p className="mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-100">
              Tentar novamente
            </Button>
          </div>
        </div>
      </DetailLayout>
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
    if (!caseData || !caseData.steps || caseData.steps.length === 0) return 0;
    const idx = Number(caseData.currentStep ?? 0);
    return Math.min(Math.max(idx, 0), caseData.steps.length - 1);
  };

  const currentStepIndex = getCurrentStepIndex();

  const workflowName = (() => {
    const t = (visto?.type || caseData.type || '');
    const c = (visto?.country || (caseData as any)?.country || '');
    if (t === 'Visto de Trabalho' && c === 'Brasil') return 'Visto de Trabalho - Brasil';
    return t.replace(/:/g, ' - ');
  })();

  // Validação de Documentos para Visto de Trabalho - Brasil e Visto de Turismo
  // NOTA: Estes documentos são sugeridos/opcionais para o salvamento. O sistema permite salvar mesmo com documentos pendentes.
  const progress = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

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
            <p className="text-muted-foreground">
              {(() => {
                const t = (visto?.type || caseData.type || '');
                const c = (visto?.country || (caseData as any)?.country || '');
                if (t === 'Visto de Trabalho' && c === 'Brasil') return 'Visto de Trabalho - Brasil';
                return t.replace(/:/g, ' - ');
              })()}
            </p>
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

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex flex-col gap-8 lg:flex-[2] min-w-0">
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
                                        selected={assignDue ? (() => { const p = assignDue.split('-').map((v) => parseInt(v, 10)); return new Date(p[0], (p[1] || 1) - 1, p[2] || 1); })() : undefined}
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
              {((caseData?.type as string) === "Visto de Trabalho - Brasil" || String(caseData?.type || "").toLowerCase().includes("turismo") || String(caseData?.type || "").toLowerCase().includes("renovação 1 ano")) && (
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
              )}

              <div className="grid grid-cols-1 gap-4">
                <div className={`border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center ${uploadingFiles['general'] ? 'opacity-50 pointer-events-none' : ''} hover:bg-gray-50`}
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => { e.preventDefault(); const files = Array.from(e.dataTransfer.files); handleFileUpload(files as any); }}>
                  <div className="p-3 bg-blue-50 rounded-full mb-3">
                    <Upload className="h-6 w-6 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Arraste e solte arquivos aqui para anexar</p>
                  <p className="text-xs text-gray-500 mt-1">Ou use os botões de envio nas etapas acima</p>
                  <input
                    type="file"
                    id="general-upload"
                    className="hidden"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        handleFileUpload(Array.from(files));
                        e.target.value = '';
                      }
                    }}
                  />
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
          <div className="flex flex-col min-h-[560px] space-y-4">
            <StatusPanel
              key={`status-panel-${currentStepIndex}-${caseData.updatedAt}`}
              status={status}
              onStatusChange={handleStatusChange}
              currentStep={currentStepIndex + 1}
              totalSteps={caseData.steps.length}
              currentStepTitle={caseData.steps[currentStepIndex]?.title}
              workflowTitle={(() => {
                const t = (visto?.type || caseData.type || '');
                const c = (visto?.country || (caseData as any)?.country || '');
                if (t === 'Visto de Trabalho' && c === 'Brasil') return 'Visto de Trabalho - Brasil';
                return t.replace(/:/g, ' - ');
              })()}
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
                  {Array.isArray(notesArray) && notesArray.length > 0 ? (
                    [...notesArray].reverse().map((n) => {
                      const d = new Date(n.timestamp);
                      const formatted = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                      const name = String(n.authorName || '').trim();
                      const showName = !!name && name.toLowerCase() !== 'equipe';

                      return (
                        <div key={n.id || Math.random().toString()} className="group relative bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
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
                      .map(([k, v]) => ({ key: k, name: v?.responsibleName as string, role: '', initials: String(v?.responsibleName || '').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase() }));
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

      {/* Process Flow Info Modal */}
      {
        showInfoModal && (
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
            </div>
          </div>
        )
      }

      {/* Modal de Responsável */}
      <ObservationResponsibleModal
        open={showResponsibleModal}
        onOpenChange={setShowResponsibleModal}
        onConfirm={(name) => {
          setNoteResponsible(name);
          confirmSaveNote(name);
        }}
        currentResponsible={noteResponsible}
      />
    </div >
  );
}
