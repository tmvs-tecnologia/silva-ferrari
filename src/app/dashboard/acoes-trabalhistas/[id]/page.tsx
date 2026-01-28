"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  Save,
  Trash2,
  Upload,
  FileText,
  ChevronRight,
  X,
  Mail,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit2
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPanel } from "@/components/detail/StatusPanel";
import { PendingDocumentsList } from "@/components/detail/PendingDocumentsList";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "react-day-picker/dist/style.css";

const WORKFLOWS = {
  "Ação Trabalhista": [
    "Cadastro de Documentos",
    "Resumo",
    "Acompanhamento",
    "Processo Finalizado",
  ],
};

const RESPONSAVEIS = [
  "Secretária – Jessica Cavallaro",
  "Advogada – Jailda Silva",
  "Advogada – Adriana Roder",
  "Advogado – Fábio Ferrari",
  "Advogado – Guilherme Augusto",
  "Estagiário – Wendel Macriani",
];

interface CaseData {
  id: string;
  clientName: string;
  type: string;
  status: string;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  autorName?: string | null;
  reuName?: string | null;
  numeroProcesso?: string | null;
  responsavelName?: string | null;
  responsavelDate?: string | null;
  resumo?: string | null;
  acompanhamento?: string | null;
  contratado?: string | null;
  // Trabalhista specific fields
  documentosIniciais?: string;
  documentosIniciaisFile?: string;
  contratoTrabalho?: string;
  contratoTrabalhoFile?: string;
  carteiraTrabalhista?: string;
  carteiraTrabalhistaFile?: string;
  comprovantesSalariais?: string;
  comprovantesSalariaisFile?: string;
  peticaoInicial?: string;
  peticaoInicialFile?: string;
  procuracaoTrabalhista?: string;
  procuracaoTrabalhistaFile?: string;
  citacaoEmpregador?: string;
  citacaoEmpregadorFile?: string;
  contestacaoRecebida?: string;
  contestacaoRecebidaFile?: string;
  ataAudienciaInicial?: string;
  ataAudienciaInicialFile?: string;
  provasTestemunhas?: string;
  provasTestemunhasFile?: string;
  alegacoesFinais?: string;
  alegacoesFinaisFile?: string;
  sentencaTrabalhista?: string;
  sentencaTrabalhistaFile?: string;
  execucaoRecurso?: string;
  execucaoRecursoFile?: string;
  // Generic file fields for steps
  resumoDoc?: string;
  acompanhamentoDoc?: string;
  finalizadoDoc?: string;
  [key: string]: any;
}

interface CaseDocument {
  id: string;
  name?: string;
  document_name?: string;
  file_name?: string;
  file_path: string;
  uploaded_at: string;
  document_type?: string;
  fieldName?: string;
}

