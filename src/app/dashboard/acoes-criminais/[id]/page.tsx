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

import { extractDocumentsFromRecord } from "@/lib/pending-documents";

// Definindo os workflows para Ações Criminais
const WORKFLOWS = {
  "Ação Criminal": [
    "Cadastro de Documentos",
    "Resumo",
    "Acompanhamento",
    "Processo Finalizado"
  ]
} as const;

type AcaoType = keyof typeof WORKFLOWS;

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

const getDocRequirements = () => {
    return [
      { label: "Procuração", key: "procuracaoDoc", group: "Cadastro de Documentos", required: true },
      { label: "RG/CPF/CNH", key: "identidadeDoc", group: "Cadastro de Documentos", required: true },
      { label: "Comprovante de Endereço", key: "comprovanteEnderecoDoc", group: "Cadastro de Documentos", required: true },
      { label: "Documentos Gerais", key: "documento_geral", group: "Cadastro de Documentos" },
      { label: "Documento de Resumo", key: "resumo_docs", group: "Resumo", required: true },
      { label: "Inquérito Policial", key: "inqueritoDoc", group: "Resumo" },
      { label: "Boletim de Ocorrência", key: "boletimOcorrenciaDoc", group: "Resumo" },
      { label: "Denúncia", key: "denunciaDoc", group: "Resumo" },
      { label: "Resposta à Acusação", key: "respostaAcusacaoDoc", group: "Acompanhamento" },
      { label: "Defesa Prévia", key: "defesaPreviaDoc", group: "Acompanhamento" },
      { label: "Audiência de Custódia", key: "audienciaCustodiaDoc", group: "Acompanhamento" },
      { label: "Sentença/Decisão", key: "sentencaDoc", group: "Processo Finalizado" },
      { label: "Documento Final", key: "final_docs", group: "Processo Finalizado", required: true },
    ];
};


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
  [key: string]: any; // Allows custom fields specific to Ações Criminais
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
  acaoCriminalValue,
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
  acaoCriminalValue?: string;
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
              <span className="font-medium text-slate-700 mr-2">{acaoCriminalValue || '-'}</span>
            ) : null}
            <span className={`text-xs ml-auto ${attachedDocs.length > 0 ? "text-green-600 font-medium" : "italic"}`}>
              {attachedDocs.length > 0 ? `${attachedDocs.length} documento(s)` : "Nenhum anexo"}
            </span>
          </div>
        ) : (
          <Input
            value={acaoCriminalValue || ""}
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

export default function AcaoCriminalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<{ [key: number]: string }>({});
  const [status, setStatus] = useState("");
  const [acaoCriminal, setVisto] = useState<any>(null);
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
    if (acaoCriminal && documents) {
      const requirements = getDocRequirements();

      const uploaded = new Set<string>();
      // Add existing docs
      documents.forEach(d => {
        const k = (d as any).field_name || (d as any).fieldName || (d as any).document_type;
        if (k) uploaded.add(k);
      });
      // Add record fields
      const recordDocs = Object.keys(acaoCriminal).filter(k => k.endsWith('Doc') || k === 'resumo_docs' || k === 'final_docs' || k === 'documento_geral');
      recordDocs.forEach(k => {
          if (acaoCriminal[k]) uploaded.add(k);
      });

      let missingCount = 0;
      const flatPending: any[] = [];
      requirements.forEach(req => {
        if (!uploaded.has(req.key)) {
            if (req.required) missingCount++;
            flatPending.push({
                key: req.key,
                label: req.label,
                group: req.group,
                status: "pending",
                priority: req.required ? "high" : "medium"
            });
        }
      });

      setPendingDocs(flatPending);
      setTotalDocs(requirements.length);
      setCompletedDocs(requirements.length - flatPending.length);
    }
  }, [acaoCriminal, documents]);


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
  const notesArray = parseNotesArray(acaoCriminal?.notes);
  const deleteNote = async (noteId: string) => {
    const next = (notesArray || []).filter((n) => n.id !== noteId);
    try {
      await fetch(`/api/acoes-criminais?id=${params.id}`, {
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
          const res = await fetch(`/api/step-assignments?moduleType=acoes_criminais&recordId=${params.id}`);
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
      const chAcaoCriminal = subscribeTable({
        channelName: `rt-acoes_criminais-${idNum}`,
        table: 'acoes-criminais',
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
        unsubscribe(chAcaoCriminal);
        unsubscribe(chDocsInsert);
        unsubscribe(chDocsDelete);
      };
    }
  }, [params.id]);

  const fetchCaseData = async () => {
    try {
      if (!params.id) {
        console.error("ID do acaoCriminal não fornecido");
        return;
      }
      const res = await fetch(`/api/acoes-criminais?id=${params.id}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ao buscar acaoCriminal: ${res.status} ${res.statusText}`);
      }
      const record = await res.json();
      if (!record) throw new Error("Ação Criminal não encontrado");

      setVisto(record);

      let flowType: AcaoType = "Ação Criminal";

      // Initialize stepData with values from DB record
      const initialStepData: { [key: number]: any } = {};

      // Map fields from record to stepData
      // Find "Processo Finalizado" step index
      const workflowSteps = WORKFLOWS["Ação Criminal"];
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
        title: `Ação Criminal ${record.id}`,
        type: flowType,
        status: record.status || "Em Andamento",
        createdAt: record.createdAt || record.created_at,
        updatedAt: record.updatedAt || record.updated_at,
        clientName: record.clientName || record.client_name,
        description: `Processo de ${flowType}`,
        steps,
        // usar currentStep para refletir etapa atual (0-based para Ações Criminais)
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
      setError(error.message || "Ocorreu um erro ao carregar os dados do acaoCriminal.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/documents/${params.id}?moduleType=acoes_criminais`);
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
        moduleType: 'acoes-criminais',
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
        moduleType: 'acoes-criminais',
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
        if (step.id === stepId) {
          return { ...step, completed: !isCurrentlyCompleted, completedAt: !isCurrentlyCompleted ? new Date().toISOString() : undefined };
        }
        return step;
      });
      const completedStepsArr = updatedSteps.filter(s => s.completed).map(s => s.id);
      const newCurrent = isCurrentlyCompleted
        ? Math.min(stepId, updatedSteps.length - 1)
        : Math.min(stepId + 1, updatedSteps.length - 1);
      (async () => {
        try {
          const isFinalStep = updatedSteps[newCurrent]?.title === 'Processo Finalizado';
          const payload: any = { currentStep: newCurrent, completedSteps: completedStepsArr };
          if (isFinalStep) payload.status = 'Finalizado';

          await fetch(`/api/acoes-criminais?id=${params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (isFinalStep) setStatus('Finalizado');

          setCaseData((prev2) => prev2 ? {
            ...prev2,
            updatedAt: new Date().toISOString(),
            status: isFinalStep ? 'Finalizado' : prev2.status
          } : prev2);

          try {
            await fetch(`/api/step-assignments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ moduleType: 'acoes-criminais', recordId: params.id as string, currentIndex: newCurrent })
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

        const res = await fetch(`/api/acoes-criminais?id=${params.id}`, {
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
      const typeKey = (caseData?.type || 'Ação Criminal de Trabalho') as AcaoType;
      const stepTitle = (WORKFLOWS[typeKey] || [])[stepId] || `Etapa ${stepId + 1}`;
      const entries = Object.entries(data || {})
        .filter(([_, v]) => typeof v === 'string' && v.trim() !== '')
        .map(([k, v]) => `- ${k}: ${v}`);
      if (entries.length) {
        const block = `\n[${stepTitle}]\n${entries.join('\n')}\n`;
        try {
          await fetch(`/api/acoes-criminais?id=${params.id}`, {
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
          await fetch(`/api/acoes-criminais?id=${params.id}`, {
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
    const arr = parseNotesArray(acaoCriminal?.notes);

    const suggestion = RESPONSAVEIS.find((r) => r.includes(finalResponsible)) || '';
    const role = suggestion ? suggestion.split(' – ')[0] : '';

    const next = [...arr, { id, stepId, content: text, timestamp: iso, authorName: finalResponsible, authorRole: role }];
    try {
      const res = await fetch(`/api/acoes-criminais?id=${params.id}`, {
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

    let nextStep = -1;
    if (newStatus === 'Finalizado' && caseData?.steps) {
      const idx = caseData.steps.findIndex(s => s.title === 'Processo Finalizado');
      if (idx !== -1) nextStep = idx;
    }

    const payload: any = { status: newStatus };
    if (nextStep !== -1) payload.currentStep = nextStep;

    try {
      await fetch(`/api/acoes-criminais?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setCaseData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          updatedAt: new Date().toISOString(),
          status: newStatus,
          currentStep: nextStep !== -1 ? nextStep : prev.currentStep
        };
      });
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
        await fetch(`/api/acoes-criminais?id=${params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value })
        });
        setCaseData((prev) => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev);
      } catch (e) {
        console.error('Erro ao atualizar campo do acaoCriminal:', e);
      }
    }, 1000);
  };

  const handleSaveAssignment = async (index: number, responsibleName?: string, dueDate?: string) => {
    try {
      const typeKey = (caseData?.type || "Ação Criminal de Trabalho") as AcaoType;
      const stepTitle = (caseData?.steps?.[index]?.title) || ((WORKFLOWS[typeKey] || [])[index]) || `Etapa ${index + 1}`;
      const res = await fetch(`/api/step-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleType: "acoes-criminais", recordId: params.id as string, stepIndex: index, responsibleName, dueDate, workflowName: stepTitle, clientName: caseData?.clientName || "Cliente" })
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
            body: JSON.stringify({ moduleType: "Ações Criminais", recordId: params.id as string, alertFor: "admin", message, isRead: false })
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
    const stepId = step.id;
    const currentStepData = stepData[stepId] || {};

    switch (stepId) {
      case 0:
          return (
             <div className="space-y-8 pb-8">
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                 {renderHeader("1. Identificação")}
                 <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderRow(stepId, "Procuração", "procuracao", "procuracaoDoc")}
                    {renderRow(stepId, "Requerente", "autorName", "identidadeDoc")}
                    {renderRow(stepId, "Requerido", "reuName", "comprovanteEnderecoDoc")}
                    {renderRow(stepId, "Número do Processo", "numeroProcesso", "documento_geral")}
                 </div>
               </div>
               
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col">
                    <Label className="text-base font-semibold">Tipo da Ação e Subtipo</Label>
                    {isEditingDocuments ? (
                        <div className="mt-2 space-y-4">
                            <div>
                                <Label className="text-sm text-slate-500 mb-1 block">Classificação da Ação (Subtipo)</Label>
                                <Select value={acaoCriminal?.actionSubtype || ""} onValueChange={(val) => handleacaoCriminalFieldChange("actionSubtype", val)}>
                                  <SelectTrigger className="w-full bg-white"><SelectValue placeholder="Selecione o subtipo" /></SelectTrigger>
                                  <SelectContent>
                                    {CRIMINAL_TYPES.map((type) => (
                                      <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-2">
                           <span className="text-sm font-medium text-slate-700">{acaoCriminal?.actionSubtype || "-"}</span>
                        </div>
                    )}
                  </div>
               </div>
             </div>
          );
      case 1:
          return (
             <div className="space-y-8 pb-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                   {renderHeader("Resumo da Ação")}
                   <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                          <Label className="block text-sm font-medium text-slate-700 mb-2">Resumo (Fatos, Inquérito, Denúncia...)</Label>
                          {isEditingDocuments ? (
                              <Textarea rows={6} value={acaoCriminal?.resumo || ""} onChange={(e) => handleacaoCriminalFieldChange("resumo", e.target.value)} className="w-full" />
                          ) : (
                              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700 whitespace-pre-wrap min-h-[100px]">
                                 {acaoCriminal?.resumo || "-"}
                              </div>
                          )}
                      </div>
                      {renderRow(stepId, "Inquérito Policial", "", "inqueritoDoc")}
                      {renderRow(stepId, "Boletim de Ocorrência", "", "boletimOcorrenciaDoc")}
                      {renderRow(stepId, "Denúncia", "", "denunciaDoc")}
                      {renderRow(stepId, "Documento de Resumo", "", "resumo_docs")}
                   </div>
                </div>
             </div>
          );
      case 2:
          return (
             <div className="space-y-8 pb-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                   {renderHeader("Acompanhamento / Defesa")}
                   <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderRow(stepId, "Resposta à Acusação", "", "respostaAcusacaoDoc")}
                      {renderRow(stepId, "Defesa Prévia", "", "defesaPreviaDoc")}
                      {renderRow(stepId, "Audiência de Custódia", "", "audienciaCustodiaDoc")}
                   </div>
                </div>
             </div>
          );
      case 3:
          return (
             <div className="space-y-8 pb-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                   {renderHeader("Status Final e Sentença")}
                   <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                          <Label className="block text-sm font-medium text-slate-700 mb-2">Considerações Finais</Label>
                          {isEditingDocuments ? (
                              <Textarea rows={4} value={acaoCriminal?.finalizadoText || ""} onChange={(e) => handleacaoCriminalFieldChange("finalizadoText", e.target.value)} className="w-full" />
                          ) : (
                              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700 whitespace-pre-wrap min-h-[80px]">
                                 {acaoCriminal?.finalizadoText || "-"}
                              </div>
                          )}
                      </div>
                      {renderRow(stepId, "Sentença / Decisão", "", "sentencaDoc")}
                      {renderRow(stepId, "Documento Final do Processo", "", "final_docs")}
                   </div>
                </div>
             </div>
          );
      default: return null;
    }
  };


  const handleSaveAcaoCriminal = async () => {
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

      const response = await fetch(`/api/acoes-criminais?id=${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Campos gerais
          type: acaoCriminal?.type,
          country: acaoCriminal?.country,
          travelStartDate: acaoCriminal?.travelStartDate,
          travelEndDate: acaoCriminal?.travelEndDate,

          // Campos específicos do Ação Criminal de Trabalho - Brasil
          numeroProcesso: acaoCriminal?.numeroProcesso,

          // Preservar outros campos
          ...acaoCriminal,

          // Override with latest step data
          ...additionalFields,
          stepData
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar dados do acaoCriminal');
      }

      const updatedAcaoCriminal = await response.json();
      setVisto(updatedAcaoCriminal);

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
      acaoCriminalValue={String((acaoCriminal || {})[fieldKey || ''] || '')}
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
      <DetailLayout title="Erro" backHref="/dashboard/acoes-criminais">
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm max-w-md w-full">
            <div className="flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">Erro ao carregar acaoCriminal</h3>
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
          <Link href="/dashboard/acoes-criminais">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Ações Criminais
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
      router.push('/dashboard/acoes-criminais');
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
    const t = (acaoCriminal?.type || caseData.type || '');
    const c = (acaoCriminal?.country || (caseData as any)?.country || '');
    if (t === 'Ação Criminal de Trabalho' && c === 'Brasil') return 'Ação Criminal de Trabalho - Brasil';
    return t.replace(/:/g, ' - ');
  })();

  // Validação de Documentos para Ação Criminal de Trabalho - Brasil e Ação Criminal de Turismo
  // NOTA: Estes documentos são sugeridos/opcionais para o salvamento. O sistema permite salvar mesmo com documentos pendentes.
  const progress = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

  return (
    <div className="w-full space-y-4 md:space-y-6 bg-transparent min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/acoes-criminais">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{caseData.clientName}</h1>
            <p className="text-muted-foreground">
              {(() => {
                const t = (acaoCriminal?.type || caseData.type || '');
                const c = (acaoCriminal?.country || (caseData as any)?.country || '');
                if (t === 'Ação Criminal de Trabalho' && c === 'Brasil') return 'Ação Criminal de Trabalho - Brasil';
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
              {caseData?.type && (
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
                              pendingDocs.reduce((acc: Record<string, any[]>, doc: any) => {
                                if (!acc[doc.group]) acc[doc.group] = [];
                                acc[doc.group].push(doc);
                                return acc;
                              }, {})
                            ).map(([group, docs]: [string, any[]]) => (
                              <div key={group} className="space-y-2">
                                <h5 className="text-sm font-bold text-amber-900 border-b border-amber-200 pb-1">
                                  {group}
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                  {docs.map((doc: any) => (
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
              currentStepTitle={(() => {
                const title = caseData.steps[currentStepIndex]?.title;
                if (title === "Processo Finalizado") {
                  const stepId = caseData.steps[currentStepIndex].id;
                  const sData = stepData[stepId] || {};
                  if (sData.statusFinal === "Aguardando") return "Aguardar Aprovação";

                  const prevStepIndex = currentStepIndex - 1;
                  if (prevStepIndex >= 0 && caseData.steps[prevStepIndex]?.title === "Aguardar Aprovação") {
                    const prevStepId = caseData.steps[prevStepIndex].id;
                    const prevSData = stepData[prevStepId] || {};
                    if (prevSData.statusFinal === "Aguardando") return "Aguardar Aprovação";
                  }
                }
                return title;
              })()}
              workflowTitle={(() => {
                const t = (acaoCriminal?.type || caseData.type || '');
                const c = (acaoCriminal?.country || (caseData as any)?.country || '');
                if (t === 'Ação Criminal de Trabalho' && c === 'Brasil') return 'Ação Criminal de Trabalho - Brasil';
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
                      pendingDocs.reduce((acc: Record<string, any[]>, doc: any) => {
                        if (!acc[doc.group]) acc[doc.group] = [];
                        acc[doc.group].push(doc);
                        return acc;
                      }, {})
                    ).map(([group, docs]: [string, any[]]) => (
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
