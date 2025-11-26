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
  {
    id: 1,
    title: "Cadastro dos Documentos",
    description: "Informações iniciais do requerente",
  },
  {
    id: 2,
    title: "Fazer Procuração e Pedido de Perda",
    description: "Elaboração de documentos legais",
  },
  {
    id: 3,
    title: "Enviar Procuração e Pedido - Cobrar Assinaturas",
    description: "Coleta de assinaturas necessárias",
  },
  {
    id: 4,
    title: "Protocolar com Procuração e Acordo Assinados",
    description: "Protocolo no cartório",
  },
  {
    id: 5,
    title: "Exigências do Juiz",
    description: "Atendimento a exigências judiciais",
  },
  {
    id: 6,
    title: "Processo Deferido - Enviar DOU e Solicitar Passaporte Chinês",
    description: "Documentação final e solicitações",
  },
  {
    id: 7,
    title: "Protocolar Exigência com Passaporte Chinês - Aguardar Portaria",
    description: "Protocolo de exigências finais",
  },
  {
    id: 8,
    title: "Processo Ratificado (Finalizado)",
    description: "Finalização do processo",
  },
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

  useEffect(() => {
    fetchCaseData();
    fetchDocuments();
  }, [params.id]);

  const fetchCaseData = async () => {
    try {
      const response = await fetch(`/api/perda-nacionalidade/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCaseData(data);
        setNotes(data.notes || "");
        setStatus(data.status || "");
        setCompletedSteps(data.completedSteps || []);
        setStepData(data.stepData || {});
        setStepNotes(data.stepNotes || {});
      }
    } catch (error) {
      console.error("Erro ao buscar dados do caso:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/documents?moduleType=perda_nacionalidade&recordId=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar documentos:", error);
    }
  };

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

  const handleFileUpload = async (files: FileList, step?: number, field?: string) => {
    if (!files.length) return;

    setUploading(true);
    if (field) setUploadingField(field);

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });
    // Use general upload route
    const file = files[0];
    const fd = new FormData();
    fd.append('file', file);
    fd.append('caseId', String(params.id));
    fd.append('moduleType', 'perda_nacionalidade');
    fd.append('fieldName', field || 'documentoAnexado');
    fd.append('clientName', caseData?.clientName || 'Cliente');

    try {
      const response = await fetch('/api/documents/upload', { method: 'POST', body: fd });
      if (response.ok) {
        await fetchDocuments();
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
    } finally {
      setUploading(false);
      setUploadingField(null);
    }
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
      await fetch(`/api/perda-nacionalidade?id=${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stepData: newStepData }),
      });
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
      const response = await fetch(`/api/perda-nacionalidade/${params.id}`, {
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
      const newData = { ...currentStepData, [field]: value };
      saveStepData(stepIndex, newData);
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
        {currentStepData[fieldName] && (
          <div className="text-sm text-green-600">✓ Arquivo enviado</div>
        )}
      </div>
    );

    switch (stepIndex) {
      case 0: // Cadastro dos Documentos
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>RNM</Label>
                <Input
                  value={currentStepData.rnm || ""}
                  onChange={(e) => updateStepData("rnm", e.target.value)}
                  placeholder="Número do RNM"
                />
              </div>
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={currentStepData.nomeCompleto || ""}
                  onChange={(e) => updateStepData("nomeCompleto", e.target.value)}
                  placeholder="Nome completo do requerente"
                />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input
                  value={currentStepData.cpf || ""}
                  onChange={(e) => updateStepData("cpf", e.target.value)}
                  placeholder="CPF do requerente"
                />
              </div>
              <div className="space-y-2">
                <Label>Nacionalidade Atual</Label>
                <Input
                  value={currentStepData.nacionalidadeAtual || ""}
                  onChange={(e) => updateStepData("nacionalidadeAtual", e.target.value)}
                  placeholder="Nacionalidade atual"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderFileUpload("rnmDoc", "RNM (Documento)")}
              {renderFileUpload("passaporte", "Passaporte")}
              {renderFileUpload("certidaoNascimento", "Certidão de Nascimento")}
              {renderFileUpload("comprovanteEndereco", "Comprovante de Endereço")}
            </div>

            <Button onClick={() => saveStepData(stepIndex, currentStepData)}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Dados
            </Button>
          </div>
        );

      case 1: // Fazer Procuração e Pedido de Perda
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {renderFileUpload("procuracao", "Procuração")}
              {renderFileUpload("pedidoPerda", "Pedido de Perda de Nacionalidade")}
            </div>
            
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={currentStepData.observacoes || ""}
                onChange={(e) => updateStepData("observacoes", e.target.value)}
                placeholder="Observações sobre a procuração e pedido"
              />
            </div>

            <Button onClick={() => saveStepData(stepIndex, currentStepData)}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        );

      case 2: // Enviar Procuração e Pedido - Cobrar Assinaturas
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {renderFileUpload("procuracaoAssinada", "Procuração Assinada")}
              {renderFileUpload("pedidoAssinado", "Pedido Assinado")}
            </div>
            
            <div className="space-y-2">
              <Label>Data de Envio</Label>
              <Input
                type="date"
                value={currentStepData.dataEnvio || ""}
                onChange={(e) => updateStepData("dataEnvio", e.target.value)}
              />
            </div>

            <Button onClick={() => saveStepData(stepIndex, currentStepData)}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        );

      case 3: // Protocolar com Procuração e Acordo Assinados
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {renderFileUpload("protocoloProcesso", "Protocolo do Processo")}
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

            <Button onClick={() => saveStepData(stepIndex, currentStepData)}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        );

      case 4: // Exigências do Juiz
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {renderFileUpload("exigenciasJuiz", "Exigências do Juiz")}
              {renderFileUpload("respostaExigencias", "Resposta às Exigências")}
            </div>
            
            <div className="space-y-2">
              <Label>Descrição das Exigências</Label>
              <Textarea
                value={currentStepData.descricaoExigencias || ""}
                onChange={(e) => updateStepData("descricaoExigencias", e.target.value)}
                placeholder="Descreva as exigências do juiz"
              />
            </div>

            <Button onClick={() => saveStepData(stepIndex, currentStepData)}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        );

      case 5: // Processo Deferido - Enviar DOU e Solicitar Passaporte Chinês
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {renderFileUpload("dou", "DOU (Diário Oficial da União)")}
              {renderFileUpload("solicitacaoPassaporte", "Solicitação de Passaporte Chinês")}
            </div>
            
            <div className="space-y-2">
              <Label>Data de Deferimento</Label>
              <Input
                type="date"
                value={currentStepData.dataDeferimento || ""}
                onChange={(e) => updateStepData("dataDeferimento", e.target.value)}
              />
            </div>

            <Button onClick={() => saveStepData(stepIndex, currentStepData)}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        );

      case 6: // Protocolar Exigência com Passaporte Chinês - Aguardar Portaria
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {renderFileUpload("passaporteChinês", "Passaporte Chinês")}
              {renderFileUpload("protocoloExigencia", "Protocolo da Exigência")}
            </div>
            
            <div className="space-y-2">
              <Label>Número da Portaria</Label>
              <Input
                value={currentStepData.numeroPortaria || ""}
                onChange={(e) => updateStepData("numeroPortaria", e.target.value)}
                placeholder="Número da portaria (quando disponível)"
              />
            </div>

            <Button onClick={() => saveStepData(stepIndex, currentStepData)}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        );

      case 7: // Processo Ratificado (Finalizado)
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {renderFileUpload("documentosFinais", "Documentos Finais")}
              {renderFileUpload("processoFinalizado", "Processo Finalizado")}
            </div>
            
            <div className="space-y-2">
              <Label>Data de Finalização</Label>
              <Input
                type="date"
                value={currentStepData.dataFinalizacao || ""}
                onChange={(e) => updateStepData("dataFinalizacao", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Observações Finais</Label>
              <Textarea
                value={currentStepData.observacoesFinais || ""}
                onChange={(e) => updateStepData("observacoesFinais", e.target.value)}
                placeholder="Observações sobre a finalização do processo"
              />
            </div>

            <Button onClick={() => saveStepData(stepIndex, currentStepData)}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
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
        title={caseData?.title || "Perda de Nacionalidade"}
        subtitle="Processo de perda de nacionalidade brasileira"
        onDelete={handleDeleteCase}
        left={
          <div className="space-y-4">
            {WORKFLOW_STEPS.map((step, index) => (
              <StepItem
                key={step.id}
                index={step.id}
                title={step.title}
                description={step.description}
                isCurrent={false}
                isCompleted={completedSteps.includes(index)}
                isPending={false}
                expanded={expandedSteps.includes(index)}
                onToggle={() => toggleStep(index)}
                onMarkComplete={() => {
                  toggleStepCompletion(index);
                  const newSteps = completedSteps.includes(index)
                    ? completedSteps.filter(i => i !== index)
                    : [...completedSteps, index];
                  fetch(`/api/perda-nacionalidade/${params.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ completedSteps: newSteps }),
                  }).catch(() => {});
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
              currentStep={completedSteps.length}
              totalSteps={WORKFLOW_STEPS.length}
              createdAt={caseData?.createdAt}
              updatedAt={caseData?.updatedAt}
            />

            {/* Document Panel */}
            <DocumentPanel
              onDropFiles={(files) => {
                // Handle file drop functionality
                handleFileUpload(files);
              }}
              uploading={uploading}
            />

            {/* Documents List */}
            {documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Documentos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {editingDocument === doc.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={newDocumentName}
                              onChange={(e) => setNewDocumentName(e.target.value)}
                              className="h-8"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => handleRenameDocument(doc.id, newDocumentName)}
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingDocument(null);
                                setNewDocumentName("");
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm truncate">{doc.name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingDocument(doc.id);
                            setNewDocumentName(doc.name);
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

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
