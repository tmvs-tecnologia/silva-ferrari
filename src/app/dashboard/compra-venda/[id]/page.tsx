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
  Hash,
  Edit2,
  History,
  Loader2,
  Paperclip,
  UploadCloud,
  FileCheck
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
import { Popover, PopoverTrigger, PopoverContent, PopoverClose } from "@/components/ui/popover";
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
import { getCompraVendaDocRequirements, computePendingByFlow, extractDocumentsFromRecord } from "@/lib/pending-documents";

// Workflow Steps for Compra e Venda
const WORKFLOW_STEPS = [
  { id: 1, title: "Cadastro Documentos", description: "Informações de cadastro" },
  { id: 2, title: "Fazer/Analisar Contrato", description: "Elaboração e análise contratual" },
  { id: 3, title: "Assinatura de contrato", description: "Coleta de assinaturas" },
  { id: 4, title: "Escritura", description: "Prazos para escritura e pagamentos" },
  { id: 5, title: "Cobrar a Matrícula", description: "Finalização do processo" },
  { id: 6, title: "Processo Finalizado", description: "Encerramento da ação" },
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
  file_path?: string;
  document_name?: string;
  file_name?: string;
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
  completedSteps?: number[];
  // Specific fields
  numeroMatricula?: string;
  cadastroContribuinte?: string;
  enderecoImovel?: string;
  rgVendedores?: string;
  cpfVendedores?: string;
  dataNascimentoVendedores?: string;
  rnmComprador?: string;
  cpfComprador?: string;
  enderecoComprador?: string;
  nomeVendedores?: string;
  nomeCompradores?: string;
  estado_civil_vendedores?: string;
  estado_civil_compradores?: string;
  certidoes_vendedores?: string;
  prazoSinal?: string;
  prazoEscritura?: string;
  contractNotes?: string;
  stepNotes?: string; // Observações em formato JSON
  // Dynamic fields
  [key: string]: any;
}

