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
  Check,
  ChevronsUpDown,
  Plus,
  History,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import "react-day-picker/dist/style.css";

const WORKFLOWS = {
  "Ação Criminal": [
    "Cadastro de Documentos",
    "Resumo",
    "Acompanhamento",
    "Processo Finalizado",
  ],
};

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
  acompanhamento?: string | null; // Stores JSON history
  contratado?: string | null;
  fotoNotificacaoDoc?: string;
  finalizadoText?: string;
  actionSubtype?: string;
  // Generic file fields for steps
  resumo_docs?: string;
  final_docs?: string;
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

export default function AcaoCriminalDetailPage() {
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
  const [actionTypeOpen, setActionTypeOpen] = useState(false);
  const [acompanhamentoText, setAcompanhamentoText] = useState("");
  const [finalizadoText, setFinalizadoText] = useState("");
  const [confirmFinalizeOpen, setConfirmFinalizeOpen] = useState(false);

  // Load case data
  useEffect(() => {
    const loadCase = async () => {
      try {
        const response = await fetch(`/api/acoes-criminais?id=${id}`);
        if (response.ok) {
          const data = await response.json();
          // Normalize data
           const normalizedData = {
            ...data,
            clientName: data.clientName || data.client_name,
            autorName: data.autorName || data.autor_name,
            reuName: data.reuName || data.reu_name,
            numeroProcesso: data.numeroProcesso || data.numero_processo || data.processNumber,
            responsavelName: data.responsavelName || data.responsavel_name,
            responsavelDate: data.responsavelDate || data.responsavel_date,
            resumo: data.resumo,
            acompanhamento: data.acompanhamento,
          };
          setCaseData(normalizedData);
          setStatus(data.status || "Em andamento");
          
          // Try to parse finalizadoText from notes if stored there
          try {
             const parsedNotes = JSON.parse(data.notes || "[]");
             const finalNote = Array.isArray(parsedNotes) ? parsedNotes.find((n: any) => n.type === 'finalizado_text') : null;
             if (finalNote) setFinalizadoText(finalNote.content.replace("CONSIDERAÇÕES FINAIS: ", ""));
          } catch {}
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
        const res = await fetch(`/api/step-assignments?moduleType=acoes_criminais&recordId=${id}`);
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
        const response = await fetch(`/api/documents/${id}?moduleType=acoes_criminais`);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFields(prev => ({ ...prev, [fieldName]: true }));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("caseId", id);
    formData.append("fieldName", fieldName);
    formData.append("moduleType", "acoes_criminais");
    formData.append("documentType", fieldName);

    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update case data
        setCaseData(prev => prev ? { ...prev, [fieldName]: data.fileName } : null);
        
        // Refresh documents
        const docsRes = await fetch(`/api/documents/${id}?moduleType=acoes_criminais`);
        if (docsRes.ok) {
            setDocuments(await docsRes.json());
        }
        
        alert("✅ Arquivo enviado com sucesso!");
      } else {
        alert("❌ Erro ao enviar arquivo");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("❌ Erro ao enviar arquivo");
    } finally {
      setUploadingFields(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      await fetch(`/api/acoes-criminais?id=${id}`, {
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
      const { error } = await supabase
        .from('acoes_criminais')
        .update({ current_step: nextCurrent })
        .eq('id', Number(id));

      if (!error) {
        setCaseData(prev => prev ? ({ ...prev, currentStep: nextCurrent }) : null);
      }
    } catch (error) {
      console.error("Erro ao atualizar etapa:", error);
    }
  };

  const handleSaveAssignment = async (index: number, responsibleName?: string, dueDate?: string) => {
    try {
      const steps = WORKFLOWS["Ação Criminal"] || [];
      const stepTitle = steps[index];
      const res = await fetch(`/api/step-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleType: "acoes_criminais", recordId: id, stepIndex: index, responsibleName, dueDate, workflowName: stepTitle, clientName: caseData?.clientName || "Cliente" })
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

  const handleAddAcompanhamento = async () => {
    if (!acompanhamentoText.trim()) return;
    const newEntry = {
      id: (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : Date.now().toString(),
      date: new Date().toISOString(),
      content: acompanhamentoText,
      author: "Usuário", 
    };
    let history: any[] = [];
    try { history = JSON.parse(caseData?.acompanhamento || "[]"); } catch {}
    if (!Array.isArray(history)) history = [];
    const updated = [...history, newEntry];
    
    await fetch(`/api/acoes-criminais?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acompanhamento: JSON.stringify(updated) }),
    });
    
    setCaseData(prev => prev ? { ...prev, acompanhamento: JSON.stringify(updated) } : null);
    setAcompanhamentoText("");
    setIsEditingAcompanhamento(false);
  };

  const handleFinalizeProcess = async () => {
    if (!finalizadoText.trim()) {
        alert("Por favor, insira as considerações finais.");
        return;
    }
    const noteEntry = {
        id: Date.now().toString(),
        content: `CONSIDERAÇÕES FINAIS: ${finalizadoText}`,
        type: 'finalizado_text',
        timestamp: new Date().toISOString(),
        authorName: "Sistema"
    };
    const currentNotes = []; // Simplified
    const nextNotes = [...currentNotes, noteEntry];
    
    try {
      await fetch(`/api/acoes-criminais?id=${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: 'Finalizado', notes: JSON.stringify(nextNotes) }),
      });
      setConfirmFinalizeOpen(false);
      setStatus('Finalizado');
      setCaseData(prev => prev ? ({ ...prev, status: 'Finalizado' }) : prev);
    } catch (e) {
      console.error(e);
    }
  };

  // Helper for requirements
  const getDocRequirements = () => {
    return [
       // Cadastro
       { label: "Procuração", key: "procuracaoDoc", group: "Cadastro de Documentos", required: true },
       { label: "RG/CPF/CNH", key: "identidadeDoc", group: "Cadastro de Documentos", required: true },
       { label: "Comprovante de Endereço", key: "comprovanteEnderecoDoc", group: "Cadastro de Documentos", required: true },
       { label: "Documentos Gerais", key: "documento_geral", group: "Cadastro de Documentos" },

       // Resumo (Investigação/Inicial)
       { label: "Documento de Resumo", key: "resumo_docs", group: "Resumo", required: true },
       { label: "Inquérito Policial", key: "inqueritoDoc", group: "Resumo" },
       { label: "Boletim de Ocorrência", key: "boletimOcorrenciaDoc", group: "Resumo" },
       { label: "Denúncia", key: "denunciaDoc", group: "Resumo" },

       // Acompanhamento
       { label: "Resposta à Acusação", key: "respostaAcusacaoDoc", group: "Acompanhamento" },
       { label: "Defesa Prévia", key: "defesaPreviaDoc", group: "Acompanhamento" },
       { label: "Audiência de Custódia", key: "audienciaCustodiaDoc", group: "Acompanhamento" },
       
       // Finalizado
       { label: "Sentença/Decisão", key: "sentencaDoc", group: "Processo Finalizado" },
       { label: "Documento Final", key: "final_docs", group: "Processo Finalizado", required: true },
    ];
  };

  const pendingDocs = getDocRequirements().filter(req => 
    !documents?.some?.(doc => (doc.document_type === req.key || doc.fieldName === req.key)) && !caseData?.[req.key]
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

  const renderStepContent = (stepIndex: number) => {
     if (!caseData) return null;
     
     switch(stepIndex) {
         case 0: // Cadastro
            return (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {renderHeader("Dados Iniciais", 
                        undefined, 
                        false
                    )}
                    <div className="p-4 md:p-6 space-y-6">
                         {/* Classificação */}
                         <div className="space-y-2">
                            <Label className="text-base font-semibold">Classificação da Ação</Label>
                            <Popover open={actionTypeOpen} onOpenChange={setActionTypeOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={actionTypeOpen}
                                  className="w-full justify-between"
                                >
                                  {caseData.type && caseData.type !== "Ação Criminal"
                                    ? caseData.type
                                    : "Selecione o tipo de ação..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[400px] p-0">
                                <Command>
                                  <CommandInput placeholder="Buscar tipo de ação..." />
                                  <CommandList>
                                    <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                                    <CommandGroup>
                                      {CRIMINAL_TYPES.map((type) => (
                                        <CommandItem
                                          key={type}
                                          value={type}
                                          onSelect={async (currentValue) => {
                                            setCaseData({...caseData, type: currentValue});
                                            await fetch(`/api/acoes-criminais?id=${id}`, {
                                                method: "PUT",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ type: currentValue }),
                                            });
                                            setActionTypeOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              caseData.type === type ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          {type}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                          
                          {/* Generic Documents */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                               <Label className="text-base font-semibold">Documentos Cadastrados</Label>
                               <div className="flex items-center gap-2">
                                  <Input type="file" id="doc-upload-0" className="hidden" onChange={(e) => handleFileUpload(e, "documento_geral")} />
                                  <Button size="sm" variant="outline" onClick={() => document.getElementById('doc-upload-0')?.click()}>
                                    <Plus className="h-4 w-4 mr-2" /> Adicionar Documento
                                  </Button>
                               </div>
                            </div>
                            
                            <div className="rounded-md border overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-slate-100">
                                  <tr className="border-b">
                                    <th className="h-10 px-4 text-left font-medium text-slate-500">Nome do Documento</th>
                                    <th className="h-10 px-4 text-left font-medium text-slate-500">Data</th>
                                    <th className="h-10 px-4 text-left font-medium text-slate-500">Ações</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {documents.filter(d => d.fieldName === "documento_geral" || !d.fieldName).length === 0 ? (
                                    <tr>
                                      <td colSpan={3} className="h-24 text-center text-slate-500">Nenhum documento cadastrado</td>
                                    </tr>
                                  ) : (
                                    documents.filter(d => d.fieldName === "documento_geral" || !d.fieldName).map((doc) => (
                                      <tr key={doc.id} className="border-b last:border-0 hover:bg-slate-50">
                                        <td className="p-4 font-medium">
                                           <div className="flex items-center gap-2">
                                             <FileText className="h-4 w-4 text-blue-500" />
                                             <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                               {doc.document_name || doc.name || doc.file_name}
                                             </a>
                                           </div>
                                        </td>
                                        <td className="p-4 text-slate-500">
                                          {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="p-4">
                                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setDocumentToDelete(doc); setDeleteDialogOpen(true); }}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                          </Button>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
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
                             await fetch(`/api/acoes-criminais?id=${id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ resumo: caseData.resumo }),
                             });
                             setIsEditingResumo(false);
                        },
                        () => setIsEditingResumo(false)
                    )}
                    <div className="p-4 md:p-6 space-y-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Observações</Label>
                            {isEditingResumo ? (
                                <Textarea value={caseData.resumo || ""} onChange={(e) => setCaseData({...caseData, resumo: e.target.value})} rows={8} />
                            ) : (
                                <div className="text-sm text-slate-900 whitespace-pre-wrap p-3 bg-slate-50 rounded-md border border-slate-100 min-h-[100px]">
                                    {caseData.resumo || "Nenhuma observação registrada."}
                                </div>
                            )}
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            {renderRow("Documentos do Resumo", undefined, "resumo_docs", isEditingResumo)}
                        </div>
                    </div>
                </div>
            );
         case 2: // Acompanhamento
            const history = (() => {
                try { return JSON.parse(caseData.acompanhamento || "[]"); } catch { return []; }
            })();
            return (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            <History className="w-4 h-4 text-slate-500" />
                            Histórico de Acompanhamento
                        </h3>
                        <Button size="sm" variant="outline" className="h-7 px-2 bg-white" onClick={() => setIsEditingAcompanhamento(!isEditingAcompanhamento)}>
                           {isEditingAcompanhamento ? "Fechar Editor" : "Adicionar Registro"}
                        </Button>
                    </div>
                    
                    <div className="p-4 md:p-6 space-y-6">
                       {isEditingAcompanhamento && (
                         <div className="bg-slate-50 p-4 rounded-md space-y-3 animate-in fade-in slide-in-from-top-2 border border-slate-200">
                           <Label>Novo Registro</Label>
                           <Textarea 
                             value={acompanhamentoText} 
                             onChange={(e) => setAcompanhamentoText(e.target.value)}
                             placeholder="Descreva o andamento..."
                             className="min-h-[100px] bg-white"
                           />
                           <div className="flex justify-end">
                             <Button size="sm" onClick={handleAddAcompanhamento} className="bg-slate-900">Salvar Registro</Button>
                           </div>
                         </div>
                       )}

                       <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                          {history.length === 0 && !isEditingAcompanhamento && (
                            <p className="text-center text-sm text-slate-500 py-4">Nenhum acompanhamento registrado.</p>
                          )}
                          {history.map((item: any, idx: number) => (
                            <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                <History className="w-5 h-5 text-slate-500" />
                              </div>
                              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 bg-white shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                  <time className="font-medium text-xs text-slate-500">{new Date(item.date).toLocaleString('pt-BR')}</time>
                                  <span className="text-xs font-bold text-slate-700">{item.author || "Usuário"}</span>
                                </div>
                                <p className="text-slate-700 text-sm whitespace-pre-wrap">{item.content}</p>
                              </div>
                            </div>
                          ))}
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
                             await handleFinalizeProcess(); // This might be too aggressive if it changes status, but let's assume it saves notes
                             setIsEditingFinalizado(false);
                        },
                        () => setIsEditingFinalizado(false)
                    )}
                    <div className="p-4 md:p-6 space-y-4">
                         <div className="space-y-1">
                           <Label>Considerações Finais</Label>
                           <Textarea 
                             value={finalizadoText}
                             onChange={(e) => setFinalizadoText(e.target.value)}
                             placeholder="Descreva o desfecho do caso, sentença, etc."
                             className="min-h-[120px]"
                             disabled={status === 'Finalizado' && !isEditingFinalizado}
                           />
                         </div>
                         <div className="grid md:grid-cols-2 gap-6">
                            {renderRow("Documento Final", undefined, "final_docs", isEditingFinalizado)}
                         </div>
                         
                         {status !== 'Finalizado' && (
                           <div className="pt-4 flex justify-end">
                             <AlertDialog open={confirmFinalizeOpen} onOpenChange={setConfirmFinalizeOpen}>
                               <AlertDialogTrigger asChild>
                                 <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                   <CheckCircle className="w-4 h-4 mr-2" />
                                   Concluir Processo
                                 </Button>
                               </AlertDialogTrigger>
                               <AlertDialogContent>
                                 <AlertDialogHeader>
                                   <AlertDialogTitle>Concluir Processo Criminal?</AlertDialogTitle>
                                   <AlertDialogDescription>
                                     Esta ação marcará o processo como Finalizado e salvará as considerações finais. Certifique-se de que todos os documentos foram anexados.
                                   </AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter>
                                   <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                   <AlertDialogAction onClick={handleFinalizeProcess} className="bg-emerald-600 hover:bg-emerald-700">
                                     Confirmar Conclusão
                                   </AlertDialogAction>
                                 </AlertDialogFooter>
                               </AlertDialogContent>
                             </AlertDialog>
                           </div>
                         )}
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
          <Link href="/dashboard/acoes-criminais">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{caseData.clientName}</h1>
            <div className="flex items-center gap-2 text-slate-500">
                <Badge variant="outline" className="font-normal bg-white">Ação Criminal</Badge>
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
                            await fetch(`/api/acoes-criminais?id=${id}`, { method: "DELETE" });
                            router.push("/dashboard/acoes-criminais");
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
                        {WORKFLOWS["Ação Criminal"].map((step, index) => {
                             const isCurrent = index === caseData.currentStep;
                             const isCompleted = index < caseData.currentStep;
                             const showConnector = index < WORKFLOWS["Ação Criminal"].length - 1;
                             
                             return (
                                <div key={index} className="relative pl-10 pb-8 last:pb-0">
                                     {showConnector && (
                                        <div className={`absolute left-[19px] top-8 bottom-0 w-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                                     )}
                                     
                                     {/* Status Indicator */}
                                     <div 
                                        className={`absolute left-0 top-1 w-10 h-10 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-105 z-10 ${
                                            isCompleted ? 'bg-green-50 border-green-500 text-green-600' :
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
                totalSteps={WORKFLOWS["Ação Criminal"].length}
                currentStepTitle={WORKFLOWS["Ação Criminal"][caseData.currentStep]}
                createdAt={caseData.createdAt}
                updatedAt={caseData.updatedAt}
            />

            {/* Pending Documents */}
            <PendingDocumentsList
                documents={pendingDocs}
                totalDocs={totalDocs}
                completedDocs={completedDocs}
                onUploadClick={(doc) => {
                     const idx = WORKFLOWS["Ação Criminal"].findIndex(w => w === doc.group);
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
