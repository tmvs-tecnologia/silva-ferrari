"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Save,
  Trash2,
  Upload,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Edit,
  Info,
  CheckCircle,
  Circle,
  FileText,
  AlertCircle,
  X,
  Mail,
  Calendar
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
import { Label } from "@/components/ui/label";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import "react-day-picker/dist/style.css";
import { StatusPanel } from "@/components/detail/StatusPanel";
import { subscribeTable, unsubscribe } from "@/lib/realtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { documentDeleteButtonClassName, documentGridClassName, documentIconClassName, documentLinkClassName, documentNameClassName, documentTileClassName } from "@/components/ui/document-style";
import { formatDateBR } from "@/lib/date";

const WORKFLOW_STEPS = [
  "Cadastro de Documentos",
  "Resumo",
  "Acompanhamento",
  "Processo Finalizado",
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
  file_name?: string;
}

interface CaseData {
  id: string;
  clientName: string;
  type: string;
  status: string;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  steps: StepData[];

  // Campos
  reuName?: string;
  numeroProcesso?: string;
  responsavelName?: string;
  responsavelDate?: string;
  resumo?: string;
  contratado?: string;
  acompanhamento?: string;
  sentencaTrabalhista?: string;
  execucaoRecurso?: string;
  [key: string]: any;
}

// Reuse SectionHeader Component from previous analysis
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
    <div className="px-4 py-3 md:px-6 md:py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
      <h2 className="text-base md:text-lg font-semibold text-slate-800 flex items-center gap-2">
        {title}
      </h2>
      {!isEditing ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          className="text-slate-500 hover:text-blue-600 min-h-[36px] min-w-[36px]"
          title="Editar seção"
        >
          <Edit className="w-4 h-4" />
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            className="text-red-500 hover:bg-red-50"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      )}
    </div>
  );
};

