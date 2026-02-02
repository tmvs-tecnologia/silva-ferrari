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
  Edit,
  FileText,
  Upload,
  CheckCircle,
  Circle,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Mail,
  CheckCircle2,
  AlertCircle,
  Info
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
import { DocumentChip } from "@/components/ui/document-chip";
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
  // Generic fields for dynamic mapping
  [key: string]: any;
}

const RESPONSAVEIS = [
  "Secretária – Jessica Cavallaro",
  "Advogada – Jailda Silva",
  "Advogada – Adriana Roder",
  "Advogado – Fábio Ferrari",
  "Advogado – Guilherme Augusto",
  "Estagiário – Wendel Macriani",
];

// --- Standardized Helper Components ---

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
        <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-red-500">*</span>}
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

        {isEditing && !!docField && (
          <div className="relative w-full sm:w-auto">
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
              onOpen={() => handlePreview(doc)}
              onDelete={isEditing ? () => onDeleteDoc(doc) : undefined}
              className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:border-sky-200 transition-all"
            />
          ))}
        </div>
      )}
    </div>
  );
};

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
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Assignments
  const [assignments, setAssignments] = useState<Record<number, { responsibleName?: string; dueDate?: string }>>({});
  const [assignOpenStep, setAssignOpenStep] = useState<number | null>(null);
  const [assignResp, setAssignResp] = useState<string>("");
  const [assignDue, setAssignDue] = useState<string>("");
  const [saveMessages, setSaveMessages] = useState<{ [key: number]: string }>({});

  // Editing state
  const [isEditingDocuments, setIsEditingDocuments] = useState(false);
  const [isPendingDocsOpen, setIsPendingDocsOpen] = useState(false);

  // Specific States for Ações Cíveis Logic
  const [dnaExamDate, setDnaExamDate] = useState("");
  const [dnaExamTime, setDnaExamTime] = useState("");
  const [dnaExamLocation, setDnaExamLocation] = useState("");
  const [dnaExamNotes, setDnaExamNotes] = useState("");
  const [dnaSaveSuccess, setDnaSaveSuccess] = useState(false);

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
      } catch { }
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
          notes: "",
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
        } catch { }
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

  const handleFileUpload = async (files: FileList | File[] | null, stepId?: number, fieldName: string = 'documentoAnexado') => {
    const arr = !files ? [] : Array.isArray(files) ? files : Array.from(files);
    if (!arr.length) return;

    // Validate all files first
    const validFiles = arr.filter(validateFile);
    if (validFiles.length === 0) return;

    const uploadKey = stepId !== undefined ? `${fieldName}-${stepId}` : 'general';
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
        const contentType = file.type || 'application/octet-stream';

        // 1. Get Signed URL
        const signRes = await fetch('/api/documents/upload/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: contentType,
            caseId: id,
            moduleType: 'acoes_civeis',
            fieldName: fieldName,
            clientName: caseData?.clientName || 'Cliente'
          })
        });

        if (!signRes.ok) {
          throw new Error(await getErrorMessage(signRes, 'Erro ao gerar URL de upload'));
        }

        const { signedUrl, fullPath, publicUrl } = await signRes.json();

        // 2. Upload with Retry
        await uploadWithRetry(signedUrl, file);

        // 3. Register Metadata in Database
        const regRes = await fetch('/api/documents/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filePath: publicUrl, // Save the public URL as expected by current schema
            fileName: file.name,
            fileType: contentType,
            fileSize: file.size,
            caseId: id,
            moduleType: 'acoes_civeis',
            fieldName: fieldName,
            clientName: caseData?.clientName || 'Cliente'
          })
        });

        if (!regRes.ok) {
          throw new Error(await getErrorMessage(regRes, 'Erro ao salvar metadados do documento'));
        }

        const payload = await regRes.json();
        if (payload?.document) {
          setDocuments(prev => [payload.document, ...prev]);
          toast.success(`Upload concluído: ${file.name}`);
        } else {
          await fetchDocuments();
        }
      }
      await fetchDocuments();
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao realizar upload.");
    } finally {
      setUploadingFiles(prev => ({ ...prev, [uploadKey]: false }));
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
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(xhr.response);
            } else {
              reject(new Error(`Status ${xhr.status}`));
            }
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

  // --- Dynamic Requirements Logic ---

  const getDocRequirements = () => {
    if (!caseData) return [];
    const type = caseData.type as AcaoType;

    const baseReqs = [
      {
        title: "Documentos Pessoais",
        step: "Cadastro de Documentos",
        fields: [] as any[]
      }
    ];

    if (type === "Exame DNA") {
      baseReqs[0].fields = [
        { key: "rnmMae", label: "RNM/RG Mãe" },
        { key: "rnmPai", label: "RNM/RG Pai" },
        { key: "rnmSupostoPai", label: "RNM/RG Suposto Pai" },
        { key: "cpfMae", label: "CPF Mãe" },
        { key: "cpfPai", label: "CPF Pai" },
        { key: "certidaoNascimento", label: "Certidão Nascimento" },
        { key: "comprovanteEndereco", label: "Comprovante Endereço" },
        { key: "passaporteMaeFile", label: "Passaporte Mãe (Arquivo)" },
        { key: "passaportePaiRegistralFile", label: "Passaporte Pai (Arquivo)" },
        { key: "passaporteSupostoPaiFile", label: "Passaporte Suposto Pai (Arquivo)" },
      ];
      baseReqs.push({ title: "Exame", step: "Agendar Exame de DNA", fields: [{ key: "resultadoExameDnaFile", label: "Resultado Exame DNA" }] });
      baseReqs.push({ title: "Petição", step: "Petição de Declaração de Paternidade (WENDEL/GUILHERME/FÁBIO)", fields: [{ key: "peticaoInicialFile", label: "Petição Inicial" }] });
    } else if (type === "Usucapião") {
      baseReqs[0].fields = [
        { key: "ownerRnm", label: "RNM Dono" },
        { key: "ownerCpf", label: "CPF Dono" },
        { key: "comprovanteEnderecoFile", label: "Comprovante Endereço (Arq)" },
        { key: "declaracaoVizinhosFile", label: "Declaração Vizinhos" },
        { key: "matriculaImovelFile", label: "Matrícula Imóvel" },
        { key: "contaAguaFile", label: "Conta Água" },
        { key: "contaLuzFile", label: "Conta Luz" },
        { key: "iptuFile", label: "IPTU" },
        { key: "laudoEngenhariaFile", label: "Laudo Engenharia" },
      ];
      baseReqs.push({ title: "Procuração", step: "Elaboração da Procuração", fields: [{ key: "procuracaoFile", label: "Procuração Assinada" }] });
      baseReqs.push({ title: "Petição", step: "Elaboração da Petição Inicial", fields: [{ key: "peticaoInicialFile", label: "Petição Inicial" }] });
      baseReqs.push({ title: "Guia", step: "Emissão da Guia Judicial", fields: [{ key: "guiaJudicialFile", label: "Guia Judicial" }] });
    } else if (type === "Alteração de Nome") {
      baseReqs[0].fields = [
        { key: "rnmMae", label: "RNM/RG Requerente" },
        { key: "cpfMae", label: "CPF Requerente" },
        { key: "certidaoNascimento", label: "Certidão Nascimento/Casamento" },
        { key: "comprovanteEndereco", label: "Comprovante Endereço" },
      ];
      baseReqs.push({ title: "Guia", step: "Emissão da Guia Judicial", fields: [{ key: "guiaJudicialFile", label: "Guia Judicial" }] });
      baseReqs.push({ title: "Procuração", step: "Elaboração Procuração", fields: [{ key: "procuracaoFile", label: "Procuração" }] });
      baseReqs.push({ title: "Petição", step: "Peticionar", fields: [{ key: "peticaoInicialFile", label: "Petição Inicial" }] });
    } else if (type === "Guarda" || type === "Acordos de Guarda") {
      baseReqs[0].fields = [
        { key: "rnmMae", label: "RNM/RG Mãe" },
        { key: "cpfMae", label: "CPF Mãe" },
        { key: "rnmPai", label: "RNM/RG Pai" },
        { key: "cpfPai", label: "CPF Pai" },
        { key: "certidaoNascimento", label: "Certidão Nascimento Criança" },
        { key: "comprovanteEndereco", label: "Comprovante Endereço" },
      ];
      baseReqs.push({ title: "Procuração", step: "Fazer Procuração (WENDEL/GUILHERME/FÁBIO)", fields: [{ key: "procuracaoFile", label: "Procuração Assinada" }] });
      if (type === "Acordos de Guarda") {
        baseReqs.push({ title: "Acordo", step: "Fazer a Procuração e o Acordo de Guarda (WENDEL/GUILHERME/FÁBIO)", fields: [{ key: "acordoGuardaFile", label: "Termo de Acordo" }] });
      }
      baseReqs.push({ title: "Petição", step: "Verificar se há Petição", fields: [{ key: "peticaoInicialFile", label: "Petição Inicial" }] });
    } else if (type === "Divórcio Consensual") {
      baseReqs[0].fields = [
        { key: "certidaoNascimento", label: "Certidão de Casamento" },
        { key: "rnmMae", label: "RNM/RG Cônjuge 1" },
        { key: "cpfMae", label: "CPF Cônjuge 1" },
        { key: "rnmPai", label: "RNM/RG Cônjuge 2" },
        { key: "cpfPai", label: "CPF Cônjuge 2" },
        { key: "comprovanteEndereco", label: "Comprovante Endereço" },
      ];
      baseReqs.push({ title: "Petição", step: "Petição Conjunta", fields: [{ key: "peticaoInicialFile", label: "Petição Conjunta" }] });
      baseReqs.push({ title: "Partilha", step: "Termo de Partilhas", fields: [{ key: "termoPartilhaFile", label: "Termo de Partilha" }] });
      baseReqs.push({ title: "Procuração", step: "Procuração", fields: [{ key: "procuracaoFile", label: "Procuração" }] });
    } else if (type === "Divórcio Litígio") {
      baseReqs[0].fields = [
        { key: "certidaoNascimento", label: "Certidão de Casamento" },
        { key: "rnmMae", label: "RNM/RG Requerente" },
        { key: "cpfMae", label: "CPF Requerente" },
        { key: "comprovanteEndereco", label: "Comprovante Endereço" },
      ];
      baseReqs.push({
        title: "Documentos Processuais", step: "Procuração, Petição e Guia Judicial", fields: [
          { key: "procuracaoFile", label: "Procuração" },
          { key: "peticaoInicialFile", label: "Petição Inicial" },
          { key: "guiaJudicialFile", label: "Guia Judicial" }
        ]
      });
    } else if (type === "Pensão Alimentícia" || type === "Ação de Alimentos") {
      baseReqs[0].fields = [
        { key: "rnmMae", label: "RNM/RG Responsável" },
        { key: "cpfMae", label: "CPF Responsável" },
        { key: "certidaoNascimento", label: "Certidão Nascimento Criança" },
        { key: "comprovanteEndereco", label: "Comprovante Endereço" },
        { key: "comprovanteRendaFile", label: "Comprovante de Renda/Despesas" },
      ];
      baseReqs.push({ title: "Petição", step: "Petição Inicial", fields: [{ key: "peticaoInicialFile", label: "Petição Inicial" }] });
      baseReqs.push({ title: "Procuração", step: "Procuração", fields: [{ key: "procuracaoFile", label: "Procuração" }] });
    } else {
      // Generic fallback
      baseReqs[0].fields = [
        { key: "rnmMae", label: "RNM/RG" },
        { key: "cpfMae", label: "CPF" },
        { key: "certidaoNascimento", label: "Certidão Nascimento/Casamento" },
        { key: "comprovanteEndereco", label: "Comprovante Endereço" },
        { key: "procuracaoFile", label: "Procuração" },
      ];
    }

    return baseReqs;
  };

  const docRequirements = getDocRequirements();
  const pendingDocs = docRequirements.flatMap(group =>
    group.fields
      .filter(f => {
        // Check if field exists in caseData (for text fields) or in documents (for files)
        const isTextField = !f.key.endsWith('File') && !f.key.includes('Doc');
        if (isTextField) {
          return !caseData?.[f.key];
        } else {
          return !documents.some(d => (d.field_name || d.fieldName) === f.key);
        }
      })
      .map(f => ({ ...f, group: group.step || group.title }))
  );

  const totalDocs = docRequirements.reduce((acc, g) => acc + g.fields.length, 0);
  const completedDocs = totalDocs - pendingDocs.length;
  const progress = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

  // --- Render Steps (Standardized) ---

  const renderStepContent = (step: StepData) => {
    if (!caseData) return null;
    const stepIndex = step.id;
    const type = caseData.type;

    // Helper renderers
    const renderRow = (label: string, fieldKey?: string, docKey?: string, tooltip?: string) => (
      <DocumentRow
        label={label}
        field={fieldKey}
        docField={docKey || ''}
        isEditing={isEditingDocuments}
        vistoValue={fieldKey ? String(caseData[fieldKey] || '') : undefined}
        onTextChange={(val) => fieldKey && patchCaseField({ [fieldKey]: val })}
        documents={documents}
        onUpload={(f) => docKey && handleFileUpload([f], stepIndex, docKey)}
        onDeleteDoc={handleDeleteDocument}
        isUploading={!!uploadingFiles[`${docKey}-${stepIndex}`]}
        tooltip={tooltip}
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

    // Specific Content Logic
    if (stepIndex === 0) { // Cadastro Documentos
      return (
        <div className="space-y-6 md:space-y-8 pb-6 md:pb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {renderHeader("Dados Iniciais")}
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {type === 'Exame DNA' && (
                <>
                  {renderRow("Nome da Mãe", "nomeMae")}
                  {renderRow("Nome Pai Registral", "nomePaiRegistral")}
                  {renderRow("Nome Suposto Pai", "nomeSupostoPai")}
                  {renderRow("RNM/RG Mãe", "rnmMae")}
                  {renderRow("RNM/RG Pai", "rnmPai")}
                  {renderRow("CPF Mãe", "cpfMae")}
                  {renderRow("CPF Pai", "cpfPai")}
                  {renderRow("Certidão Nascimento", "certidaoNascimento", "certidaoNascimentoFile")}
                  {renderRow("Comprovante Endereço", "comprovanteEndereco", "comprovanteEnderecoFile")}
                  {renderRow("Passaporte Mãe", undefined, "passaporteMaeFile")}
                  {renderRow("Passaporte Pai", undefined, "passaportePaiRegistralFile")}
                  {renderRow("Passaporte Suposto Pai", undefined, "passaporteSupostoPaiFile")}
                </>
              )}
              {type === 'Usucapião' && (
                <>
                  {renderRow("Dono do Imóvel", "ownerName")}
                  {renderRow("CPF Dono", "ownerCpf")}
                  {renderRow("RNM Dono", "ownerRnm", "ownerRnmFile")}
                  {renderRow("Endereço Imóvel", "endereco")}
                  {renderRow("Comprovante Endereço", undefined, "comprovanteEnderecoFile")}
                  {renderRow("Declaração Vizinhos", undefined, "declaracaoVizinhosFile")}
                  {renderRow("Matrícula Imóvel", undefined, "matriculaImovelFile")}
                  {renderRow("Conta Água", undefined, "contaAguaFile")}
                  {renderRow("Conta Luz", undefined, "contaLuzFile")}
                  {renderRow("IPTU", undefined, "iptuFile")}
                </>
              )}
              {/* Fallback for other types */}
              {!['Exame DNA', 'Usucapião'].includes(type) && (
                <>
                  {renderRow("Nome Mãe", "nomeMae")}
                  {renderRow("Nome Pai", "nomePaiRegistral")}
                  {renderRow("RNM/RG Mãe", "rnmMae", "rnmMaeFile")}
                  {renderRow("CPF Mãe", "cpfMae", "cpfMaeFile")}
                  {renderRow("Comprovante Endereço", "comprovanteEndereco", "comprovanteEnderecoFile")}
                  {renderRow("Certidão Nascimento", "certidaoNascimento", "certidaoNascimentoFile")}
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Default Step Renderer
    return (
      <div className="space-y-3">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {renderHeader(step.title)}
          <div className="p-4 md:p-6 grid grid-cols-1 gap-4 md:gap-6">
            {/* DNA Exam Scheduling */}
            {type === 'Exame DNA' && step.title.includes('Agendar') && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data do Exame</Label>
                  {isEditingDocuments ? (
                    <Input type="date" value={dnaExamDate} onChange={e => setDnaExamDate(e.target.value)} />
                  ) : (
                    <div className="p-2.5 bg-slate-50 border border-dashed rounded-md">{dnaExamDate ? formatDateBR(dnaExamDate) : '-'}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Hora</Label>
                  {isEditingDocuments ? (
                    <Input type="time" value={dnaExamTime} onChange={e => setDnaExamTime(e.target.value)} />
                  ) : (
                    <div className="p-2.5 bg-slate-50 border border-dashed rounded-md">{dnaExamTime || '-'}</div>
                  )}
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Local</Label>
                  {isEditingDocuments ? (
                    <Input value={dnaExamLocation} onChange={e => setDnaExamLocation(e.target.value)} placeholder="Endereço/Laboratório" />
                  ) : (
                    <div className="p-2.5 bg-slate-50 border border-dashed rounded-md">{dnaExamLocation || '-'}</div>
                  )}
                </div>
                {isEditingDocuments && (
                  <div className="md:col-span-2 flex justify-end">
                    <Button size="sm" onClick={handleSaveDnaSchedule}><Save className="w-4 h-4 mr-2" /> Salvar Agendamento</Button>
                    {dnaSaveSuccess && <span className="ml-2 text-green-600 flex items-center"><CheckCircle2 className="w-4 h-4 mr-1" /> Salvo</span>}
                  </div>
                )}
              </div>
            )}

            {/* Generic Notes Area */}
            <div className="space-y-3">
              <Label>Observações da Etapa</Label>

              {/* Note Input */}
              <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                <Textarea
                  value={notes[stepIndex] || ""}
                  onChange={e => setNotes(prev => ({ ...prev, [stepIndex]: e.target.value }))}
                  placeholder="Adicione uma nova nota..."
                  className={`w-full border-0 focus-visible:ring-0 p-0 resize-none min-h-[80px] ${!isEditingDocuments ? "bg-slate-50 text-slate-500" : "bg-white"}`}
                  readOnly={!isEditingDocuments}
                  rows={3}
                />
                {isEditingDocuments && (
                  <div className="flex justify-end items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                    {saveMessages[stepIndex] && (
                      <span className="text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 animate-in fade-in slide-in-from-right-2">Salvo!</span>
                    )}
                    <Button
                      size="sm"
                      onClick={() => saveStepNotes(stepIndex)}
                      className="h-8 text-xs px-4"
                      disabled={!notes[stepIndex]}
                    >
                      Salvar Nota
                    </Button>
                  </div>
                )}
              </div>

              {/* Notes List */}
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 min-h-[100px] max-h-[300px] overflow-y-auto space-y-3">
                {notesArray.filter((n: any) => n.stepId === stepIndex).length > 0 ? (
                  notesArray.filter((n: any) => n.stepId === stepIndex).map((n: any) => (
                    <div key={n.id} className="bg-white p-3 rounded border border-slate-200 shadow-sm relative group">
                      <button
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1 hover:bg-red-50 rounded"
                        onClick={() => deleteNote(n.id)}
                        title="Excluir nota"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                          {(n.authorName || 'S').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col leading-none">
                          <span className="text-xs font-semibold text-slate-700">{n.authorName}</span>
                          <span className="text-[10px] text-slate-400">{new Date(n.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap pl-7">{n.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic text-center py-4">Nenhuma observação nesta etapa.</p>
                )}
              </div>
            </div>

            {/* Generic Upload Area */}
            {renderRow("Documentos da Etapa", undefined, `step-${stepIndex}-docs`)}
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
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Caso não encontrado</h1>
          <Link href="/dashboard/acoes-civeis">
            <Button><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = caseData.currentStep;

  return (
    <div className="w-full p-4 space-y-6 bg-gray-50">
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

      <div className="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-12">
        {/* LEFT COLUMN: WORKFLOW */}
        <div className="lg:col-span-8">
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
                        >
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                      ) : isCurrent ? (
                        <div
                          className="h-12 w-12 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center z-10 shadow-md cursor-pointer hover:scale-105 transition"
                          onClick={() => handleStepCompletion(step.id)}
                        >
                          <div className="h-4 w-4 rounded-full bg-blue-500" />
                        </div>
                      ) : (
                        <div
                          className="h-12 w-12 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center z-10 cursor-pointer hover:scale-105 transition"
                          onClick={() => handleStepCompletion(step.id)}
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
                          <button
                            className="text-gray-500"
                            onClick={() => toggleStepExpansion(step.id)}
                          >
                            {expandedSteps[step.id] ? <ChevronRight className="w-5 h-5 rotate-90" /> : <ChevronRight className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      {expandedSteps[step.id] && (
                        <div className="mt-3">
                          {renderStepContent(step)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="rounded-xl border-gray-200 shadow-sm">
            <CardHeader className="px-2.5">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2.5">
              <div className="mb-8 space-y-6">
                {/* Progress Bar */}
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

                {/* Pending List or Success */}
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

        {/* RIGHT COLUMN: STATUS & DOCS */}
        <div className="lg:col-span-4 flex flex-col min-h-[560px] space-y-4">
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
                <span className="flex items-center">Observações</span>
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
              <div className="relative mb-4">
                <Textarea
                  rows={4}
                  placeholder="Adicione uma nova observação..."
                  value={notes[0] || ''}
                  onChange={(e) => setNotes(prev => ({ ...prev, 0: e.target.value }))}
                  className="w-full min-h-[100px] border-slate-200 focus:border-slate-400 bg-white shadow-sm resize-none"
                />
                <div className="flex justify-end items-center gap-2 mt-2">
                  {saveMessages[0] && (
                    <span className="text-emerald-600 text-xs font-medium animate-fade-in bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">Salvo!</span>
                  )}
                  <Button
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 text-white h-8 px-4 shadow-sm"
                    onClick={() => saveStepNotes(0)}
                    disabled={!notes[0]}
                  >
                    Salvar
                  </Button>
                </div>
              </div>

              <div className="flex-1 min-h-[200px] max-h-[400px] overflow-y-auto space-y-3 p-2 bg-slate-50/50 rounded-lg border border-slate-100">
                {notesArray.length > 0 ? (
                  notesArray.map((n) => (
                    <div key={n.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative group transition-all hover:shadow-md">
                      <button
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1 hover:bg-red-50 rounded"
                        onClick={() => deleteNote(n.id)}
                        title="Excluir nota"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-inner">
                          {(n.authorName || 'S').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col leading-none">
                          <span className="text-xs font-semibold text-slate-700">{n.authorName}</span>
                          <span className="text-[10px] text-slate-400">{new Date(n.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap pl-8">{n.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 italic">
                    <img src="https://cdn-icons-png.flaticon.com/512/7486/7486744.png" alt="Empty" className="h-12 w-12 opacity-20 mb-2 grayscale" />
                    <p className="text-sm">Nenhuma observação registrada.</p>
                  </div>
                )}
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

      {/* Modals */}

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
          <DialogTitle className="sr-only">Notas do Processo</DialogTitle>
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
    </div>
  );
}
