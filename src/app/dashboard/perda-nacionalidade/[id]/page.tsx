"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Trash2, FileText, Download, X, Edit2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DetailLayout } from "@/components/detail/DetailLayout";
import { StepItem } from "@/components/detail/StepItem";
import { StatusPanel } from "@/components/detail/StatusPanel";
import { DocumentPanel } from "@/components/detail/DocumentPanel";
import { NotesPanel } from "@/components/detail/NotesPanel";

const WORKFLOW_STEPS = [
  { id: 1, title: "Cadastro de Documento", description: "Informações iniciais do requerente" },
  { id: 2, title: "Fazer a Procuração e o Pedido de Perda", description: "Elaboração de documentos legais" },
  { id: 3, title: "Colher assinaturas nas Procurações e Pedidos", description: "Coleta de assinaturas necessárias" },
  { id: 4, title: "Protocolar no SEI", description: "Registro do protocolo no SEI" },
  { id: 5, title: "Processo Protocolado", description: "Confirmação de protocolo e comprovantes" },
  { id: 6, title: "Processo Deferido", description: "Registro do deferimento e DOU" },
  { id: 7, title: "Passaporte Chinês", description: "Solicitação e registro de passaporte chinês" },
  { id: 8, title: "Manifesto", description: "Registro do manifesto" },
  { id: 9, title: "Protocolar no SEI", description: "Protocolo do manifesto no SEI" },
  { id: 10, title: "Processo Ratificado", description: "Registro da ratificação com DOU e data" },
  { id: 11, title: "Processo Finalizado", description: "Arquivar documento de finalização do processo" },
];

