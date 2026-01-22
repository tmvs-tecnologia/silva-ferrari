"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { documentIconClassName } from "@/components/ui/document-style";
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
  X,
  Plus,
  Mail,
  ChevronDown,
  Edit2
} from "lucide-react";
import { toast } from "sonner";
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
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import "react-day-picker/dist/style.css";
import { StatusPanel } from "@/components/detail/StatusPanel";
import { PendingDocumentsList } from "@/components/detail/PendingDocumentsList";
import { formatDateBR } from "@/lib/date";

// Workflow Steps for Compra e Venda
const WORKFLOW_STEPS = [
  { id: 1, title: "Cadastro Documentos", description: "Informações de cadastro" },
  { id: 2, title: "Emitir Certidões", description: "Emissão de documentos" },
  { id: 3, title: "Fazer/Analisar Contrato", description: "Elaboração e análise contratual" },
  { id: 4, title: "Assinatura de contrato", description: "Coleta de assinaturas" },
  { id: 5, title: "Escritura", description: "Prazos para escritura e pagamentos" },
  { id: 6, title: "Cobrar a Matrícula", description: "Finalização do processo" },
  { id: 7, title: "Processo Finalizado", description: "Encerramento da ação" },
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
  prazoSinal?: string;
  prazoEscritura?: string;
  contractNotes?: string;
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
  
  // Specific lists
  const [editableSellers, setEditableSellers] = useState<{ rg?: string; cpf?: string; dataNascimento?: string }[]>([]);
  const [editableCompradores, setEditableCompradores] = useState<{ rnm?: string; cpf?: string; endereco?: string }[]>([]);

  const [assignments, setAssignments] = useState<Record<number, { responsibleName?: string; dueDate?: string }>>({});
  const [saveMessages, setSaveMessages] = useState<{ [key: number]: string }>({});
  const [assignOpenStep, setAssignOpenStep] = useState<number | null>(null);
  const [assignResp, setAssignResp] = useState<string>("");
  const [assignDue, setAssignDue] = useState<string>("");
  const [showNotesModal, setShowNotesModal] = useState(false);

  const RESPONSAVEIS = [
    "Secretária – Jessica Cavallaro",
    "Advogada – Jailda Silva",
    "Advogada – Adriana Roder",
    "Advogado – Fábio Ferrari",
    "Advogado – Guilherme Augusto",
    "Estagiário – Wendel Macriani",
  ];

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
    const next = (notesArray || []).filter((n) => n.id !== noteId);
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
      const loadAssignments = async () => {
        try {
          const res = await fetch(`/api/step-assignments?moduleType=compra_venda_imoveis&recordId=${params.id}`);
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
    }
  }, [params.id]);

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

        const rgList = (record.rgVendedores || "").split(",").filter(Boolean);
        const cpfList = (record.cpfVendedores || "").split(",").filter(Boolean);
        const dobList = (record.dataNascimentoVendedores || "").split(",").filter(Boolean);
        const maxLen = Math.max(rgList.length, cpfList.length, dobList.length);
        const sellers = maxLen > 0
          ? Array.from({ length: maxLen }, (_, i) => ({ rg: rgList[i] || "", cpf: cpfList[i] || "", dataNascimento: dobList[i] || "" }))
          : [{ rg: "", cpf: "", dataNascimento: "" }];
        setEditableSellers(sellers);

        const rnmList = (record.rnmComprador || "").split(",").filter(Boolean);
        const cpfCList = (record.cpfComprador || "").split(",").filter(Boolean);
        const endList = (record.enderecoComprador || "").split(",").filter(Boolean);
        const maxC = Math.max(rnmList.length, cpfCList.length, endList.length);
        const compradores = maxC > 0
          ? Array.from({ length: maxC }, (_, i) => ({ rnm: rnmList[i] || "", cpf: cpfCList[i] || "", endereco: endList[i] || "" }))
          : [{ rnm: "", cpf: "", endereco: "" }];
        setEditableCompradores(compradores);

        const data: CaseData = {
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
          ...record
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
      await fetchDocuments();
      toast.success(`Upload concluído: ${file.name}`);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao realizar upload.");
    } finally {
      setUploadingFiles(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleStepCompletion = async (stepId: number) => {
    if (!caseData) return;
    const isCompleted = caseData.steps.find(s => s.id === stepId)?.completed;
    
    const newCompleted = isCompleted 
        ? (caseData.completedSteps || [] as any).filter((id: number) => id !== stepId)
        : [...(caseData.completedSteps || [] as any), stepId];
        
    const nextStep = isCompleted ? stepId : Math.min(stepId + 1, WORKFLOW_STEPS.length);

    try {
        await fetch(`/api/compra-venda-imoveis?id=${params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completedSteps: newCompleted, currentStep: nextStep })
        });
        fetchCaseData();
    } catch (e) {
        console.error("Erro ao atualizar etapa:", e);
    }
  };

  const saveStepNotes = async (stepId: number) => {
    const text = (notes[stepId] || '').trim();
    if (!text) return;
    
    const iso = new Date().toISOString();
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    
    const assigned = assignments[stepId] || assignments[caseData?.currentStep || 1] || {};
    const assignedName = assigned.responsibleName || '';
    const suggestion = RESPONSAVEIS.find((r) => r.includes(assignedName || '')) || '';
    const role = suggestion ? suggestion.split(' – ')[0] : '';
    
    const next = [...notesArray, { id, stepId, content: text, timestamp: iso, authorName: assignedName || 'Equipe', authorRole: role }];
    
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
      }
    } catch (error) {
      console.error('Erro ao salvar notas:', error);
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
    try {
      const body = {
        clientName: caseData?.clientName || "",
        numeroMatricula: caseData?.numeroMatricula || "",
        cadastroContribuinte: caseData?.cadastroContribuinte || "",
        enderecoImovel: caseData?.enderecoImovel || "",
        rgVendedores: (editableSellers || []).map(s => s.rg || "").filter(Boolean).join(","),
        cpfVendedores: (editableSellers || []).map(s => s.cpf || "").filter(Boolean).join(","),
        dataNascimentoVendedores: (editableSellers || []).map(s => s.dataNascimento || "").filter(Boolean).join(","),
        rnmComprador: (editableCompradores || []).map(c => c.rnm || "").filter(Boolean).join(","),
        cpfComprador: (editableCompradores || []).map(c => c.cpf || "").filter(Boolean).join(","),
        enderecoComprador: (editableCompradores || []).map(c => c.endereco || "").filter(Boolean).join(","),
      };
      await fetch(`/api/compra-venda-imoveis?id=${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      fetchCaseData();
      setSaveMessages(prev => ({ ...prev, 1: 'Dados salvos' }));
    } catch (e) {
      console.error(e);
    }
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
    <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
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
    // Find doc by fieldName or infer from fileKey
    const fileUrl = (documents || []).find(d => d.fieldName === fileKey || d.field_name === fileKey)?.url || (documents || []).find(d => d.fieldName === fileKey || d.field_name === fileKey)?.file_path;
    const fileName = (documents || []).find(d => d.fieldName === fileKey || d.field_name === fileKey)?.name || 'Documento';

    return (
        <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</Label>
            <div className="flex flex-col gap-2">
                {valueKey && (
                    isEditing ? (
                        <Input 
                            value={String(caseData?.[valueKey] || "")} 
                            onChange={(e) => onChangeValue?.(e.target.value)}
                            className="h-9 bg-white"
                        />
                    ) : (
                        <div className="text-sm font-medium text-slate-900 min-h-[20px]">
                            {String(caseData?.[valueKey] || "-")}
                        </div>
                    )
                )}
                {customValue}
                
                <div className="flex items-center gap-2 mt-1">
                     {fileUrl ? (
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100 w-full">
                            <FileText className={`${documentIconClassName} text-blue-600 flex-shrink-0`} />
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-700 hover:underline truncate flex-1">
                                {fileName}
                            </a>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => {
                                    const doc = documents.find(d => d.fieldName === fileKey || d.field_name === fileKey);
                                    if(doc) handleDeleteDocument(doc);
                                }}
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                     ) : (
                        <div className="flex items-center gap-2 w-full">
                            <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 border border-dashed border-slate-300 rounded-md text-sm text-slate-500 cursor-pointer hover:bg-slate-50 transition-colors ${uploadingFiles[`${fileKey}-${stepId}`] ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Upload className="w-3.5 h-3.5" />
                                {uploadingFiles[`${fileKey}-${stepId}`] ? 'Enviando...' : 'Anexar arquivo'}
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    onChange={(e) => { const f = e.target.files?.[0]; if(f) handleSpecificFileUpload(f, fileKey, stepId || 0); }}
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                            </label>
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
  };

  const getDocRequirements = () => {
    const reqs = [
        { label: "Comprovante de Endereço", key: "comprovanteEnderecoImovelDoc", group: "Cadastro Documentos", required: true },
        { label: "Matrícula do Imóvel", key: "numeroMatriculaDoc", group: "Cadastro Documentos", required: true },
        { label: "Cadastro de Contribuinte", key: "cadastroContribuinteDoc", group: "Cadastro Documentos", required: true },
    ];
    
    editableSellers.forEach((_, i) => {
        reqs.push({ label: `RG Vendedor ${i+1}`, key: `rgVendedorDoc_${i}`, group: "Cadastro Documentos", required: true });
        reqs.push({ label: `CPF Vendedor ${i+1}`, key: `cpfVendedorDoc_${i}`, group: "Cadastro Documentos", required: true });
        reqs.push({ label: `Certidão Estado Civil Vendedor ${i+1}`, key: `certidaoEstadoCivilVendedorDoc_${i}`, group: "Cadastro Documentos", required: true });
    });

    editableCompradores.forEach((_, i) => {
        reqs.push({ label: `RNM Comprador ${i+1}`, key: `rnmCompradorDoc_${i}`, group: "Cadastro Documentos", required: true });
        reqs.push({ label: `CPF Comprador ${i+1}`, key: `cpfCompradorDoc_${i}`, group: "Cadastro Documentos", required: true });
        reqs.push({ label: `Certidão Estado Civil Comprador ${i+1}`, key: `certidaoEstadoCivilCompradorDoc_${i}`, group: "Cadastro Documentos", required: true });
    });

    reqs.push({ label: "Certidões", key: "certidoesDoc", group: "Emitir Certidões", required: false });
    reqs.push({ label: "Minuta do Contrato", key: "contratoDoc", group: "Fazer/Analisar Contrato", required: true });
    reqs.push({ label: "Contrato Assinado", key: "assinaturaContratoDoc", group: "Assinatura de contrato", required: true });
    reqs.push({ label: "Comprovante Pagamento Sinal", key: "comprovanteSinalDoc", group: "Assinatura de contrato", required: false });
    reqs.push({ label: "Escritura", key: "escrituraDoc", group: "Escritura", required: true });
    reqs.push({ label: "Matrícula Atualizada", key: "matriculaCartorioDoc", group: "Cobrar a Matrícula", required: true });

    return reqs;
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

  const renderStepContent = (step: StepData) => {
    const stepId = step.id;

    if (stepId === 1) { // Cadastro
        return (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {renderHeader("Dados Iniciais", 
                    () => setIsEditingDocuments(true), 
                    isEditingDocuments,
                    () => { saveStep1Fields(); setIsEditingDocuments(false); },
                    () => setIsEditingDocuments(false)
                )}
                <div className="p-4 md:p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {renderRow("Nome do Cliente", "clientName", "", isEditingDocuments, (v) => setCaseData(prev => prev ? ({...prev, clientName: v}) : null), undefined, stepId)}
                         {renderRow("Endereço Imóvel", "enderecoImovel", "comprovanteEnderecoImovelDoc", isEditingDocuments, (v) => setCaseData(prev => prev ? ({...prev, enderecoImovel: v}) : null), undefined, stepId)}
                         {renderRow("Matrícula", "numeroMatricula", "numeroMatriculaDoc", isEditingDocuments, (v) => setCaseData(prev => prev ? ({...prev, numeroMatricula: v}) : null), undefined, stepId)}
                         {renderRow("Contribuinte", "cadastroContribuinte", "cadastroContribuinteDoc", isEditingDocuments, (v) => setCaseData(prev => prev ? ({...prev, cadastroContribuinte: v}) : null), undefined, stepId)}
                    </div>
                    
                    {/* Vendedores */}
                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold text-sm">Vendedores</h4>
                            {isEditingDocuments && <Button size="sm" variant="outline" onClick={() => setEditableSellers(prev => [...prev, {}])}><Plus className="w-3 h-3 mr-1"/> Adicionar</Button>}
                        </div>
                        <div className="space-y-4">
                            {editableSellers.map((seller, idx) => (
                                <div key={idx} className="bg-slate-50 p-3 rounded-lg border relative">
                                    {isEditingDocuments && editableSellers.length > 1 && (
                                        <button onClick={() => setEditableSellers(prev => prev.filter((_, i) => i !== idx))} className="absolute top-2 right-2 text-red-500"><X className="w-3 h-3"/></button>
                                    )}
                                    <div className="grid md:grid-cols-3 gap-4">
                                        {renderRow("RG", undefined, `rgVendedorDoc_${idx}`, isEditingDocuments, undefined, 
                                            isEditingDocuments ? <Input value={seller.rg || ""} onChange={(e) => setEditableSellers(prev => prev.map((s, i) => i === idx ? {...s, rg: e.target.value} : s))} className="h-9 bg-white" /> : <span className="text-sm font-medium">{seller.rg || '-'}</span>, stepId
                                        )}
                                        {renderRow("CPF", undefined, `cpfVendedorDoc_${idx}`, isEditingDocuments, undefined, 
                                            isEditingDocuments ? <Input value={seller.cpf || ""} onChange={(e) => setEditableSellers(prev => prev.map((s, i) => i === idx ? {...s, cpf: e.target.value} : s))} className="h-9 bg-white" /> : <span className="text-sm font-medium">{seller.cpf || '-'}</span>, stepId
                                        )}
                                        {renderRow("Nascimento", undefined, "", isEditingDocuments, undefined, 
                                            isEditingDocuments ? <Input type="date" value={seller.dataNascimento || ""} onChange={(e) => setEditableSellers(prev => prev.map((s, i) => i === idx ? {...s, dataNascimento: e.target.value} : s))} className="h-9 bg-white" /> : <span className="text-sm font-medium">{formatDateBR(seller.dataNascimento)}</span>, stepId
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Compradores */}
                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold text-sm">Compradores</h4>
                            {isEditingDocuments && <Button size="sm" variant="outline" onClick={() => setEditableCompradores(prev => [...prev, {}])}><Plus className="w-3 h-3 mr-1"/> Adicionar</Button>}
                        </div>
                        <div className="space-y-4">
                            {editableCompradores.map((comp, idx) => (
                                <div key={idx} className="bg-slate-50 p-3 rounded-lg border relative">
                                    {isEditingDocuments && editableCompradores.length > 1 && (
                                        <button onClick={() => setEditableCompradores(prev => prev.filter((_, i) => i !== idx))} className="absolute top-2 right-2 text-red-500"><X className="w-3 h-3"/></button>
                                    )}
                                    <div className="grid md:grid-cols-3 gap-4">
                                        {renderRow("RNM", undefined, `rnmCompradorDoc_${idx}`, isEditingDocuments, undefined, 
                                            isEditingDocuments ? <Input value={comp.rnm || ""} onChange={(e) => setEditableCompradores(prev => prev.map((s, i) => i === idx ? {...s, rnm: e.target.value} : s))} className="h-9 bg-white" /> : <span className="text-sm font-medium">{comp.rnm || '-'}</span>, stepId
                                        )}
                                        {renderRow("CPF", undefined, `cpfCompradorDoc_${idx}`, isEditingDocuments, undefined, 
                                            isEditingDocuments ? <Input value={comp.cpf || ""} onChange={(e) => setEditableCompradores(prev => prev.map((s, i) => i === idx ? {...s, cpf: e.target.value} : s))} className="h-9 bg-white" /> : <span className="text-sm font-medium">{comp.cpf || '-'}</span>, stepId
                                        )}
                                        {renderRow("Endereço", undefined, "", isEditingDocuments, undefined, 
                                            isEditingDocuments ? <Input value={comp.endereco || ""} onChange={(e) => setEditableCompradores(prev => prev.map((s, i) => i === idx ? {...s, endereco: e.target.value} : s))} className="h-9 bg-white" /> : <span className="text-sm font-medium">{comp.endereco || '-'}</span>, stepId
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
             </div>
        );
    }

    if (stepId === 4) { // Assinatura - Prazos
        return (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {renderHeader("Assinatura e Prazos", undefined, false)}
                <div className="p-4 md:p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Prazo Sinal</Label>
                            <div className="flex gap-2">
                                <Input type="date" value={caseData?.prazoSinal || ""} onChange={(e) => setCaseData(prev => prev ? ({...prev, prazoSinal: e.target.value}) : null)} className="h-9 bg-white" />
                                <Button size="sm" onClick={savePrazos}>Salvar</Button>
                            </div>
                        </div>
                         <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Prazo Escritura</Label>
                            <div className="flex gap-2">
                                <Input type="date" value={caseData?.prazoEscritura || ""} onChange={(e) => setCaseData(prev => prev ? ({...prev, prazoEscritura: e.target.value}) : null)} className="h-9 bg-white" />
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
        2: "certidoesDoc",
        3: "contratoDoc",
        5: "escrituraDoc",
        6: "matriculaCartorioDoc"
    };
    const key = docKeys[stepId];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {renderHeader(step.title, undefined, false)}
            <div className="p-4 md:p-6 space-y-4">
                 {key && renderRow(step.description, undefined, key, false, undefined, undefined, stepId)}
                 
                 <div className="space-y-1 mt-4">
                    <Label className="text-xs font-semibold text-slate-500 uppercase">Observações</Label>
                    <div className="flex gap-2">
                        <Textarea 
                            rows={3} 
                            value={notes[stepId] || ""} 
                            onChange={(e) => setNotes(prev => ({...prev, [stepId]: e.target.value}))} 
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

  return (
    <div className="w-full p-4 space-y-6 bg-gray-50 min-h-screen">
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
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                {/* Dialog content is managed by state, trigger is manual */}
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Excluir documento?</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteDocument}>Excluir</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-12">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-6">
             <Card className="rounded-xl border-gray-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-100">
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Fluxo do Processo
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-6 space-y-1">
                        {caseData.steps.map((step, index) => {
                             const isCurrent = step.id === caseData.currentStep;
                             const isCompleted = step.completed;
                             const showConnector = index < caseData.steps.length - 1;
                             
                             return (
                                <div key={step.id} className="relative pl-10 pb-8 last:pb-0">
                                     {showConnector && (
                                        <div className={`absolute left-[19px] top-8 bottom-0 w-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                                     )}
                                     
                                     <div 
                                        className={`absolute left-0 top-1 w-10 h-10 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-105 z-10 ${
                                            isCompleted ? 'bg-green-50 border-green-500 text-green-600' :
                                            isCurrent ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-md' :
                                            'bg-white border-gray-200 text-gray-300'
                                        }`}
                                        onClick={() => handleStepCompletion(step.id)}
                                     >
                                         {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5 fill-current" />}
                                     </div>

                                     <div className="space-y-3">
                                         <div className="flex items-center justify-between">
                                             <div className="flex items-center gap-3">
                                                 <h3 className={`font-semibold text-lg ${isCurrent ? 'text-blue-700' : 'text-slate-700'}`}>
                                                     {step.title}
                                                 </h3>
                                                 {isCurrent && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">Atual</Badge>}
                                             </div>
                                             
                                             <div className="flex items-center gap-2">
                                                 <Popover open={assignOpenStep === step.id} onOpenChange={(open) => setAssignOpenStep(open ? step.id : null)}>
                                                     <PopoverTrigger asChild>
                                                         <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500">
                                                             {assignments[step.id]?.responsibleName ? assignments[step.id].responsibleName : "Atribuir"}
                                                         </Button>
                                                     </PopoverTrigger>
                                                     <PopoverContent className="w-80 p-4">
                                                         <div className="space-y-4">
                                                             <h4 className="font-semibold text-sm">Definir Responsável</h4>
                                                             <div className="space-y-2">
                                                                 <Label>Nome</Label>
                                                                 <Select value={assignResp} onValueChange={setAssignResp}>
                                                                     <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                     <SelectContent>
                                                                         {RESPONSAVEIS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                                     </SelectContent>
                                                                 </Select>
                                                             </div>
                                                             <div className="space-y-2">
                                                                 <Label>Prazo</Label>
                                                                 <Input type="date" value={assignDue} onChange={(e) => setAssignDue(e.target.value)} />
                                                             </div>
                                                             <Button size="sm" onClick={() => { handleSaveAssignment(step.id, assignResp, assignDue); setAssignOpenStep(null); }}>Salvar</Button>
                                                         </div>
                                                     </PopoverContent>
                                                 </Popover>
                                                 
                                                 <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => setExpandedSteps(prev => ({ ...prev, [step.id]: !prev[step.id] }))}
                                                 >
                                                     {expandedSteps[step.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                 </Button>
                                             </div>
                                         </div>

                                         {(expandedSteps[step.id] || isCurrent) && (
                                             <div className="pt-2 animate-in slide-in-from-top-2 duration-300">
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
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 space-y-6">
            <StatusPanel
                status={status}
                onStatusChange={handleStatusChange}
                currentStep={caseData.currentStep}
                totalSteps={WORKFLOW_STEPS.length}
                currentStepTitle={WORKFLOW_STEPS.find(s => s.id === caseData.currentStep)?.title || "Finalizado"}
                createdAt={caseData.createdAt}
                updatedAt={caseData.updatedAt}
            />

            <PendingDocumentsList
                documents={pendingDocs}
                totalDocs={totalDocs}
                completedDocs={completedDocs}
                onUploadClick={(doc) => {
                     // Find step id based on group
                     const step = WORKFLOW_STEPS.find(s => s.title === doc.group);
                     if (step) {
                         setExpandedSteps(prev => ({ ...prev, [step.id]: true }));
                     }
                }}
            />

            <Card className="rounded-xl border-gray-200 shadow-sm flex-1 flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="flex items-center w-full justify-between">
                    <span className="flex items-center text-sm font-semibold uppercase text-slate-500">Observações Gerais</span>
                    <button className="rounded-md border px-2 py-1 text-xs bg-white hover:bg-slate-50" onClick={() => setShowNotesModal(true)}>Ver Histórico</button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <Textarea 
                    rows={6} 
                    placeholder="Adicione observações gerais..." 
                    value={notes[0] || ''} 
                    onChange={(e) => setNotes(prev => ({ ...prev, 0: e.target.value }))} 
                    className="flex-1 border-none bg-slate-50 resize-none mb-2" 
                  />
                  <div className="flex justify-end">
                    <Button size="sm" className="bg-slate-900" onClick={() => saveStepNotes(0)}>Salvar Nota</Button>
                  </div>
                </CardContent>
            </Card>
        </div>
      </div>
      
       {/* Modal de Notas */}
      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent>
            <DialogHeader><DialogTitle>Notas do Processo</DialogTitle></DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto space-y-3">
                {notesArray.length ? notesArray.map((n) => (
                    <div key={n.id} className="bg-gray-50 p-3 rounded border relative group">
                        <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100" onClick={() => deleteNote(n.id)}><X className="h-3 w-3" /></button>
                        <div className="text-xs font-medium mb-1">{new Date(n.timestamp).toLocaleString()} - {n.authorName}</div>
                        <p className="text-sm">{n.content}</p>
                    </div>
                )) : <p>Nenhuma nota.</p>}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
