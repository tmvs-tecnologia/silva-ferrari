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
    "Análise de Elegibilidade",
    "Preparação da Documentação",
    "Agendamento no Consulado",
    "Entrevista Consular",
    "Aguardar Resultado",
    "Retirada do Visto",
    "Processo Finalizado"
  ],
  "Visto de Turismo": [
    "Cadastro de Documentos",
    "Verificação de Requisitos",
    "Preparação da Documentação",
    "Agendamento no Consulado",
    "Entrevista Consular",
    "Aguardar Resultado",
    "Retirada do Visto",
    "Processo Finalizado"
  ],
  "Visto de Estudante": [
    "Cadastro de Documentos",
    "Verificação de Aceitação Acadêmica",
    "Preparação da Documentação",
    "Comprovação Financeira",
    "Agendamento no Consulado",
    "Entrevista Consular",
    "Aguardar Resultado",
    "Retirada do Visto",
    "Processo Finalizado"
  ],
  "Visto de Reunião Familiar": [
    "Cadastro de Documentos",
    "Verificação de Vínculo Familiar",
    "Preparação da Documentação",
    "Comprovação de Relacionamento",
    "Agendamento no Consulado",
    "Entrevista Consular",
    "Aguardar Resultado",
    "Retirada do Visto",
    "Processo Finalizado"
  ]
};

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
}