export default function PerdaNacionalidadeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [stepData, setStepData] = useState<{ [key: number]: any }>({});
  const [stepNotes, setStepNotes] = useState<{ [key: number]: string }>({});
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [editingDocument, setEditingDocument] = useState<string | null>(null);
  const [newDocumentName, setNewDocumentName] = useState("");
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [assignments, setAssignments] = useState<Record<number, { responsibleName?: string; dueDate?: string }>>({});
  const [recordFields, setRecordFields] = useState<any>({});
  const [stepSaveSuccess, setStepSaveSuccess] = useState<Record<number, boolean>>({});
  const [recordFieldsSaved, setRecordFieldsSaved] = useState(false);

  useEffect(() => {
    fetchCaseData();
    fetchDocuments();
  }, [params.id]);

  const fetchCaseData = async () => {
    try {
      const response = await fetch(`/api/perda-nacionalidade?id=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCaseData(data);
        setNotes(data.notes || "");
        setStatus(data.status || "");
        setCompletedSteps(data.completedSteps || []);
        setStepData(data.stepData || {});
        setStepNotes(data.stepNotes || {});
        setRecordFields({
          nomeMae: data.nomeMae || "",
          nomePai: data.nomePai || "",
          nomeCrianca: data.nomeCrianca || "",
          rnmMae: data.rnmMae || "",
          rnmPai: data.rnmPai || "",
          cpfMae: data.cpfMae || "",
          cpfPai: data.cpfPai || "",
          passaporteMae: data.passaporteMae || "",
          passaportePai: data.passaportePai || "",
          passaporteCrianca: data.passaporteCrianca || "",
          rgCrianca: data.rgCrianca || "",
          documentoChines: data.documentoChines || "",
          traducaoJuramentada: data.traducaoJuramentada || "",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar dados do caso:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/documents/${params.id}?moduleType=perda_nacionalidade`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar documentos:", error);
    }
  };

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const res = await fetch(`/api/step-assignments?moduleType=perda_nacionalidade&recordId=${params.id}`);
        if (res.ok) {
          const data = await res.json();
          const map: Record<number, { responsibleName?: string; dueDate?: string }> = {};
          (data || []).forEach((a: any) => { map[a.stepIndex] = { responsibleName: a.responsibleName, dueDate: a.dueDate }; });
          setAssignments(map);
        }
      } catch {}
    };
    loadAssignments();
  }, [params.id]);

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/delete/${documentId}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchDocuments();
      }
    } catch (error) {
      console.error("Erro ao deletar documento:", error);
    }
  };

  const handleRenameDocument = async (documentId: string, newName: string) => {
    try {
      const response = await fetch(`/api/documents/rename/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_name: newName })
      });
      if (response.ok) {
        await fetchDocuments();
        setEditingDocument(null);
        setNewDocumentName("");
      }
    } catch (error) {
      console.error("Erro ao renomear documento:", error);
    }
  };

  const handleFileUpload = async (files: FileList | File[], step?: number, field?: string) => {
    const fileArray = Array.from(files as any);
    if (!fileArray.length) return;

    setUploading(true);
    if (field) setUploadingField(field);

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });
    // Use general upload route
    const file = fileArray[0];
    const fd = new FormData();
    fd.append('file', file);
    fd.append('caseId', String(params.id));
    fd.append('moduleType', 'perda_nacionalidade');
    fd.append('fieldName', field || 'documentoAnexado');
    fd.append('clientName', caseData?.clientName || 'Cliente');

    try {
      const response = await fetch('/api/documents/upload', { method: 'POST', body: fd });
      if (response.ok) {
        const resp = await response.json();
        const fileUrl = resp.fileUrl || resp.file_path || resp.filePath || resp.url;
        if (field && fileUrl) {
          try {
            await fetch(`/api/perda-nacionalidade?id=${params.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ [field]: fileUrl }),
            });
            setCaseData((prev: any) => ({ ...(prev || {}), [field]: fileUrl }));
            if (typeof step === 'number') {
              setStepData((prev: any) => {
                const next = {
                  ...prev,
                  [step]: { ...((prev || {})[step] || {}), [field]: fileUrl },
                };
                fetch(`/api/perda-nacionalidade?id=${params.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ stepData: next }),
                }).catch(() => {});
                return next;
              });
            }
          } catch {}
        }
        await fetchDocuments();
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
    } finally {
      setUploading(false);
      setUploadingField(null);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const toggleStep = (stepIndex: number) => {
    setExpandedSteps(prev => 
      prev.includes(stepIndex) 
        ? prev.filter(i => i !== stepIndex)
        : [...prev, stepIndex]
    );
  };

  const toggleStepCompletion = (stepIndex: number) => {
    setCompletedSteps(prev => 
      prev.includes(stepIndex)
        ? prev.filter(i => i !== stepIndex)
        : [...prev, stepIndex]
    );
  };

  const saveStepData = async (stepIndex: number, data: any) => {
    const newStepData = { ...stepData, [stepIndex]: data };
    setStepData(newStepData);
    
    try {
      const r = await fetch(`/api/perda-nacionalidade?id=${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stepData: newStepData }),
      });
      if (r.ok) {
        setStepSaveSuccess(prev => ({ ...prev, [stepIndex]: true }));
        setTimeout(() => setStepSaveSuccess(prev => ({ ...prev, [stepIndex]: false })), 3000);
      }
    } catch (error) {
      console.error("Erro ao salvar dados da etapa:", error);
    }
  };

  const saveStepNotes = async (stepIndex: number, notes: string) => {
    const newStepNotes = { ...stepNotes, [stepIndex]: notes };
    setStepNotes(newStepNotes);
    
    try {
      await fetch(`/api/perda-nacionalidade?id=${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stepNotes: newStepNotes }),
      });
    } catch (error) {
      console.error("Erro ao salvar notas da etapa:", error);
    }
  };

  const saveNotes = async () => {
    try {
      await fetch(`/api/perda-nacionalidade?id=${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes }),
      });
    } catch (error) {
      console.error("Erro ao salvar notas:", error);
    }
  };

  const saveStatus = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      const res = await fetch(`/api/perda-nacionalidade?id=${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus, completedSteps }),
      });
      if (res.ok && typeof window !== 'undefined') {
        try {
          localStorage.setItem('perda-nacionalidade-status-update', JSON.stringify({ id: params.id, status: newStatus, t: Date.now() }));
          window.dispatchEvent(new CustomEvent('perda-nacionalidade-status-updated', { detail: { id: params.id, status: newStatus } }));
        } catch {}
      }
    } catch (error) {
      console.error("Erro ao salvar status:", error);
    }
  };

  const handleDeleteCase = async () => {
    try {
      const response = await fetch(`/api/perda-nacionalidade?id=${params.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        router.push("/dashboard/perda-nacionalidade");
      }
    } catch (error) {
      console.error("Erro ao deletar caso:", error);
    }
  };

  const renderStepContent = (stepIndex: number) => {
    if (!caseData) return null;
    
    return renderPerdaNacionalidadeStepContent(stepIndex);
  };

  const renderPerdaNacionalidadeStepContent = (stepIndex: number) => {
    const currentStepData = stepData[stepIndex] || {};
    const updateStepData = (field: string, value: any) => {
      setStepData((prev: any) => ({
        ...prev,
        [stepIndex]: { ...((prev || {})[stepIndex] || {}), [field]: value },
      }));
      setStepSaveSuccess(prev => ({ ...prev, [stepIndex]: false }));
    };
    const updateFieldLocal = (field: string, value: any) => {
      setRecordFields((prev: any) => ({ ...prev, [field]: value }));
    };

    const saveRecordFields = async () => {
      try {
        const payload = { ...recordFields };
        const res = await fetch(`/api/perda-nacionalidade?id=${params.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setCaseData((prev: any) => ({ ...(prev || {}), ...payload }));
        }
      } catch (e) {
        console.error("Erro ao salvar dados do cadastro:", e);
      }
    };

    const renderFileUpload = (fieldName: string, label: string) => (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            multiple
            onChange={(e) => e.target.files && handleFileUpload(e.target.files, stepIndex, fieldName)}
            className="flex-1"
          />
          {uploadingField === fieldName && (
            <div className="text-sm text-muted-foreground">Enviando...</div>
          )}
        </div>
        {renderDocLinks(fieldName)}
        {currentStepData[fieldName] && (
          <div className="text-sm text-green-600">✓ Arquivo enviado</div>
        )}
      </div>
    );

    switch (stepIndex) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Mãe</Label>
                <Input
                  value={recordFields.nomeMae || ""}
                  onChange={(e) => updateFieldLocal("nomeMae", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Nome do Pai</Label>
                <Input
                  value={recordFields.nomePai || ""}
                  onChange={(e) => updateFieldLocal("nomePai", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Nome da Criança</Label>
                <Input
                  value={recordFields.nomeCrianca || ""}
                  onChange={(e) => updateFieldLocal("nomeCrianca", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>RNM da Mãe</Label>
                <Input
                  value={recordFields.rnmMae || ""}
                  onChange={(e) => updateFieldLocal("rnmMae", e.target.value)}
                  placeholder="Número do RNM"
                />
              </div>
              <div className="space-y-2">
                <Label>CPF da Mãe</Label>
                <Input
                  value={recordFields.cpfMae || ""}
                  onChange={(e) => updateFieldLocal("cpfMae", e.target.value)}
                  placeholder="CPF"
                />
              </div>
              <div className="space-y-2">
                <Label>RNM do Pai</Label>
                <Input
                  value={recordFields.rnmPai || ""}
                  onChange={(e) => updateFieldLocal("rnmPai", e.target.value)}
                  placeholder="Número do RNM"
                />
              </div>
              <div className="space-y-2">
                <Label>CPF do Pai</Label>
                <Input
                  value={recordFields.cpfPai || ""}
                  onChange={(e) => updateFieldLocal("cpfPai", e.target.value)}
                  placeholder="CPF"
                />
              </div>
              <div className="space-y-2">
                <Label>Passaporte da Mãe</Label>
                <Input
                  value={recordFields.passaporteMae || ""}
                  onChange={(e) => updateFieldLocal("passaporteMae", e.target.value)}
                  placeholder="Número do passaporte"
                />
              </div>
              <div className="space-y-2">
                <Label>Passaporte do Pai</Label>
                <Input
                  value={recordFields.passaportePai || ""}
                  onChange={(e) => updateFieldLocal("passaportePai", e.target.value)}
                  placeholder="Número do passaporte"
                />
              </div>
              <div className="space-y-2">
                <Label>Passaporte da Criança</Label>
                <Input
                  value={recordFields.passaporteCrianca || ""}
                  onChange={(e) => updateFieldLocal("passaporteCrianca", e.target.value)}
                  placeholder="Número do passaporte"
                />
              </div>
              <div className="space-y-2">
                <Label>RG da Criança</Label>
                <Input
                  value={recordFields.rgCrianca || ""}
                  onChange={(e) => updateFieldLocal("rgCrianca", e.target.value)}
                  placeholder="Número do RG"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderFileUpload("rnmMaeDoc", "RNM da Mãe (Documento)")}
              {renderFileUpload("cpfMaeDoc", "CPF da Mãe (Documento)")}
              {renderFileUpload("rnmPaiDoc", "RNM do Pai (Documento)")}
              {renderFileUpload("cpfPaiDoc", "CPF do Pai (Documento)")}
              {renderFileUpload("certidaoNascimentoDoc", "Certidão de Nascimento da Criança")}
              {renderFileUpload("comprovanteEnderecoDoc", "Comprovante de Endereço")}
              {renderFileUpload("passaporteMaeDoc", "Passaporte da Mãe (Documento)")}
              {renderFileUpload("passaportePaiDoc", "Passaporte do Pai (Documento)")}
              {renderFileUpload("passaporteCriancaDoc", "Passaporte da Criança (Documento)")}
              {renderFileUpload("rgCriancaDoc", "RG da Criança (Documento)")}
            </div>

            <div className="space-y-2">
              <Label>Documento Chinês</Label>
              <Input
                value={recordFields.documentoChines || ""}
                onChange={(e) => updateFieldLocal("documentoChines", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tradução Juramentada</Label>
              <Input
                value={recordFields.traducaoJuramentada || ""}
                onChange={(e) => updateFieldLocal("traducaoJuramentada", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={currentStepData.observacoes || ""}
                onChange={(e) => updateStepData("observacoes", e.target.value)}
                placeholder="Observações sobre os documentos iniciais"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => saveStepData(stepIndex, currentStepData)}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              {stepSaveSuccess[stepIndex] && (
                <span className="text-green-600 text-sm">Salvo!</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={saveRecordFields}>
                <Save className="w-4 h-4 mr-2" />
                Salvar Dados
              </Button>
              {recordFieldsSaved && (
                <span className="text-green-600 text-sm">Salvo!</span>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {renderFileUpload("procuracaoDoc", "Procuração")}
              {renderFileUpload("pedidoPerdaDoc", "Pedido de Perda de Nacionalidade")}
            </div>
            
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={currentStepData.observacoes || ""}
                onChange={(e) => updateStepData("observacoes", e.target.value)}
                placeholder="Observações sobre a procuração e pedido"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => saveStepData(stepIndex, currentStepData)}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              {stepSaveSuccess[stepIndex] && (
                <span className="text-green-600 text-sm">Salvo!</span>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {renderFileUpload("procuracaoAssinadaDoc", "Procuração Assinada")}
              {renderFileUpload("pedidoAssinadoDoc", "Pedido Assinado")}
            </div>
            
            <div className="space-y-2">
              <Label>Data da Coleta de Assinaturas</Label>
              <Input
                type="date"
                value={currentStepData.dataColetaAssinaturas || ""}
                onChange={(e) => updateStepData("dataColetaAssinaturas", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={currentStepData.observacoes || ""}
                onChange={(e) => updateStepData("observacoes", e.target.value)}
                placeholder="Observações sobre a coleta de assinaturas"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => saveStepData(stepIndex, currentStepData)}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              {stepSaveSuccess[stepIndex] && (
                <span className="text-green-600 text-sm">Salvo!</span>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {renderFileUpload("protocoloDoc", "Protocolo no SEI")}
            </div>
            
            <div className="space-y-2">
              <Label>Número do Protocolo</Label>
              <Input
                value={currentStepData.numeroProtocolo || ""}
                onChange={(e) => updateStepData("numeroProtocolo", e.target.value)}
                placeholder="Número do protocolo"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Data de Protocolo</Label>
              <Input
                type="date"
                value={currentStepData.dataProtocolo || ""}
                onChange={(e) => updateStepData("dataProtocolo", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={currentStepData.observacoes || ""}
                onChange={(e) => updateStepData("observacoes", e.target.value)}
                placeholder="Observações sobre o protocolo no SEI"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => saveStepData(stepIndex, currentStepData)}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              {stepSaveSuccess[stepIndex] && (
                <span className="text-green-600 text-sm">Salvo!</span>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {renderFileUpload("comprovanteProtocoladoDoc", "Comprovante de Protocolo")}
              {renderFileUpload("extratoSeiDoc", "Extrato do SEI")}
            </div>
            
            <div className="space-y-2">
              <Label>Data de Confirmação</Label>
              <Input
                type="date"
                value={currentStepData.dataProtocolado || ""}
                onChange={(e) => updateStepData("dataProtocolado", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={currentStepData.observacoes || ""}
                onChange={(e) => updateStepData("observacoes", e.target.value)}
                placeholder="Observações sobre a confirmação do protocolo"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => saveStepData(stepIndex, currentStepData)}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              {stepSaveSuccess[stepIndex] && (
                <span className="text-green-600 text-sm">Salvo!</span>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {renderFileUpload("douDoc", "DOU (Diário Oficial da União)")}
            </div>
            
            <div className="space-y-2">
              <Label>Data de Deferimento</Label>
              <Input
                type="date"
                value={currentStepData.dataDeferimento || ""}
                onChange={(e) => updateStepData("dataDeferimento", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={currentStepData.observacoes || ""}
                onChange={(e) => updateStepData("observacoes", e.target.value)}
                placeholder="Observações sobre o deferimento"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => saveStepData(stepIndex, currentStepData)}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              {stepSaveSuccess[stepIndex] && (
                <span className="text-green-600 text-sm">Salvo!</span>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {renderFileUpload("passaporteChinesDoc", "Passaporte Chinês")}
              {renderFileUpload("portariaDoc", "Portaria")}
            </div>
            
            <div className="space-y-2">
              <Label>Número da Portaria</Label>
              <Input
                value={currentStepData.numeroPortaria || ""}
                onChange={(e) => updateStepData("numeroPortaria", e.target.value)}
                placeholder="Número da portaria (quando disponível)"
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={currentStepData.observacoes || ""}
                onChange={(e) => updateStepData("observacoes", e.target.value)}
                placeholder="Observações sobre passaporte chinês e portaria"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => saveStepData(stepIndex, currentStepData)}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              {stepSaveSuccess[stepIndex] && (
                <span className="text-green-600 text-sm">Salvo!</span>
              )}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {renderFileUpload("manifestoDoc", "Manifesto")}
            </div>
            
            <div className="space-y-2">
              <Label>Data do Manifesto</Label>
              <Input
                type="date"
                value={currentStepData.dataManifesto || ""}
                onChange={(e) => updateStepData("dataManifesto", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={currentStepData.observacoes || ""}
                onChange={(e) => updateStepData("observacoes", e.target.value)}
                placeholder="Observações sobre o manifesto"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => saveStepData(stepIndex, currentStepData)}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              {stepSaveSuccess[stepIndex] && (
                <span className="text-green-600 text-sm">Salvo!</span>
              )}
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {renderFileUpload("protocoloManifestoDoc", "Protocolo do Manifesto no SEI")}
            </div>
            
            <div className="space-y-2">
              <Label>Número do Protocolo</Label>
              <Input
                value={currentStepData.numeroProtocoloManifesto || ""}
                onChange={(e) => updateStepData("numeroProtocoloManifesto", e.target.value)}
                placeholder="Número do protocolo do manifesto"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Data de Protocolo</Label>
              <Input
                type="date"
                value={currentStepData.dataProtocoloManifesto || ""}
                onChange={(e) => updateStepData("dataProtocoloManifesto", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={currentStepData.observacoes || ""}
                onChange={(e) => updateStepData("observacoes", e.target.value)}
                placeholder="Observações sobre o protocolo do manifesto no SEI"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => saveStepData(stepIndex, currentStepData)}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              {stepSaveSuccess[stepIndex] && (
                <span className="text-green-600 text-sm">Salvo!</span>
              )}
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {renderFileUpload("douRatificacaoDoc", "DOU (Diário Oficial da União)")}
            </div>
            
            <div className="space-y-2">
              <Label>Data de Ratificação</Label>
              <Input
                type="date"
                value={currentStepData.dataRatificacao || ""}
                onChange={(e) => updateStepData("dataRatificacao", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={currentStepData.observacoes || ""}
                onChange={(e) => updateStepData("observacoes", e.target.value)}
                placeholder="Observações sobre a ratificação"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => saveStepData(stepIndex, currentStepData)}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              {stepSaveSuccess[stepIndex] && (
                <span className="text-green-600 text-sm">Salvo!</span>
              )}
            </div>
          </div>
        );

      case 10:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {renderFileUpload("documentoFinalizacaoDoc", "Documento de Finalização")}
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={currentStepData.observacoes || ""}
                onChange={(e) => updateStepData("observacoes", e.target.value)}
                placeholder="Observações sobre a finalização do processo"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => saveStepData(stepIndex, currentStepData)}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              {stepSaveSuccess[stepIndex] && (
                <span className="text-green-600 text-sm">Salvo!</span>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center text-muted-foreground">
            Conteúdo da etapa em desenvolvimento
          </div>
        );
    }
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
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
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
          <h1 className="text-2xl font-bold text-gray-900">Caso não encontrado</h1>
          <p className="text-gray-600 mt-2">O caso solicitado não foi encontrado.</p>
          <Link href="/dashboard/perda-nacionalidade">
            <Button className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Perda de Nacionalidade
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`w-full space-y-6 ${dragActive ? 'bg-blue-50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Documento</DialogTitle>
            <DialogDescription>
              Digite o novo nome para o documento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newDocumentName}
              onChange={(e) => setNewDocumentName(e.target.value)}
              placeholder="Nome do documento"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              if (editingDocument) {
                handleRenameDocument(editingDocument, newDocumentName);
                setRenameDialogOpen(false);
              }
            }}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DetailLayout
        backHref="/dashboard/perda-nacionalidade"
        title={caseData?.clientName || "Perda de Nacionalidade"}
        subtitle="Processo de perda de nacionalidade brasileira"
        onDelete={handleDeleteCase}
        left={
          <div className="space-y-4">
            {WORKFLOW_STEPS.map((step, index) => (
              <StepItem
                key={step.id}
                index={step.id}
                title={step.title}
                isCurrent={index === (caseData?.currentStep || 0)}
                isCompleted={index < (caseData?.currentStep || 0)}
                isPending={index > (caseData?.currentStep || 0)}
                expanded={expandedSteps.includes(index)}
                onToggle={() => toggleStep(index)}
                onMarkComplete={async () => {
                  const nextStep = index + 1;
                  try {
                    const r = await fetch(`/api/perda-nacionalidade?id=${params.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ currentStep: nextStep })
                    });
                    if (r.ok) {
                      setCaseData((prev: any) => ({ ...(prev || {}), currentStep: nextStep }));
                    }
                  } catch {}
                }}
                assignment={assignments[index]}
                onSaveAssignment={async ({ responsibleName, dueDate }) => {
                  try {
                    const r = await fetch('/api/step-assignments', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ moduleType: 'perda_nacionalidade', recordId: params.id, stepIndex: index, responsibleName, dueDate })
                    });
                    if (r.ok) {
                      setAssignments(prev => ({ ...prev, [index]: { responsibleName, dueDate } }));
                      return true;
                    }
                  } catch {}
                  return false;
                }}
              >
                {expandedSteps.includes(index) && renderStepContent(index)}
              </StepItem>
            ))}
          </div>
        }
        right={
          <div className="space-y-6">
            <StatusPanel
              status={status}
              onStatusChange={saveStatus}
              currentStep={(caseData?.currentStep ?? 0) + 1}
              totalSteps={WORKFLOW_STEPS.length}
              createdAt={caseData?.createdAt}
              updatedAt={caseData?.updatedAt}
            />

            <DocumentPanel
              onDropFiles={(files) => handleFileUpload(files)}
              uploading={uploading}
              documents={documents}
              loadingDocuments={false}
              isDragOver={dragActive}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDocumentDownload={(doc) => {
                const url = (doc as any).file_path || (doc as any).url;
                if (url && typeof window !== 'undefined') window.open(url, '_blank');
              }}
              onDocumentDelete={(doc) => handleDeleteDocument(String((doc as any).id))}
              editingDocumentId={editingDocument as any}
              editingDocumentName={newDocumentName}
              onDocumentNameChange={(name) => setNewDocumentName(name)}
              onDocumentNameSave={(documentId) => handleRenameDocument(documentId as any, newDocumentName)}
              onDocumentNameKeyPress={(e, documentId) => {
                if (e.key === 'Enter') {
                  handleRenameDocument(documentId as any, newDocumentName);
                } else if (e.key === 'Escape') {
                  setEditingDocument(null);
                  setNewDocumentName('');
                }
              }}
              onDocumentDoubleClick={(doc) => {
                setEditingDocument(String((doc as any).id));
                setNewDocumentName((doc as any).document_name || (doc as any).file_name || (doc as any).name || '');
              }}
            />

            {/* Notes Panel */}
            <NotesPanel
              notes={notes}
              onChange={setNotes}
              onSave={saveNotes}
            />
          </div>
        }
      />
    </div>
  );
}
