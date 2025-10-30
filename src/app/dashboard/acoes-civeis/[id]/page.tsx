"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, Circle, Save, Trash2, FileUp, ChevronDown, ChevronUp, Upload, FileText, Download, Edit2 } from "lucide-react";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Workflow steps for each case type
const WORKFLOWS = {
  "Exame DNA": [
    "Cadastro dos Documentos",
    "Agendar Exame de DNA",
    "Aguardar Resultado e Fazer Procuração (JAILDA → MARRONE)",
    "Petição de Declaração de Paternidade (WENDEL/GUILHERME/FÁBIO)",
    "Protocolar Processo (WENDEL/GUILHERME/FÁBIO)",
    "Exigências do Juiz",
    "Processo Finalizado",
  ],
  "Alteração de Nome": [
    "Cadastro dos Documentos",
    "Fazer Procuração (WENDEL/GUILHERME/FÁBIO)",
    "Enviar Procuração (JESSICA → JAILDA)",
    "Petição (WENDEL/GUILHERME/FÁBIO)",
    "Protocolar Processo (WENDEL/GUILHERME/FÁBIO)",
    "Exigências do Juiz",
    "Processo Finalizado",
  ],
  "Guarda": [
    "Cadastro dos Documentos",
    "Fazer Procuração (WENDEL/GUILHERME/FÁBIO)",
    "Enviar Procuração (JESSICA → JAILDA)",
    "Procuração e Acordo Assinados (WENDEL/GUILHERME/FÁBIO)",
    "Verificar se há Petição",
    "Protocolar Processo (WENDEL/GUILHERME/FÁBIO)",
    "Exigências do Juiz",
    "Processo Finalizado",
  ],
  "Acordos de Guarda": [
    "Cadastro dos Documentos",
    "Fazer a Procuração e o Acordo de Guarda (WENDEL/GUILHERME/FÁBIO)",
    "Enviar a procuração e o acordo de guarda e cobrar as assinaturas (JESSICA → JAILDA → MARRONE)",
    "Com a Procuração e o Acordo assinados, seguir com a Petição (WENDEL/GUILHERME/FÁBIO)",
    "Verificar se há Petição",
    "Protocolar Processo (WENDEL/GUILHERME/FÁBIO)",
    "Exigências do Juiz",
    "Processo Finalizado",
  ],
  "Divórcio Consensual": [
    "Cadastro dos Documentos",
    "Petição Conjunta",
    "Termo de Partilhas",
    "Guarda (se tiver filhos)",
    "Procuração",
    "Processo Finalizado",
  ],
  "Divórcio Litígio": [
    "Cadastro dos Documentos",
    "Petição Cliente",
    "Procuração Cliente",
    "Custas",
    "Processo Finalizado",
  ],
  "Usucapião": [
    "Petição Inicial",
    "Matrícula do Imóvel / Transcrição",
    "Água / Luz / IPTU",
    "Exigências",
    "Processo Finalizado",
  ],
};