export default function CompraVendaDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<{ [key: number]: string }>({});
  const [status, setStatus] = useState("");
  const [property, setProperty] = useState<any>(null); // Raw data
  const [expandedSteps, setExpandedSteps] = useState<{ [key: number]: boolean }>({});
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [isEditingDocuments, setIsEditingDocuments] = useState(false);

  // Modais e UI
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showResponsibleModal, setShowResponsibleModal] = useState(false);
  const [pendingNote, setPendingNote] = useState<string | null>(null);
  const [noteResponsible, setNoteResponsible] = useState("");
  const [isPendingDocsOpen, setIsPendingDocsOpen] = useState(false);
  const [isCertidoesOpen, setIsCertidoesOpen] = useState(false);
  const [isVendedoresOpen, setIsVendedoresOpen] = useState(false);
  const [isCompradoresOpen, setIsCompradoresOpen] = useState(false);

  // Edição de Documento
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [newDocumentName, setNewDocumentName] = useState("");

  // Specific lists
  const [editableSellers, setEditableSellers] = useState<{ nome?: string; rg?: string; cpf?: string; dataNascimento?: string; estadoCivil?: string; certidoes?: string }[]>([]);
  const [editableCompradores, setEditableCompradores] = useState<{ nome?: string; rnm?: string; cpf?: string; endereco?: string; estadoCivil?: string }[]>([]);

  const [assignments, setAssignments] = useState<Record<number, { responsibleName?: string; dueDate?: string }>>({});
  const [saveMessages, setSaveMessages] = useState<{ [key: number]: string }>({});
  const [assignOpenStep, setAssignOpenStep] = useState<number | null>(null);
  const [assignResp, setAssignResp] = useState<string>("");
  const [assignDue, setAssignDue] = useState<string>("");
  const [showNotesModal, setShowNotesModal] = useState(false);

  // Pending Documents State
  const [pendingDocs, setPendingDocs] = useState<any[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [completedDocs, setCompletedDocs] = useState(0);

  const progress = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

  // Realtime
  const purchaseSubscriptionRef = useRef<any>(null);
  const docsSubscriptionRef = useRef<any>(null);

  const parseNotesArray = (notesStr?: string) => {
    try {
      const v = (notesStr || '').trim();
      if (!v) return [] as Array<{ id: string; stepId?: number; content: string; timestamp: string; authorName?: string; authorRole?: string }>;
      const arr = JSON.parse(v);
      if (Array.isArray(arr)) return arr as any;
      return [] as any;
    } catch { return [] as any; }
  };
  const notesArray = parseNotesArray(property?.stepNotes || property?.notes);

  const deleteNote = async (noteId: string) => {
    const next = (notesArray || []).filter((n: any) => n.id !== noteId);
    try {
      await fetch(`/api/compra-venda-imoveis?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepNotes: JSON.stringify(next) })
      });
      setProperty((prev: any) => ({ ...(prev || {}), stepNotes: JSON.stringify(next) }));
    } catch (e) { console.error('Erro ao excluir nota:', e); }
  };

  useEffect(() => {
    if (params.id) {
      fetchCaseData();
      fetchDocuments();
      loadAssignments();

      // Realtime subscription
      purchaseSubscriptionRef.current = subscribeTable({
        table: 'compra_venda_imoveis',
        events: ['insert', 'update', 'delete'],
        onChange: (payload: any) => {
          if (payload.new && String(payload.new.id) === String(params.id)) {
            fetchCaseData();
          }
        }
      });

      docsSubscriptionRef.current = subscribeTable({
        table: 'documents',
        events: ['insert', 'update', 'delete'],
        onChange: (payload: any) => {
          if (
            (payload.new && String(payload.new.record_id) === String(params.id)) ||
            (payload.old && String(payload.old.record_id) === String(params.id))
          ) {
            fetchDocuments();
          }
        }
      });
    }

    return () => {
      if (purchaseSubscriptionRef.current) unsubscribe(purchaseSubscriptionRef.current);
      if (docsSubscriptionRef.current) unsubscribe(docsSubscriptionRef.current);
    };
  }, [params.id]);

  const loadAssignments = async () => {
    try {
      const res = await fetch(`/api/step-assignments?moduleType=compra_venda_imoveis&recordId=${params.id}`);
      if (res.ok) {
        const data = await res.json();
        const map: Record<number, { responsibleName?: string; dueDate?: string }> = {};
        (data || []).forEach((a: any) => {
          map[a.stepIndex] = { responsibleName: a.responsibleName, dueDate: a.dueDate };
        });
        setAssignments(map);
      }
    } catch (e) {
      console.error("Erro ao carregar assignments:", e);
    }
  };

  useEffect(() => {
    if (property && documents) {
      const requirements = getCompraVendaDocRequirements(property);

      const uploaded = new Set<string>();
      // Add existing docs
      documents.forEach(d => {
        const k = (d as any).field_name || (d as any).fieldName || (d as any).document_type;
        if (k) uploaded.add(k);
      });
      // Add record fields if they contain document-like substrings
      const recordDocs = extractDocumentsFromRecord(property);
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
            status: "pending",
          });
        });
      });

      setPendingDocs(flatPending);
      setTotalDocs(totalCount);
      setCompletedDocs(totalCount - missingCount);
    }
  }, [property, documents]);

  const fetchCaseData = async () => {
    try {
      const res = await fetch(`/api/compra-venda-imoveis?id=${params.id}`);
      if (res.ok) {
        const record = await res.json();
        setProperty(record);

        const steps: StepData[] = WORKFLOW_STEPS.map((s, index) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          completed: false,
          notes: "",
        }));

        const recordCurrentStep = Number(record.currentStep ?? 1);
        const completedFromServer = (() => {
          const v = (record.completedSteps ?? []) as any;
          if (Array.isArray(v)) return v as number[];
          if (typeof v === 'string') { try { const parsed = JSON.parse(v); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
          return [];
        })();

        steps.forEach(s => {
          s.completed = completedFromServer.includes(s.id);
        });

        const nomeVList = (record.nomeVendedores || "").split(",");
        const rgList = (record.rgVendedores || "").split(",");
        const cpfList = (record.cpfVendedores || "").split(",");
        const dobList = (record.dataNascimentoVendedores || "").split(",");
        const ecVList = (record.estadoCivilVendedores || record.estado_civil_vendedores || "").split(",");
        const certVList = (record.certidoes_vendedores || "").split(",");
        const maxLen = Math.max(nomeVList.length, rgList.length, cpfList.length, dobList.length, ecVList.length, certVList.length);
        const sellers = maxLen > 0
          ? Array.from({ length: maxLen }, (_, i) => ({ 
              nome: nomeVList[i] || "", 
              rg: rgList[i] || "", 
              cpf: cpfList[i] || "", 
              dataNascimento: dobList[i] || "",
              estadoCivil: ecVList[i] || "",
              certidoes: certVList[i] || ""
            }))
          : [{ nome: "", rg: "", cpf: "", dataNascimento: "", estadoCivil: "", certidoes: "" }];
        setEditableSellers(sellers);

        const nomeCList = (record.nomeCompradores || "").split(",");
        const rnmList = (record.rnmComprador || "").split(",");
        const cpfCList = (record.cpfComprador || "").split(",");
        const endList = (record.enderecoComprador || "").split(",");
        const ecCList = (record.estadoCivilCompradores || record.estado_civil_compradores || "").split(",");
        const maxC = Math.max(nomeCList.length, rnmList.length, cpfCList.length, endList.length, ecCList.length);
        const compradores = maxC > 0
          ? Array.from({ length: maxC }, (_, i) => ({ 
              nome: nomeCList[i] || "", 
              rnm: rnmList[i] || "", 
              cpf: cpfCList[i] || "", 
              endereco: endList[i] || "",
              estadoCivil: ecCList[i] || ""
            }))
          : [{ nome: "", rnm: "", cpf: "", endereco: "", estadoCivil: "" }];
        setEditableCompradores(compradores);

        const data: CaseData = {
          ...record,
          id: String(record.id),
          title: record.clientName || "Cliente",
          type: "Compra e Venda",
          status: record.status || "Em Andamento",
          createdAt: record.createdAt || record.created_at,
          updatedAt: record.updatedAt || record.updated_at,
          clientName: record.clientName || "Cliente",
          description: record.enderecoImovel || "Transação Imobiliária",
          steps,
          currentStep: recordCurrentStep,
          completedSteps: completedFromServer // Garantir que seja array de números
        };
        setCaseData(data);
        setStatus(data.status);

        setExpandedSteps(prev => ({ ...prev, [recordCurrentStep]: true }));
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/documents/${params.id}?moduleType=compra_venda_imoveis`);
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

  const handleSpecificFileUpload = async (files: FileList | File[] | null, fieldKey: string, stepId: number) => {
    const arr = !files ? [] : Array.isArray(files) ? files : Array.from(files);
    if (!arr.length) return;

    const validFiles = arr.filter(validateFile);
    if (!validFiles.length) return;

    const caseId = String(params.id || "");
    if (!caseId || !fieldKey) {
      toast.error("Erro interno: ID do caso ou chave do campo ausente.");
      return;
    }

    const uploadKey = `${fieldKey}-${stepId}`;
    setUploadingFiles(prev => ({ ...prev, [uploadKey]: true }));
    try {
      const getErrorMessage = async (res: Response, fallback: string) => {
        try {
          const data = await res.json().catch(() => ({} as any));
          const message = data?.error || data?.message || fallback;
          const details = data?.details ? ` (${data.details})` : "";
          return String(`${message}${details}`);
        } catch {
          return fallback;
        }
      };

      for (const file of validFiles) {
        const MAX_DIRECT_SIZE = 4 * 1024 * 1024; // 4MB

        if (file.size > MAX_DIRECT_SIZE) {
          // Signed Upload
          const signRes = await fetch("/api/documents/upload/sign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              caseId: String(params.id),
              moduleType: 'compra_venda_imoveis', // Fixed module type
              fieldName: fieldKey,
              clientName: caseData?.clientName || 'Cliente'
            })
          });

          if (!signRes.ok) throw new Error(await getErrorMessage(signRes, "Falha ao gerar URL assinada"));

          const { signedUrl, publicUrl } = await signRes.json();

          const uploadRes = await fetch(signedUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type }
          });

          if (!uploadRes.ok) throw new Error("Falha no upload do arquivo");

          // Register
          const regRes = await fetch("/api/documents/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              isRegisterOnly: true,
              fileUrl: publicUrl,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              fieldName: fieldKey,
              moduleType: "compra_venda_imoveis",
              caseId: String(params.id),
              clientName: caseData?.clientName || 'Cliente'
            })
          });

          if (!regRes.ok) throw new Error(await getErrorMessage(regRes, "Erro ao registrar document"));

          const payload = await regRes.json();
          const newDoc = payload?.document;
          if (newDoc) setDocuments(prev => [newDoc, ...prev]);

        } else {
          // Direct Upload
          const fd = new FormData();
          fd.append('file', file);
          fd.append('caseId', String(params.id));
          fd.append('moduleType', 'compra_venda_imoveis');
          fd.append('fieldName', fieldKey);
          fd.append('clientName', caseData?.clientName || 'Cliente');
          const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
          if (!res.ok) throw new Error(await getErrorMessage(res, 'Erro ao fazer upload do documento'));
          const payload = await res.json();
          const newDoc = payload?.document;
          if (newDoc) {
            setDocuments(prev => [newDoc, ...prev]);
          }
        }
      }

      await fetchDocuments();
      toast.success("Upload(s) concluído(s) com sucesso!");
    } catch (error: any) {
      console.error("❌ Detalhes do erro de upload:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao realizar upload.");
    } finally {
      setUploadingFiles(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleStepCompletion = async (stepId: number) => {
    if (!caseData) return;
    const step = caseData.steps.find(s => s.id === stepId);
    if (!step) return;
    
    const isCompleted = step.completed;
    const currentCompleted = Array.isArray(caseData.completedSteps) ? caseData.completedSteps : [];
    
    const newCompleted = isCompleted
      ? currentCompleted.filter((id: number) => id !== stepId)
      : [...currentCompleted, stepId];

    // Lógica dinâmica (semelhante ao Vistos):
    // Se estou desmarcando, o passo desmarcado vira o atual.
    // Se estou marcando, o passo atual é o próximo que não está na lista de concluídos.
    let nextStepId = 1;
    if (isCompleted) {
      // Se desmarcou, essa etapa vira a atual imediatamente
      nextStepId = stepId;
    } else {
      // Se marcou como concluído, procura o próximo que não está concluído
      const nextUncompleted = WORKFLOW_STEPS.find(s => !newCompleted.includes(s.id));
      nextStepId = nextUncompleted ? nextUncompleted.id : WORKFLOW_STEPS.length;
    }

    try {
      const res = await fetch(`/api/compra-venda-imoveis?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          completedSteps: newCompleted, 
          currentStep: nextStepId 
        })
      });
      
      if (res.ok) {
        fetchCaseData();
      }
    } catch (e) {
      console.error("Erro ao atualizar etapa:", e);
      toast.error("Erro ao atualizar o progresso do fluxo.");
    }
  };

  const saveStepNotes = async (stepId: number, content?: string, author?: string) => {
    const text = content || (notes[stepId] || '').trim();
    if (!text) return;

    if (!author && !noteResponsible) {
      setPendingNote(text);
      setShowResponsibleModal(true);
      return;
    }

    const iso = new Date().toISOString();
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const finalAuthor = author || noteResponsible || 'Equipe';
    const suggestion = RESPONSAVEIS.find((r) => r.includes(finalAuthor)) || '';
    const role = suggestion ? suggestion.split(' – ')[0] : (finalAuthor === 'Equipe' ? 'Sistema' : 'Membro');

    const next = [...notesArray, { id, stepId, content: text, timestamp: iso, authorName: finalAuthor, authorRole: role }];

    try {
      const res = await fetch(`/api/compra-venda-imoveis?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepNotes: JSON.stringify(next) })
      });
      if (res.ok) {
        setSaveMessages(prev => ({ ...prev, [stepId]: 'Salvo' }));
        setProperty((prev: any) => ({ ...(prev || {}), stepNotes: JSON.stringify(next) }));
        setNotes((prev) => ({ ...prev, [stepId]: '' }));
        setPendingNote(null);
        setNoteResponsible("");
        setShowResponsibleModal(false);
        toast.success("Nota salva com sucesso!");
      }
    } catch (error) {
      console.error('Erro ao salvar notas:', error);
      toast.error("Erro ao salvar nota.");
    }
  };

  const handleEditDocument = (doc: Document) => {
    setEditingDocument(doc);
    setNewDocumentName(doc.document_name || doc.name || doc.file_name || '');
    setShowEditDialog(true);
  };

  const handleRenameDocument = async () => {
    if (!editingDocument || !newDocumentName.trim()) return;

    try {
      const res = await fetch(`/api/documents/rename/${editingDocument.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentName: newDocumentName.trim() })
      });

      if (res.ok) {
        toast.success("Documento renomeado com sucesso!");
        fetchDocuments();
        setShowEditDialog(false);
        setEditingDocument(null);
      } else {
        toast.error("Falha ao renomear documento.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao renomear documento.");
    }
  };

  const handleDeleteCase = async () => {
    try {
      const res = await fetch(`/api/compra-venda-imoveis?id=${params.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success("Processo excluído com sucesso!");
        router.push('/dashboard/compra-venda');
      } else {
        toast.error("Erro ao excluir processo.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao comunicar com o servidor.");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      await fetch(`/api/compra-venda-imoveis?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      console.error('Erro ao atualizar status:', e);
    }
  };

  const handleSaveAssignment = async (index: number, responsibleName?: string, dueDate?: string) => {
    try {
      const stepTitle = WORKFLOW_STEPS.find(s => s.id === index)?.title || `Etapa ${index}`;
      const res = await fetch(`/api/step-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleType: "compra_venda_imoveis", recordId: params.id as string, stepIndex: index, responsibleName, dueDate, workflowName: stepTitle, clientName: caseData?.clientName || "Cliente" })
      });
      if (res.ok) {
        setAssignments(prev => ({ ...prev, [index]: { responsibleName, dueDate } }));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const saveStep1Fields = async () => {
    const promise = async () => {
      const body = {
        clientName: caseData?.clientName || "",
        numeroMatricula: caseData?.numeroMatricula || "",
        cadastroContribuinte: caseData?.cadastroContribuinte || "",
        enderecoImovel: caseData?.enderecoImovel || "",
        nomeVendedores: (editableSellers || []).map(s => s.nome || "").join(","),
        rgVendedores: (editableSellers || []).map(s => s.rg || "").join(","),
        cpfVendedores: (editableSellers || []).map(s => s.cpf || "").join(","),
        dataNascimentoVendedores: (editableSellers || []).map(s => s.dataNascimento || "").join(","),
        nomeCompradores: (editableCompradores || []).map(c => c.nome || "").join(","),
        rnmComprador: (editableCompradores || []).map(c => c.rnm || "").join(","),
        cpfComprador: (editableCompradores || []).map(c => c.cpf || "").join(","),
        enderecoComprador: (editableCompradores || []).map(c => c.endereco || "").join(","),
        estado_civil_vendedores: (editableSellers || []).map(s => s.estadoCivil || "").join(","),
        estado_civil_compradores: (editableCompradores || []).map(c => c.estadoCivil || "").join(","),
        certidoes_vendedores: (editableSellers || []).map(s => s.certidoes || "").join(","),
      };

      const res = await fetch(`/api/compra-venda-imoveis?id=${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Erro ao salvar os dados no servidor");
      }

      await fetchCaseData();
      return true;
    };

    toast.promise(promise(), {
      loading: 'Salvando alterações...',
      success: 'Dados salvos com sucesso!',
      error: 'Erro ao salvar alterações.',
    });
  };

  const savePrazos = async () => {
    try {
      await fetch(`/api/compra-venda-imoveis?id=${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prazoSinal: caseData?.prazoSinal, prazoEscritura: caseData?.prazoEscritura })
      });
      setSaveMessages(prev => ({ ...prev, 4: 'Prazos salvos' }));
    } catch (e) {
      console.error(e);
    }
  }

  // Helper functions for Rendering
  const renderHeader = (title: string, onEdit?: () => void, isEditing?: boolean, onSave?: () => void, onCancel?: () => void) => (
    <div className="bg-slate-50 px-3 py-2 md:px-4 md:py-3 border-b border-slate-100 flex justify-between items-center">
      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
        <FileText className="w-4 h-4 text-slate-500" />
        {title}
      </h3>
      {onEdit && (
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button size="sm" variant="outline" className="h-7 px-2 bg-white" onClick={onEdit}>
              <Edit2 className="w-3 h-3 mr-1" /> Editar
            </Button>
          ) : (
            <>
              <Button size="sm" variant="default" className="h-7 px-2 bg-slate-900" onClick={onSave}>
                <Save className="w-3 h-3 mr-1" /> Salvar
              </Button>
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onCancel}>
                <X className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );

  const renderRow = (label: string, valueKey: keyof CaseData | undefined, fileKey: string, isEditing: boolean, onChangeValue?: (val: string) => void, customValue?: React.ReactNode, stepId?: number) => {
    // Busca TODOS os documentos associados a esse campo
    const fieldDocs = (documents || []).filter(d => d.fieldName === fileKey || d.field_name === fileKey);
    const isUploading = uploadingFiles[`${fileKey}-${stepId}`];

    return (
      <div className="flex flex-col gap-1 w-full min-w-0">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</Label>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isUploading && <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
            {fileKey && (
              <label className={`p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-all ${isUploading ? 'opacity-30 pointer-events-none' : ''}`}>
                <UploadCloud className="w-3.5 h-3.5" />
                <input
                  type="file"
                  className="hidden"
                  multiple
                  onChange={(e) => { handleSpecificFileUpload(e.target.files, fileKey, stepId || 0); e.target.value = ""; }}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.txt,.rtf"
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full">
          {valueKey && (
            isEditing ? (
              <Input
                value={String(caseData?.[valueKey] || "")}
                onChange={(e) => onChangeValue?.(e.target.value)}
                className="h-9 bg-white text-[11px] xl:text-xs 2xl:text-sm truncate"
              />
            ) : (
              <div className="text-[11px] xl:text-xs 2xl:text-sm font-semibold text-slate-800 truncate">
                {String(caseData?.[valueKey] || "-")}
              </div>
            )
          )}
          {customValue}

          {/* Lista Compacta de Documentos (Chips) */}
          {fileKey && fieldDocs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {fieldDocs.map((doc) => {
                const displayName = doc.name || doc.file_name || "Doc";
                return (
                  <div key={doc.id} className="group flex items-center gap-1.5 bg-blue-50/50 hover:bg-blue-50 border border-blue-100/50 px-2 py-0.5 rounded-full transition-all max-w-[140px]">
                    <Paperclip className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    <a 
                      href={doc.url || doc.file_path} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[11px] sm:text-xs text-blue-700 hover:underline truncate font-medium"
                      title={displayName}
                    >
                      {displayName}
                    </a>
                    <button
                      onClick={() => handleDeleteDocument(doc)}
                      className="p-0.5 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };


  const renderStepContent = (step: StepData) => {
    const stepId = step.id;

    if (stepId === 1) { // Cadastro
      return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {renderHeader("Dados Iniciais",
            () => setIsEditingDocuments(true),
            isEditingDocuments,
            async () => { 
              await saveStep1Fields(); 
              setIsEditingDocuments(false); 
            },
            () => setIsEditingDocuments(false)
          )}
          <div className="p-3 sm:p-4 md:p-6 space-y-6">
            {/* Seção 1: Dados do Imóvel/Cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4 md:gap-x-6 lg:gap-x-8">
              {renderRow("Nome do Cliente", "clientName", "", isEditingDocuments, (v) => setCaseData(prev => prev ? ({ ...prev, clientName: v }) : null), undefined, stepId)}
              {renderRow("Endereço Imóvel", "enderecoImovel", "comprovanteEnderecoImovelDoc", isEditingDocuments, (v) => setCaseData(prev => prev ? ({ ...prev, enderecoImovel: v }) : null), undefined, stepId)}
              {renderRow("Matrícula", "numeroMatricula", "numeroMatriculaDoc", isEditingDocuments, (v) => setCaseData(prev => prev ? ({ ...prev, numeroMatricula: v }) : null), undefined, stepId)}
              {renderRow("Contribuinte", "cadastroContribuinte", "cadastroContribuinteDoc", isEditingDocuments, (v) => setCaseData(prev => prev ? ({ ...prev, cadastroContribuinte: v }) : null), undefined, stepId)}
            </div>

            {/* Vendedores */}
            <div className="space-y-4 pt-2">
              <div 
                className="flex justify-between items-center bg-slate-50 hover:bg-slate-100 p-3 rounded-xl border border-slate-200 cursor-pointer transition-colors"
                onClick={() => setIsVendedoresOpen(!isVendedoresOpen)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                  <h4 className="font-bold text-sm uppercase text-slate-700 tracking-tight">Vendedores</h4>
                  <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-600 border-none">
                    {editableSellers.length}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  {isEditingDocuments && (
                    <Button 
                      size="xs" 
                      variant="outline" 
                      className="h-6 text-[10px] font-bold uppercase" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditableSellers(prev => [...prev, { nome: "", rg: "", cpf: "", dataNascimento: "", estadoCivil: "", certidoes: "" }]);
                        setIsVendedoresOpen(true);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Adicionar
                    </Button>
                  )}
                  {isVendedoresOpen ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
                </div>
              </div>
              {isVendedoresOpen && (
                <div className="grid grid-cols-1 gap-3 px-1">
                  {editableSellers.length === 0 ? (
                    <div className="text-sm text-slate-500 py-2 text-center">Nenhum vendedor adicionado.</div>
                  ) : editableSellers.map((seller, idx) => (
                    <div key={idx} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 relative group transition-all hover:border-blue-100 hover:bg-white shadow-sm">
                      {isEditingDocuments && (
                        <button 
                          onClick={() => setEditableSellers(prev => prev.filter((_, i) => i !== idx))} 
                          className="absolute -top-2 -right-2 bg-white text-red-500 border border-red-100 shadow-sm p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                          title="Remover Vendedor"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                        {renderRow("Nome", undefined, "", isEditingDocuments, undefined,
                          isEditingDocuments ? <Input value={seller.nome || ""} onChange={(e) => setEditableSellers(prev => prev.map((s, i) => i === idx ? { ...s, nome: e.target.value } : s))} className="h-9 bg-white text-[11px] xl:text-xs 2xl:text-sm truncate" /> : <div className="text-[11px] xl:text-xs 2xl:text-sm font-semibold text-slate-800 truncate">{seller.nome || '-'}</div>, stepId
                        )}
                        {renderRow("RG", undefined, `rgVendedorDoc_${idx}`, isEditingDocuments, undefined,
                          isEditingDocuments ? <Input value={seller.rg || ""} onChange={(e) => setEditableSellers(prev => prev.map((s, i) => i === idx ? { ...s, rg: e.target.value } : s))} className="h-9 bg-white text-[11px] xl:text-xs 2xl:text-sm truncate" /> : <div className="text-[11px] xl:text-xs 2xl:text-sm font-semibold text-slate-800 truncate">{seller.rg || '-'}</div>, stepId
                        )}
                        {renderRow("CPF", undefined, `cpfVendedorDoc_${idx}`, isEditingDocuments, undefined,
                          isEditingDocuments ? <Input value={seller.cpf || ""} onChange={(e) => setEditableSellers(prev => prev.map((s, i) => i === idx ? { ...s, cpf: e.target.value } : s))} className="h-9 bg-white text-[11px] xl:text-xs 2xl:text-sm truncate" /> : <div className="text-[11px] xl:text-xs 2xl:text-sm font-semibold text-slate-800 truncate">{seller.cpf || '-'}</div>, stepId
                        )}
                        {renderRow("Nascimento", undefined, "", isEditingDocuments, undefined,
                          isEditingDocuments ? <Input type="date" value={seller.dataNascimento || ""} onChange={(e) => setEditableSellers(prev => prev.map((s, i) => i === idx ? { ...s, dataNascimento: e.target.value } : s))} className="h-9 bg-white text-[11px] xl:text-xs 2xl:text-sm truncate" /> : <div className="text-[11px] xl:text-xs 2xl:text-sm font-semibold text-slate-800 truncate">{formatDateBR(seller.dataNascimento)}</div>, stepId
                        )}
                        {renderRow("Est. Civil", undefined, `certidaoEstadoCivilVendedorDoc_${idx}`, isEditingDocuments, undefined,
                          isEditingDocuments ? (
                            <Select 
                              value={seller.estadoCivil || ""} 
                              onValueChange={(val) => setEditableSellers(prev => prev.map((s, i) => i === idx ? { ...s, estadoCivil: val } : s))}
                            >
                              <SelectTrigger className="h-9 bg-white text-[11px] xl:text-xs 2xl:text-sm truncate">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Solteiro">Solteiro</SelectItem>
                                <SelectItem value="Casado">Casado</SelectItem>
                                <SelectItem value="Divorciado">Divorciado</SelectItem>
                                <SelectItem value="Viúvo">Viúvo</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : <div className="text-[11px] xl:text-xs 2xl:text-sm font-semibold text-slate-800 truncate">{seller.estadoCivil || '-'}</div>, stepId
                        )}
                        {renderRow("Certidões", undefined, `certidoesVendedorDoc_${idx}`, isEditingDocuments, undefined,
                          isEditingDocuments ? <Input value={seller.certidoes || ""} onChange={(e) => setEditableSellers(prev => prev.map((s, i) => i === idx ? { ...s, certidoes: e.target.value } : s))} className="h-9 bg-white text-[11px] xl:text-xs 2xl:text-sm truncate" placeholder="Ex: CND federal, CND estadual..." /> : <div className="text-[11px] xl:text-xs 2xl:text-sm font-semibold text-slate-800 truncate">{seller.certidoes || '-'}</div>, stepId
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 pt-2">
              <div 
                className="flex justify-between items-center bg-slate-50 hover:bg-slate-100 p-3 rounded-xl border border-slate-200 cursor-pointer transition-colors"
                onClick={() => setIsCompradoresOpen(!isCompradoresOpen)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-green-500 rounded-full" />
                  <h4 className="font-bold text-sm uppercase text-slate-700 tracking-tight">Compradores</h4>
                  <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-600 border-none">
                    {editableCompradores.length}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  {isEditingDocuments && (
                    <Button 
                      size="xs" 
                      variant="outline" 
                      className="h-6 text-[10px] font-bold uppercase" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditableCompradores(prev => [...prev, { nome: "", rnm: "", cpf: "", endereco: "", estadoCivil: "" }]);
                        setIsCompradoresOpen(true);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Adicionar
                    </Button>
                  )}
                  {isCompradoresOpen ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
                </div>
              </div>
              {isCompradoresOpen && (
                <div className="grid grid-cols-1 gap-3 px-1">
                  {editableCompradores.length === 0 ? (
                    <div className="text-sm text-slate-500 py-2 text-center">Nenhum comprador adicionado.</div>
                  ) : editableCompradores.map((comp, idx) => (
                    <div key={idx} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 relative group transition-all hover:border-green-100 hover:bg-white shadow-sm">
                      {isEditingDocuments && (
                        <button 
                          onClick={() => setEditableCompradores(prev => prev.filter((_, i) => i !== idx))} 
                          className="absolute -top-2 -right-2 bg-white text-red-500 border border-red-100 shadow-sm p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                          title="Remover Comprador"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {renderRow("Nome", undefined, "", isEditingDocuments, undefined,
                          isEditingDocuments ? <Input value={comp.nome || ""} onChange={(e) => setEditableCompradores(prev => prev.map((s, i) => i === idx ? { ...s, nome: e.target.value } : s))} className="h-9 bg-white text-[11px] xl:text-xs 2xl:text-sm truncate" /> : <div className="text-[11px] xl:text-xs 2xl:text-sm font-semibold text-slate-800 truncate">{comp.nome || '-'}</div>, stepId
                        )}
                        {renderRow("RNM", undefined, `rnmCompradorDoc_${idx}`, isEditingDocuments, undefined,
                          isEditingDocuments ? <Input value={comp.rnm || ""} onChange={(e) => setEditableCompradores(prev => prev.map((s, i) => i === idx ? { ...s, rnm: e.target.value } : s))} className="h-9 bg-white text-[11px] xl:text-xs 2xl:text-sm truncate" /> : <div className="text-[11px] xl:text-xs 2xl:text-sm font-semibold text-slate-800 truncate">{comp.rnm || '-'}</div>, stepId
                        )}
                        {renderRow("CPF", undefined, `cpfCompradorDoc_${idx}`, isEditingDocuments, undefined,
                          isEditingDocuments ? <Input value={comp.cpf || ""} onChange={(e) => setEditableCompradores(prev => prev.map((s, i) => i === idx ? { ...s, cpf: e.target.value } : s))} className="h-9 bg-white text-[11px] xl:text-xs 2xl:text-sm truncate" /> : <div className="text-[11px] xl:text-xs 2xl:text-sm font-semibold text-slate-800 truncate">{comp.cpf || '-'}</div>, stepId
                        )}
                        {renderRow("Endereço", undefined, "", isEditingDocuments, undefined,
                          isEditingDocuments ? <Input value={comp.endereco || ""} onChange={(e) => setEditableCompradores(prev => prev.map((s, i) => i === idx ? { ...s, endereco: e.target.value } : s))} className="h-9 bg-white text-[11px] xl:text-xs 2xl:text-sm truncate" /> : <div className="text-[11px] xl:text-xs 2xl:text-sm font-semibold text-slate-800 truncate">{comp.endereco || '-'}</div>, stepId
                        )}
                        {renderRow("Est. Civil", undefined, `certidaoEstadoCivilCompradorDoc_${idx}`, isEditingDocuments, undefined,
                          isEditingDocuments ? (
                            <Select 
                              value={comp.estadoCivil || ""} 
                              onValueChange={(val) => setEditableCompradores(prev => prev.map((c, i) => i === idx ? { ...c, estadoCivil: val } : c))}
                            >
                              <SelectTrigger className="h-9 bg-white text-[11px] xl:text-xs 2xl:text-sm truncate">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Solteiro">Solteiro</SelectItem>
                                <SelectItem value="Casado">Casado</SelectItem>
                                <SelectItem value="Divorciado">Divorciado</SelectItem>
                                <SelectItem value="Viúvo">Viúvo</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : <div className="text-[11px] xl:text-xs 2xl:text-sm font-semibold text-slate-800 truncate">{comp.estadoCivil || '-'}</div>, stepId
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (stepId === 3) { // Assinatura - Prazos
      return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {renderHeader("Assinatura e Prazos", undefined, false)}
          <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase">Prazo Sinal</Label>
                <div className="flex gap-2">
                  <Input type="date" value={caseData?.prazoSinal || ""} onChange={(e) => setCaseData(prev => prev ? ({ ...prev, prazoSinal: e.target.value }) : null)} className="h-9 bg-white" />
                  <Button size="sm" onClick={savePrazos}>Salvar</Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase">Prazo Escritura</Label>
                <div className="flex gap-2">
                  <Input type="date" value={caseData?.prazoEscritura || ""} onChange={(e) => setCaseData(prev => prev ? ({ ...prev, prazoEscritura: e.target.value }) : null)} className="h-9 bg-white" />
                  <Button size="sm" onClick={savePrazos}>Salvar</Button>
                </div>
              </div>
            </div>
            {renderRow("Contrato Assinado", undefined, "assinaturaContratoDoc", false, undefined, undefined, stepId)}
          </div>
        </div>
      );
    }

    // Default Steps
    const docKeys: Record<number, string> = {
      2: "contratoDoc",
      4: "escrituraDoc",
      5: "matriculaCartorioDoc"
    };
    const key = docKeys[stepId];

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {renderHeader(step.title, undefined, false)}
        <div className="p-3 sm:p-4 md:p-6 space-y-4">
          {key && renderRow(step.description, undefined, key, false, undefined, undefined, stepId)}

          <div className="space-y-1 mt-4">
            <Label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase">Observações</Label>
            <div className="flex gap-2">
              <Textarea
                rows={3}
                value={notes[stepId] || ""}
                onChange={(e) => setNotes(prev => ({ ...prev, [stepId]: e.target.value }))}
                placeholder="Adicione observações..."
                className="bg-slate-50"
              />
            </div>
            <div className="flex justify-end mt-2">
              <Button size="sm" onClick={() => saveStepNotes(stepId)}>Salvar Nota</Button>
            </div>
            {saveMessages[stepId] && <div className="text-green-600 text-xs text-right">{saveMessages[stepId]}</div>}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <Skeleton className="h-screen w-full" />;
  if (!caseData) return <div>Caso não encontrado</div>;

  // Lógica espelhada de Vistos: O passo atual é o pointer salvo no banco (baseado em ID 1-indexed)
  const currentStepIndex = Math.max(0, Math.min(Number(caseData.currentStep || 1) - 1, WORKFLOW_STEPS.length - 1));

  // Agrupamento de certidões por vendedor para o dropdown
  const sellersWithCertificates = (editableSellers || []).map((seller, idx) => {
    const sellerCerts = (documents || []).filter(d => (d.fieldName || d.field_name) === `certidoesVendedorDoc_${idx}`);
    return {
      name: seller.nome || `Vendedor ${idx + 1}`,
      docs: sellerCerts
    };
  }).filter(s => s.docs.length > 0);

  return (
    <div className="w-full space-y-4 md:space-y-6 bg-transparent min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/compra-venda">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{caseData.clientName}</h1>
            <div className="flex items-center gap-2 text-slate-500">
              <Badge variant="outline" className="font-normal bg-white">Compra e Venda</Badge>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                ID: {params.id}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este processo de Compra e Venda? Esta ação não pode ser desfeita e removerá todos os dados e documentos vinculados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteCase} className="bg-red-600 hover:bg-red-700 text-white border-0">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* COLUNA ESQUERDA - FLUXO E DOCUMENTOS */}
        <div className="flex flex-col gap-8 lg:flex-[2] min-w-0">
          <Card className="rounded-xl border-gray-200 shadow-sm relative overflow-visible">
            <CardHeader className="bg-white border-b border-gray-100 py-3 sm:py-4 px-4 sm:px-6 rounded-t-xl">
              <CardTitle className="flex items-center w-full justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-slate-800">Fluxo do Processo</span>
                </div>
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="w-6 h-6 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                  title="Documentos Pendentes"
                >
                  <img src="https://cdn-icons-png.flaticon.com/512/9195/9195785.png" alt="Info" className="w-full h-full object-contain" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="space-y-0">
                {caseData.steps.map((step, index) => {
                  const isCurrent = index === currentStepIndex;
                  const isCompleted = step.completed;
                  const showConnector = index < caseData.steps.length - 1;

                  return (
                    <div key={step.id} className="flex group relative pb-10 last:pb-0">
                      {showConnector && (
                        <div className={`absolute left-6 top-8 bottom-0 w-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                      )}

                      <div className="flex-shrink-0 mr-4">
                        {isCompleted ? (
                          <div
                            className="h-12 w-12 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center z-10 cursor-pointer hover:scale-105 transition shadow-sm"
                            onClick={() => handleStepCompletion(step.id)}
                            title="Desfazer conclusão"
                          >
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                        ) : isCurrent ? (
                          <div
                            className="h-12 w-12 rounded-full bg-blue-600 border-4 border-blue-100 flex items-center justify-center z-10 shadow-[0_0_15px_rgba(37,99,235,0.4)] cursor-pointer hover:scale-110 transition-all duration-300"
                            onClick={() => handleStepCompletion(step.id)}
                            title="Passo atual - Clique para concluir"
                          >
                            <div className="h-4 w-4 rounded-full bg-white animate-pulse" />
                          </div>
                        ) : (
                          <div
                            className="h-12 w-12 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center z-10 cursor-pointer hover:scale-105 transition group-hover:border-gray-400"
                            onClick={() => handleStepCompletion(step.id)}
                            title="Marcar como concluído"
                          >
                            <Circle className="w-6 h-6 text-gray-400 group-hover:text-gray-500" />
                          </div>
                        )}
                      </div>

                      <div className={`flex-grow pt-2 ${isCurrent ? 'p-3 sm:p-4 md:p-5 bg-blue-50 rounded-xl border border-blue-100 shadow-sm' : isCompleted ? '' : 'opacity-70'}`}>
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className={`text-base font-bold ${isCurrent ? 'text-blue-700' : 'text-slate-800'}`}>
                                {step.title}
                              </h3>
                              {isCurrent ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">Atual</span>
                              ) : isCompleted ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-800">Concluído</span>
                              ) : null}
                            </div>
                            
                            {(assignments[step.id]?.responsibleName || assignments[step.id]?.dueDate) && (
                              <div className="flex items-center gap-3 text-xs text-slate-500">
                                {assignments[step.id]?.responsibleName && (
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    <span>{assignments[step.id]?.responsibleName}</span>
                                  </div>
                                )}
                                {assignments[step.id]?.dueDate && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>Prazo: {(assignments[step.id] as any).dueDate.split('-').reverse().join('/')}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Popover open={assignOpenStep === step.id} onOpenChange={(open) => setAssignOpenStep(open ? step.id : null)}>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 border border-slate-200 bg-white hover:bg-slate-50">
                                  {assignments[step.id]?.responsibleName ? "Alterar" : "Atribuir"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[340px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl" align="start">
                                <div className="bg-slate-900 px-4 py-3 flex items-center justify-between text-white">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-400" />
                                    <h4 className="font-bold text-sm">Definir Responsável</h4>
                                  </div>
                                  <PopoverClose className="text-slate-400 hover:text-white transition-colors">
                                    <X className="w-4 h-4" />
                                  </PopoverClose>
                                </div>
                                <div className="p-4 space-y-5 bg-white">
                                  <div className="space-y-2">
                                    <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-1">Membro da Equipe</Label>
                                    <Select value={assignResp} onValueChange={setAssignResp}>
                                      <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500/20">
                                        <SelectValue placeholder="Selecione um membro..." />
                                      </SelectTrigger>
                                      <SelectContent className="rounded-xl border-slate-200">
                                        {RESPONSAVEIS.map(r => <SelectItem key={r} value={r} className="rounded-lg">{r}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-1">Data Limite</Label>
                                    <div className="flex flex-col items-center p-2 bg-slate-50/50 border border-slate-100 rounded-2xl overflow-hidden">
                                      <CalendarPicker
                                        mode="single"
                                        selected={assignDue ? new Date(assignDue + 'T12:00:00') : undefined}
                                        onSelect={(date) => {
                                          if (date) {
                                            const y = date.getFullYear();
                                            const m = String(date.getMonth() + 1).padStart(2, '0');
                                            const d = String(date.getDate()).padStart(2, '0');
                                            setAssignDue(`${y}-${m}-${d}`);
                                          }
                                        }}
                                        className="p-3 pointer-events-auto"
                                        captionLayout="dropdown"
                                      />
                                    </div>
                                    {assignDue && (
                                      <div className="flex items-center justify-center gap-2 mt-2 py-2 px-3 bg-blue-50 border border-blue-100/50 rounded-xl">
                                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                        <span className="text-[11px] text-blue-700 font-bold">
                                          Vencimento: {assignDue.split('-').reverse().join('/')}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <Button 
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 transition-all shadow-lg shadow-blue-100 active:scale-[0.98] font-bold" 
                                    size="sm" 
                                    onClick={() => { handleSaveAssignment(step.id, assignResp, assignDue); setAssignOpenStep(null); }}
                                  >
                                    <Save className="w-4 h-4 mr-2" />
                                    Confirmar Atribuição
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>

                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 transition-transform duration-200 ${expandedSteps[step.id] ? 'rotate-180' : ''}`}
                              onClick={() => setExpandedSteps(prev => ({ ...prev, [step.id]: !prev[step.id] }))}
                            >
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            </Button>
                          </div>
                        </div>

                        {expandedSteps[step.id] && (
                          <div className="pt-4 animate-in slide-in-from-top-2 duration-300">
                            {renderStepContent(step)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          {/* DOCUMENTOS DO CLIENTE */}
          <Card className="rounded-xl border-gray-200 shadow-sm mt-8 bg-white overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50 py-4 px-6 rounded-t-xl flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-slate-800 text-sm font-bold uppercase tracking-wider">Documentos do Cliente</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="space-y-6">
                {/* Barra de Progresso Expansível */}
                <div 
                  className="space-y-3 cursor-pointer group select-none bg-slate-50/50 p-4 rounded-xl border border-slate-100 hover:border-blue-200 transition-all"
                  onClick={() => setIsPendingDocsOpen(!isPendingDocsOpen)}
                  role="button"
                >
                  <div className="flex justify-between text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-700 font-bold text-xs uppercase tracking-tight">Progresso da Documentação</span>
                      {pendingDocs.length > 0 && (
                        isPendingDocsOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <span className="text-slate-900 font-bold text-xs">{progress}% ({completedDocs}/{totalDocs})</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 ease-out ${progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>

                {/* Lista de Documentos Pendentes (Expansível) */}
                {pendingDocs.length > 0 ? (
                  <div 
                    className={`grid transition-all duration-300 ease-in-out ${isPendingDocsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                  >
                    <div className="overflow-hidden">
                      <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-5 mt-2">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                            <AlertCircle className="h-4 w-4" />
                            Documentos Pendentes
                          </h4>
                        </div>
                        <p className="text-[11px] text-amber-700 mb-4 font-medium italic">
                          Os documentos abaixo ainda não foram identificados nesta pasta.
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
                              <h5 className="text-[10px] font-black text-amber-900/60 uppercase tracking-widest border-b border-amber-200 pb-1">
                                {group}
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {docs.map((doc) => (
                                  <div key={doc.key} className="flex items-center gap-2 text-xs text-amber-800 group/item">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 group-hover/item:scale-150 transition-transform" />
                                    <span className="font-semibold">{doc.label}</span>
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
                  <div className={`transition-all duration-500 ${isPendingDocsOpen ? 'block' : 'hidden'}`}>
                    <div className="bg-green-50 border border-green-100 rounded-xl p-5 flex items-start gap-4 text-green-800">
                      <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider mb-1">Documentação Completa!</h4>
                        <p className="text-[11px] text-green-700 font-medium">Todos os documentos obrigatórios foram anexados com sucesso.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dropdown de Certidões por Vendedor */}
                <div 
                  className="space-y-3 cursor-pointer group select-none bg-slate-50/50 p-4 rounded-xl border border-slate-100 hover:border-blue-200 transition-all mt-4"
                  onClick={() => setIsCertidoesOpen(!isCertidoesOpen)}
                  role="button"
                >
                  <div className="flex justify-between text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-blue-600" />
                      <span className="text-slate-700 font-bold text-xs uppercase tracking-tight">Certidões</span>
                      {isCertidoesOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                    {sellersWithCertificates.length > 0 && (
                      <span className="text-slate-900 font-bold text-xs">
                        {sellersWithCertificates.reduce((acc, curr) => acc + curr.docs.length, 0)} arquivos
                      </span>
                    )}
                  </div>
                </div>

                {/* Lista de Certidões (Expansível) */}
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${isCertidoesOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <div className="bg-white border border-slate-100 rounded-xl p-5 mt-2 space-y-4">
                      {sellersWithCertificates.length > 0 ? (
                        sellersWithCertificates.map((seller, sIdx) => (
                          <div key={sIdx} className="space-y-2">
                            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-50 pb-1 flex items-center gap-2">
                              <User className="h-3 w-3" />
                              {seller.name}
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {seller.docs.map((doc) => {
                                const displayName = doc.document_name || doc.file_name || doc.name || "Certidão";
                                return (
                                  <a
                                    key={doc.id}
                                    href={doc.url || doc.file_path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg border border-blue-50 transition-all font-semibold"
                                  >
                                    <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="truncate">{displayName}</span>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-slate-400">
                          <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-30" />
                          <p className="text-[11px] font-bold uppercase tracking-widest">Nenhuma certidão anexada até o momento.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 hover:border-blue-300 transition-all group"
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => { e.preventDefault(); const files = Array.from(e.dataTransfer.files); handleSpecificFileUpload(files as any, "general", 0); }}
                  onClick={() => document.getElementById('general-upload')?.click()}
                >
                  <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform border border-slate-100">
                    <UploadCloud className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">Anexar Documentos</p>
                    <p className="text-[10px] text-slate-500 font-medium">PDF, DOCX, Imagens (Máx: 50MB)</p>
                  </div>
                  <input
                    type="file"
                    id="general-upload"
                    className="hidden"
                    multiple
                    onChange={(e) => { handleSpecificFileUpload(e.target.files, "general", 0); e.target.value = ""; }}
                  />
                </div>

                {documents.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {documents.map((doc) => {
                      const displayName = doc.document_name || doc.file_name || doc.name || "Documento";
                      const fileUrl = doc.url || doc.file_path;
                      return (
                        <div key={doc.id} className="group relative flex flex-col items-center gap-2 p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all hover:-translate-y-0.5">
                          <div className="relative w-10 h-10 flex items-center justify-center bg-blue-50/50 rounded-lg text-blue-600">
                            <FileText className="w-5 h-5" />
                            <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditDocument(doc); }}
                                className="p-1 bg-white border border-slate-100 rounded-lg shadow-sm hover:bg-slate-50 text-slate-600"
                                title="Renomear"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc); }}
                                className="p-1 bg-white border border-slate-100 rounded-lg shadow-sm hover:bg-red-50 text-red-600"
                                title="Excluir"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-slate-700 text-center line-clamp-2 hover:text-blue-600 transition-colors px-1"
                            title={displayName}
                          >
                            {displayName}
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300 opacity-50" />
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pasta Vazia</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUNA DIREITA - STATUS E OBSERVAÇÕES */}
        <div className="flex flex-col gap-8 lg:flex-[1] min-w-0">
          <div className="flex flex-col space-y-6">
            <StatusPanel
              status={status}
              onStatusChange={handleStatusChange}
              currentStep={currentStepIndex + 1}
              totalSteps={WORKFLOW_STEPS.length}
              currentStepTitle={WORKFLOW_STEPS[currentStepIndex]?.title || "Finalizado"}
              createdAt={caseData.createdAt}
              updatedAt={caseData.updatedAt}
            />

            <Card className="rounded-xl border-gray-200 shadow-sm flex-1 flex flex-col bg-white">
              <CardHeader className="flex-shrink-0 border-b border-slate-50 py-4 px-6">
                <CardTitle className="flex items-center w-full justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-600">Observações</span>
                  </div>
                  <button
                    type="button"
                    className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                    onClick={() => setShowNotesModal(true)}
                    title="Ver Histórico Completo"
                  >
                    <History className="h-4 w-4 text-slate-400" />
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 h-[450px]">
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
                  {notesArray.length > 0 ? (
                    [...notesArray].reverse().map((n: any) => {
                      const d = new Date(n.timestamp);
                      const formattedDate = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                      const formattedTime = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={n.id} className="group relative bg-slate-50 rounded-xl p-3 border border-slate-100 hover:border-slate-200 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                                {n.authorName?.split(' ').map((s: any) => s[0]).join('').slice(0, 2).toUpperCase() || 'EQ'}
                              </div>
                              <span className="text-[11px] font-bold text-slate-700">{n.authorName || 'Equipe'}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">{formattedDate} às {formattedTime}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-40">
                      <FileText className="h-8 w-8 text-slate-300" />
                      <p className="text-xs font-medium text-slate-500">Nenhuma observação.</p>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="relative">
                    <Textarea
                      rows={3}
                      placeholder="Nova observação..."
                      value={notes[0] || ''}
                      onChange={(e) => setNotes(prev => ({ ...prev, 0: e.target.value }))}
                      className="w-full resize-none pr-10 text-xs border-slate-200 focus:border-blue-400 min-h-[80px] bg-white rounded-xl"
                    />
                    <Button
                      size="sm"
                      className="absolute bottom-2 right-2 h-7 w-7 p-0 rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-all"
                      onClick={() => saveStepNotes(0)}
                      disabled={!notes[0]?.trim()}
                    >
                      <Save className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RESPONSÁVEIS */}
            <Card className="rounded-xl border-gray-200 shadow-sm bg-white">
              <CardHeader className="py-4 px-6 border-b border-slate-50">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Responsáveis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {Object.entries(assignments)
                    .filter(([_, v]) => v?.responsibleName)
                    .map(([stepId, data]) => (
                      <div key={stepId} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                            {data.responsibleName?.split(' ').map((s: any) => s[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{data.responsibleName}</p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {WORKFLOW_STEPS.find(s => s.id === Number(stepId))?.title || `Etapa ${stepId}`}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                          <Mail className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  {Object.values(assignments).filter(v => v?.responsibleName).length === 0 && (
                    <p className="text-[11px] text-center text-slate-400 py-2">Nenhum responsável atribuído.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* MODAIS */}

      {/* Histórico de Notas */}
      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold">Histórico de Observações</h2>
            </div>
            <DialogClose className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </DialogClose>
          </div>
          <div className="p-6 max-h-[60vh] overflow-y-auto bg-white space-y-4">
            {notesArray.length > 0 ? (
              [...notesArray].reverse().map((n: any) => (
                <div key={n.id} className="relative bg-slate-50 border border-slate-100 rounded-xl p-4 transition-all hover:bg-slate-100/50">
                   <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 shadow-sm">
                        {(n.authorName as string)?.split(' ').map((s: any) => s[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">{n.authorName || 'Equipe'}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{n.authorRole || 'Colaborador'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                      {new Date(n.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Nenhuma observação registrada.</p>
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
             <Button onClick={() => setShowNotesModal(false)} className="bg-slate-900 border-none px-6">Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Info Modal / Documentos Pendentes */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowInfoModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Pendências de Documentação
              </h3>
              <button onClick={() => setShowInfoModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {pendingDocs.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(
                    pendingDocs.reduce((acc, doc) => {
                      if (!acc[doc.group]) acc[doc.group] = [];
                      acc[doc.group].push(doc);
                      return acc;
                    }, {} as Record<string, typeof pendingDocs>)
                  ).map(([group, docs]) => (
                    <div key={group} className="space-y-3">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">{group}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {docs.map((doc: any) => (
                          <div key={doc.key} className="flex items-center gap-3 p-2 bg-amber-50/50 border border-amber-100 rounded-lg group">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span className="text-xs font-bold text-amber-900">{doc.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                   <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                     <CheckCircle className="w-8 h-8 text-green-600" />
                   </div>
                   <h4 className="text-lg font-bold text-slate-800">Documentação Completa!</h4>
                   <p className="text-sm text-slate-500 mt-1">Todos os documentos obrigatórios foram enviados.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Deleção de Documento */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl border-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <Trash2 className="w-5 h-5 text-red-500" />
              Excluir Documento
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 pt-2">
              Você está prestes a excluir o documento <span className="font-bold text-slate-700">"{documentToDelete?.document_name || documentToDelete?.file_name}"</span>.
              Esta ação é permanente e não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6 gap-2">
            <AlertDialogCancel className="rounded-xl border-slate-200">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDocument} className="bg-red-600 hover:bg-red-700 text-white rounded-xl border-0 px-6">
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edição de Nome do Documento */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="rounded-2xl border-none">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <Edit2 className="w-5 h-5 text-blue-500" />
              Renomear Documento
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase">Novo Nome</Label>
            <Input
              value={newDocumentName}
              onChange={(e) => setNewDocumentName(e.target.value)}
              className="rounded-xl h-11 border-slate-200 focus:border-blue-400"
              placeholder="Digite o nome do documento..."
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleRenameDocument()}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleRenameDocument} className="bg-slate-900 rounded-xl px-8">Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Responsável (p/ Nota) */}
      <ObservationResponsibleModal
        open={showResponsibleModal}
        onOpenChange={setShowResponsibleModal}
        onConfirm={(name) => {
          setNoteResponsible(name);
          saveStepNotes(0, pendingNote || undefined, name);
        }}
        currentResponsible={noteResponsible}
      />
    </div>
  );
}
