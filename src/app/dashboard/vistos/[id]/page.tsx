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
  ChevronDown,
  ChevronUp,
  ChevronRight,
  X,
  Plus
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DetailLayout } from "@/components/detail/DetailLayout";
import { StepItem } from "@/components/detail/StepItem";
import { StatusPanel } from "@/components/detail/StatusPanel";
import { DocumentPanel } from "@/components/detail/DocumentPanel";
import { NotesPanel } from "@/components/detail/NotesPanel";

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

  // Estados para dados específicos de cada etapa
  const [stepData, setStepData] = useState<{ [key: number]: any }>({});

  // Estados para uploads de arquivos específicos
  const [fileUploads, setFileUploads] = useState<{ [key: string]: File | null }>({});
  const [assignments, setAssignments] = useState<Record<number, { responsibleName?: string; dueDate?: string }>>({});
  const [saveMessages, setSaveMessages] = useState<{ [key: number]: string }>({});

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
      <div className="mt-2">
        <Label>Documento anexado</Label>
        <ul className="list-disc pl-5">
          {list.map((doc: any) => (
            <li key={String(doc.id)}>
              <a href={doc.file_path || doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {doc.document_name || doc.name || doc.file_name || 'Documento'}
              </a>
            </li>
          ))}
        </ul>
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
      const updatedSteps = prev.steps.map(step => 
        step.id === stepId 
          ? { 
              ...step, 
              completed: !step.completed,
              completedAt: !step.completed ? new Date().toISOString() : undefined
            }
          : step
      );
      const completedCount = updatedSteps.filter(s => s.completed).length;
      const newCurrent = Math.min(completedCount, updatedSteps.length - 1);
      const completedStepsArr = updatedSteps.filter(s => s.completed).map(s => s.id);
      (async () => {
        try {
          await fetch(`/api/vistos?id=${params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentStep: newCurrent, completedSteps: completedStepsArr })
          });
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
      if (res.ok) setSaveMessages(prev => ({ ...prev, [stepId]: 'Salvo' }));
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
      }
    } catch (e) {
      console.error('Erro ao atualizar statusFinal do registro:', e);
    }
  };

  const saveStepNotes = async (stepId: number) => {
    const typeKey = (caseData?.type || 'Visto de Trabalho') as VistoType;
    const stepTitle = (WORKFLOWS[typeKey] || [])[stepId] || `Etapa ${stepId + 1}`;
    const text = notes[stepId] || '';
    const block = `\n[${stepTitle}]\n${text.trim()}\n`;
    try {
      const res = await fetch(`/api/vistos?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: `${block}` })
      });
      if (res.ok) setSaveMessages(prev => ({ ...prev, [stepId]: 'Salvo' }));
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
    } catch (e) {
      console.error('Erro ao atualizar status:', e);
    }
  };

  const handleVistoFieldChange = async (field: string, value: string) => {
    setVisto((prev: any) => ({ ...(prev || {}), [field]: value }));
    try {
      await fetch(`/api/vistos?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
    } catch (e) {
      console.error('Erro ao atualizar campo do visto:', e);
    }
  };

  const handleSaveAssignment = async (index: number, responsibleName?: string, dueDate?: string) => {
    try {
      const res = await fetch(`/api/step-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleType: "vistos", recordId: params.id as string, stepIndex: index, responsibleName, dueDate })
      });
      if (res.ok) {
        setAssignments(prev => ({ ...prev, [index]: { responsibleName, dueDate } }));
        const typeKey = (caseData?.type || "Visto de Trabalho") as VistoType;
        const stepTitle = (caseData?.steps?.[index]?.title) || ((WORKFLOWS[typeKey] || [])[index]) || `Etapa ${index + 1}`;
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
        const renderField = (label: string, fieldKey?: string, docKey?: string) => (
          <div className="space-y-2">
            <Label htmlFor={`${(fieldKey || docKey || '').replace(/Doc$/, '')}-${stepId}`}>{label}</Label>
            {fieldKey ? (
              <Input
                id={`${fieldKey}-${stepId}`}
                value={String((visto || {})[fieldKey] || '')}
                onChange={(e) => handleVistoFieldChange(fieldKey, e.target.value)}
                placeholder={"Status ou informações do documento"}
              />
            ) : null}
            {docKey ? (
              <div className="flex items-center gap-2">
                <input type="file" id={`${docKey}-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, docKey, stepId); }} />
                <Button variant="outline" size="sm" onClick={() => document.getElementById(`${docKey}-${stepId}`)?.click()} disabled={uploadingFiles[`${docKey}-${stepId}`]}>
                  {uploadingFiles[`${docKey}-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload
                </Button>
              </div>
            ) : null}
            {docKey ? renderDocLinks(docKey) : null}
          </div>
        );
        const rawTypeStr = String(visto?.type || caseData?.type || '');
        const t = rawTypeStr.toLowerCase();
        const showBrasil = t.includes('trabalho') && t.includes('brasil');
        const showResidenciaPrevia = t.includes('trabalho') && (t.includes('resid') || t.includes('prévia') || t.includes('previ'));
        const showInvestidor = t.includes('invest');
        const showTrabalhistas = t.includes('trabalhistas');
        const showFormacao = t.includes('forma');
        const showRenovacao = t.includes('renov') || t.includes('1 ano');
        const showIndeterminado = t.includes('indeterminado');
        const showMudancaEmpregador = t.includes('mudan') && t.includes('empregador');

        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Documentos Pessoais</h4>
              <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor={`country-${stepId}`}>País do Visto</Label>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`cpf-${stepId}`}>CPF</Label>
                  <Input
                    id={`cpf-${stepId}`}
                    value={visto?.cpf || ""}
                    onChange={(e) => handleVistoFieldChange('cpf', e.target.value)}
                    placeholder="000.000.000-00"
                  />
                  <div className="flex items-center gap-2">
                    <input type="file" id={`cpfDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'cpfDoc', stepId); }} />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById(`cpfDoc-${stepId}`)?.click()} disabled={uploadingFiles[`cpfDoc-${stepId}`]}>
                      {uploadingFiles[`cpfDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload CPF
                    </Button>
                  </div>
                  {renderDocLinks('cpfDoc')}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`rnm-${stepId}`}>RNM</Label>
                  <Input id={`rnm-${stepId}`} value={visto?.rnm || ""} onChange={(e) => handleVistoFieldChange('rnm', e.target.value)} placeholder="Número RNM" />
                  <div className="flex items-center gap-2">
                    <input type="file" id={`rnmDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'rnmDoc', stepId); }} />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById(`rnmDoc-${stepId}`)?.click()} disabled={uploadingFiles[`rnmDoc-${stepId}`]}>
                      {uploadingFiles[`rnmDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload RNM
                    </Button>
                  </div>
                  {renderDocLinks('rnmDoc')}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`passaporte-${stepId}`}>Passaporte</Label>
                  <Input id={`passaporte-${stepId}`} value={visto?.passaporte || ""} onChange={(e) => handleVistoFieldChange('passaporte', e.target.value)} placeholder="Número do passaporte" />
                  <div className="flex items-center gap-2">
                    <input type="file" id={`passaporteDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'passaporteDoc', stepId); }} />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById(`passaporteDoc-${stepId}`)?.click()} disabled={uploadingFiles[`passaporteDoc-${stepId}`]}>
                      {uploadingFiles[`passaporteDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload Passaporte
                    </Button>
                  </div>
                  {renderDocLinks('passaporteDoc')}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`comprovanteEndereco-${stepId}`}>Comprovante de Endereço</Label>
                  <Input id={`comprovanteEndereco-${stepId}`} value={visto?.comprovanteEndereco || ""} onChange={(e) => handleVistoFieldChange('comprovanteEndereco', e.target.value)} placeholder="Informe endereço / declaração" />
                  <div className="flex items-center gap-2">
                    <input type="file" id={`comprovanteEnderecoDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'comprovanteEnderecoDoc', stepId); }} />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById(`comprovanteEnderecoDoc-${stepId}`)?.click()} disabled={uploadingFiles[`comprovanteEnderecoDoc-${stepId}`]}>
                      {uploadingFiles[`comprovanteEnderecoDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload Endereço
                    </Button>
                  </div>
                  {renderDocLinks('comprovanteEnderecoDoc')}
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
                </div>
                {renderField('Foto digital 3x4', undefined, 'foto3x4Doc')}
                <div className="space-y-2">
                  <Label htmlFor={`documentoChines-${stepId}`}>Documento Chinês (quando aplicável)</Label>
                  <Input id={`documentoChines-${stepId}`} value={visto?.documentoChines || ""} onChange={(e) => handleVistoFieldChange('documentoChines', e.target.value)} placeholder="Descrição do documento" />
                  <div className="flex items-center gap-2">
                    <input type="file" id={`documentoChinesDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'documentoChinesDoc', stepId); }} />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById(`documentoChinesDoc-${stepId}`)?.click()} disabled={uploadingFiles[`documentoChinesDoc-${stepId}`]}>
                      {uploadingFiles[`documentoChinesDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload Documento Chinês
                    </Button>
                  </div>
                  {renderDocLinks('documentoChinesDoc')}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`antecedentesCriminais-${stepId}`}>Antecedentes Criminais</Label>
                  <Input id={`antecedentesCriminais-${stepId}`} value={visto?.antecedentesCriminais || ""} onChange={(e) => handleVistoFieldChange('antecedentesCriminais', e.target.value)} placeholder="Número/Status" />
                  <div className="flex items-center gap-2">
                    <input type="file" id={`antecedentesCriminaisDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'antecedentesCriminaisDoc', stepId); }} />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById(`antecedentesCriminaisDoc-${stepId}`)?.click()} disabled={uploadingFiles[`antecedentesCriminaisDoc-${stepId}`]}>
                      {uploadingFiles[`antecedentesCriminaisDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload Antecedentes
                    </Button>
                  </div>
                  {renderDocLinks('antecedentesCriminaisDoc')}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Comprovação Financeira PF</h4>
              <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor={`certidaoNascimentoFilhos-${stepId}`}>Filhos (Certidão de Nascimento)</Label>
                  <Input id={`certidaoNascimentoFilhos-${stepId}`} value={visto?.certidaoNascimentoFilhos || ""} onChange={(e) => handleVistoFieldChange('certidaoNascimentoFilhos', e.target.value)} placeholder="Informações" />
                  <div className="flex items-center gap-2">
                    <input type="file" id={`certidaoNascimentoFilhosDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'certidaoNascimentoFilhosDoc', stepId); }} />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById(`certidaoNascimentoFilhosDoc-${stepId}`)?.click()} disabled={uploadingFiles[`certidaoNascimentoFilhosDoc-${stepId}`]}>
                      {uploadingFiles[`certidaoNascimentoFilhosDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload Certidão
                    </Button>
                  </div>
                  {renderDocLinks('certidaoNascimentoFilhosDoc')}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`cartaoCnpj-${stepId}`}>Empresa: Cartão CNPJ</Label>
                  <Input id={`cartaoCnpj-${stepId}`} value={visto?.cartaoCnpj || ""} onChange={(e) => handleVistoFieldChange('cartaoCnpj', e.target.value)} placeholder="CNPJ" />
                  <div className="flex items-center gap-2">
                    <input type="file" id={`cartaoCnpjDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'cartaoCnpjDoc', stepId); }} />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById(`cartaoCnpjDoc-${stepId}`)?.click()} disabled={uploadingFiles[`cartaoCnpjDoc-${stepId}`]}>
                      {uploadingFiles[`cartaoCnpjDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload CNPJ
                    </Button>
                  </div>
                  {renderDocLinks('cartaoCnpjDoc')}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`contratoEmpresa-${stepId}`}>Contrato Social</Label>
                  <Input id={`contratoEmpresa-${stepId}`} value={visto?.contratoEmpresa || ""} onChange={(e) => handleVistoFieldChange('contratoEmpresa', e.target.value)} placeholder="Contrato Social" />
                  <div className="flex items-center gap-2">
                    <input type="file" id={`contratoEmpresaDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'contratoEmpresaDoc', stepId); }} />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById(`contratoEmpresaDoc-${stepId}`)?.click()} disabled={uploadingFiles[`contratoEmpresaDoc-${stepId}`]}>
                      {uploadingFiles[`contratoEmpresaDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload Contrato
                    </Button>
                  </div>
                  {renderDocLinks('contratoEmpresaDoc')}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`escrituraImoveis-${stepId}`}>Imóveis (Escritura/Matrícula)</Label>
                  <Input id={`escrituraImoveis-${stepId}`} value={visto?.escrituraImoveis || ""} onChange={(e) => handleVistoFieldChange('escrituraImoveis', e.target.value)} placeholder="Imóveis" />
                  <div className="flex items-center gap-2">
                    <input type="file" id={`escrituraImoveisDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'escrituraImoveisDoc', stepId); }} />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById(`escrituraImoveisDoc-${stepId}`)?.click()} disabled={uploadingFiles[`escrituraImoveisDoc-${stepId}`]}>
                      {uploadingFiles[`escrituraImoveisDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload Escritura
                    </Button>
                  </div>
                  {renderDocLinks('escrituraImoveisDoc')}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`extratosBancarios-${stepId}`}>Últimos 3 extratos bancários</Label>
                  <Input id={`extratosBancarios-${stepId}`} value={visto?.extratosBancarios || ""} onChange={(e) => handleVistoFieldChange('extratosBancarios', e.target.value)} placeholder="Extratos" />
                  <div className="flex items-center gap-2">
                    <input type="file" id={`extratosBancariosDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'extratosBancariosDoc', stepId); }} />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById(`extratosBancariosDoc-${stepId}`)?.click()} disabled={uploadingFiles[`extratosBancariosDoc-${stepId}`]}>
                      {uploadingFiles[`extratosBancariosDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload Extratos
                    </Button>
                  </div>
                  {renderDocLinks('extratosBancariosDoc')}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`impostoRenda-${stepId}`}>Imposto de Renda</Label>
                  <Input id={`impostoRenda-${stepId}`} value={visto?.impostoRenda || ""} onChange={(e) => handleVistoFieldChange('impostoRenda', e.target.value)} placeholder="IR" />
                  <div className="flex items-center gap-2">
                    <input type="file" id={`impostoRendaDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'impostoRendaDoc', stepId); }} />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById(`impostoRendaDoc-${stepId}`)?.click()} disabled={uploadingFiles[`impostoRendaDoc-${stepId}`]}>
                      {uploadingFiles[`impostoRendaDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload IR
                    </Button>
                  </div>
                  {renderDocLinks('impostoRendaDoc')}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Outros Documentos</h4>
              <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor={`reservasPassagens-${stepId}`}>Reservas de Passagens</Label>
                  <Input id={`reservasPassagens-${stepId}`} value={visto?.reservasPassagens || ""} onChange={(e) => handleVistoFieldChange('reservasPassagens', e.target.value)} placeholder="Detalhes" />
                  <div className="flex items-center gap-2">
                    <input type="file" id={`reservasPassagensDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'reservasPassagensDoc', stepId); }} />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById(`reservasPassagensDoc-${stepId}`)?.click()} disabled={uploadingFiles[`reservasPassagensDoc-${stepId}`]}>
                      {uploadingFiles[`reservasPassagensDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload Passagens
                    </Button>
                  </div>
                  {renderDocLinks('reservasPassagensDoc')}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`reservasHotel-${stepId}`}>Reservas de Hotel</Label>
                  <Input id={`reservasHotel-${stepId}`} value={visto?.reservasHotel || ""} onChange={(e) => handleVistoFieldChange('reservasHotel', e.target.value)} placeholder="Detalhes" />
                  <div className="flex items-center gap-2">
                    <input type="file" id={`reservasHotelDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'reservasHotelDoc', stepId); }} />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById(`reservasHotelDoc-${stepId}`)?.click()} disabled={uploadingFiles[`reservasHotelDoc-${stepId}`]}>
                      {uploadingFiles[`reservasHotelDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload Hotel
                    </Button>
                  </div>
                  {renderDocLinks('reservasHotelDoc')}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`seguroViagem-${stepId}`}>Seguro Viagem</Label>
                  <Input id={`seguroViagem-${stepId}`} value={visto?.seguroViagem || ""} onChange={(e) => handleVistoFieldChange('seguroViagem', e.target.value)} placeholder="Detalhes" />
                  <div className="flex items-center gap-2">
                    <input type="file" id={`seguroViagemDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'seguroViagemDoc', stepId); }} />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById(`seguroViagemDoc-${stepId}`)?.click()} disabled={uploadingFiles[`seguroViagemDoc-${stepId}`]}>
                      {uploadingFiles[`seguroViagemDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload Seguro
                    </Button>
                  </div>
                  {renderDocLinks('seguroViagemDoc')}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`roteiroViagem-${stepId}`}>Roteiro de Viagem Detalhado</Label>
                  <Input id={`roteiroViagem-${stepId}`} value={visto?.roteiroViagem || ""} onChange={(e) => handleVistoFieldChange('roteiroViagem', e.target.value)} placeholder="Detalhes" />
                  <div className="flex items-center gap-2">
                    <input type="file" id={`roteiroViagemDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'roteiroViagemDoc', stepId); }} />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById(`roteiroViagemDoc-${stepId}`)?.click()} disabled={uploadingFiles[`roteiroViagemDoc-${stepId}`]}>
                      {uploadingFiles[`roteiroViagemDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload Roteiro
                    </Button>
                  </div>
                  {renderDocLinks('roteiroViagemDoc')}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`taxa-${stepId}`}>Taxa Consular</Label>
                  <Input id={`taxa-${stepId}`} value={visto?.taxa || ""} onChange={(e) => handleVistoFieldChange('taxa', e.target.value)} placeholder="Valor/Status" />
                  <div className="flex items-center gap-2">
                    <input type="file" id={`taxaDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'taxaDoc', stepId); }} />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById(`taxaDoc-${stepId}`)?.click()} disabled={uploadingFiles[`taxaDoc-${stepId}`]}>
                      {uploadingFiles[`taxaDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload Taxa
                    </Button>
                  </div>
                  {renderDocLinks('taxaDoc')}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`formularioConsulado-${stepId}`}>Formulário do Consulado preenchido</Label>
                  <Input id={`formularioConsulado-${stepId}`} value={visto?.formularioConsulado || ""} onChange={(e) => handleVistoFieldChange('formularioConsulado', e.target.value)} placeholder="Detalhes" />
                  <div className="flex items-center gap-2">
                    <input type="file" id={`formularioConsuladoDoc-${stepId}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSpecificFileUpload(f, 'formularioConsuladoDoc', stepId); }} />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById(`formularioConsuladoDoc-${stepId}`)?.click()} disabled={uploadingFiles[`formularioConsuladoDoc-${stepId}`]}>
                      {uploadingFiles[`formularioConsuladoDoc-${stepId}`] ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload Formulário
                    </Button>
                  </div>
                  {renderDocLinks('formularioConsuladoDoc')}
                </div>
              </div>
            </div>

            {showBrasil ? (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Trabalho (Brasil)</h4>
                <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted rounded-lg">
                  {renderField('Certidão de Nascimento', 'certidaoNascimento', 'certidaoNascimentoDoc')}
                  {renderField('Declaração de Compreensão', 'declaracaoCompreensao', 'declaracaoCompreensaoDoc')}
                  {renderField('Declarações da Empresa', 'declaracoesEmpresa', 'declaracoesEmpresaDoc')}
                  {renderField('Procuração da Empresa', 'procuracaoEmpresa', 'procuracaoEmpresaDoc')}
                  {renderField('Formulário RN01', 'formularioRn01', 'formularioRn01Doc')}
                  {renderField('Guia Paga', 'guiaPaga', 'guiaPagaDoc')}
                  {renderField('Publicação DOU', 'publicacaoDou', 'publicacaoDouDoc')}
                </div>
              </div>
            ) : null}

            {showResidenciaPrevia ? (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Residência Prévia</h4>
                <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted rounded-lg">
                  {renderField('Formulário RN02', 'formularioRn02', 'formularioRn02Doc')}
                  {renderField('Comprovante Residência Prévia', 'comprovanteResidenciaPrevia', 'comprovanteResidenciaPreviaDoc')}
                  {renderField('Comprovante de Atividade', 'comprovanteAtividade', 'comprovanteAtividadeDoc')}
                </div>
              </div>
            ) : null}

            {showInvestidor ? (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Investidor</h4>
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
                <h4 className="font-semibold text-lg">Trabalhistas</h4>
                <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted rounded-lg">
                  {renderField('Contrato de Trabalho', 'contratoTrabalho', 'contratoTrabalhoDoc')}
                  {renderField('Folha de Pagamento', 'folhaPagamento', 'folhaPagamentoDoc')}
                  {renderField('Comprovante de Vínculo Anterior', 'comprovanteVinculoAnterior', 'comprovanteVinculoAnteriorDoc')}
                  {renderField('Justificativa Mudança de Empregador', 'justificativaMudancaEmpregador', 'justificativaMudancaEmpregadorDoc')}
                  {renderField('Declaração de Antecedentes Criminais', 'declaracaoAntecedentesCriminais', 'declaracaoAntecedentesCriminaisDoc')}
                </div>
              </div>
            ) : null}

            {showFormacao ? (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Formação</h4>
                <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted rounded-lg">
                  {renderField('Diploma', 'diploma', 'diplomaDoc')}
                </div>
              </div>
            ) : null}

            {showRenovacao ? (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Renovação 1 ano</h4>
                <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted rounded-lg">
                  {renderField('CTPS', 'ctps', 'ctpsDoc')}
                  {renderField('Contrato de Trabalho Anterior', 'contratoTrabalhoAnterior', 'contratoTrabalhoAnteriorDoc')}
                  {renderField('Contrato de Trabalho Atual', 'contratoTrabalhoAtual', 'contratoTrabalhoAtualDoc')}
                  {renderField('Formulário de Prorrogação', 'formularioProrrogacao', 'formularioProrrogacaoDoc')}
                </div>
              </div>
            ) : null}

            {showIndeterminado ? (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Indeterminado</h4>
                <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted rounded-lg">
                  {renderField('Contrato de Trabalho Indeterminado', 'contratoTrabalhoIndeterminado', 'contratoTrabalhoIndeterminadoDoc')}
                </div>
              </div>
            ) : null}

            <Button onClick={() => saveStepData(stepId, currentStepData)} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Salvar Anotações da Etapa
            </Button>
            {saveMessages[stepId] ? (
              <div className="text-green-600 text-sm mt-2">{saveMessages[stepId]}</div>
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
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      ? ["Aprovado", "Negado", "Outro"]
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
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
    <div className="w-full p-6 space-y-6">
      <DetailLayout
        backHref="/dashboard/vistos"
        title={caseData.clientName}
        subtitle={(visto?.type || caseData.type || '').replace(/:/g, ' - ')}
        onDelete={handleDeleteCase}
        left={
          <div className="space-y-6">
            {showWorkflow && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Fluxo do Processo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {caseData.steps.map((step, index) => (
                    <StepItem
                      key={step.id}
                      index={index}
                      title={step.title}
                      isCurrent={index === currentStepIndex}
                      isCompleted={step.completed}
                      isPending={index > currentStepIndex}
                      expanded={expandedSteps[step.id] || false}
                      onToggle={() => toggleStepExpansion(step.id)}
                      onMarkComplete={() => handleStepCompletion(step.id)}
                      onMarkIncomplete={() => handleStepCompletion(step.id)}
                      assignment={assignments[index]}
                      onSaveAssignment={(a) => handleSaveAssignment(index, a.responsibleName, a.dueDate)}
                    >
                      {renderStepContent(step)}
                    </StepItem>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        }
        right={
          <div className="space-y-6">
            <StatusPanel
              status={status}
              onStatusChange={handleStatusChange}
              currentStep={currentStepIndex + 1}
              totalSteps={caseData.steps.length}
              currentStepTitle={caseData.steps[currentStepIndex]?.title}
              createdAt={caseData.createdAt}
              updatedAt={caseData.updatedAt}
            />

            <DocumentPanel
              onDropFiles={(files) => handleFileUpload(files)}
              uploading={uploadingFiles['general'] || false}
              documents={documents as any}
              loadingDocuments={false}
              onDocumentDownload={(doc) => { if ((doc as any)?.file_path) window.open((doc as any).file_path, '_blank') }}
              onDocumentDelete={(doc) => handleDeleteDocument(doc as any)}
              editingDocumentId={editingDocument?.id as any}
              editingDocumentName={newDocumentName}
              onDocumentNameChange={setNewDocumentName}
              onDocumentNameSave={(documentId) => { /* no-op */ }}
              onDocumentDoubleClick={(doc) => handleRenameDocument(doc as any)}
            />

            <NotesPanel
              notes={notes[0] || ""}
              onChange={(value) => setNotes(prev => ({ ...prev, 0: value }))}
              onSave={() => saveStepNotes(0)}
            />
          </div>
        }
      />

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