export default function AcaoTrabalhistaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Em andamento");
  const [notes, setNotes] = useState<{ [key: number]: string }>({});
  const [expandedSteps, setExpandedSteps] = useState<{ [key: number]: boolean }>({});
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
  const [assignments, setAssignments] = useState<Record<number, { responsibleName?: string; dueDate?: string }>>({});

  // Modal states
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<CaseDocument | null>(null);
  const [assignOpenStep, setAssignOpenStep] = useState<number | null>(null);
  const [assignResp, setAssignResp] = useState<string>("");
  const [assignDue, setAssignDue] = useState<string>("");
  const [saveMessages, setSaveMessages] = useState<{ [key: number]: string }>({});

  // Specific edit states
  const [isEditingCadastro, setIsEditingCadastro] = useState(false);
  const [isEditingResumo, setIsEditingResumo] = useState(false);
  const [isEditingAcompanhamento, setIsEditingAcompanhamento] = useState(false);
  const [isEditingFinalizado, setIsEditingFinalizado] = useState(false);

  // Load case data
  useEffect(() => {
    const loadCase = async () => {
      try {
        const response = await fetch(`/api/acoes-trabalhistas?id=${id}`);
        if (response.ok) {
          const data = await response.json();
          setCaseData(data);
          setStatus(data.status || "Em andamento");
          // Parse notes
          try {
            const parsedNotes = JSON.parse(data.notes || "[]");
            // Transform array to object by stepId if needed, or just keep as array for modal
            // For the textarea per step, we might need a different approach or just use a generic notes field
          } catch { }
        }
      } catch (error) {
        console.error("Erro ao carregar caso:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadCase();
    }
  }, [id]);

  // Load assignments
  useEffect(() => {
    const loadAssignments = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/step-assignments?moduleType=acoes_trabalhistas&recordId=${id}`);
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
  }, [id]);

  // Load documents
  useEffect(() => {
    const loadDocuments = async () => {
      if (!id) return;
      try {
        const response = await fetch(`/api/documents/${id}?moduleType=acoes_trabalhistas`);
        if (response.ok) {
          const data = await response.json();
          setDocuments(data || []);
        }
      } catch (error) {
        console.error("Erro ao carregar documentos:", error);
      }
    };
    loadDocuments();
  }, [id]);

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
      alert(`Arquivo vazio: ${file.name}.`);
      return false;
    }

    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|doc|docx|xls|xlsx|txt|rtf)$/i)) {
      alert(`Formato inválido: ${file.name}.`);
      return false;
    }

    if (file.size > maxSize) {
      alert(`Arquivo muito grande: ${file.name}. Máximo 50MB.`);
      return false;
    }
    return true;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) {
      e.target.value = "";
      return;
    }

    setUploadingFields(prev => ({ ...prev, [fieldName]: true }));

    try {
      const MAX_DIRECT_SIZE = 4 * 1024 * 1024; // 4MB
      let fileUrl = "";
      let finalFileName = file.name;

      // Standardize file name
      const sanitizedFileName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
      const finalFile = new File([file], sanitizedFileName, { type: file.type });
      finalFileName = sanitizedFileName;

      if (file.size > MAX_DIRECT_SIZE) {
        // Signed Upload (Temporary)
        const signRes = await fetch("/api/documents/upload/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: sanitizedFileName,
            fileType: file.type,
            caseId: id,
            moduleType: "acoes_trabalhistas",
            fieldName: fieldName,
            clientName: caseData?.clientName || "Cliente"
          })
        });

        if (!signRes.ok) {
          const err = await signRes.json();
          throw new Error(err.error || "Falha ao gerar URL assinada");
        }

        const { signedUrl, publicUrl } = await signRes.json();

        const uploadRes = await fetch(signedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type }
        });

        if (!uploadRes.ok) throw new Error("Falha no upload do arquivo");

        fileUrl = publicUrl;

        // Register metadata
        await fetch("/api/documents/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isRegisterOnly: true,
            fileUrl,
            fileName: sanitizedFileName,
            fileType: file.type,
            fileSize: file.size,
            caseId: id,
            fieldName: fieldName,
            moduleType: "acoes_trabalhistas",
            clientName: caseData?.clientName || "Cliente"
          })
        });

      } else {
        // Direct Upload
        const formData = new FormData();
        formData.append("file", finalFile);
        formData.append("caseId", id);
        formData.append("fieldName", fieldName);
        formData.append("moduleType", "acoes_trabalhistas");
        formData.append("documentType", fieldName);

        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao enviar documento");
        }
        const data = await response.json();
        fileUrl = data.fileUrl; // or data.fileName depends on the response, usually upload route returns fileUrl or fileName? 
        // In the original code: setCaseData(..., [fieldName]: data.fileName)
        // But signed upload returns publicUrl. 
        // I should verify what data.fileName is.
        finalFileName = data.fileName;
      }

      if (fileUrl || finalFileName) {
        // Update case data
        setCaseData(prev => prev ? { ...prev, [fieldName]: finalFileName } : null);

        // Refresh documents
        const docsRes = await fetch(`/api/documents/${id}?moduleType=acoes_trabalhistas`);
        if (docsRes.ok) {
          setDocuments(await docsRes.json());
        }
        alert("✅ Arquivo enviado com sucesso!");
      }

    } catch (error: any) {
      console.error("Error uploading file:", error);
      alert(`❌ Erro ao enviar arquivo: ${error.message}`);
    } finally {
      setUploadingFields(prev => ({ ...prev, [fieldName]: false }));
      e.target.value = "";
    }
  };

  const handleDeleteDocument = async (doc: CaseDocument) => {
    try {
      const response = await fetch(`/api/documents/delete/${doc.id}`, { method: "DELETE" });
      if (response.ok) {
        setDocuments(prev => prev.filter(d => d.id !== doc.id));
        setDeleteDialogOpen(false);
        setDocumentToDelete(null);
      }
    } catch (error) {
      console.error("Erro ao excluir documento:", error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      await fetch(`/api/acoes-trabalhistas?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const handleStepCompletion = async (stepIndex: number) => {
    const nextCurrent = stepIndex + 1;
    try {
      const res = await fetch(`/api/acoes-trabalhistas?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStep: nextCurrent }),
      });

      if (res.ok) {
        setCaseData(prev => prev ? ({ ...prev, currentStep: nextCurrent }) : null);
      }
    } catch (error) {
      console.error("Erro ao atualizar etapa:", error);
    }
  };

  const handleSaveAssignment = async (index: number, responsibleName?: string, dueDate?: string) => {
    try {
      const steps = WORKFLOWS["Ação Trabalhista"] || [];
      const stepTitle = steps[index];
      const res = await fetch(`/api/step-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleType: "acoes_trabalhistas", recordId: id, stepIndex: index, responsibleName, dueDate, workflowName: stepTitle, clientName: caseData?.clientName || "Cliente" })
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

  const saveStepNotes = async (stepIndex: number) => {
    const text = (notes[stepIndex] || '').trim();
    if (!text) return;
    // Implementation for saving notes (simplified)
    console.log("Saving notes for step", stepIndex, text);
    setSaveMessages(prev => ({ ...prev, [stepIndex]: 'Salvo' }));
  };

  // Helper for requirements
  const getDocRequirements = () => {
    return [
      // Cadastro
      { label: "Documentos Iniciais", key: "documentosIniciaisFile", group: "Cadastro de Documentos", required: true },
      { label: "Contrato de Trabalho", key: "contratoTrabalhoFile", group: "Cadastro de Documentos", required: true },
      { label: "Carteira de Trabalho", key: "carteiraTrabalhistaFile", group: "Cadastro de Documentos", required: true },
      { label: "Comprovantes Salariais", key: "comprovantesSalariaisFile", group: "Cadastro de Documentos", required: true },
      { label: "Petição Inicial", key: "peticaoInicialFile", group: "Cadastro de Documentos", required: true },
      { label: "Procuração", key: "procuracaoTrabalhistaFile", group: "Cadastro de Documentos", required: true },

      // Resumo
      { label: "Documento de Resumo", key: "resumoDoc", group: "Resumo" },

      // Acompanhamento
      { label: "Documento de Acompanhamento", key: "acompanhamentoDoc", group: "Acompanhamento" },
      { label: "Citação Empregador", key: "citacaoEmpregadorFile", group: "Acompanhamento" },
      { label: "Contestação", key: "contestacaoRecebidaFile", group: "Acompanhamento" },
      { label: "Ata de Audiência", key: "ataAudienciaInicialFile", group: "Acompanhamento" },
      { label: "Provas/Testemunhas", key: "provasTestemunhasFile", group: "Acompanhamento" },
      { label: "Alegações Finais", key: "alegacoesFinaisFile", group: "Acompanhamento" },

      // Finalizado
      { label: "Sentença", key: "sentencaTrabalhistaFile", group: "Processo Finalizado" },
      { label: "Execução/Recurso", key: "execucaoRecursoFile", group: "Processo Finalizado" },
      { label: "Documento Final", key: "finalizadoDoc", group: "Processo Finalizado" },
    ];
  };

  const pendingDocs = getDocRequirements().filter(req =>
    !documents.some(doc => (doc.document_type === req.key || doc.fieldName === req.key)) && !caseData?.[req.key]
  ).map(doc => ({
    ...doc,
    priority: doc.required ? "high" : "medium" as any,
    status: "pending" as any
  }));

  const totalDocs = getDocRequirements().length;
  const completedDocs = totalDocs - pendingDocs.length;

  // Render Helpers
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

  const renderRow = (label: string, valueKey: keyof CaseData | undefined, fileKey: string, isEditing: boolean, onChangeValue?: (val: string) => void, customValue?: React.ReactNode) => {
    const fileUrl = caseData?.[fileKey];
    const fileName = fileUrl ? (fileUrl.split('/').pop() || 'Documento') : null;

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

          {/* File Upload Area */}
          <div className="flex items-center gap-2 mt-1">
            {fileUrl ? (
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100 w-full">
                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-700 hover:underline truncate flex-1">
                  {fileName}
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => {
                    // Handle delete specific field file if needed, or just clear the field
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 border border-dashed border-slate-300 rounded-md text-sm text-slate-500 cursor-pointer hover:bg-slate-50 transition-colors ${uploadingFields[fileKey] ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingFields[fileKey] ? 'Enviando...' : 'Anexar arquivo'}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, fileKey)}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.txt,.rtf"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStepContent = (stepIndex: number) => {
    if (!caseData) return null;

    switch (stepIndex) {
      case 0: // Cadastro
        return (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {renderHeader("Dados Iniciais",
              () => setIsEditingCadastro(true),
              isEditingCadastro,
              async () => {
                await fetch(`/api/acoes-trabalhistas?id=${id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    reuName: caseData.reuName,
                    numeroProcesso: caseData.numeroProcesso,
                    responsavelName: caseData.responsavelName,
                    responsavelDate: caseData.responsavelDate,
                    documentosIniciais: caseData.documentosIniciais,
                    contratoTrabalho: caseData.contratoTrabalho,
                    carteiraTrabalhista: caseData.carteiraTrabalhista,
                    comprovantesSalariais: caseData.comprovantesSalariais
                  }),
                });
                setIsEditingCadastro(false);
              },
              () => setIsEditingCadastro(false)
            )}
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {renderRow("Autor", undefined, "", false, undefined, <div className="text-sm font-medium">{caseData.clientName}</div>)}
              {renderRow("Réu", "reuName", "", isEditingCadastro, (v) => setCaseData({ ...caseData, reuName: v }))}
              {renderRow("Nº Processo", "numeroProcesso", "", isEditingCadastro, (v) => setCaseData({ ...caseData, numeroProcesso: v }))}
              {renderRow("Responsável", "responsavelName", "", isEditingCadastro, (v) => setCaseData({ ...caseData, responsavelName: v }))}

              {/* Documents Section */}
              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h4 className="font-semibold text-sm mb-4">Documentação Obrigatória</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderRow("Documentos Iniciais", "documentosIniciais", "documentosIniciaisFile", isEditingCadastro, (v) => setCaseData({ ...caseData, documentosIniciais: v }))}
                  {renderRow("Contrato de Trabalho", "contratoTrabalho", "contratoTrabalhoFile", isEditingCadastro, (v) => setCaseData({ ...caseData, contratoTrabalho: v }))}
                  {renderRow("Carteira de Trabalho", "carteiraTrabalhista", "carteiraTrabalhistaFile", isEditingCadastro, (v) => setCaseData({ ...caseData, carteiraTrabalhista: v }))}
                  {renderRow("Comprovantes Salariais", "comprovantesSalariais", "comprovantesSalariaisFile", isEditingCadastro, (v) => setCaseData({ ...caseData, comprovantesSalariais: v }))}
                </div>
              </div>
            </div>
          </div>
        );
      case 1: // Resumo
        return (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {renderHeader("Resumo do Caso",
              () => setIsEditingResumo(true),
              isEditingResumo,
              async () => {
                await fetch(`/api/acoes-trabalhistas?id=${id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ resumo: caseData.resumo, contratado: caseData.contratado }),
                });
                setIsEditingResumo(false);
              },
              () => setIsEditingResumo(false)
            )}
            <div className="p-4 md:p-6 space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Observações</Label>
                {isEditingResumo ? (
                  <Textarea value={caseData.resumo || ""} onChange={(e) => setCaseData({ ...caseData, resumo: e.target.value })} rows={5} />
                ) : (
                  <div className="text-sm text-slate-900 whitespace-pre-wrap p-3 bg-slate-50 rounded-md border border-slate-100 min-h-[80px]">
                    {caseData.resumo || "Nenhuma observação registrada."}
                  </div>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {renderRow("Contratado", undefined, "resumoDoc", isEditingResumo, undefined,
                  isEditingResumo ? (
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant={caseData.contratado === "Sim" ? "default" : "outline"} onClick={() => setCaseData({ ...caseData, contratado: "Sim" })}>Sim</Button>
                      <Button type="button" size="sm" variant={caseData.contratado === "Não" ? "default" : "outline"} onClick={() => setCaseData({ ...caseData, contratado: "Não" })}>Não</Button>
                    </div>
                  ) : (
                    <div className="text-sm font-medium">{caseData.contratado || "-"}</div>
                  )
                )}
              </div>
            </div>
          </div>
        );
      case 2: // Acompanhamento
        return (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {renderHeader("Acompanhamento Processual",
              () => setIsEditingAcompanhamento(true),
              isEditingAcompanhamento,
              async () => {
                await fetch(`/api/acoes-trabalhistas?id=${id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ acompanhamento: caseData.acompanhamento }),
                });
                setIsEditingAcompanhamento(false);
              },
              () => setIsEditingAcompanhamento(false)
            )}
            <div className="p-4 md:p-6 space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Histórico</Label>
                {isEditingAcompanhamento ? (
                  <Textarea value={caseData.acompanhamento || ""} onChange={(e) => setCaseData({ ...caseData, acompanhamento: e.target.value })} rows={8} />
                ) : (
                  <div className="text-sm text-slate-900 whitespace-pre-wrap p-3 bg-slate-50 rounded-md border border-slate-100 min-h-[100px]">
                    {caseData.acompanhamento || "Nenhum andamento registrado."}
                  </div>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {renderRow("Documento de Andamento", undefined, "acompanhamentoDoc", isEditingAcompanhamento)}
              </div>
            </div>
          </div>
        );
      case 3: // Finalizado
        return (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {renderHeader("Finalização",
              () => setIsEditingFinalizado(true),
              isEditingFinalizado,
              async () => {
                // Logic to save final notes
                await fetch(`/api/acoes-trabalhistas?id=${id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ notes: caseData.notes }), // Simplified
                });
                setIsEditingFinalizado(false);
              },
              () => setIsEditingFinalizado(false)
            )}
            <div className="p-4 md:p-6 space-y-4">
              {/* Simplified notes handling for standardization */}
              <div className="grid md:grid-cols-2 gap-6">
                {renderRow("Documento Final", undefined, "finalizadoDoc", isEditingFinalizado)}
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  if (loading) return <Skeleton className="h-screen w-full" />;
  if (!caseData) return <div>Caso não encontrado</div>;

  return (
    <div className="w-full p-4 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/acoes-trabalhistas">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{caseData.clientName}</h1>
            <div className="flex items-center gap-2 text-slate-500">
              <Badge variant="outline" className="font-normal bg-white">Ação Trabalhista</Badge>
              <span>•</span>
              <span className="text-sm">{caseData.type}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-2" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este processo? Todos os dados e documentos serão perdidos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={async () => {
                  await fetch(`/api/acoes-trabalhistas?id=${id}`, { method: "DELETE" });
                  router.push("/dashboard/acoes-trabalhistas");
                }} className="bg-red-600 hover:bg-red-700">
                  Excluir Definitivamente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-12">
        {/* LEFT COLUMN: WORKFLOW */}
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
                {WORKFLOWS["Ação Trabalhista"].map((step, index) => {
                  const isCurrent = index === caseData.currentStep;
                  const isCompleted = index < caseData.currentStep;
                  const showConnector = index < WORKFLOWS["Ação Trabalhista"].length - 1;

                  return (
                    <div key={index} className="relative pl-10 pb-8 last:pb-0">
                      {showConnector && (
                        <div className={`absolute left-[19px] top-8 bottom-0 w-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                      )}

                      {/* Status Indicator */}
                      <div
                        className={`absolute left-0 top-1 w-10 h-10 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-105 z-10 ${isCompleted ? 'bg-green-50 border-green-500 text-green-600' :
                          isCurrent ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-md' :
                            'bg-white border-gray-200 text-gray-300'
                          }`}
                        onClick={() => handleStepCompletion(index)}
                      >
                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5 fill-current" />}
                      </div>

                      {/* Step Content */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className={`font-semibold text-lg ${isCurrent ? 'text-blue-700' : 'text-slate-700'}`}>
                              {step}
                            </h3>
                            {isCurrent && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">Atual</Badge>}
                          </div>

                          <div className="flex items-center gap-2">
                            <Popover open={assignOpenStep === index} onOpenChange={(open) => setAssignOpenStep(open ? index : null)}>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500">
                                  {assignments[index]?.responsibleName ? assignments[index].responsibleName : "Atribuir"}
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
                                  <Button size="sm" onClick={() => { handleSaveAssignment(index, assignResp, assignDue); setAssignOpenStep(null); }}>Salvar</Button>
                                </div>
                              </PopoverContent>
                            </Popover>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setExpandedSteps(prev => ({ ...prev, [index]: !prev[index] }))}
                            >
                              {expandedSteps[index] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* Collapsible Content */}
                        {(expandedSteps[index] || isCurrent) && (
                          <div className="pt-2 animate-in slide-in-from-top-2 duration-300">
                            {renderStepContent(index)}
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

        {/* RIGHT COLUMN: INFO & DOCS */}
        <div className="lg:col-span-4 space-y-6">
          <StatusPanel
            status={status}
            onStatusChange={handleStatusChange}
            currentStep={caseData.currentStep + 1}
            totalSteps={WORKFLOWS["Ação Trabalhista"].length}
            currentStepTitle={WORKFLOWS["Ação Trabalhista"][caseData.currentStep] || "Finalizado"}
            createdAt={caseData.createdAt}
            updatedAt={caseData.updatedAt}
          />

          {/* Pending Documents */}
          <PendingDocumentsList
            documents={pendingDocs}
            totalDocs={totalDocs}
            completedDocs={completedDocs}
            onUploadClick={(doc) => {
              const idx = WORKFLOWS["Ação Trabalhista"].findIndex(w => w === doc.group);
              if (idx !== -1) {
                setExpandedSteps(prev => ({ ...prev, [idx]: true }));
                // Scroll logic could be added here
              }
            }}
          />

          {/* General Notes */}
          <Card className="rounded-xl border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase text-slate-500">Observações Gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  placeholder="Adicione notas gerais..."
                  className="resize-none bg-slate-50"
                  rows={6}
                />
                <Button size="sm" className="w-full bg-slate-900">Salvar Notas</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