export default function VistoDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<{ [key: number]: string }>({});
  const [status, setStatus] = useState("");
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
      // Simulando dados do caso
      const mockData: CaseData = {
        id: params.id as string,
        title: `Visto ${params.id}`,
        type: "Visto de Trabalho",
        status: "Em Andamento",
        createdAt: "2024-01-15",
        updatedAt: "2024-01-20",
        clientName: "Cliente Exemplo",
        description: "Processo de visto de trabalho",
        steps: WORKFLOWS["Visto de Trabalho"].map((title, index) => ({
          id: index,
          title,
          description: `Descrição da etapa ${title}`,
          completed: index < 2,
          completedAt: index < 2 ? "2024-01-20" : undefined,
          notes: ""
        }))
      };
      
      setCaseData(mockData);
      setStatus(mockData.status);
      
      // Inicializar notas
      const initialNotes: { [key: number]: string } = {};
      mockData.steps.forEach(step => {
        initialNotes[step.id] = step.notes || "";
      });
      setNotes(initialNotes);
      
    } catch (error) {
      console.error("Erro ao buscar dados do caso:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      // Simulando documentos
      const mockDocuments: Document[] = [
        {
          id: "1",
          name: "Passaporte.pdf",
          type: "application/pdf",
          size: 1024000,
          uploadedAt: "2024-01-15",
          url: "/documents/passaporte.pdf",
          stepId: 0
        }
      ];
      setDocuments(mockDocuments);
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
      setDocuments(prev => prev.filter(doc => doc.id !== documentToDelete.id));
      setShowDeleteDialog(false);
      setDocumentToDelete(null);
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
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === editingDocument.id 
            ? { ...doc, name: newDocumentName.trim() }
            : doc
        )
      );
      setShowEditDialog(false);
      setEditingDocument(null);
      setNewDocumentName("");
    } catch (error) {
      console.error("Erro ao renomear documento:", error);
    }
  };

  const handleFileUpload = async (files: FileList | null, stepId?: number) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const uploadKey = stepId !== undefined ? `step-${stepId}` : 'general';
    
    setUploadingFiles(prev => ({ ...prev, [uploadKey]: true }));

    try {
      // Simulando upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newDocument: Document = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        url: URL.createObjectURL(file),
        stepId
      };

      setDocuments(prev => [...prev, newDocument]);
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
      // Simulando upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newDocument: Document = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        url: URL.createObjectURL(file),
        stepId
      };

      setDocuments(prev => [...prev, newDocument]);
      setFileUploads(prev => ({ ...prev, [uploadKey]: null }));
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
    } finally {
      setUploadingFiles(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

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
      
      return {
        ...prev,
        steps: prev.steps.map(step => 
          step.id === stepId 
            ? { 
                ...step, 
                completed: !step.completed,
                completedAt: !step.completed ? new Date().toISOString() : undefined
              }
            : step
        )
      };
    });
  };

  const saveStepData = (stepId: number, data: any) => {
    setStepData(prev => ({
      ...prev,
      [stepId]: { ...prev[stepId], ...data }
    }));
  };

  const saveStepNotes = (stepId: number) => {
    if (!caseData) return;
    
    setCaseData(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        steps: prev.steps.map(step => 
          step.id === stepId 
            ? { ...step, notes: notes[stepId] }
            : step
        )
      };
    });
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    if (caseData) {
      setCaseData(prev => prev ? { ...prev, status: newStatus } : prev);
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
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`passaporte-${stepId}`}>Número do Passaporte</Label>
                <Input
                  id={`passaporte-${stepId}`}
                  value={currentStepData.passaporte || ""}
                  onChange={(e) => saveStepData(stepId, { passaporte: e.target.value })}
                  placeholder="Digite o número do passaporte"
                />
              </div>
              <div>
                <Label htmlFor={`nome-completo-${stepId}`}>Nome Completo</Label>
                <Input
                  id={`nome-completo-${stepId}`}
                  value={currentStepData.nomeCompleto || ""}
                  onChange={(e) => saveStepData(stepId, { nomeCompleto: e.target.value })}
                  placeholder="Nome completo do requerente"
                />
              </div>
              <div>
                <Label htmlFor={`cpf-${stepId}`}>CPF</Label>
                <Input
                  id={`cpf-${stepId}`}
                  value={currentStepData.cpf || ""}
                  onChange={(e) => saveStepData(stepId, { cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <Label htmlFor={`empresa-${stepId}`}>Empresa Contratante</Label>
                <Input
                  id={`empresa-${stepId}`}
                  value={currentStepData.empresa || ""}
                  onChange={(e) => saveStepData(stepId, { empresa: e.target.value })}
                  placeholder="Nome da empresa"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Documentos Necessários:</h4>
              
              {[
                { key: 'passaporte-doc', label: 'Passaporte' },
                { key: 'foto', label: 'Foto 3x4' },
                { key: 'certidao-nascimento', label: 'Certidão de Nascimento' },
                { key: 'comprovante-endereco', label: 'Comprovante de Endereço' },
                { key: 'carta-empresa', label: 'Carta da Empresa' },
                { key: 'contrato-trabalho', label: 'Contrato de Trabalho' }
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
                </div>
              ))}
            </div>

            <Button onClick={() => saveStepData(stepId, currentStepData)} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Salvar Dados
            </Button>
          </div>
        );

      case 1: // Análise de Elegibilidade
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor={`elegibilidade-${stepId}`}>Status de Elegibilidade</Label>
                <Select
                  value={currentStepData.elegibilidade || ""}
                  onValueChange={(value) => saveStepData(stepId, { elegibilidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elegivel">Elegível</SelectItem>
                    <SelectItem value="nao-elegivel">Não Elegível</SelectItem>
                    <SelectItem value="pendente">Pendente de Análise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor={`observacoes-elegibilidade-${stepId}`}>Observações da Análise</Label>
                <Textarea
                  id={`observacoes-elegibilidade-${stepId}`}
                  value={currentStepData.observacoesElegibilidade || ""}
                  onChange={(e) => saveStepData(stepId, { observacoesElegibilidade: e.target.value })}
                  placeholder="Observações sobre a elegibilidade do candidato"
                  rows={4}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Documentos de Análise:</h4>
              
              {[
                { key: 'relatorio-elegibilidade', label: 'Relatório de Elegibilidade' },
                { key: 'documentos-adicionais', label: 'Documentos Adicionais' }
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
                </div>
              ))}
            </div>

            <Button onClick={() => saveStepData(stepId, currentStepData)} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Salvar Análise
            </Button>
          </div>
        );

      case 2: // Preparação da Documentação
        return (
          <div className="space-y-4">
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
                </div>
              ))}
            </div>

            <Button onClick={() => saveStepData(stepId, currentStepData)} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Salvar Preparação
            </Button>
          </div>
        );

      case 3: // Agendamento no Consulado
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor={`horario-agendamento-${stepId}`}>Horário</Label>
                <Input
                  id={`horario-agendamento-${stepId}`}
                  type="time"
                  value={currentStepData.horarioAgendamento || ""}
                  onChange={(e) => saveStepData(stepId, { horarioAgendamento: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor={`consulado-${stepId}`}>Consulado</Label>
                <Input
                  id={`consulado-${stepId}`}
                  value={currentStepData.consulado || ""}
                  onChange={(e) => saveStepData(stepId, { consulado: e.target.value })}
                  placeholder="Nome do consulado"
                />
              </div>
              <div>
                <Label htmlFor={`numero-agendamento-${stepId}`}>Número do Agendamento</Label>
                <Input
                  id={`numero-agendamento-${stepId}`}
                  value={currentStepData.numeroAgendamento || ""}
                  onChange={(e) => saveStepData(stepId, { numeroAgendamento: e.target.value })}
                  placeholder="Número de confirmação"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Comprovantes:</h4>
              
              {[
                { key: 'comprovante-agendamento', label: 'Comprovante de Agendamento' },
                { key: 'instrucoes-consulado', label: 'Instruções do Consulado' }
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
                </div>
              ))}
            </div>

            <Button onClick={() => saveStepData(stepId, currentStepData)} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Salvar Agendamento
            </Button>
          </div>
        );

      case 4: // Entrevista Consular
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`data-entrevista-${stepId}`}>Data da Entrevista</Label>
                <Input
                  id={`data-entrevista-${stepId}`}
                  type="date"
                  value={currentStepData.dataEntrevista || ""}
                  onChange={(e) => saveStepData(stepId, { dataEntrevista: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor={`resultado-entrevista-${stepId}`}>Resultado da Entrevista</Label>
                <Select
                  value={currentStepData.resultadoEntrevista || ""}
                  onValueChange={(value) => saveStepData(stepId, { resultadoEntrevista: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o resultado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="negado">Negado</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor={`observacoes-entrevista-${stepId}`}>Observações da Entrevista</Label>
              <Textarea
                id={`observacoes-entrevista-${stepId}`}
                value={currentStepData.observacoesEntrevista || ""}
                onChange={(e) => saveStepData(stepId, { observacoesEntrevista: e.target.value })}
                placeholder="Observações sobre a entrevista"
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Documentos da Entrevista:</h4>
              
              {[
                { key: 'protocolo-entrevista', label: 'Protocolo da Entrevista' },
                { key: 'documentos-adicionais-entrevista', label: 'Documentos Adicionais Solicitados' }
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
                </div>
              ))}
            </div>

            <Button onClick={() => saveStepData(stepId, currentStepData)} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Salvar Entrevista
            </Button>
          </div>
        );

      case 5: // Aguardar Resultado
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`data-resultado-${stepId}`}>Data do Resultado</Label>
                <Input
                  id={`data-resultado-${stepId}`}
                  type="date"
                  value={currentStepData.dataResultado || ""}
                  onChange={(e) => saveStepData(stepId, { dataResultado: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor={`status-resultado-${stepId}`}>Status do Resultado</Label>
                <Select
                  value={currentStepData.statusResultado || ""}
                  onValueChange={(value) => saveStepData(stepId, { statusResultado: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="negado">Negado</SelectItem>
                    <SelectItem value="aguardando">Aguardando</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Documentos do Resultado:</h4>
              
              {[
                { key: 'resultado-oficial', label: 'Resultado Oficial' },
                { key: 'instrucoes-retirada', label: 'Instruções para Retirada' }
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
                </div>
              ))}
            </div>

            <Button onClick={() => saveStepData(stepId, currentStepData)} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Salvar Resultado
            </Button>
          </div>
        );

      case 6: // Retirada do Visto
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`data-retirada-${stepId}`}>Data da Retirada</Label>
                <Input
                  id={`data-retirada-${stepId}`}
                  type="date"
                  value={currentStepData.dataRetirada || ""}
                  onChange={(e) => saveStepData(stepId, { dataRetirada: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor={`numero-visto-${stepId}`}>Número do Visto</Label>
                <Input
                  id={`numero-visto-${stepId}`}
                  value={currentStepData.numeroVisto || ""}
                  onChange={(e) => saveStepData(stepId, { numeroVisto: e.target.value })}
                  placeholder="Número do visto emitido"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Documentos da Retirada:</h4>
              
              {[
                { key: 'visto-emitido', label: 'Visto Emitido' },
                { key: 'passaporte-visto', label: 'Passaporte com Visto' },
                { key: 'comprovante-retirada', label: 'Comprovante de Retirada' }
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
                </div>
              ))}
            </div>

            <Button onClick={() => saveStepData(stepId, currentStepData)} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Salvar Retirada
            </Button>
          </div>
        );

      case 7: // Processo Finalizado
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

            <div className="space-y-3">
              <h4 className="font-medium">Documentos Finais:</h4>
              
              {[
                { key: 'processo-finalizado', label: 'Documentos do Processo Finalizado' },
                { key: 'relatorio-final', label: 'Relatório Final' }
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
    // Similar structure to Visto de Trabalho but with tourism-specific fields
    return renderDefaultStepContent(step);
  };

  const renderVistoEstudanteStepContent = (step: StepData) => {
    // Similar structure to Visto de Trabalho but with student-specific fields
    return renderDefaultStepContent(step);
  };

  const renderVistoReuniaoFamiliarStepContent = (step: StepData) => {
    // Similar structure to Visto de Trabalho but with family reunion-specific fields
    return renderDefaultStepContent(step);
  };

  const renderDefaultStepContent = (step: StepData) => {
    const stepId = step.id;
    
    return (
      <div className="space-y-4">
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
        </div>

        <Button onClick={() => saveStepNotes(stepId)} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Salvar Observações
        </Button>
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
    const completedSteps = caseData.steps.filter(step => step.completed).length;
    return Math.min(completedSteps, caseData.steps.length - 1);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="w-full p-6 space-y-6">
      <DetailLayout
        backHref="/dashboard/vistos"
        title={caseData.title}
        subtitle={caseData.clientName}
        onDelete={handleDeleteCase}
        left={
          <div className="space-y-6">
            {/* Case Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Informações do Caso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="case-type">Tipo de Visto</Label>
                    <Select value={caseData.type} onValueChange={(value) => setCaseData(prev => prev ? { ...prev, type: value } : prev)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(WORKFLOWS).map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="case-status">Status</Label>
                    <Select value={status} onValueChange={handleStatusChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Concluído">Concluído</SelectItem>
                        <SelectItem value="Pausado">Pausado</SelectItem>
                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="case-description">Descrição</Label>
                  <Textarea
                    id="case-description"
                    value={caseData.description}
                    onChange={(e) => setCaseData(prev => prev ? { ...prev, description: e.target.value } : prev)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Workflow Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Fluxo de Trabalho - {caseData.type}
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
                    assignment={assignments[index]}
                    onSaveAssignment={(a) => handleSaveAssignment(index, a.responsibleName, a.dueDate)}
                  >
                    {renderStepContent(step)}
                  </StepItem>
                ))}
              </CardContent>
            </Card>
          </div>
        }
        right={
          <div className="space-y-6">
            <StatusPanel
              status={status}
              onStatusChange={handleStatusChange}
              currentStep={currentStepIndex + 1}
              totalSteps={caseData.steps.length}
              createdAt={caseData.createdAt}
              updatedAt={caseData.updatedAt}
            />

            <DocumentPanel
              onDropFiles={(files) => handleFileUpload(files)}
              uploading={uploadingFiles['general'] || false}
            />

            <NotesPanel
              notes={notes[currentStepIndex] || ""}
              onChange={(value) => setNotes(prev => ({ ...prev, [currentStepIndex]: value }))}
              onSave={() => saveStepNotes(currentStepIndex)}
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