// Reuse DocumentRow Component
const DocumentRow = ({
  label,
  field,
  docField,
  placeholder = "Informação do documento",
  isEditing = false,
  value,
  onTextChange,
  documents,
  onUpload,
  onDeleteDoc,
  isUploading,
  tooltip
}: {
  label: string;
  field?: string;
  docField: string;
  placeholder?: string;
  isEditing: boolean;
  value?: string;
  onTextChange?: (val: string) => void;
  documents: Document[];
  onUpload: (f: File) => void;
  onDeleteDoc: (d: Document) => void;
  isUploading: boolean;
  tooltip?: string;
}) => {
  const attachedDocs = (documents || []).filter((d: any) => (d.field_name || d.fieldName) === docField);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="block text-sm font-medium text-slate-700">
          {label}
        </Label>
        {tooltip && (
          <div className="text-slate-400 cursor-pointer" title={tooltip}><Info className="w-3 h-3" /></div>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-start">
        {!isEditing ? (
          <div className="flex-1 flex flex-wrap items-center p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm min-h-[42px]">
            {field ? (
              <span className="font-medium text-slate-700 mr-2 break-all">{value || '-'}</span>
            ) : null}
            <span className={`text-xs ml-auto ${attachedDocs.length > 0 ? "text-green-600 font-medium" : "italic"} mt-1 sm:mt-0 w-full sm:w-auto text-right`}>
              {attachedDocs.length > 0 ? `${attachedDocs.length} documento(s)` : "Nenhum anexo"}
            </span>
          </div>
        ) : (
          <Input
            value={value || ""}
            onChange={(e) => onTextChange && onTextChange(e.target.value)}
            className="flex-1 rounded-md border-slate-200 bg-white text-slate-700 text-sm py-2.5"
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
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.txt,.rtf"
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
              className="flex items-center justify-center gap-2 px-4 py-2 w-full sm:w-auto min-h-[42px]"
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

      {attachedDocs.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {attachedDocs.map((doc: any, idx: number) => (
            <DocumentChip
              key={idx}
              name={doc.document_name || doc.name || doc.file_name || "Documento"}
              href={doc.file_path || doc.url}
              onDelete={isEditing ? () => onDeleteDoc(doc) : undefined}
              className="bg-slate-100 border-slate-200 hover:bg-sky-50 hover:border-sky-200 transition-all"
            />
          ))}
        </div>
      )}
    </div>
  );
};


export default function AcoesTrabalhistasDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState<{ [key: number]: string }>({});
  const [expandedSteps, setExpandedSteps] = useState<{ [key: number]: boolean }>({});
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [isPendingDocsOpen, setIsPendingDocsOpen] = useState(false);
  const [assignments, setAssignments] = useState<Record<number, { responsibleName?: string; dueDate?: string }>>({});
  const [assignOpenStep, setAssignOpenStep] = useState<number | null>(null);
  const [assignResp, setAssignResp] = useState<string>("");
  const [assignDue, setAssignDue] = useState<string>("");
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [saveMessages, setSaveMessages] = useState<{ [key: number]: string }>({});

  // Edit Mode state
  const [isEditingDocuments, setIsEditingDocuments] = useState(false);

  const RESPONSAVEIS = [
    "Secretária – Jessica Cavallaro",
    "Advogada – Jailda Silva",
    "Advogada – Adriana Roder",
    "Advogado – Fábio Ferrari",
    "Advogado – Guilherme Augusto",
    "Estagiário – Wendel Macriani",
  ];

  const docRequirements = [
    {
      title: "Documentação Inicial",
      step: "Cadastro de Documentos",
      fields: [
        { key: "documentosIniciaisFile", label: "Documentos Iniciais" },
        { key: "contratoTrabalhoFile", label: "Contrato de Trabalho" },
        { key: "carteiraTrabalhistaFile", label: "Carteira de Trabalho" },
        { key: "comprovantesSalariaisFile", label: "Comprovantes Salariais" },
        { key: "peticaoInicialFile", label: "Petição Inicial" },
        { key: "procuracaoTrabalhistaFile", label: "Procuração" },
      ]
    },
    { title: "Resumo e Contrato", step: "Resumo", fields: [{ key: "resumoDoc", label: "Documento de Resumo/Contrato" }] },
    { title: "Andamento", step: "Acompanhamento", fields: [{ key: "citacaoEmpregadorFile", label: "Citação Empregador" }, { key: "contestacaoRecebidaFile", label: "Contestação Recebida" }, { key: "ataAudienciaInicialFile", label: "Ata Audiência Inicial" }, { key: "provasTestemunhasFile", label: "Provas/Testemunhas" }, { key: "alegacoesFinaisFile", label: "Alegações Finais" }] },
    { title: "Finalização", step: "Processo Finalizado", fields: [{ key: "sentencaTrabalhistaFile", label: "Sentença Trabalhista" }, { key: "execucaoRecursoFile", label: "Execução/Recurso" }, { key: "finalizadoDoc", label: "Documento Final do Processo" }] }
  ];

  useEffect(() => {
    if (params.id) {
      fetchCaseData();
      fetchDocuments();
      loadAssignments();

      const idNum = Number(params.id);

      const chCase = subscribeTable({
        channelName: `rt-acoes-trabalhistas-${idNum}`,
        table: 'acoes_trabalhistas',
        events: ['update'],
        filter: `id=eq.${idNum}`,
        onChange: (payload) => {
          const next = payload?.new;
          if (next && next.id === idNum) {
            setCaseData((prev: any) => prev ? ({ ...prev, ...next }) : prev);
          }
        }
      });

      const chDocsInsert = subscribeTable({
        channelName: `rt-docs-at-insert-${idNum}`,
        table: 'documents',
        events: ['insert'],
        filter: `record_id=eq.${idNum}`,
        onChange: () => { fetchDocuments(); }
      });

      const chDocsDelete = subscribeTable({
        channelName: `rt-docs-at-delete-${idNum}`,
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
  }, [params.id]);

  const loadAssignments = async () => {
    try {
      const res = await fetch(`/api/step-assignments?moduleType=acoes-trabalhistas&recordId=${params.id}`);
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

  const handleSaveAssignment = async (stepIndex: number, responsibleName?: string, dueDate?: string) => {
    try {
      await fetch('/api/step-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleType: 'acoes-trabalhistas',
          recordId: params.id,
          stepIndex,
          responsibleName,
          dueDate
        })
      });
      setAssignments(prev => ({
        ...prev,
        [stepIndex]: { responsibleName, dueDate }
      }));
      toast.success("Responsável atualizado!");
    } catch (e) {
      toast.error("Erro ao salvar responsável");
    }
  };

  const fetchCaseData = async () => {
    try {
      const res = await fetch(`/api/acoes-trabalhistas?id=${params.id}`);
      if (res.ok) {
        const record = await res.json();

        const steps: StepData[] = WORKFLOW_STEPS.map((title: string, index: number) => ({
          id: index,
          title,
          description: `Etapa ${index + 1}: ${title}`,
          completed: false,
          notes: "",
        }));

        const recordCurrentStep = Number(record.currentStep ?? 0);

        for (let i = 0; i < steps.length; i++) {
          steps[i].completed = i < recordCurrentStep;
        }

        const data: CaseData = {
          ...record,
          id: String(record.id),
          title: `Ação ${record.id}`,
          type: "Ação Trabalhista",
          description: "Processo Trabalhista",
          steps,
          currentStep: recordCurrentStep
        };

        setCaseData(data);
        setStatus(data.status || "Em andamento");

        // Auto-expand current step
        setExpandedSteps(prev => ({
          ...prev,
          [recordCurrentStep]: true
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar dados do caso:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/documents/${params.id}?moduleType=acoes_trabalhistas`);
      if (res.ok) {
        const docs = await res.json();
        setDocuments(docs || []);
      }
    } catch (error) {
      console.error("Erro ao buscar documentos:", error);
    }
  };

  const validateFile = (file: File) => {
    const validTypes = [
      'application/pdf', 'image/jpeg', 'image/png', 'image/jpg',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'application/rtf'
    ];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|doc|docx|xls|xlsx|txt|rtf)$/i)) {
      toast.error(`Formato inválido: ${file.name}`);
      return false;
    }
    if (file.size > maxSize) {
      toast.error(`Arquivo muito grande (max 50MB): ${file.name}`);
      return false;
    }
    return true;
  };

  // General Field Update
  const handleFieldChange = (field: string, value: string) => {
    setCaseData(prev => prev ? ({ ...prev, [field]: value }) : prev);
  };

  const handleSaveAll = async () => {
    try {
      if (!caseData) return;
      const res = await fetch(`/api/acoes-trabalhistas?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData) // Send all flat fields
      });
      if (res.ok) {
        toast.success("Dados salvos com sucesso!");
        setIsEditingDocuments(false);
      } else {
        throw new Error("Erro ao salvar");
      }
    } catch (e) {
      toast.error("Erro ao salvar dados.");
    }
  };

  const handleFileUpload = async (files: FileList | File[] | null, stepId?: number) => {
    const arr = !files ? [] : Array.isArray(files) ? files : Array.from(files);
    if (!arr.length) return;
    const uploadKey = stepId !== undefined ? `step-${stepId}` : 'general';
    setUploadingFiles(prev => ({ ...prev, [uploadKey]: true }));

    try {
      for (const file of arr) {
        if (!validateFile(file)) continue;
        const fieldKey = 'documentoAnexado';
        const isLargeFile = file.size > 4 * 1024 * 1024;

        if (isLargeFile) {
          const signRes = await fetch('/api/documents/upload/sign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              caseId: params.id,
              moduleType: 'acoes_trabalhistas',
              fieldName: fieldKey,
              clientName: caseData?.clientName
            })
          });

          if (!signRes.ok) throw new Error("Erro de assinatura");
          const signData = await signRes.json();

          await fetch(signData.signedUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type || 'application/octet-stream' }
          });

          await fetch('/api/documents/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              caseId: params.id,
              moduleType: 'acoes_trabalhistas',
              fieldName: fieldKey,
              clientName: caseData?.clientName,
              fileUrl: signData.publicUrl,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size
            })
          });
        } else {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('caseId', String(params.id));
          fd.append('moduleType', 'acoes_trabalhistas');
          fd.append('fieldName', fieldKey);
          fd.append('clientName', caseData?.clientName || 'Cliente');

          const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
          if (!res.ok) throw new Error("Erro no upload");
        }
        toast.success(`Upload concluído: ${file.name}`);
      }
      await fetchDocuments();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao enviar arquivos");
    } finally {
      setUploadingFiles(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleSpecificFileUpload = async (file: File, fieldKey: string, stepId: number) => {
    if (!validateFile(file)) return;
    const uploadKey = `${fieldKey}-${stepId}`;
    setUploadingFiles(prev => ({ ...prev, [uploadKey]: true }));

    try {
      const isLargeFile = file.size > 4 * 1024 * 1024;
      if (isLargeFile) {
        const signRes = await fetch('/api/documents/upload/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            caseId: params.id,
            moduleType: 'acoes_trabalhistas',
            fieldName: fieldKey,
            clientName: caseData?.clientName
          })
        });
        if (!signRes.ok) throw new Error("Erro assinatura");
        const signData = await signRes.json();
        await fetch(signData.signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
        await fetch('/api/documents/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseId: params.id,
            moduleType: 'acoes_trabalhistas',
            fieldName: fieldKey,
            clientName: caseData?.clientName,
            fileUrl: signData.publicUrl,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size
          })
        });
      } else {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('caseId', String(params.id));
        fd.append('moduleType', 'acoes_trabalhistas');
        fd.append('fieldName', fieldKey);
        fd.append('clientName', caseData?.clientName || 'Cliente');
        const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
        if (!res.ok) throw new Error("Erro upload");
      }
      await fetchDocuments();
      toast.success(`Upload concluído: ${file.name}`);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao enviar arquivo.");
    } finally {
      setUploadingFiles(prev => ({ ...prev, [uploadKey]: false }));
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
        toast.success("Documento excluído.");
      }
    } catch (error) {
      toast.error("Erro ao excluir documento.");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      await fetch(`/api/acoes-trabalhistas?id=${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (caseData) setCaseData({ ...caseData, status: newStatus });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  // Helper for rendering rows inside the step content
  const renderRowItem = (stepId: number, label: string, fieldKey?: string, docKey?: string, tooltip?: string, required?: boolean) => (
    <DocumentRow
      label={label}
      field={fieldKey}
      docField={docKey || ''}
      isEditing={isEditingDocuments}
      value={String((caseData as any)?.[fieldKey || ''] || '')}
      onTextChange={(val) => fieldKey && handleFieldChange(fieldKey, val)}
      documents={documents}
      onUpload={(f) => docKey && handleSpecificFileUpload(f, docKey, stepId)}
      onDeleteDoc={handleDeleteDocument}
      isUploading={!!uploadingFiles[`${docKey}-${stepId}`]}
      tooltip={tooltip}
    />
  );

  const renderStepContent = (step: StepData) => {
    const stepId = step.id;

    switch (stepId) {
      case 0: // Cadastro de Documentos
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <SectionHeader
                title="1. Dados do Processo"
                isEditing={isEditingDocuments}
                onEdit={() => setIsEditingDocuments(true)}
                onCancel={() => setIsEditingDocuments(false)}
                onSave={handleSaveAll}
              />
              <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {renderRowItem(stepId, "Nome do Requerente", "clientName", undefined)}
                {renderRowItem(stepId, "Réu (Empresa/Pessoa)", "reuName", undefined)}
                {renderRowItem(stepId, "Número do Processo", "numeroProcesso", undefined)}
                {renderRowItem(stepId, "Advogado Responsável", "responsavelName", undefined)}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <SectionHeader
                title="2. Documentos Iniciais"
                isEditing={isEditingDocuments}
                onEdit={() => setIsEditingDocuments(true)}
                onCancel={() => setIsEditingDocuments(false)}
                onSave={handleSaveAll}
              />
              <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {renderRowItem(stepId, "Documentos Iniciais", "documentosIniciais", "documentosIniciaisFile")}
                {renderRowItem(stepId, "Contrato de Trabalho", "contratoTrabalho", "contratoTrabalhoFile")}
                {renderRowItem(stepId, "Carteira de Trabalho", "carteiraTrabalhista", "carteiraTrabalhistaFile")}
                {renderRowItem(stepId, "Comprovantes Salariais", "comprovantesSalariais", "comprovantesSalariaisFile")}
                {renderRowItem(stepId, "Petição Inicial", "peticaoInicial", "peticaoInicialFile")}
                {renderRowItem(stepId, "Procuração", "procuracaoTrabalhista", "procuracaoTrabalhistaFile")}
              </div>
            </div>
          </div>
        );
      case 1: // Resumo
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <SectionHeader
                title="Resumo do Caso"
                isEditing={isEditingDocuments}
                onEdit={() => setIsEditingDocuments(true)}
                onCancel={() => setIsEditingDocuments(false)}
                onSave={handleSaveAll}
              />
              <div className="p-4 md:p-6 grid grid-cols-1 gap-4 md:gap-6">
                <div className="space-y-2">
                  <Label>Descrição Detalhada do Caso</Label>
                  {isEditingDocuments ? (
                    <Textarea
                      value={caseData?.resumo || ""}
                      onChange={(e) => handleFieldChange("resumo", e.target.value)}
                      className="min-h-[150px]"
                    />
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-md text-sm text-slate-700 whitespace-pre-wrap min-h-[100px]">
                      {caseData?.resumo || "Não informado."}
                    </div>
                  )}
                </div>
                {renderRowItem(stepId, "Documento de Contrato/Resumo", "contratado", "resumoDoc")}
              </div>
            </div>
          </div>
        );
      case 2: // Acompanhamento
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <SectionHeader
                title="Histórico e Andamentos"
                isEditing={isEditingDocuments}
                onEdit={() => setIsEditingDocuments(true)}
                onCancel={() => setIsEditingDocuments(false)}
                onSave={handleSaveAll}
              />
              <div className="p-4 md:p-6 grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Registro de Andamentos</Label>
                  {isEditingDocuments ? (
                    <Textarea
                      value={caseData?.acompanhamento || ""}
                      onChange={(e) => handleFieldChange("acompanhamento", e.target.value)}
                      className="min-h-[200px]"
                    />
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-md text-sm text-slate-700 whitespace-pre-wrap min-h-[200px]">
                      {caseData?.acompanhamento || "Nenhum andamento."}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <SectionHeader
                title="Documentos Processuais"
                isEditing={isEditingDocuments}
                onEdit={() => setIsEditingDocuments(true)}
                onCancel={() => setIsEditingDocuments(false)}
                onSave={handleSaveAll}
              />
              <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderRowItem(stepId, "Citação Empregador", "citacaoEmpregador", "citacaoEmpregadorFile")}
                {renderRowItem(stepId, "Contestação Recebida", "contestacaoRecebida", "contestacaoRecebidaFile")}
                {renderRowItem(stepId, "Ata Audiência Inicial", "ataAudienciaInicial", "ataAudienciaInicialFile")}
                {renderRowItem(stepId, "Provas/Testemunhas", "provasTestemunhas", "provasTestemunhasFile")}
                {renderRowItem(stepId, "Alegações Finais", "alegacoesFinais", "alegacoesFinaisFile")}
              </div>
            </div>
          </div>
        );
      case 3: // Finalizado
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <SectionHeader
                title="Encerramento"
                isEditing={isEditingDocuments}
                onEdit={() => setIsEditingDocuments(true)}
                onCancel={() => setIsEditingDocuments(false)}
                onSave={handleSaveAll}
              />
              <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderRowItem(stepId, "Sentença Trabalhista proferida", "sentencaTrabalhista", "sentencaTrabalhistaFile")}
                {renderRowItem(stepId, "Execução e Recurso", "execucaoRecurso", "execucaoRecursoFile")}
                {renderRowItem(stepId, "Documento Final", "finalizadoDoc", "finalizadoDoc")}
              </div>
            </div>
          </div>
        );
      default:
        return <div className="p-4">Conteúdo da etapa...</div>;
    }
  };

  const parseNotesArray = (notesStr?: string) => {
    try {
      const v = (notesStr || '').trim();
      if (!v) return [] as Array<{ id: string; stepId?: number; content: string; timestamp: string, authorName?: string }>;
      const arr = JSON.parse(v);
      if (Array.isArray(arr)) return arr as any;
      return [] as any;
    } catch { return [] as any; }
  };
  const notesArray = parseNotesArray(caseData?.notes);

  const saveStepNotes = async (stepId: number) => {
    if (!notes[stepId]) return;
    const newNote = {
      id: Math.random().toString(36).substr(2, 9),
      content: notes[stepId],
      timestamp: new Date().toISOString(),
      authorName: "Usuário",
    };

    const updatedNotes = [...notesArray, newNote];
    try {
      await fetch(`/api/acoes-trabalhistas?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: JSON.stringify(updatedNotes) })
      });
      setCaseData(prev => prev ? ({ ...prev, notes: JSON.stringify(updatedNotes) }) : prev);
      setNotes(prev => ({ ...prev, [stepId]: "" }));
      setSaveMessages(prev => ({ ...prev, [stepId]: "Salvo!" }));
      setTimeout(() => setSaveMessages(prev => ({ ...prev, [stepId]: "" })), 2000);
    } catch (e) {
      toast.error("Erro ao salvar nota");
    }
  };

  const pendingDocs = docRequirements.flatMap(group =>
    group.fields
      .filter(f => !documents.some(d => (d.field_name || d.fieldName) === f.key))
      .map(f => ({ ...f, group: group.step || group.title }))
  );
  const totalDocs = docRequirements.reduce((acc, g) => acc + g.fields.length, 0);
  const completedDocs = totalDocs - pendingDocs.length;
  const progress = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

  const currentStepIndex = caseData ? Math.min(Math.max(Number(caseData.currentStep), 0), caseData.steps.length - 1) : 0;

  if (loading) return <Skeleton className="h-screen w-full" />;
  if (!caseData) return <div className="p-8">Caso não encontrado</div>;

  return (
    <div className="w-full p-4 space-y-6 bg-gray-50 min-h-screen">
      {/*... Top Bar ...*/}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/acoes-trabalhistas">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{caseData.clientName}</h1>
            <p className="text-muted-foreground">{caseData.type}</p>
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
                <AlertDialogAction onClick={async () => {
                  await fetch(`/api/acoes-trabalhistas?id=${params.id}`, { method: 'DELETE' });
                  router.push('/dashboard/acoes-trabalhistas');
                }} className="bg-white text-red-600 border border-red-500 hover:bg-red-50 hover:text-red-700">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:gap-8 lg:flex-row lg:items-start">
        {/* Main Content (Left) */}
        <div className="flex flex-col gap-6 lg:gap-8 lg:flex-[2] min-w-0">
          {/* Workflow Card */}
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
                const isCompleted = index < currentStepIndex;
                const showConnector = index < caseData.steps.length - 1;
                return (
                  <div key={step.id} className="flex group relative pb-10">
                    {showConnector ? (
                      <div className={`absolute left-6 top-8 bottom-0 w-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                    ) : null}
                    <div className="flex-shrink-0 mr-4">
                      {isCompleted ? (
                        <div className="h-12 w-12 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center z-10 cursor-pointer hover:scale-105 transition">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                      ) : isCurrent ? (
                        <div className="h-12 w-12 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center z-10 shadow-md cursor-pointer hover:scale-105 transition">
                          <div className="h-4 w-4 rounded-full bg-blue-500" />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center z-10 cursor-pointer hover:scale-105 transition">
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
                              <button className="text-xs text-gray-600 border border-gray-300 rounded px-3 py-1 bg-white hover:bg-slate-50">Definir Responsável</button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[320px]">
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <Label>Responsável</Label>
                                  <Input
                                    value={assignResp}
                                    onChange={(e) => setAssignResp(e.target.value)}
                                    placeholder="Nome do responsável"
                                  />
                                  <div className="max-h-32 overflow-y-auto border rounded mt-1">
                                    {RESPONSAVEIS.map((r) => (
                                      <div key={r} className="p-1 hover:bg-slate-100 cursor-pointer text-xs" onClick={() => setAssignResp(r)}>{r}</div>
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Label>Data Limite</Label>
                                  <Input type="date" value={assignDue} onChange={(e) => setAssignDue(e.target.value)} />
                                </div>
                                <Button size="sm" onClick={() => { handleSaveAssignment(index, assignResp, assignDue); setAssignOpenStep(null); }}>Salvar</Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                          <button className="text-gray-500" onClick={() => setExpandedSteps(prev => ({ ...prev, [step.id]: !prev[step.id] }))}>
                            {expandedSteps[step.id] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {expandedSteps[step.id] && (
                        <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                          {renderStepContent(step)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Documents Progress Card similar to Turismo */}
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
                  <div className={`grid transition-all duration-300 ease-in-out ${isPendingDocsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-5 mt-1">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="flex items-center gap-2 text-amber-800 font-semibold">
                            <AlertCircle className="h-5 w-5" />
                            Documentos Pendentes
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {pendingDocs.map((doc, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-amber-700">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span>{doc.label} ({doc.group})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-5 flex items-start gap-4 text-green-800">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <h4 className="font-bold text-lg mb-1">Documentação Completa!</h4>
                      <p className="text-green-700">Todos os documentos obrigatórios foram anexados.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-50"
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => { e.preventDefault(); const files = Array.from(e.dataTransfer.files); handleFileUpload(files as any); }}
                >
                  <div className="p-3 bg-blue-50 rounded-full mb-3">
                    <Upload className="h-6 w-6 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Arraste e solte arquivos aqui</p>
                </div>

                {documents.length > 0 ? (
                  <div className={documentGridClassName}>
                    {documents.map((doc) => (
                      <div key={doc.id} className="min-w-0 flex flex-col items-center">
                        <div className={documentTileClassName}>
                          <a href={doc.url || doc.file_path} target="_blank" className={documentLinkClassName}>
                            <FileText className={`${documentIconClassName} text-blue-600`} />
                          </a>
                          <button className={documentDeleteButtonClassName} onClick={() => handleDeleteDocument(doc)}>
                            <X className="h-3 w-3 text-gray-600" />
                          </button>
                        </div>
                        <div className={documentNameClassName} title={doc.name}>{doc.name}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Nenhum documento anexado ainda</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar (Right) */}
        <div className="flex flex-col gap-6 lg:gap-8 lg:flex-[1] min-w-0">
          <div className="flex flex-col min-h-[560px] space-y-4">
            <StatusPanel
              status={status}
              onStatusChange={handleStatusChange}
              currentStep={Number(caseData.currentStep) + 1}
              totalSteps={WORKFLOW_STEPS.length}
              currentStepTitle={WORKFLOW_STEPS[currentStepIndex] || ""}
              workflowTitle="Ação Trabalhista"
              createdAt={caseData.createdAt}
              updatedAt={caseData.updatedAt}
            />

            <Card className="rounded-xl border-gray-200 shadow-sm flex-1 flex flex-col max-h-[500px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>Observações</span>
                  <Button variant="ghost" size="sm" onClick={() => setShowNotesModal(true)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3 scrollbar-thin">
                  {notesArray.length > 0 ? (
                    [...notesArray].reverse().map((n: any) => (
                      <div key={n.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>{new Date(n.timestamp).toLocaleDateString()}</span>
                          <span>{n.authorName}</span>
                        </div>
                        <p className="text-sm text-slate-700">{n.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-sm">Nenhuma observação.</div>
                  )}
                </div>
                <div className="p-2 border-t mt-2">
                  <Textarea
                    placeholder="Nova observação..."
                    rows={2}
                    value={notes[0] || ""}
                    onChange={(e) => setNotes(prev => ({ ...prev, 0: e.target.value }))}
                  />
                  <div className="flex justify-end mt-2">
                    <Button size="sm" onClick={() => saveStepNotes(0)} disabled={!notes[0]}>Enviar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-gray-200 shadow-sm">
              <CardHeader><CardTitle>Responsáveis</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(assignments)
                    .filter(([_, v]) => v?.responsibleName)
                    .map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src="https://cdn-icons-png.flaticon.com/512/3177/3177440.png" className="h-8 w-8 rounded-full border" />
                          <div>
                            <p className="font-medium text-sm">{v.responsibleName}</p>
                            <p className="text-xs text-gray-500">Etapa: {WORKFLOW_STEPS[Number(k)]}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                  {Object.keys(assignments).length === 0 && <p className="text-sm text-gray-500 text-center">Nenhum responsável definido.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setShowInfoModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" /> Documentos Pendentes
              </h3>
              <button onClick={() => setShowInfoModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              {pendingDocs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingDocs.map((doc, idx) => (
                    <div key={idx} className="p-3 bg-amber-50 rounded border border-amber-100 text-amber-900">
                      <span className="font-bold block text-xs uppercase text-amber-700">{doc.group}</span>
                      {doc.label}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-green-600 font-medium">Todos os documentos entregues!</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