export default function AcaoCivelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Em Andamento");
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState("");
  const [pendingStep, setPendingStep] = useState(0);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<any>(null);
  const [deletingDocument, setDeletingDocument] = useState(false);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  
  // Document editing states
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editingDocumentName, setEditingDocumentName] = useState("");
  
  // Step data states
  const [stepData, setStepData] = useState({
    // Step 0 - Documents
    rnmMae: "",
    rnmMaeFile: "",
    nomeMae: "",
    rnmPai: "",
    rnmPaiFile: "",
    nomePaiRegistral: "",
    rnmSupostoPai: "",
    rnmSupostoPaiFile: "",
    nomeSupostoPai: "",
    cpfMae: "",
    cpfPai: "",
    certidaoNascimento: "",
    certidaoNascimentoFile: "",
    comprovanteEndereco: "",
    comprovanteEnderecoFile: "",
    passaporte: "",
    passaporteFile: "",
    guiaPaga: "",
    guiaPagaFile: "",
    // Step 1 - DNA Exam Date
    dataExameDna: "",
    resultadoExameDna: "",
    resultadoExameDnaFile: "",
    // Step 2 - Procuração
    procuracaoAnexada: "",
    procuracaoAnexadaFile: "",
    // Step 3 - Petição
    peticaoAnexada: "",
    peticaoAnexadaFile: "",
    // Step 4 - Process Protocol
    processoAnexado: "",
    numeroProtocolo: "",
    processoAnexadoFile: "",
    // Step 5 - Final Documents
    documentosFinaisAnexados: "",
    documentosFinaisAnexadosFile: "",
    // Step 6 - Process Completed
    documentosProcessoFinalizado: "",
    documentosProcessoFinalizadoFile: "",
  });

  useEffect(() => {
    fetchCase();
    fetchDocuments();
  }, [params.id]);

  const fetchCase = async () => {
    try {
      const response = await fetch(`/api/acoes-civeis?id=${params.id}`);
      const data = await response.json();
      setCaseData(data);
      setNotes(data.notes || "");
      setStatus(data.status);
      
      // Populate step data from database
      setStepData({
        rnmMae: data.rnmMae || "",
        rnmMaeFile: data.rnmMaeFile || "",
        nomeMae: data.nomeMae || "",
        rnmPai: data.rnmPai || "",
        rnmPaiFile: data.rnmPaiFile || "",
        nomePaiRegistral: data.nomePaiRegistral || "",
        rnmSupostoPai: data.rnmSupostoPai || "",
        rnmSupostoPaiFile: data.rnmSupostoPaiFile || "",
        nomeSupostoPai: data.nomeSupostoPai || "",
        cpfMae: data.cpfMae || "",
        cpfPai: data.cpfPai || "",
        certidaoNascimento: data.certidaoNascimento || "",
        certidaoNascimentoFile: data.certidaoNascimentoFile || "",
        comprovanteEndereco: data.comprovanteEndereco || "",
        comprovanteEnderecoFile: data.comprovanteEnderecoFile || "",
        passaporte: data.passaporte || "",
        passaporteFile: data.passaporteFile || "",
        guiaPaga: data.guiaPaga || "",
        guiaPagaFile: data.guiaPagaFile || "",
        dataExameDna: data.dataExameDna || "",
        resultadoExameDna: data.resultadoExameDna || "",
        resultadoExameDnaFile: data.resultadoExameDnaFile || "",
        procuracaoAnexada: data.procuracaoAnexada || "",
        procuracaoAnexadaFile: data.procuracaoAnexadaFile || "",
        peticaoAnexada: data.peticaoAnexada || "",
        peticaoAnexadaFile: data.peticaoAnexadaFile || "",
        processoAnexado: data.processoAnexado || "",
        numeroProtocolo: data.numeroProtocolo || "",
        processoAnexadoFile: data.processoAnexadoFile || "",
        documentosFinaisAnexados: data.documentosFinaisAnexados || "",
        documentosFinaisAnexadosFile: data.documentosFinaisAnexadosFile || "",
        documentosProcessoFinalizado: data.documentosProcessoFinalizado || "",
        documentosProcessoFinalizadoFile: data.documentosProcessoFinalizadoFile || "",
      });
    } catch (error) {
      console.error("Error fetching case:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const response = await fetch(`/api/documents/${params.id}?moduleType=acoes_civeis`);
      const data = await response.json();
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    try {
      setDeletingDocument(true);
      const response = await fetch(`/api/documents/delete/${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove document from state
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        setDeleteDialogOpen(false);
        setDocumentToDelete(null);
      } else {
        console.error('Erro ao excluir documento');
      }
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
    } finally {
      setDeletingDocument(false);
    }
  };

  const handleDocumentDoubleClick = (doc: any) => {
    setEditingDocumentId(doc.id);
    setEditingDocumentName(doc.document_name || doc.file_name);
  };

  const handleDocumentNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingDocumentName(e.target.value);
  };

  const handleDocumentNameSave = async (documentId: string) => {
    if (!editingDocumentName.trim()) {
      setEditingDocumentId(null);
      setEditingDocumentName("");
      return;
    }

    try {
      const response = await fetch(`/api/documents/rename/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_name: editingDocumentName.trim() }),
      });

      if (response.ok) {
        // Update document in state
        setDocuments(prev => prev.map(doc => 
          doc.id === parseInt(documentId) 
            ? { ...doc, document_name: editingDocumentName.trim() }
            : doc
        ));
        setEditingDocumentId(null);
        setEditingDocumentName("");
      } else {
        console.error('Erro ao renomear documento');
        alert('Erro ao renomear documento');
      }
    } catch (error) {
      console.error('Erro ao renomear documento:', error);
      alert('Erro ao renomear documento');
    }
  };

  const handleDocumentNameCancel = () => {
    setEditingDocumentId(null);
    setEditingDocumentName("");
  };

  const handleDocumentNameKeyPress = (e: React.KeyboardEvent, documentId: string) => {
    if (e.key === 'Enter') {
      handleDocumentNameSave(documentId);
    } else if (e.key === 'Escape') {
      handleDocumentNameCancel();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    for (const file of files) {
      await uploadDroppedFile(file);
    }
  };

  const uploadDroppedFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("caseId", params.id as string);
    formData.append("fieldName", "documentoAnexado");

    try {
      setUploadingFile(true);
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        // Refresh documents list
        await fetchDocuments();
        alert("✅ Arquivo enviado com sucesso!");
      } else {
        const data = await response.json();
        console.error('Erro ao fazer upload do arquivo:', data);
        alert(
          `❌ Erro ao enviar arquivo:\n\n${data.error}\n\n${
            data.details ? `Detalhes: ${data.details}\n\n` : ""
          }${
            data.hint
              ? `💡 ${data.hint}\n\nConsulte o arquivo SUPABASE_STORAGE_POLICIES.md para configurar as políticas RLS do bucket.`
              : ""
          }`
        );
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert(
        "❌ Erro ao enviar arquivo. Verifique:\n\n" +
        "1. Se o bucket 'juridico-documentos' existe no Supabase Storage\n" +
        "2. Se as políticas RLS estão configuradas (consulte SUPABASE_STORAGE_POLICIES.md)\n" +
        "3. Se as variáveis de ambiente estão corretas no arquivo .env\n\n" +
        "Erro: " + (error as Error).message
      );
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFields(prev => ({ ...prev, [fieldName]: true }));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("caseId", params.id as string);
    formData.append("fieldName", fieldName);

    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Update stepData with the file URL
        setStepData(prev => ({ ...prev, [fieldName]: data.fileName }));
        
        // Save to database immediately after upload
        await fetch(`/api/acoes-civeis?id=${params.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [fieldName]: data.fileName }),
        });
        
        alert("✅ Arquivo enviado e salvo com sucesso!");
        await fetchCase(); // Refresh data
        await fetchDocuments(); // Refresh documents list
      } else {
        console.error("Erro no upload:", data);
        alert(
          `❌ Erro ao enviar arquivo:\n\n${data.error}\n\n${
            data.details ? `Detalhes: ${data.details}\n\n` : ""
          }${
            data.hint
              ? `💡 ${data.hint}\n\nConsulte o arquivo SUPABASE_STORAGE_POLICIES.md para configurar as políticas RLS do bucket.`
              : ""
          }`
        );
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(
        "❌ Erro ao enviar arquivo. Verifique:\n\n" +
        "1. Se o bucket 'juridico-documentos' existe no Supabase Storage\n" +
        "2. Se as políticas RLS estão configuradas (consulte SUPABASE_STORAGE_POLICIES.md)\n" +
        "3. Se as variáveis de ambiente estão corretas no arquivo .env\n\n" +
        "Erro: " + (error as Error).message
      );
    } finally {
      setUploadingFields(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleStepClick = async (stepIndex: number) => {
    // Se está fechando o passo (expandedStep === stepIndex), salvar dados primeiro
    if (expandedStep === stepIndex) {
      await handleSaveStepData(stepIndex, true); // true = silencioso, sem alert
      setExpandedStep(null);
    } else {
      setExpandedStep(stepIndex);
    }
  };

  const handleCompleteStep = async (stepIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Enviar notificação via WhatsApp para os passos 1, 2, 3, 4, 5 e 6 (índices 0, 1, 2, 3, 4 e 5)
    if (stepIndex >= 0 && stepIndex <= 5) {
      await sendWhatsAppNotification(stepIndex);
    }
    
    setPendingStep(stepIndex);
    setStepDialogOpen(true);
  };

  const sendWhatsAppNotification = async (stepIndex: number) => {
    try {
      const currentStepName = workflow[stepIndex];
      const nextStepIndex = stepIndex + 1;
      const nextStepName = workflow[nextStepIndex] || "Processo finalizado";
      
      // Preparar dados para envio
      const notificationData = {
        clientInfo: {
          id: caseData.id,
          name: caseData.clientName,
          email: caseData.email,
          phone: caseData.phone,
          cpf: caseData.cpf,
          type: caseData.type,
          status: caseData.status,
          createdAt: caseData.createdAt,
          updatedAt: caseData.updatedAt
        },
        currentStep: {
          index: stepIndex,
          name: currentStepName,
          status: "concluído"
        },
        nextStep: {
          index: nextStepIndex,
          name: nextStepName,
          action: nextStepName
        },
        documents: {
          rnmMae: stepData.rnmMaeFile || null,
          rnmPai: stepData.rnmPaiFile || null,
          rnmSupostoPai: stepData.rnmSupostoPaiFile || null,
          certidaoNascimento: stepData.certidaoNascimentoFile || null,
          comprovanteEndereco: stepData.comprovanteEnderecoFile || null,
          passaporte: stepData.passaporteFile || null,
          guiaPaga: stepData.guiaPagaFile || null,
          resultadoExameDna: stepData.resultadoExameDnaFile || null,
          procuracao: stepData.procuracaoAnexadaFile || null,
          peticao: stepData.peticaoAnexadaFile || null,
          processo: stepData.processoAnexadoFile || null,
          documentosFinais: stepData.documentosFinaisAnexadosFile || null,
          processoFinalizado: stepData.documentosProcessoFinalizadoFile || null
        },
        timestamp: new Date().toISOString()
      };

      console.log("📱 Enviando notificação WhatsApp:", notificationData);

      const response = await fetch("/api/webhook/n8n", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notificationData),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("✅ Notificação WhatsApp enviada com sucesso:", result);
        setWhatsappMessage("Notificação enviada via WhatsApp para os responsáveis!");
        setWhatsappDialogOpen(true);
      } else {
        console.error("❌ Erro ao enviar notificação:", response.status, result);
        setWhatsappMessage(`Erro ao enviar notificação via WhatsApp: ${result.error || 'Erro desconhecido'}`);
        setWhatsappDialogOpen(true);
      }
    } catch (error) {
      console.error("❌ Erro ao enviar notificação WhatsApp:", error);
      setWhatsappMessage("Erro ao enviar notificação via WhatsApp");
      setWhatsappDialogOpen(true);
    }
  };

  const confirmStepChange = async () => {
    try {
      let newCurrentStep: number;
      
      if (pendingStep === caseData.currentStep) {
        newCurrentStep = pendingStep + 1;
      } else if (pendingStep < caseData.currentStep) {
        newCurrentStep = pendingStep;
      } else {
        setStepDialogOpen(false);
        return;
      }
      
      // Verificar se é o último passo do workflow
      const workflow = WORKFLOWS[caseData.type as keyof typeof WORKFLOWS] || [];
      const isLastStep = newCurrentStep >= workflow.length - 1;
      
      // Preparar dados para atualização
      const updateData: any = { currentStep: newCurrentStep };
      
      // Se for o último passo, automaticamente mudar status para "Finalizado"
      if (isLastStep && pendingStep === caseData.currentStep) {
        updateData.status = "Finalizado";
      }
      
      const response = await fetch(`/api/acoes-civeis?id=${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        await fetchCase();
        if (pendingStep === caseData.currentStep) {
          if (isLastStep) {
            alert("Último passo concluído! Processo finalizado automaticamente.");
          } else {
            alert("Passo marcado como concluído!");
          }
        } else {
          alert("Passo marcado como atual!");
        }
        setStepDialogOpen(false);
      }
    } catch (error) {
      console.error("Error completing step:", error);
      alert("Erro ao marcar passo");
    }
  };

  const handleSaveStepData = async (stepIndex: number, silent = false) => {
    try {
      console.log("💾 Salvando dados no banco:", stepData);
      
      const response = await fetch(`/api/acoes-civeis?id=${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stepData),
      });

      if (response.ok) {
        const updated = await response.json();
        console.log("✅ Dados salvos com sucesso:", updated);
        
        if (!silent) {
          alert("Dados salvos com sucesso!");
        }
        await fetchCase();
      } else {
        const error = await response.json();
        console.error("❌ Erro ao salvar:", error);
        if (!silent) {
          alert("Erro ao salvar dados: " + (error.error || "Erro desconhecido"));
        }
      }
    } catch (error) {
      console.error("❌ Error saving step data:", error);
      if (!silent) {
        alert("Erro ao salvar dados: " + (error as Error).message);
      }
    }
  };

  const handleSaveNotes = async () => {
    setSaveDialogOpen(true);
  };

  const confirmSaveNotes = async () => {
    try {
      const response = await fetch(`/api/acoes-civeis?id=${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, status }),
      });

      if (response.ok) {
        alert("Informações atualizadas com sucesso!");
        await fetchCase();
        setSaveDialogOpen(false);
      }
    } catch (error) {
      console.error("Error saving notes:", error);
      alert("Erro ao salvar informações");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      // Update local state immediately for better UX
      setStatus(newStatus);
      
      // Update in database
      const response = await fetch(`/api/acoes-civeis?id=${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Update the case data to reflect the change
      const updatedAt = new Date().toISOString();
      setCaseData((prev: any) => ({
        ...prev,
        status: newStatus,
        updatedAt: updatedAt,
      }));

      // Notify other pages about the status change
      const updateData = {
        id: parseInt(params.id),
        status: newStatus,
        updatedAt: updatedAt,
      };

      // Store in localStorage for cross-tab communication (only on client side)
      if (typeof window !== 'undefined') {
        localStorage.setItem('acoes-civeis-status-update', JSON.stringify(updateData));

        // Dispatch custom event for same-tab communication
        window.dispatchEvent(new CustomEvent('acoes-civeis-status-updated', {
          detail: updateData
        }));
      }

      // Show success message (optional, can be removed for silent update)
      console.log("Status atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating status:", error);
      // Revert the status change if the API call failed
      setStatus(caseData?.status || "Em Andamento");
      alert("Erro ao atualizar status");
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/acoes-civeis?id=${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard/acoes-civeis");
      }
    } catch (error) {
      console.error("Error deleting case:", error);
      alert("Erro ao excluir ação");
    }
  };

  const renderStepContent = (stepIndex: number) => {
    // Handle both "Exame DNA" and "Alteração de Nome" workflows
    if (caseData.type === "Exame DNA") {
      return renderExameDNAStepContent(stepIndex);
    } else if (caseData.type === "Alteração de Nome") {
      return renderAlteracaoNomeStepContent(stepIndex);
    } else if (caseData.type === "Guarda") {
      return renderGuardaStepContent(stepIndex);
    } else if (caseData.type === "Acordos de Guarda") {
      return renderAcordosGuardaStepContent(stepIndex);
    }
    return null;
  };

  const renderExameDNAStepContent = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Cadastro de Documentos
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-1 gap-4">
              {/* RNM Mãe */}
              <div className="space-y-2">
                <Label htmlFor="rnmMae">RNM Mãe</Label>
                <Input
                  id="rnmMae"
                  value={stepData.rnmMae}
                  onChange={(e) => setStepData({ ...stepData, rnmMae: e.target.value })}
                  placeholder="Digite o RNM da mãe"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="rnmMaeFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "rnmMaeFile")}
                    disabled={uploadingFields.rnmMaeFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.rnmMaeFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.rnmMaeFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.rnmMaeFile}
                  </p>
                )}
              </div>

              {/* Nome da Mãe */}
              <div className="space-y-2">
                <Label htmlFor="nomeMae">Nome da Mãe</Label>
                <Input
                  id="nomeMae"
                  value={stepData.nomeMae}
                  onChange={(e) => setStepData({ ...stepData, nomeMae: e.target.value })}
                  placeholder="Nome completo da mãe"
                />
              </div>

              {/* RNM Pai */}
              <div className="space-y-2">
                <Label htmlFor="rnmPai">RNM Pai</Label>
                <Input
                  id="rnmPai"
                  value={stepData.rnmPai}
                  onChange={(e) => setStepData({ ...stepData, rnmPai: e.target.value })}
                  placeholder="Digite o RNM do pai"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="rnmPaiFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "rnmPaiFile")}
                    disabled={uploadingFields.rnmPaiFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.rnmPaiFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.rnmPaiFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.rnmPaiFile}
                  </p>
                )}
              </div>

              {/* Nome do Pai Registral */}
              <div className="space-y-2">
                <Label htmlFor="nomePaiRegistral">Nome do Pai Registral</Label>
                <Input
                  id="nomePaiRegistral"
                  value={stepData.nomePaiRegistral}
                  onChange={(e) => setStepData({ ...stepData, nomePaiRegistral: e.target.value })}
                  placeholder="Nome completo do pai registral"
                />
              </div>

              {/* RNM Suposto Pai */}
              <div className="space-y-2">
                <Label htmlFor="rnmSupostoPai">RNM Suposto Pai</Label>
                <Input
                  id="rnmSupostoPai"
                  value={stepData.rnmSupostoPai}
                  onChange={(e) => setStepData({ ...stepData, rnmSupostoPai: e.target.value })}
                  placeholder="Digite o RNM do suposto pai"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="rnmSupostoPaiFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "rnmSupostoPaiFile")}
                    disabled={uploadingFields.rnmSupostoPaiFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.rnmSupostoPaiFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.rnmSupostoPaiFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.rnmSupostoPaiFile}
                  </p>
                )}
              </div>

              {/* Nome do Suposto Pai */}
              <div className="space-y-2">
                <Label htmlFor="nomeSupostoPai">Nome do Suposto Pai</Label>
                <Input
                  id="nomeSupostoPai"
                  value={stepData.nomeSupostoPai}
                  onChange={(e) => setStepData({ ...stepData, nomeSupostoPai: e.target.value })}
                  placeholder="Nome completo do suposto pai"
                />
              </div>

              {/* Certidão de Nascimento */}
              <div className="space-y-2">
                <Label htmlFor="certidaoNascimento">Certidão de Nascimento</Label>
                <Input
                  id="certidaoNascimento"
                  value={stepData.certidaoNascimento}
                  onChange={(e) => setStepData({ ...stepData, certidaoNascimento: e.target.value })}
                  placeholder="Anexado/Não anexado"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="certidaoNascimentoFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "certidaoNascimentoFile")}
                    disabled={uploadingFields.certidaoNascimentoFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.certidaoNascimentoFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.certidaoNascimentoFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.certidaoNascimentoFile}
                  </p>
                )}
              </div>

              {/* Comprovante de Endereço */}
              <div className="space-y-2">
                <Label htmlFor="comprovanteEndereco">Comprovante de Endereço</Label>
                <Input
                  id="comprovanteEndereco"
                  value={stepData.comprovanteEndereco}
                  onChange={(e) => setStepData({ ...stepData, comprovanteEndereco: e.target.value })}
                  placeholder="Anexado/Não anexado"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="comprovanteEnderecoFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "comprovanteEnderecoFile")}
                    disabled={uploadingFields.comprovanteEnderecoFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.comprovanteEnderecoFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.comprovanteEnderecoFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.comprovanteEnderecoFile}
                  </p>
                )}
              </div>

              {/* Passaporte */}
              <div className="space-y-2">
                <Label htmlFor="passaporte">Passaporte</Label>
                <Input
                  id="passaporte"
                  value={stepData.passaporte}
                  onChange={(e) => setStepData({ ...stepData, passaporte: e.target.value })}
                  placeholder="Anexado/Não anexado"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="passaporteFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "passaporteFile")}
                    disabled={uploadingFields.passaporteFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.passaporteFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.passaporteFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.passaporteFile}
                  </p>
                )}
              </div>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        );

      case 1: // Agendar Exame DNA
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="dataExameDna">Data do Exame DNA</Label>
              <Input
                id="dataExameDna"
                type="date"
                value={stepData.dataExameDna}
                onChange={(e) => setStepData({ ...stepData, dataExameDna: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resultadoExameDnaFile">Upload do Resultado do Exame DNA</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="resultadoExameDnaFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "resultadoExameDnaFile")}
                  disabled={uploadingFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.resultadoExameDnaFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.resultadoExameDnaFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF, DOC, DOCX, JPG, PNG
              </p>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Informações
            </Button>
          </div>
        );

      case 2: // Aguardar Resultado DNA
          return (
            <div className="space-y-4 mt-4 p-4 bg-muted rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="procuracaoAnexada">Procuração</Label>
              <Input
                id="procuracaoAnexada"
                value={stepData.procuracaoAnexada}
                onChange={(e) => setStepData({ ...stepData, procuracaoAnexada: e.target.value })}
                placeholder="Status do anexo ou referência do arquivo"
              />
              <div className="flex items-center gap-2">
                <Input
                  id="procuracaoAnexadaFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "procuracaoAnexadaFile")}
                  disabled={uploadingFields.procuracaoAnexadaFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.procuracaoAnexadaFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.procuracaoAnexadaFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.procuracaoAnexadaFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enviar para: JAILDA → MARRONE
              </p>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Informações
            </Button>
          </div>
        );

      case 3: // Petição
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="peticaoAnexada">Petição de Declaração de Paternidade</Label>
              <Input
                id="peticaoAnexada"
                value={stepData.peticaoAnexada}
                onChange={(e) => setStepData({ ...stepData, peticaoAnexada: e.target.value })}
                placeholder="Status do anexo ou referência do arquivo"
              />
              <div className="flex items-center gap-2">
                <Input
                  id="peticaoAnexadaFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "peticaoAnexadaFile")}
                  disabled={uploadingFields.peticaoAnexadaFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.peticaoAnexadaFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.peticaoAnexadaFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.peticaoAnexadaFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Responsáveis: WENDEL / GUILHERME / FÁBIO
              </p>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Petição
            </Button>
          </div>
        );

      case 4: // Protocolar Processo
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="processoAnexado">Processo</Label>
                <Input
                  id="processoAnexado"
                  value={stepData.processoAnexado}
                  onChange={(e) => setStepData({ ...stepData, processoAnexado: e.target.value })}
                  placeholder="Status do anexo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numeroProtocolo">Número do Protocolo</Label>
                <Input
                  id="numeroProtocolo"
                  value={stepData.numeroProtocolo}
                  onChange={(e) => setStepData({ ...stepData, numeroProtocolo: e.target.value })}
                  placeholder="Digite o número do protocolo"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="processoAnexadoFile">Upload do Processo</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="processoAnexadoFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "processoAnexadoFile")}
                  disabled={uploadingFields.processoAnexadoFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.processoAnexadoFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.processoAnexadoFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.processoAnexadoFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF, DOC, DOCX, JPG, PNG
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Responsáveis: WENDEL / GUILHERME / FÁBIO
            </p>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Protocolo
            </Button>
          </div>
        );

      case 5: // Exigências do Juiz
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="documentosFinaisAnexados">Documentos Finais</Label>
              <Textarea
                id="documentosFinaisAnexados"
                value={stepData.documentosFinaisAnexados}
                onChange={(e) => setStepData({ ...stepData, documentosFinaisAnexados: e.target.value })}
                placeholder="Descreva os documentos anexados e exigências cumpridas"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentosFinaisAnexadosFile">Upload de Documentos</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="documentosFinaisAnexadosFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "documentosFinaisAnexadosFile")}
                  disabled={uploadingFields.documentosFinaisAnexadosFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.documentosFinaisAnexadosFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.documentosFinaisAnexadosFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.documentosFinaisAnexadosFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF, DOC, DOCX, JPG, PNG
              </p>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Documentos
            </Button>
          </div>
        );

      case 6: // Processo Finalizado
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="documentosProcessoFinalizado">Documentos do Processo Finalizado</Label>
              <Textarea
                id="documentosProcessoFinalizado"
                value={stepData.documentosProcessoFinalizado}
                onChange={(e) => setStepData({ ...stepData, documentosProcessoFinalizado: e.target.value })}
                placeholder="Descreva os documentos finais do processo"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentosProcessoFinalizadoFile">Upload de Documentos Finais</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="documentosProcessoFinalizadoFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "documentosProcessoFinalizadoFile")}
                  disabled={uploadingFields.documentosProcessoFinalizadoFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.documentosProcessoFinalizadoFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.documentosProcessoFinalizadoFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.documentosProcessoFinalizadoFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF, DOC, DOCX, JPG, PNG
              </p>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Documentos
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const renderAlteracaoNomeStepContent = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Cadastro de Documentos
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-1 gap-4">
              {/* RNM Mãe */}
              <div className="space-y-2">
                <Label htmlFor="rnmMae">RNM Mãe</Label>
                <Input
                  id="rnmMae"
                  value={stepData.rnmMae}
                  onChange={(e) => setStepData({ ...stepData, rnmMae: e.target.value })}
                  placeholder="Digite o RNM da mãe"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="rnmMaeFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "rnmMaeFile")}
                    disabled={uploadingFields.rnmMaeFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.rnmMaeFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.rnmMaeFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.rnmMaeFile}
                  </p>
                )}
              </div>

              {/* Nome da Mãe */}
              <div className="space-y-2">
                <Label htmlFor="nomeMae">Nome da Mãe</Label>
                <Input
                  id="nomeMae"
                  value={stepData.nomeMae}
                  onChange={(e) => setStepData({ ...stepData, nomeMae: e.target.value })}
                  placeholder="Nome completo da mãe"
                />
              </div>

              {/* RNM Pai */}
              <div className="space-y-2">
                <Label htmlFor="rnmPai">RNM Pai</Label>
                <Input
                  id="rnmPai"
                  value={stepData.rnmPai}
                  onChange={(e) => setStepData({ ...stepData, rnmPai: e.target.value })}
                  placeholder="Digite o RNM do pai"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="rnmPaiFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "rnmPaiFile")}
                    disabled={uploadingFields.rnmPaiFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.rnmPaiFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.rnmPaiFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.rnmPaiFile}
                  </p>
                )}
              </div>

              {/* Nome do Pai Registral */}
              <div className="space-y-2">
                <Label htmlFor="nomePaiRegistral">Nome do Pai Registral</Label>
                <Input
                  id="nomePaiRegistral"
                  value={stepData.nomePaiRegistral}
                  onChange={(e) => setStepData({ ...stepData, nomePaiRegistral: e.target.value })}
                  placeholder="Nome completo do pai registral"
                />
              </div>

              {/* CPF Mãe */}
              <div className="space-y-2">
                <Label htmlFor="cpfMae">CPF Mãe</Label>
                <Input
                  id="cpfMae"
                  value={stepData.cpfMae}
                  onChange={(e) => setStepData({ ...stepData, cpfMae: e.target.value })}
                  placeholder="Digite o CPF da mãe"
                />
              </div>

              {/* CPF Pai */}
              <div className="space-y-2">
                <Label htmlFor="cpfPai">CPF Pai</Label>
                <Input
                  id="cpfPai"
                  value={stepData.cpfPai}
                  onChange={(e) => setStepData({ ...stepData, cpfPai: e.target.value })}
                  placeholder="Digite o CPF do pai"
                />
              </div>

              {/* Certidão de Nascimento */}
              <div className="space-y-2">
                <Label htmlFor="certidaoNascimento">Certidão de Nascimento</Label>
                <Input
                  id="certidaoNascimento"
                  value={stepData.certidaoNascimento}
                  onChange={(e) => setStepData({ ...stepData, certidaoNascimento: e.target.value })}
                  placeholder="Anexado/Não anexado"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="certidaoNascimentoFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "certidaoNascimentoFile")}
                    disabled={uploadingFields.certidaoNascimentoFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.certidaoNascimentoFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.certidaoNascimentoFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.certidaoNascimentoFile}
                  </p>
                )}
              </div>

              {/* Comprovante de Endereço */}
              <div className="space-y-2">
                <Label htmlFor="comprovanteEndereco">Comprovante de Endereço</Label>
                <Input
                  id="comprovanteEndereco"
                  value={stepData.comprovanteEndereco}
                  onChange={(e) => setStepData({ ...stepData, comprovanteEndereco: e.target.value })}
                  placeholder="Anexado/Não anexado"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="comprovanteEnderecoFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "comprovanteEnderecoFile")}
                    disabled={uploadingFields.comprovanteEnderecoFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.comprovanteEnderecoFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.comprovanteEnderecoFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.comprovanteEnderecoFile}
                  </p>
                )}
              </div>

              {/* Passaporte */}
              <div className="space-y-2">
                <Label htmlFor="passaporte">Passaporte</Label>
                <Input
                  id="passaporte"
                  value={stepData.passaporte}
                  onChange={(e) => setStepData({ ...stepData, passaporte: e.target.value })}
                  placeholder="Anexado/Não anexado"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="passaporteFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "passaporteFile")}
                    disabled={uploadingFields.passaporteFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.passaporteFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.passaporteFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.passaporteFile}
                  </p>
                )}
              </div>

              {/* Guia Paga */}
              <div className="space-y-2">
                <Label htmlFor="guiaPaga">Guia Paga</Label>
                <Input
                  id="guiaPaga"
                  value={stepData.guiaPaga}
                  onChange={(e) => setStepData({ ...stepData, guiaPaga: e.target.value })}
                  placeholder="Anexado/Não anexado"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="guiaPagaFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "guiaPagaFile")}
                    disabled={uploadingFields.guiaPagaFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.guiaPagaFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.guiaPagaFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.guiaPagaFile}
                  </p>
                )}
              </div>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        );

      case 3: // Aguardar Procuração
          return (
            <div className="space-y-4 mt-4 p-4 bg-muted rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="procuracaoAnexada">Procuração</Label>
              <Input
                id="procuracaoAnexada"
                value={stepData.procuracaoAnexada}
                onChange={(e) => setStepData({ ...stepData, procuracaoAnexada: e.target.value })}
                placeholder="Status do anexo ou referência do arquivo"
              />
              <div className="flex items-center gap-2">
                <Input
                  id="procuracaoAnexadaFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "procuracaoAnexadaFile")}
                  disabled={uploadingFields.procuracaoAnexadaFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.procuracaoAnexadaFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.procuracaoAnexadaFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.procuracaoAnexadaFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enviar para: WENDEL / GUILHERME / FÁBIO
              </p>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Informações
            </Button>
          </div>
        );

      case 2: // Enviar Procuração
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="procuracaoAnexada">Procuração</Label>
              <Input
                id="procuracaoAnexada"
                value={stepData.procuracaoAnexada}
                onChange={(e) => setStepData({ ...stepData, procuracaoAnexada: e.target.value })}
                placeholder="Status do anexo ou referência do arquivo"
              />
              <div className="flex items-center gap-2">
                <Input
                  id="procuracaoAnexadaFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "procuracaoAnexadaFile")}
                  disabled={uploadingFields.procuracaoAnexadaFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.procuracaoAnexadaFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.procuracaoAnexadaFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.procuracaoAnexadaFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enviar para: JESSICA → JAILDA
              </p>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Informações
            </Button>
          </div>
        );

      case 3: // Petição
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="peticaoAnexada">Petição de Alteração de Nome</Label>
              <Input
                id="peticaoAnexada"
                value={stepData.peticaoAnexada}
                onChange={(e) => setStepData({ ...stepData, peticaoAnexada: e.target.value })}
                placeholder="Status do anexo ou referência do arquivo"
              />
              <div className="flex items-center gap-2">
                <Input
                  id="peticaoAnexadaFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "peticaoAnexadaFile")}
                  disabled={uploadingFields.peticaoAnexadaFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.peticaoAnexadaFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.peticaoAnexadaFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.peticaoAnexadaFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Responsáveis: WENDEL / GUILHERME / FÁBIO
              </p>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Petição
            </Button>
          </div>
        );

      case 4: // Protocolar Processo
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="processoAnexado">Processo</Label>
                <Input
                  id="processoAnexado"
                  value={stepData.processoAnexado}
                  onChange={(e) => setStepData({ ...stepData, processoAnexado: e.target.value })}
                  placeholder="Status do anexo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numeroProtocolo">Número do Protocolo</Label>
                <Input
                  id="numeroProtocolo"
                  value={stepData.numeroProtocolo}
                  onChange={(e) => setStepData({ ...stepData, numeroProtocolo: e.target.value })}
                  placeholder="Digite o número do protocolo"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="processoAnexadoFile">Upload do Processo</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="processoAnexadoFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "processoAnexadoFile")}
                  disabled={uploadingFields.processoAnexadoFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.processoAnexadoFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.processoAnexadoFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.processoAnexadoFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF, DOC, DOCX, JPG, PNG
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Responsáveis: WENDEL / GUILHERME / FÁBIO
            </p>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Protocolo
            </Button>
          </div>
        );

      case 5: // Exigências do Juiz
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="documentosFinaisAnexados">Documentos Finais</Label>
              <Textarea
                id="documentosFinaisAnexados"
                value={stepData.documentosFinaisAnexados}
                onChange={(e) => setStepData({ ...stepData, documentosFinaisAnexados: e.target.value })}
                placeholder="Descreva os documentos anexados e exigências cumpridas"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentosFinaisAnexadosFile">Upload de Documentos</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="documentosFinaisAnexadosFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "documentosFinaisAnexadosFile")}
                  disabled={uploadingFields.documentosFinaisAnexadosFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.documentosFinaisAnexadosFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.documentosFinaisAnexadosFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.documentosFinaisAnexadosFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF, DOC, DOCX, JPG, PNG
              </p>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Documentos
            </Button>
          </div>
        );

      case 6: // Processo Finalizado
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="documentosProcessoFinalizado">Documentos do Processo Finalizado</Label>
              <Textarea
                id="documentosProcessoFinalizado"
                value={stepData.documentosProcessoFinalizado}
                onChange={(e) => setStepData({ ...stepData, documentosProcessoFinalizado: e.target.value })}
                placeholder="Descreva os documentos finais do processo"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentosProcessoFinalizadoFile">Upload de Documentos Finais</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="documentosProcessoFinalizadoFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "documentosProcessoFinalizadoFile")}
                  disabled={uploadingFields.documentosProcessoFinalizadoFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.documentosProcessoFinalizadoFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.documentosProcessoFinalizadoFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.documentosProcessoFinalizadoFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF, DOC, DOCX, JPG, PNG
              </p>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Documentos
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const renderGuardaStepContent = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Cadastro de Documentos
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-1 gap-4">
              {/* RNM Mãe */}
              <div className="space-y-2">
                <Label htmlFor="rnmMae">RNM Mãe</Label>
                <Input
                  id="rnmMae"
                  value={stepData.rnmMae}
                  onChange={(e) => setStepData({ ...stepData, rnmMae: e.target.value })}
                  placeholder="Digite o RNM da mãe"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="rnmMaeFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "rnmMaeFile")}
                    disabled={uploadingFields.rnmMaeFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.rnmMaeFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.rnmMaeFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.rnmMaeFile}
                  </p>
                )}
              </div>

              {/* Nome da Mãe */}
              <div className="space-y-2">
                <Label htmlFor="nomeMae">Nome da Mãe</Label>
                <Input
                  id="nomeMae"
                  value={stepData.nomeMae}
                  onChange={(e) => setStepData({ ...stepData, nomeMae: e.target.value })}
                  placeholder="Nome completo da mãe"
                />
              </div>

              {/* RNM Pai */}
              <div className="space-y-2">
                <Label htmlFor="rnmPai">RNM Pai</Label>
                <Input
                  id="rnmPai"
                  value={stepData.rnmPai}
                  onChange={(e) => setStepData({ ...stepData, rnmPai: e.target.value })}
                  placeholder="Digite o RNM do pai"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="rnmPaiFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "rnmPaiFile")}
                    disabled={uploadingFields.rnmPaiFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.rnmPaiFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.rnmPaiFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.rnmPaiFile}
                  </p>
                )}
              </div>

              {/* Nome do Pai Registral */}
              <div className="space-y-2">
                <Label htmlFor="nomePaiRegistral">Nome do Pai Registral</Label>
                <Input
                  id="nomePaiRegistral"
                  value={stepData.nomePaiRegistral}
                  onChange={(e) => setStepData({ ...stepData, nomePaiRegistral: e.target.value })}
                  placeholder="Nome completo do pai registral"
                />
              </div>

              {/* RNM Suposto Pai */}
              <div className="space-y-2">
                <Label htmlFor="rnmSupostoPai">RNM Suposto Pai</Label>
                <Input
                  id="rnmSupostoPai"
                  value={stepData.rnmSupostoPai}
                  onChange={(e) => setStepData({ ...stepData, rnmSupostoPai: e.target.value })}
                  placeholder="Digite o RNM do suposto pai"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="rnmSupostoPaiFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "rnmSupostoPaiFile")}
                    disabled={uploadingFields.rnmSupostoPaiFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.rnmSupostoPaiFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.rnmSupostoPaiFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.rnmSupostoPaiFile}
                  </p>
                )}
              </div>

              {/* Nome do Suposto Pai */}
              <div className="space-y-2">
                <Label htmlFor="nomeSupostoPai">Nome do Suposto Pai</Label>
                <Input
                  id="nomeSupostoPai"
                  value={stepData.nomeSupostoPai}
                  onChange={(e) => setStepData({ ...stepData, nomeSupostoPai: e.target.value })}
                  placeholder="Nome completo do suposto pai"
                />
              </div>

              {/* Certidão de Nascimento */}
              <div className="space-y-2">
                <Label htmlFor="certidaoNascimento">Certidão de Nascimento</Label>
                <Input
                  id="certidaoNascimento"
                  value={stepData.certidaoNascimento}
                  onChange={(e) => setStepData({ ...stepData, certidaoNascimento: e.target.value })}
                  placeholder="Anexado/Não anexado"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="certidaoNascimentoFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "certidaoNascimentoFile")}
                    disabled={uploadingFields.certidaoNascimentoFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.certidaoNascimentoFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.certidaoNascimentoFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.certidaoNascimentoFile}
                  </p>
                )}
              </div>

              {/* Comprovante de Endereço */}
              <div className="space-y-2">
                <Label htmlFor="comprovanteEndereco">Comprovante de Endereço</Label>
                <Input
                  id="comprovanteEndereco"
                  value={stepData.comprovanteEndereco}
                  onChange={(e) => setStepData({ ...stepData, comprovanteEndereco: e.target.value })}
                  placeholder="Anexado/Não anexado"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="comprovanteEnderecoFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "comprovanteEnderecoFile")}
                    disabled={uploadingFields.comprovanteEnderecoFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.comprovanteEnderecoFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.comprovanteEnderecoFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.comprovanteEnderecoFile}
                  </p>
                )}
              </div>

              {/* Passaporte */}
              <div className="space-y-2">
                <Label htmlFor="passaporte">Passaporte</Label>
                <Input
                  id="passaporte"
                  value={stepData.passaporte}
                  onChange={(e) => setStepData({ ...stepData, passaporte: e.target.value })}
                  placeholder="Anexado/Não anexado"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="passaporteFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "passaporteFile")}
                    disabled={uploadingFields.passaporteFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.passaporteFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.passaporteFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.passaporteFile}
                  </p>
                )}
              </div>

              {/* Guia Paga */}
              <div className="space-y-2">
                <Label htmlFor="guiaPaga">Guia Paga</Label>
                <Input
                  id="guiaPaga"
                  value={stepData.guiaPaga}
                  onChange={(e) => setStepData({ ...stepData, guiaPaga: e.target.value })}
                  placeholder="Anexado/Não anexado"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="guiaPagaFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "guiaPagaFile")}
                    disabled={uploadingFields.guiaPagaFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.guiaPagaFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.guiaPagaFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.guiaPagaFile}
                  </p>
                )}
              </div>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        );

      case 1: // Fazer Procuração
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="procuracaoAnexada">Procuração</Label>
              <Input
                id="procuracaoAnexada"
                value={stepData.procuracaoAnexada}
                onChange={(e) => setStepData({ ...stepData, procuracaoAnexada: e.target.value })}
                placeholder="Status do anexo ou referência do arquivo"
              />
              <div className="flex items-center gap-2">
                <Input
                  id="procuracaoAnexadaFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "procuracaoAnexadaFile")}
                  disabled={uploadingFields.procuracaoAnexadaFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.procuracaoAnexadaFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.procuracaoAnexadaFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.procuracaoAnexadaFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enviar para: WENDEL / GUILHERME / FÁBIO
              </p>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Informações
            </Button>
          </div>
        );

      case 2: // Enviar Procuração
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="procuracaoAnexada">Procuração</Label>
              <Input
                id="procuracaoAnexada"
                value={stepData.procuracaoAnexada}
                onChange={(e) => setStepData({ ...stepData, procuracaoAnexada: e.target.value })}
                placeholder="Status do anexo ou referência do arquivo"
              />
              <div className="flex items-center gap-2">
                <Input
                  id="procuracaoAnexadaFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "procuracaoAnexadaFile")}
                  disabled={uploadingFields.procuracaoAnexadaFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.procuracaoAnexadaFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.procuracaoAnexadaFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.procuracaoAnexadaFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enviar para: JESSICA → JAILDA
              </p>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Informações
            </Button>
          </div>
        );

      case 3: // Procuração e Acordo Assinados
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="procuracaoAnexada">Procuração e Acordo Assinados</Label>
              <Input
                id="procuracaoAnexada"
                value={stepData.procuracaoAnexada}
                onChange={(e) => setStepData({ ...stepData, procuracaoAnexada: e.target.value })}
                placeholder="Status do anexo ou referência do arquivo"
              />
              <div className="flex items-center gap-2">
                <Input
                  id="procuracaoAnexadaFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "procuracaoAnexadaFile")}
                  disabled={uploadingFields.procuracaoAnexadaFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.procuracaoAnexadaFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.procuracaoAnexadaFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.procuracaoAnexadaFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enviar para: WENDEL / GUILHERME / FÁBIO
              </p>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Informações
            </Button>
          </div>
        );

      case 4: // Verificar se há Petição
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="peticaoAnexada">Petição</Label>
              <Input
                id="peticaoAnexada"
                value={stepData.peticaoAnexada}
                onChange={(e) => setStepData({ ...stepData, peticaoAnexada: e.target.value })}
                placeholder="Status do anexo ou referência do arquivo"
              />
              <div className="flex items-center gap-2">
                <Input
                  id="peticaoAnexadaFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "peticaoAnexadaFile")}
                  disabled={uploadingFields.peticaoAnexadaFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.peticaoAnexadaFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.peticaoAnexadaFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.peticaoAnexadaFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enviar para: WENDEL / GUILHERME / FÁBIO
              </p>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Informações
            </Button>
          </div>
        );

      case 5: // Protocolar Processo
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="processoAnexado">Processo</Label>
                <Input
                  id="processoAnexado"
                  value={stepData.processoAnexado}
                  onChange={(e) => setStepData({ ...stepData, processoAnexado: e.target.value })}
                  placeholder="Status do anexo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numeroProtocolo">Número do Protocolo</Label>
                <Input
                  id="numeroProtocolo"
                  value={stepData.numeroProtocolo}
                  onChange={(e) => setStepData({ ...stepData, numeroProtocolo: e.target.value })}
                  placeholder="Digite o número do protocolo"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="processoAnexadoFile">Upload do Processo</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="processoAnexadoFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "processoAnexadoFile")}
                  disabled={uploadingFields.processoAnexadoFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.processoAnexadoFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.processoAnexadoFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.processoAnexadoFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF, DOC, DOCX, JPG, PNG
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Responsáveis: WENDEL / GUILHERME / FÁBIO
            </p>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Protocolo
            </Button>
          </div>
        );

      case 6: // Exigências do Juiz
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="documentosFinaisAnexados">Documentos Finais</Label>
              <Textarea
                id="documentosFinaisAnexados"
                value={stepData.documentosFinaisAnexados}
                onChange={(e) => setStepData({ ...stepData, documentosFinaisAnexados: e.target.value })}
                placeholder="Descreva os documentos anexados e exigências cumpridas"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentosFinaisAnexadosFile">Upload de Documentos</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="documentosFinaisAnexadosFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "documentosFinaisAnexadosFile")}
                  disabled={uploadingFields.documentosFinaisAnexadosFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.documentosFinaisAnexadosFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.documentosFinaisAnexadosFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.documentosFinaisAnexadosFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF, DOC, DOCX, JPG, PNG
              </p>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Documentos
            </Button>
          </div>
        );

      case 7: // Processo Finalizado
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="documentosProcessoFinalizado">Documentos do Processo Finalizado</Label>
              <Textarea
                id="documentosProcessoFinalizado"
                value={stepData.documentosProcessoFinalizado}
                onChange={(e) => setStepData({ ...stepData, documentosProcessoFinalizado: e.target.value })}
                placeholder="Descreva os documentos finais do processo"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentosProcessoFinalizadoFile">Upload de Documentos Finais</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="documentosProcessoFinalizadoFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "documentosProcessoFinalizadoFile")}
                  disabled={uploadingFields.documentosProcessoFinalizadoFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.documentosProcessoFinalizadoFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.documentosProcessoFinalizadoFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.documentosProcessoFinalizadoFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF, DOC, DOCX, JPG, PNG
              </p>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Documentos
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const renderAcordosGuardaStepContent = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Cadastro de Documentos
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-1 gap-4">
              {/* RNM Mãe */}
              <div className="space-y-2">
                <Label htmlFor="rnmMae">RNM Mãe</Label>
                <Input
                  id="rnmMae"
                  value={stepData.rnmMae}
                  onChange={(e) => setStepData({ ...stepData, rnmMae: e.target.value })}
                  placeholder="Digite o RNM da mãe"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="rnmMaeFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "rnmMaeFile")}
                    disabled={uploadingFields.rnmMaeFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.rnmMaeFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.rnmMaeFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.rnmMaeFile}
                  </p>
                )}
              </div>

              {/* Nome da Mãe */}
              <div className="space-y-2">
                <Label htmlFor="nomeMae">Nome da Mãe</Label>
                <Input
                  id="nomeMae"
                  value={stepData.nomeMae}
                  onChange={(e) => setStepData({ ...stepData, nomeMae: e.target.value })}
                  placeholder="Nome completo da mãe"
                />
              </div>

              {/* RNM Pai */}
              <div className="space-y-2">
                <Label htmlFor="rnmPai">RNM Pai</Label>
                <Input
                  id="rnmPai"
                  value={stepData.rnmPai}
                  onChange={(e) => setStepData({ ...stepData, rnmPai: e.target.value })}
                  placeholder="Digite o RNM do pai"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="rnmPaiFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "rnmPaiFile")}
                    disabled={uploadingFields.rnmPaiFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.rnmPaiFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.rnmPaiFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.rnmPaiFile}
                  </p>
                )}
              </div>

              {/* Nome do Pai Registral */}
              <div className="space-y-2">
                <Label htmlFor="nomePaiRegistral">Nome do Pai Registral</Label>
                <Input
                  id="nomePaiRegistral"
                  value={stepData.nomePaiRegistral}
                  onChange={(e) => setStepData({ ...stepData, nomePaiRegistral: e.target.value })}
                  placeholder="Nome completo do pai registral"
                />
              </div>

              {/* RNM Suposto Pai */}
              <div className="space-y-2">
                <Label htmlFor="rnmSupostoPai">RNM Suposto Pai</Label>
                <Input
                  id="rnmSupostoPai"
                  value={stepData.rnmSupostoPai}
                  onChange={(e) => setStepData({ ...stepData, rnmSupostoPai: e.target.value })}
                  placeholder="Digite o RNM do suposto pai"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="rnmSupostoPaiFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "rnmSupostoPaiFile")}
                    disabled={uploadingFields.rnmSupostoPaiFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.rnmSupostoPaiFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.rnmSupostoPaiFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.rnmSupostoPaiFile}
                  </p>
                )}
              </div>

              {/* Nome do Suposto Pai */}
              <div className="space-y-2">
                <Label htmlFor="nomeSupostoPai">Nome do Suposto Pai</Label>
                <Input
                  id="nomeSupostoPai"
                  value={stepData.nomeSupostoPai}
                  onChange={(e) => setStepData({ ...stepData, nomeSupostoPai: e.target.value })}
                  placeholder="Nome completo do suposto pai"
                />
              </div>

              {/* Certidão de Nascimento */}
              <div className="space-y-2">
                <Label htmlFor="certidaoNascimento">Certidão de Nascimento</Label>
                <Input
                  id="certidaoNascimento"
                  value={stepData.certidaoNascimento}
                  onChange={(e) => setStepData({ ...stepData, certidaoNascimento: e.target.value })}
                  placeholder="Anexado/Não anexado"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="certidaoNascimentoFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "certidaoNascimentoFile")}
                    disabled={uploadingFields.certidaoNascimentoFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.certidaoNascimentoFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.certidaoNascimentoFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.certidaoNascimentoFile}
                  </p>
                )}
              </div>

              {/* Comprovante de Endereço */}
              <div className="space-y-2">
                <Label htmlFor="comprovanteEndereco">Comprovante de Endereço</Label>
                <Input
                  id="comprovanteEndereco"
                  value={stepData.comprovanteEndereco}
                  onChange={(e) => setStepData({ ...stepData, comprovanteEndereco: e.target.value })}
                  placeholder="Anexado/Não anexado"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="comprovanteEnderecoFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "comprovanteEnderecoFile")}
                    disabled={uploadingFields.comprovanteEnderecoFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.comprovanteEnderecoFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.comprovanteEnderecoFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.comprovanteEnderecoFile}
                  </p>
                )}
              </div>

              {/* Passaporte */}
              <div className="space-y-2">
                <Label htmlFor="passaporte">Passaporte</Label>
                <Input
                  id="passaporte"
                  value={stepData.passaporte}
                  onChange={(e) => setStepData({ ...stepData, passaporte: e.target.value })}
                  placeholder="Anexado/Não anexado"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="passaporteFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "passaporteFile")}
                    disabled={uploadingFields.passaporteFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.passaporteFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.passaporteFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.passaporteFile}
                  </p>
                )}
              </div>

              {/* Guia Paga */}
              <div className="space-y-2">
                <Label htmlFor="guiaPaga">Guia Paga</Label>
                <Input
                  id="guiaPaga"
                  value={stepData.guiaPaga}
                  onChange={(e) => setStepData({ ...stepData, guiaPaga: e.target.value })}
                  placeholder="Anexado/Não anexado"
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="guiaPagaFile"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "guiaPagaFile")}
                    disabled={uploadingFields.guiaPagaFile}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadingFields.guiaPagaFile && (
                    <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {stepData.guiaPagaFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado: {stepData.guiaPagaFile}
                  </p>
                )}
              </div>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        );

      case 1: // Fazer Procuração e Acordo
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="procuracaoAnexada">Procuração e Acordo</Label>
              <Input
                id="procuracaoAnexada"
                value={stepData.procuracaoAnexada}
                onChange={(e) => setStepData({ ...stepData, procuracaoAnexada: e.target.value })}
                placeholder="Status do anexo ou referência do arquivo"
              />
              <div className="flex items-center gap-2">
                <Input
                  id="procuracaoAnexadaFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "procuracaoAnexadaFile")}
                  disabled={uploadingFields.procuracaoAnexadaFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.procuracaoAnexadaFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.procuracaoAnexadaFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.procuracaoAnexadaFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enviar para: WENDEL / GUILHERME / FÁBIO
              </p>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Informações
            </Button>
          </div>
        );

      case 2: // Enviar Documentos
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="procuracaoAnexada">Documentos</Label>
              <Input
                id="procuracaoAnexada"
                value={stepData.procuracaoAnexada}
                onChange={(e) => setStepData({ ...stepData, procuracaoAnexada: e.target.value })}
                placeholder="Status do anexo ou referência do arquivo"
              />
              <div className="flex items-center gap-2">
                <Input
                  id="procuracaoAnexadaFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "procuracaoAnexadaFile")}
                  disabled={uploadingFields.procuracaoAnexadaFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.procuracaoAnexadaFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.procuracaoAnexadaFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.procuracaoAnexadaFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enviar para: JESSICA → JAILDA → MARRONE
              </p>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Informações
            </Button>
          </div>
        );

      case 3: // Documentos Assinados
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="procuracaoAnexada">Documentos Assinados</Label>
              <Input
                id="procuracaoAnexada"
                value={stepData.procuracaoAnexada}
                onChange={(e) => setStepData({ ...stepData, procuracaoAnexada: e.target.value })}
                placeholder="Status do anexo ou referência do arquivo"
              />
              <div className="flex items-center gap-2">
                <Input
                  id="procuracaoAnexadaFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "procuracaoAnexadaFile")}
                  disabled={uploadingFields.procuracaoAnexadaFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.procuracaoAnexadaFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.procuracaoAnexadaFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.procuracaoAnexadaFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enviar para: WENDEL / GUILHERME / FÁBIO
              </p>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Informações
            </Button>
          </div>
        );

      case 4: // Verificar se há Petição
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="peticaoAnexada">Petição</Label>
              <Input
                id="peticaoAnexada"
                value={stepData.peticaoAnexada}
                onChange={(e) => setStepData({ ...stepData, peticaoAnexada: e.target.value })}
                placeholder="Status do anexo ou referência do arquivo"
              />
              <div className="flex items-center gap-2">
                <Input
                  id="peticaoAnexadaFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "peticaoAnexadaFile")}
                  disabled={uploadingFields.peticaoAnexadaFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.peticaoAnexadaFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.peticaoAnexadaFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.peticaoAnexadaFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enviar para: WENDEL / GUILHERME / FÁBIO
              </p>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Informações
            </Button>
          </div>
        );

      case 5: // Protocolar Processo
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="processoAnexado">Processo</Label>
                <Input
                  id="processoAnexado"
                  value={stepData.processoAnexado}
                  onChange={(e) => setStepData({ ...stepData, processoAnexado: e.target.value })}
                  placeholder="Status do anexo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numeroProtocolo">Número do Protocolo</Label>
                <Input
                  id="numeroProtocolo"
                  value={stepData.numeroProtocolo}
                  onChange={(e) => setStepData({ ...stepData, numeroProtocolo: e.target.value })}
                  placeholder="Digite o número do protocolo"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="processoAnexadoFile">Upload do Processo</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="processoAnexadoFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "processoAnexadoFile")}
                  disabled={uploadingFields.processoAnexadoFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.processoAnexadoFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.processoAnexadoFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.processoAnexadoFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF, DOC, DOCX, JPG, PNG
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Responsáveis: WENDEL / GUILHERME / FÁBIO
            </p>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Protocolo
            </Button>
          </div>
        );

      case 6: // Exigências do Juiz
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="documentosFinaisAnexados">Documentos Finais</Label>
              <Textarea
                id="documentosFinaisAnexados"
                value={stepData.documentosFinaisAnexados}
                onChange={(e) => setStepData({ ...stepData, documentosFinaisAnexados: e.target.value })}
                placeholder="Descreva os documentos anexados e exigências cumpridas"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentosFinaisAnexadosFile">Upload de Documentos</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="documentosFinaisAnexadosFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "documentosFinaisAnexadosFile")}
                  disabled={uploadingFields.documentosFinaisAnexadosFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.documentosFinaisAnexadosFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.documentosFinaisAnexadosFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.documentosFinaisAnexadosFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF, DOC, DOCX, JPG, PNG
              </p>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Documentos
            </Button>
          </div>
        );

      case 7: // Processo Finalizado
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="documentosProcessoFinalizado">Documentos do Processo Finalizado</Label>
              <Textarea
                id="documentosProcessoFinalizado"
                value={stepData.documentosProcessoFinalizado}
                onChange={(e) => setStepData({ ...stepData, documentosProcessoFinalizado: e.target.value })}
                placeholder="Descreva os documentos finais do processo"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentosProcessoFinalizadoFile">Upload de Documentos Finais</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="documentosProcessoFinalizadoFile"
                  type="file"
                  onChange={(e) => handleFileUpload(e, "documentosProcessoFinalizadoFile")}
                  disabled={uploadingFields.documentosProcessoFinalizadoFile}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {uploadingFields.documentosProcessoFinalizadoFile && (
                  <Upload className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {stepData.documentosProcessoFinalizadoFile && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Arquivo anexado: {stepData.documentosProcessoFinalizadoFile}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF, DOC, DOCX, JPG, PNG
              </p>
            </div>
            <Button onClick={() => handleSaveStepData(stepIndex)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Documentos
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!caseData) {
    return <div>Ação não encontrada</div>;
  }

  const workflow = WORKFLOWS[caseData.type as keyof typeof WORKFLOWS] || [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/acoes-civeis">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{caseData.clientName}</h1>
            <p className="text-muted-foreground">{caseData.type}</p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                <Trash2 className="h-4 w-4 mr-2" />
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
              <AlertDialogAction onClick={handleDelete}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Workflow Steps */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo do Processo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {workflow.map((step, index) => (
                <Collapsible
                  key={index}
                  open={expandedStep === index}
                  onOpenChange={() => handleStepClick(index)}
                >
                  <div
                    className={`flex items-start gap-3 p-4 rounded-lg transition-colors ${
                      index === caseData.currentStep
                        ? "bg-primary/10 border-2 border-primary"
                        : index < caseData.currentStep
                        ? "bg-green-50 dark:bg-green-950/20"
                        : "bg-muted/50"
                    }`}
                  >
                    <button
                      onClick={(e) => handleCompleteStep(index, e)}
                      className="shrink-0 mt-0.5 hover:scale-110 transition-transform cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={index > caseData.currentStep}
                      title={
                        index === caseData.currentStep 
                          ? "Clique para marcar como concluído" 
                          : index < caseData.currentStep 
                          ? "Clique para marcar como atual" 
                          : "Aguardando passo anterior"
                      }
                    >
                      {index < caseData.currentStep ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <Circle
                          className={`h-6 w-6 ${
                            index === caseData.currentStep
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <CollapsibleTrigger className="w-full text-left">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">Passo {index + 1}</span>
                            {index === caseData.currentStep && (
                              <Badge>Atual</Badge>
                            )}
                            {index < caseData.currentStep && (
                              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                                Concluído
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {caseData.type === "Exame DNA" && index < 6 && (
                              <Edit2 className="h-4 w-4 text-muted-foreground" />
                            )}
                            {expandedStep === index ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <p className="text-sm mt-1 text-left">{step}</p>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {renderStepContent(index)}
                      </CollapsibleContent>
                    </div>
                  </div>
                </Collapsible>
              ))}
            </CardContent>
          </Card>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status do Processo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Aguardando">Aguardando</SelectItem>
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Passo Atual</label>
                <div className="text-2xl font-bold">{caseData.currentStep + 1}</div>
                <p className="text-xs text-muted-foreground">
                  de {workflow.length} passos
                </p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">Criado em</p>
                <p className="text-sm font-medium">
                  {new Date(caseData.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">Última atualização</p>
                <p className="text-sm font-medium">
                  {new Date(caseData.updatedAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Documentos do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos do Cliente
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Todos os documentos anexados para {caseData?.clientName}
              </p>
            </CardHeader>
            <CardContent>
              {/* Drag & Drop Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-4 mb-4 transition-colors ${
                  isDragOver 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                } ${uploadingFile ? 'opacity-50 pointer-events-none' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className={`text-sm ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`}>
                    {uploadingFile 
                      ? 'Fazendo upload...' 
                      : isDragOver 
                        ? 'Solte os arquivos aqui' 
                        : 'Arraste e solte arquivos aqui para anexar'
                    }
                  </p>
                  {!uploadingFile && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Ou clique nos botões de upload nas etapas acima
                    </p>
                  )}
                </div>
              </div>

              {loadingDocuments ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="group flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          {editingDocumentId === doc.id ? (
                            <input
                              type="text"
                              value={editingDocumentName}
                              onChange={handleDocumentNameChange}
                              onBlur={() => handleDocumentNameSave(doc.id.toString())}
                              onKeyDown={(e) => handleDocumentNameKeyPress(e, doc.id.toString())}
                              className="text-sm font-medium bg-background border border-input rounded px-2 py-1 flex-1 mr-2"
                              autoFocus
                            />
                          ) : (
                            <h4 
                              className="text-sm font-medium truncate cursor-pointer hover:text-blue-600 transition-colors"
                              onDoubleClick={() => handleDocumentDoubleClick(doc)}
                              title="Clique duas vezes para renomear"
                            >
                              {doc.document_name || doc.file_name}
                            </h4>
                          )}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (typeof window !== 'undefined') {
                                  window.open(doc.file_path, '_blank');
                                }
                              }}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDocumentToDelete(doc);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enviado em {new Date(doc.uploaded_at).toLocaleDateString("pt-BR", {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {doc.field_name && (
                          <p className="text-xs text-blue-600 mt-1">
                            Campo: {doc.field_name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum documento anexado ainda</p>
                  <p className="text-xs mt-1">
                    Arraste arquivos para esta área ou use os botões de upload nas etapas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                placeholder="Adicione observações..."
              />
              <Button onClick={handleSaveNotes} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Step Change Confirmation Dialog */}
      <AlertDialog open={stepDialogOpen} onOpenChange={setStepDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar mudança de passo</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStep === caseData?.currentStep 
                ? "Tem certeza que deseja marcar este passo como concluído e avançar para o próximo?"
                : "Tem certeza que deseja voltar para este passo?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStepChange}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Notes Confirmation Dialog */}
      <AlertDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alterações</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja salvar as alterações de status e observações?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSaveNotes}>
              Salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Document Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o documento "{documentToDelete?.document_name || documentToDelete?.file_name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingDocument}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDeleteDocument(documentToDelete?.id)}
              disabled={deletingDocument}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingDocument ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* WhatsApp Notification Dialog */}
      <AlertDialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notificação WhatsApp</AlertDialogTitle>
            <AlertDialogDescription>
              {whatsappMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setWhatsappDialogOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}