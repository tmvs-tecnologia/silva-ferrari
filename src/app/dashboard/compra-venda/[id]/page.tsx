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
  ChevronUp,
  X,
  Plus,
  Mail,
  AlertTriangle
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
import "react-day-picker/dist/style.css";
import { StatusPanel } from "@/components/detail/StatusPanel";
import { formatDateBR } from "@/lib/date";
import { subscribeTable, unsubscribe } from "@/lib/realtime";

// Workflow Steps for Compra e Venda
const WORKFLOW_STEPS = [
  { id: 1, title: "Cadastro Documentos", description: "Informações de cadastro" },
  { id: 2, title: "Emitir Certidões", description: "Emissão de documentos" },
  { id: 3, title: "Fazer/Analisar Contrato Compra e Venda", description: "Elaboração e análise contratual" },
  { id: 4, title: "Assinatura de contrato", description: "Coleta de assinaturas" },
  { id: 5, title: "Escritura", description: "Prazos para escritura e pagamentos" },
  { id: 6, title: "Cobrar a Matrícula do Cartório", description: "Finalização do processo" },
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
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [newDocumentName, setNewDocumentName] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isEditingDocuments, setIsEditingDocuments] = useState(false);
  
  // Specific lists
  const [editableSellers, setEditableSellers] = useState<{ rg?: string; cpf?: string; dataNascimento?: string }[]>([]);
  const [editableCompradores, setEditableCompradores] = useState<{ rnm?: string; cpf?: string; endereco?: string }[]>([]);

  const [stepData, setStepData] = useState<{ [key: number]: any }>({});
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
  const notesArray = parseNotesArray(property?.stepNotes || property?.notes); // Using stepNotes for CV usually, but consistent with Vistos notes

  const deleteNote = async (noteId: string) => {
    const next = (notesArray || []).filter((n) => n.id !== noteId);
    try {
      await fetch(`/api/compra-venda-imoveis?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepNotes: JSON.stringify(next) }) // CompraVenda uses stepNotes usually
      });
      setProperty((prev: any) => ({ ...(prev || {}), stepNotes: JSON.stringify(next) }));
      console.log('Nota excluída', { noteId });
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

      // Realtime subscription would go here similar to Vistos
    }
  }, [params.id]);

  const fetchCaseData = async () => {
    try {
      const res = await fetch(`/api/compra-venda-imoveis?id=${params.id}`);
      if (res.ok) {
        const record = await res.json();
        setProperty(record);
        
        const steps: StepData[] = WORKFLOW_STEPS.map((s, index) => ({
          id: s.id, // 1-based in WORKFLOW_STEPS
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

        // Mark completed steps
        steps.forEach(s => {
            s.completed = completedFromServer.includes(s.id);
        });

        // Initialize editable lists
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
        
        // Expand current step
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

  const handleRenameDocument = (document: Document) => {
    setEditingDocument(document);
    setNewDocumentName(document.name || document.document_name || document.file_name || "");
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
        fd.append('moduleType', 'compra_venda_imoveis');
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
      fd.append('moduleType', 'compra_venda_imoveis');
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
    setExpandedSteps(prev => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const handleStepCompletion = async (stepId: number) => {
    if (!caseData) return;
    const isCompleted = caseData.steps.find(s => s.id === stepId)?.completed;
    
    // Logic: If marking complete, add to list. If unmarking, remove.
    const newCompleted = isCompleted 
        ? (caseData.completedSteps || [] as any).filter((id: number) => id !== stepId)
        : [...(caseData.completedSteps || [] as any), stepId];
        
    // Update current step logic (simple progression)
    const nextStep = isCompleted ? stepId : Math.min(stepId + 1, WORKFLOW_STEPS.length);

    try {
        await fetch(`/api/compra-venda-imoveis?id=${params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completedSteps: newCompleted, currentStep: nextStep })
        });
        fetchCaseData(); // Refresh to update UI
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
      console.error("Erro ao salvar assignment:", e);
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
      fetchCaseData(); // Refresh
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
        setSaveMessages(prev => ({ ...prev, 4: 'Prazos salvos' })); // Step 4 usually has deadlines
    } catch (e) {
        console.error(e);
    }
  }

  const renderStepContent = (step: StepData) => {
    const stepId = step.id;

    if (stepId === 1) { // Cadastro Documentos
        const renderField = (label: string, value: string, onChange: (val: string) => void, docKey?: string) => (
            <div className="space-y-2">
                {isEditingDocuments ? <Label>{label}</Label> : null}
                {isEditingDocuments ? (
                    <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-9" />
                ) : (
                    <div className="text-xs leading-snug">
                        <span className="font-medium">{label}:</span> {value || '-'}
                    </div>
                )}
                {docKey && (
                    <>
                        {isEditingDocuments && (
                            <div className="mt-1 flex items-center gap-2">
                                <input 
                                    type="file" 
                                    id={`up-${docKey}-${stepId}`} 
                                    className="hidden" 
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, docKey, stepId); }} 
                                />
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => document.getElementById(`up-${docKey}-${stepId}`)?.click()}
                                    disabled={uploadingFiles[`${docKey}-${stepId}`]}
                                >
                                    {uploadingFiles[`${docKey}-${stepId}`] ? <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                                    Upload
                                </Button>
                            </div>
                        )}
                        {renderDocLinks(docKey)}
                    </>
                )}
            </div>
        );

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-end">
                  {isEditingDocuments ? (
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => { saveStep1Fields(); setIsEditingDocuments(false); }}>
                        <Save className="w-4 h-4 mr-2" />
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
                        <h4 className="font-semibold text-base">Dados do Cliente e Imóvel</h4>
                        {!isEditingDocuments && (
                            <Button size="icon" variant="outline" className="h-7 w-7 p-0" onClick={() => setIsEditingDocuments(true)}>
                                <Edit className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 p-3 bg-white border rounded-lg shadow-xs">
                        {renderField("Nome do Cliente", caseData?.clientName || "", (v) => setCaseData(prev => prev ? ({...prev, clientName: v}) : null))}
                        {renderField("Endereço Imóvel", caseData?.enderecoImovel || "", (v) => setCaseData(prev => prev ? ({...prev, enderecoImovel: v}) : null), "comprovanteEnderecoImovelDoc")}
                        {renderField("Matrícula", caseData?.numeroMatricula || "", (v) => setCaseData(prev => prev ? ({...prev, numeroMatricula: v}) : null), "numeroMatriculaDoc")}
                        {renderField("Contribuinte", caseData?.cadastroContribuinte || "", (v) => setCaseData(prev => prev ? ({...prev, cadastroContribuinte: v}) : null), "cadastroContribuinteDoc")}
                    </div>
                </div>

                {/* Vendedores */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-base">Vendedores</h4>
                         {!isEditingDocuments && (
                            <Button size="icon" variant="outline" className="h-7 w-7 p-0" onClick={() => setIsEditingDocuments(true)}>
                                <Edit className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                    <div className="space-y-3">
                        {editableSellers.map((seller, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 border rounded-lg grid md:grid-cols-3 gap-3 relative group">
                                {isEditingDocuments && editableSellers.length > 1 && (
                                    <button 
                                        onClick={() => setEditableSellers(prev => prev.filter((_, i) => i !== idx))}
                                        className="absolute top-2 right-2 text-red-500 hover:bg-red-50 p-1 rounded"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                
                                <div className="space-y-1">
                                    {isEditingDocuments ? <Label className="text-xs">RG</Label> : <span className="text-xs font-medium block">RG:</span>}
                                    {isEditingDocuments ? (
                                        <Input 
                                            value={seller.rg || ""} 
                                            onChange={(e) => setEditableSellers(prev => prev.map((s, i) => i === idx ? {...s, rg: e.target.value} : s))} 
                                            className="h-8 text-sm" 
                                        />
                                    ) : (
                                        <span className="text-sm">{seller.rg || '-'}</span>
                                    )}
                                    {(isEditingDocuments || ((documents || []).some((d: any) => (d.field_name || d.fieldName) === `rgVendedorDoc_${idx}`))) && (
                                        <>
                                            {isEditingDocuments && (
                                                <div className="mt-1">
                                                    <input type="file" id={`up-rg-${idx}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, `rgVendedorDoc_${idx}`, stepId); }} />
                                                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => document.getElementById(`up-rg-${idx}`)?.click()}>
                                                        <Upload className="w-3 h-3 mr-1" /> Upload
                                                    </Button>
                                                </div>
                                            )}
                                            {renderDocLinks(`rgVendedorDoc_${idx}`)}
                                        </>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    {isEditingDocuments ? <Label className="text-xs">CPF</Label> : <span className="text-xs font-medium block">CPF:</span>}
                                    {isEditingDocuments ? (
                                        <Input 
                                            value={seller.cpf || ""} 
                                            onChange={(e) => setEditableSellers(prev => prev.map((s, i) => i === idx ? {...s, cpf: e.target.value} : s))} 
                                            className="h-8 text-sm" 
                                        />
                                    ) : (
                                        <span className="text-sm">{seller.cpf || '-'}</span>
                                    )}
                                    {(isEditingDocuments || ((documents || []).some((d: any) => (d.field_name || d.fieldName) === `cpfVendedorDoc_${idx}`))) && (
                                        <>
                                            {isEditingDocuments && (
                                                <div className="mt-1">
                                                    <input type="file" id={`up-cpf-${idx}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, `cpfVendedorDoc_${idx}`, stepId); }} />
                                                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => document.getElementById(`up-cpf-${idx}`)?.click()}>
                                                        <Upload className="w-3 h-3 mr-1" /> Upload
                                                    </Button>
                                                </div>
                                            )}
                                            {renderDocLinks(`cpfVendedorDoc_${idx}`)}
                                        </>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    {isEditingDocuments ? <Label className="text-xs">Nascimento</Label> : <span className="text-xs font-medium block">Nascimento:</span>}
                                    {isEditingDocuments ? (
                                        <Input 
                                            type="date" 
                                            value={seller.dataNascimento || ""} 
                                            onChange={(e) => setEditableSellers(prev => prev.map((s, i) => i === idx ? {...s, dataNascimento: e.target.value} : s))} 
                                            className="h-8 text-sm" 
                                        />
                                    ) : (
                                        <span className="text-sm">{formatDateBR(seller.dataNascimento)}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isEditingDocuments && (
                            <Button size="sm" variant="outline" onClick={() => setEditableSellers(prev => [...prev, {}])}>
                                <Plus className="w-4 h-4 mr-2" /> Adicionar Vendedor
                            </Button>
                        )}
                    </div>
                </div>

                {/* Compradores */}
                <div className="space-y-3">
                     <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-base">Compradores</h4>
                         {!isEditingDocuments && (
                            <Button size="icon" variant="outline" className="h-7 w-7 p-0" onClick={() => setIsEditingDocuments(true)}>
                                <Edit className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                    <div className="space-y-3">
                        {editableCompradores.map((comp, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 border rounded-lg grid md:grid-cols-3 gap-3 relative group">
                                 {isEditingDocuments && editableCompradores.length > 1 && (
                                    <button 
                                        onClick={() => setEditableCompradores(prev => prev.filter((_, i) => i !== idx))}
                                        className="absolute top-2 right-2 text-red-500 hover:bg-red-50 p-1 rounded"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <div className="space-y-1">
                                    {isEditingDocuments ? <Label className="text-xs">RNM</Label> : <span className="text-xs font-medium block">RNM:</span>}
                                    {isEditingDocuments ? (
                                        <Input 
                                            value={comp.rnm || ""} 
                                            onChange={(e) => setEditableCompradores(prev => prev.map((s, i) => i === idx ? {...s, rnm: e.target.value} : s))} 
                                            className="h-8 text-sm" 
                                        />
                                    ) : (
                                        <span className="text-sm">{comp.rnm || '-'}</span>
                                    )}
                                     {(isEditingDocuments || ((documents || []).some((d: any) => (d.field_name || d.fieldName) === `rnmCompradorDoc_${idx}`))) && (
                                        <>
                                            {isEditingDocuments && (
                                                <div className="mt-1">
                                                    <input type="file" id={`up-rnm-${idx}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, `rnmCompradorDoc_${idx}`, stepId); }} />
                                                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => document.getElementById(`up-rnm-${idx}`)?.click()}>
                                                        <Upload className="w-3 h-3 mr-1" /> Upload
                                                    </Button>
                                                </div>
                                            )}
                                            {renderDocLinks(`rnmCompradorDoc_${idx}`)}
                                        </>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    {isEditingDocuments ? <Label className="text-xs">CPF</Label> : <span className="text-xs font-medium block">CPF:</span>}
                                    {isEditingDocuments ? (
                                        <Input 
                                            value={comp.cpf || ""} 
                                            onChange={(e) => setEditableCompradores(prev => prev.map((s, i) => i === idx ? {...s, cpf: e.target.value} : s))} 
                                            className="h-8 text-sm" 
                                        />
                                    ) : (
                                        <span className="text-sm">{comp.cpf || '-'}</span>
                                    )}
                                     {(isEditingDocuments || ((documents || []).some((d: any) => (d.field_name || d.fieldName) === `cpfCompradorDoc_${idx}`))) && (
                                        <>
                                            {isEditingDocuments && (
                                                <div className="mt-1">
                                                    <input type="file" id={`up-cpfc-${idx}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, `cpfCompradorDoc_${idx}`, stepId); }} />
                                                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => document.getElementById(`up-cpfc-${idx}`)?.click()}>
                                                        <Upload className="w-3 h-3 mr-1" /> Upload
                                                    </Button>
                                                </div>
                                            )}
                                            {renderDocLinks(`cpfCompradorDoc_${idx}`)}
                                        </>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    {isEditingDocuments ? <Label className="text-xs">Endereço</Label> : <span className="text-xs font-medium block">Endereço:</span>}
                                    {isEditingDocuments ? (
                                        <Input 
                                            value={comp.endereco || ""} 
                                            onChange={(e) => setEditableCompradores(prev => prev.map((s, i) => i === idx ? {...s, endereco: e.target.value} : s))} 
                                            className="h-8 text-sm" 
                                        />
                                    ) : (
                                        <span className="text-sm">{comp.endereco || '-'}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                         {isEditingDocuments && (
                            <Button size="sm" variant="outline" onClick={() => setEditableCompradores(prev => [...prev, {}])}>
                                <Plus className="w-4 h-4 mr-2" /> Adicionar Comprador
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (stepId === 4) { // Assinatura - Prazos
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Prazo Sinal</Label>
                        <Input type="date" value={caseData?.prazoSinal || ""} onChange={(e) => setCaseData(prev => prev ? ({...prev, prazoSinal: e.target.value}) : null)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Prazo Escritura</Label>
                        <Input type="date" value={caseData?.prazoEscritura || ""} onChange={(e) => setCaseData(prev => prev ? ({...prev, prazoEscritura: e.target.value}) : null)} />
                    </div>
                </div>
                <Button size="sm" onClick={savePrazos}>Salvar Prazos</Button>
                {saveMessages[4] && <div className="text-green-600 text-sm">{saveMessages[4]}</div>}
                
                <div className="mt-4">
                    <UploadDocBlock 
                        inputId={`contrato-assinado-${stepId}`}
                        disabledKey={`contrato-assinado-${stepId}`}
                        onSelect={(f) => handleSpecificFileUpload(f, "assinaturaContratoDoc", stepId)}
                    />
                    {renderDocLinks("assinaturaContratoDoc")}
                </div>
            </div>
        );
    }

    // Default generic step content
    return (
        <div className="space-y-4">
            <UploadDocBlock 
                inputId={`upload-${stepId}`} 
                disabledKey={`upload-${stepId}`} 
                onSelect={(f) => handleFileUpload([f], stepId)} 
            />
            {renderDocLinks(`documentoAnexado`)} {/* Shows generic docs if mapped, or we can use step specific keys if needed */}
            
            {/* Specific docs for other steps */}
            {stepId === 2 && renderDocLinks("certidoesDoc")}
            {stepId === 3 && renderDocLinks("contratoDoc")}
            {stepId === 5 && renderDocLinks("escrituraDoc")}
            {stepId === 6 && renderDocLinks("matriculaCartorioDoc")}

            <div>
                <Label>Observações</Label>
                <Textarea 
                    rows={3} 
                    value={notes[stepId] || ""} 
                    onChange={(e) => setNotes(prev => ({...prev, [stepId]: e.target.value}))} 
                    placeholder="Adicione observações..."
                />
                <Button size="sm" className="mt-2" onClick={() => saveStepNotes(stepId)}>Salvar Observações</Button>
                {saveMessages[stepId] && <div className="text-green-600 text-sm mt-1">{saveMessages[stepId]}</div>}
            </div>
        </div>
    );
  };

  const currentStepIndex = (caseData?.currentStep || 1) - 1;

  if (loading) {
    return <div className="p-6"><Skeleton className="h-10 w-64 mb-4"/><Skeleton className="h-96 w-full"/></div>;
  }

  if (!caseData) return <div className="p-6">Caso não encontrado</div>;

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
            <h1 className="text-2xl sm:text-3xl font-bold">{caseData.clientName}</h1>
            <p className="text-muted-foreground">{caseData.description}</p>
          </div>
        </div>
        <div className="flex-shrink-0">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700">
                        <Trash2 className="h-4 w-4 mr-2" /> Excluir
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>Tem certeza que deseja excluir esta ação?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={async () => {
                            await fetch(`/api/compra-venda-imoveis?id=${params.id}`, { method: 'DELETE' });
                            router.push('/dashboard/compra-venda');
                        }} className="bg-red-600">Excluir</AlertDialogAction>
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
                {caseData.steps.map((step, index) => {
                  const isCurrent = step.id === caseData.currentStep;
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
                              {isCurrent ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Atual</span>
                              ) : isCompleted ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Concluído</span>
                              ) : null}
                            </div>
                            {assignments[step.id]?.responsibleName ? (
                              <div className="mt-1 text-xs text-gray-600">
                                <span className="font-medium">Responsável:</span> {assignments[step.id]?.responsibleName}
                                {assignments[step.id]?.dueDate && <span> · Prazo: {formatDateBR(assignments[step.id]?.dueDate)}</span>}
                              </div>
                            ) : null}
                            {/* Prazos display for step 4/5 */}
                            {step.id === 4 && (caseData.prazoSinal || caseData.prazoEscritura) && (
                                <div className="mt-1 flex gap-2">
                                    {caseData.prazoSinal && <Badge variant="outline" className="text-xs">Sinal: {formatDateBR(caseData.prazoSinal)}</Badge>}
                                    {caseData.prazoEscritura && <Badge variant="outline" className="text-xs">Escritura: {formatDateBR(caseData.prazoEscritura)}</Badge>}
                                </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Popover open={assignOpenStep === step.id} onOpenChange={(open) => setAssignOpenStep(open ? step.id : null)}>
                              <PopoverTrigger asChild>
                                <button className="text-xs text-gray-600 border border-gray-300 rounded px-3 py-1 bg-white">Definir Responsável</button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[420px]">
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <Label>Responsável</Label>
                                    <Input value={assignResp} onChange={(e) => setAssignResp(e.target.value)} placeholder="Selecione..." />
                                    <div className="rounded-md border mt-2 bg-white max-h-40 overflow-y-auto">
                                      {RESPONSAVEIS.map((r) => (
                                        <button key={r} className="w-full text-left px-2 py-1 text-sm hover:bg-slate-100" onClick={() => setAssignResp(r)}>{r}</button>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <Label>Data limite</Label>
                                    <Input type="date" value={assignDue} onChange={(e) => setAssignDue(e.target.value)} />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button size="sm" onClick={() => { handleSaveAssignment(step.id, assignResp, assignDue); setAssignOpenStep(null); }}>Salvar</Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                            <button className="text-gray-500" onClick={() => toggleStepExpansion(step.id)}>
                              {expandedSteps[step.id] ? <ChevronUp className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
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
        </div>

        <div className="lg:col-span-4 flex flex-col min-h-[560px] space-y-4">
          <StatusPanel
            status={status}
            onStatusChange={handleStatusChange}
            currentStep={caseData.currentStep}
            totalSteps={WORKFLOW_STEPS.length}
            currentStepTitle={WORKFLOW_STEPS.find(s => s.id === caseData.currentStep)?.title}
            createdAt={caseData.createdAt}
            updatedAt={caseData.updatedAt}
          />

          <Card className="rounded-xl border-gray-200 shadow-sm flex-1 flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center w-full justify-between">
                <span className="flex items-center">Observações</span>
                <button className="rounded-md border px-2 py-1 text-xs bg-white" onClick={() => setShowNotesModal(true)}>Ver todas</button>
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
              <div className="flex justify-end mt-2">
                <Button onClick={() => saveStepNotes(0)}>Salvar</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
                <div className={`col-span-1 md:col-span-2 border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center ${uploadingFiles['general'] ? 'opacity-50' : ''} hover:bg-gray-50`}
                     onDragOver={(e) => e.preventDefault()}
                     onDrop={(e) => { e.preventDefault(); handleFileUpload(e.dataTransfer.files as any); }}>
                  <Upload className="h-6 w-6 text-blue-500 mb-2" />
                  <p className="text-sm font-medium text-gray-700">Arraste arquivos aqui</p>
                </div>
                {documents.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-4">
                        {documents.map((doc) => (
                            <div key={doc.id} className="group relative w-10 h-10">
                                <a href={doc.file_path || doc.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full rounded-md border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                </a>
                                <button className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-white border rounded-full p-0.5" onClick={(e) => { e.preventDefault(); handleDeleteDocument(doc); }}>
                                    <X className="h-3 w-3 text-gray-600" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Excluir documento?</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteDocument}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
