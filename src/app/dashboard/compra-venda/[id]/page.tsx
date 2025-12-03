"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ArrowLeft,
  Home,
  CheckCircle2,
  Circle,
  Upload,
  FileText,
  Calendar,
  AlertTriangle,
  Save,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { DetailLayout } from "@/components/detail/DetailLayout";
import { StepItem } from "@/components/detail/StepItem";
import { StatusPanel } from "@/components/detail/StatusPanel";
import { NotesPanel } from "@/components/detail/NotesPanel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DocumentPanel } from "@/components/detail/DocumentPanel";

const WORKFLOW_STEPS = [
  {
    id: 1,
    title: "Cadastro Documentos",
    description: "Informações de cadastro",
  },
  {
    id: 2,
    title: "Emitir Certidões",
    description: "Emissão de documentos",
  },
  {
    id: 3,
    title: "Fazer/Analisar Contrato Compra e Venda",
    description: "Elaboração e análise contratual",
  },
  {
    id: 4,
    title: "Assinatura de contrato",
    description: "Coleta de assinaturas",
  },
  {
    id: 5,
    title: "Escritura",
    description: "Prazos para escritura e pagamentos",
  },
  {
    id: 6,
    title: "Cobrar a Matrícula do Cartório",
    description: "Finalização do processo",
  },
  {
    id: 7,
    title: "Processo Finalizado",
    description: "Encerramento da ação",
  },
];

export default function CompraVendaDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepNotes, setStepNotes] = useState<{ [key: number]: string }>({});
  const [uploading, setUploading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [status, setStatus] = useState("Em andamento");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState("");
  const [pendingStep, setPendingStep] = useState(0);
  const [assignments, setAssignments] = useState<Record<number, { responsibleName?: string; dueDate?: string }>>({});
  const [expandedStepId, setExpandedStepId] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [editableSellers, setEditableSellers] = useState<{ rg?: string; cpf?: string; dataNascimento?: string }[]>([]);
  const [editableCompradores, setEditableCompradores] = useState<{ rnm?: string; cpf?: string; endereco?: string }[]>([]);
  const [pendingPrazoSinal, setPendingPrazoSinal] = useState<string>("");
  const [pendingPrazoEscritura, setPendingPrazoEscritura] = useState<string>("");
  const [prazosOpen, setPrazosOpen] = useState(false);
  interface Document {
    id: string | number;
    document_name?: string;
    file_name?: string;
    file_path: string;
    uploaded_at: string;
    field_name?: string;
  }
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState<string | number | null>(null);
  const [editingDocumentName, setEditingDocumentName] = useState("");

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/compra-venda-imoveis?id=${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setProperty(null);
          return;
        }
        throw new Error("Erro ao buscar transação");
      }
      
      const data = await response.json();
      setProperty(data);
      setCurrentStep(data.currentStep || 1);
      setExpandedStepId(data.currentStep || 1);
      setStatus(data.status || "Em andamento");
      setPendingPrazoSinal(data.prazoSinal || "");
      setPendingPrazoEscritura(data.prazoEscritura || "");
      if (data.stepNotes) {
        try {
          setStepNotes(JSON.parse(data.stepNotes));
        } catch (e) {
          setStepNotes({});
        }
      }
      if (data.completedSteps) {
        try {
          setCompletedSteps(JSON.parse(data.completedSteps));
        } catch (e) {
          setCompletedSteps([]);
        }
      }
      try {
        const rgList = (data.rgVendedores || "").split(",").filter(Boolean);
        const cpfList = (data.cpfVendedores || "").split(",").filter(Boolean);
        const dobList = (data.dataNascimentoVendedores || "").split(",").filter(Boolean);
        const maxLen = Math.max(rgList.length, cpfList.length, dobList.length);
        const sellers = maxLen > 0
          ? Array.from({ length: maxLen }, (_, i) => ({ rg: rgList[i] || "", cpf: cpfList[i] || "", dataNascimento: dobList[i] || "" }))
          : [{ rg: "", cpf: "", dataNascimento: "" }];
        setEditableSellers(sellers);

        const rnmList = (data.rnmComprador || "").split(",").filter(Boolean);
        const cpfCList = (data.cpfComprador || "").split(",").filter(Boolean);
        const endList = (data.enderecoComprador || "").split(",").filter(Boolean);
        const maxC = Math.max(rnmList.length, cpfCList.length, endList.length);
        const compradores = maxC > 0
          ? Array.from({ length: maxC }, (_, i) => ({ rnm: rnmList[i] || "", cpf: cpfCList[i] || "", endereco: endList[i] || "" }))
          : [{ rnm: "", cpf: "", endereco: "" }];
        setEditableCompradores(compradores);
      } catch {}
    } catch (error) {
      console.error("Error fetching property:", error);
      toast.error("Erro ao carregar dados da transação");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadAssignments = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/step-assignments?moduleType=compra_venda_imoveis&recordId=${id}`);
        if (res.ok) {
          const data = await res.json();
          const map: Record<number, { responsibleName?: string; dueDate?: string }> = {};
          (data || []).forEach((a: any) => {
            map[a.stepIndex] = { responsibleName: a.responsibleName, dueDate: a.dueDate };
          });
          setAssignments(map);
        }
      } catch (e) {
        console.error("Erro ao carregar assignments:", e);
      }
    };
    loadAssignments();
  }, [id]);

  useEffect(() => {
    const loadDocuments = async () => {
      if (!id) return;
      setLoadingDocuments(true);
      try {
        const response = await fetch(`/api/documents/${id}?moduleType=compra_venda_imoveis`);
        if (response.ok) {
          const data = await response.json();
          setDocuments(data || []);
        }
      } catch (error) {
        console.error("Erro ao carregar documentos:", error);
      } finally {
        setLoadingDocuments(false);
      }
    };
    loadDocuments();
  }, [id]);

  const refreshDocuments = async () => {
    if (!id) return;
    setLoadingDocuments(true);
    try {
      const response = await fetch(`/api/documents/${id}?moduleType=compra_venda_imoveis`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const renderDocLinks = (fieldKey: string) => {
    const list = documents.filter((d) => d.field_name === fieldKey);
    if (!list.length) return null;
    return (
      <div className="mt-2">
        <ul className="text-sm list-disc pl-5">
          {list.map((doc) => (
            <li key={String(doc.id)}>
              <a
                href={doc.file_path}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {doc.document_name || doc.file_name || "Documento"}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const handleSaveAssignment = async (stepId: number, responsibleName?: string, dueDate?: string) => {
    try {
      const res = await fetch(`/api/step-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleType: "compra_venda_imoveis", recordId: id, stepIndex: stepId, responsibleName, dueDate }),
      });
      if (res.ok) {
        setAssignments(prev => ({ ...prev, [stepId]: { responsibleName, dueDate } }));
        return true;
      }
      return false;
    } catch (e) {
      console.error("Erro ao salvar assignment:", e);
      return false;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setPendingStatus(newStatus);
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    try {
      const response = await fetch(`/api/compra-venda-imoveis?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: pendingStatus }),
      });

      if (response.ok) {
        setStatus(pendingStatus);
        toast.success("Status atualizado com sucesso");
        setStatusDialogOpen(false);
        setPendingStatus("");
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('compra-venda-status-update', JSON.stringify({ id, status: pendingStatus, t: Date.now() }));
            window.dispatchEvent(new CustomEvent('compra-venda-status-updated', { detail: { id, status: pendingStatus } }));
          } catch {}
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleStepChange = async (step: number) => {
    setPendingStep(step);
    setStepDialogOpen(true);
  };

  const confirmStepChange = async () => {
    try {
      const response = await fetch(`/api/compra-venda-imoveis?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentStep: pendingStep,
        }),
      });

      if (response.ok) {
        setCurrentStep(pendingStep);
        toast.success("Etapa atualizada com sucesso");
        setStepDialogOpen(false);
      }
    } catch (error) {
      console.error("Error updating step:", error);
      toast.error("Erro ao atualizar etapa");
    }
  };

  const toggleStepCompletion = async (stepId: number) => {
    const wasCompleted = completedSteps.includes(stepId);
    const newCompletedSteps = wasCompleted
      ? completedSteps.filter((s) => s !== stepId)
      : [...completedSteps, stepId];

    const shouldAdvance = !wasCompleted && stepId === currentStep;
    const nextStep = wasCompleted
      ? stepId
      : shouldAdvance
        ? Math.min(stepId + 1, WORKFLOW_STEPS.length)
        : currentStep;

    setCompletedSteps(newCompletedSteps);
    setCurrentStep(nextStep);

    try {
      await fetch(`/api/compra-venda-imoveis?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedSteps: JSON.stringify(newCompletedSteps),
          currentStep: nextStep,
        }),
      });
      toast.success(wasCompleted ? "Etapa desmarcada" : "Etapa concluída!");
    } catch (error) {
      console.error("Error updating completed steps:", error);
      toast.error("Erro ao atualizar etapa");
    }
  };

  const handleNotesChange = async (step: number, notes: string) => {
    const updatedNotes = { ...stepNotes, [step]: notes };
    setStepNotes(updatedNotes);

    try {
      await fetch(`/api/compra-venda-imoveis?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepNotes: JSON.stringify(updatedNotes),
        }),
      });
    } catch (error) {
      console.error("Error saving notes:", error);
    }
  };

  const setStepNoteLocal = (step: number, notes: string) => {
    setStepNotes(prev => ({ ...prev, [step]: notes }));
  };

  const handlePropertyFieldChange = (field: string, value: string) => {
    setProperty((prev: any) => (prev ? { ...prev, [field]: value } : prev));
  };

  const saveStep1Fields = async () => {
    try {
      setSaving(true);
      const body = {
        numeroMatricula: property?.numeroMatricula || "",
        cadastroContribuinte: property?.cadastroContribuinte || "",
        enderecoImovel: property?.enderecoImovel || "",
        clientName: property?.clientName || "",
        contractNotes: property?.contractNotes || "",
        rgVendedores: (editableSellers || []).map(s => s.rg || "").filter(Boolean).join(","),
        cpfVendedores: (editableSellers || []).map(s => s.cpf || "").filter(Boolean).join(","),
        dataNascimentoVendedores: (editableSellers || []).map(s => s.dataNascimento || "").filter(Boolean).join(","),
        rnmComprador: (editableCompradores || []).map(c => c.rnm || "").filter(Boolean).join(","),
        cpfComprador: (editableCompradores || []).map(c => c.cpf || "").filter(Boolean).join(","),
        enderecoComprador: (editableCompradores || []).map(c => c.endereco || "").filter(Boolean).join(","),
      };
      const res = await fetch(`/api/compra-venda-imoveis?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Dados atualizados com sucesso");
        fetchProperty();
      } else {
        toast.error("Erro ao salvar dados");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar dados");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("entityType", "compra-venda");
        formData.append("moduleType", "compra_venda_imoveis");
        formData.append("entityId", id);
        formData.append("fieldName", fieldName);
        if (property?.clientName) {
          formData.append("clientName", String(property.clientName));
        }

        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          throw new Error("upload failed");
        }
        const result = await response.json();
        if (result?.document) {
          setDocuments(prev => [...prev, result.document]);
        }
      }
      toast.success("Documentos enviados com sucesso");
      // Caso algum upload não tenha retornado o documento, sincroniza lista
      // sem recarregar demais o layout
      if (!Array.from(files).some(() => false)) {
        await refreshDocuments();
      }
    } catch (error) {
      console.error("Error uploading file(s):", error);
      toast.error("Erro ao enviar documentos");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDrop = async (files: File[]) => {
    if (files.length === 0) return;
    setUploadingFile(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("entityType", "compra-venda");
        formData.append("moduleType", "compra_venda_imoveis");
        formData.append("entityId", id);
        formData.append("caseId", id);
        formData.append("name", file.name);
        formData.append("fieldName", "documentoAnexado");
        if (property?.clientName) {
          formData.append("clientName", String(property.clientName));
        }
        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          const result = await response.json();
          if (result?.document) {
            setDocuments(prev => [...prev, result.document]);
          } else {
            await refreshDocuments();
          }
        }
      }
    } catch (error) {
      console.error("Erro ao fazer upload de arquivo(s):", error);
    } finally {
      setUploadingFile(false);
      setIsDragOver(false);
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

  const handleDocumentDownload = (document: Document) => {
    if (typeof window !== 'undefined') {
      window.open(document.file_path, '_blank');
    }
  };

  const handleDocumentDelete = async (document: Document) => {
    try {
      const response = await fetch(`/api/documents/delete/${document.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== document.id));
        setDeleteDialogOpen(false);
        setDocumentToDelete(null);
      }
    } catch (error) {
      console.error("Erro ao excluir documento:", error);
    }
  };

  const handleDocumentNameChange = (name: string) => {
    setEditingDocumentName(name);
  };

  const handleDocumentNameSave = async (documentId?: string) => {
    const idToSave = (documentId ?? (editingDocumentId?.toString() || ""));
    if (!idToSave || !editingDocumentName.trim()) return;
    try {
      const response = await fetch(`/api/documents/rename/${idToSave}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_name: editingDocumentName }),
      });
      if (response.ok) {
        setDocuments(prev => prev.map(doc => doc.id.toString() === idToSave ? { ...doc, document_name: editingDocumentName } : doc));
        setEditingDocumentId(null);
        setEditingDocumentName("");
      }
    } catch (error) {
      console.error("Erro ao atualizar nome do documento:", error);
    }
  };

  const handleDocumentNameKeyPress = (e: React.KeyboardEvent, documentId: string) => {
    if (e.key === 'Enter') {
      handleDocumentNameSave(documentId);
    } else if (e.key === 'Escape') {
      setEditingDocumentId(null);
      setEditingDocumentName("");
    }
  };

  const handleDocumentDoubleClick = (document: Document) => {
    setEditingDocumentId(document.id);
    setEditingDocumentName(document.document_name || document.file_name || '');
  };

  const savePrazos = async () => {
    try {
      const res = await fetch(`/api/compra-venda-imoveis?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prazoSinal: pendingPrazoSinal || null, prazoEscritura: pendingPrazoEscritura || null })
      });
      if (res.ok) {
        toast.success("Prazos atualizados");
        fetchProperty();
      } else {
        toast.error("Erro ao salvar prazos");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar prazos");
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/compra-venda-imoveis?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Transação excluída com sucesso");
        router.push("/dashboard/compra-venda");
      } else {
        toast.error("Erro ao excluir transação");
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      toast.error("Erro ao excluir transação");
    }
  };

  const getDaysUntil = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineColor = (days: number | null) => {
    if (days === null) return "";
    if (days < 0) return "text-red-600 dark:text-red-400";
    if (days <= 7) return "text-orange-600 dark:text-orange-400";
    return "text-green-600 dark:text-green-400";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/compra-venda">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Home className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Transação não encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const daysUntilSinal = getDaysUntil(property.prazoSinal);
  const daysUntilEscritura = getDaysUntil(property.prazoEscritura);

  // Build sellers from aggregated fields
  let sellers = [] as { rg?: string; cpf?: string; dataNascimento?: string }[];
  const rgList = (property.rgVendedores || "").split(",").filter(Boolean);
  const cpfList = (property.cpfVendedores || "").split(",").filter(Boolean);
  const dobList = (property.dataNascimentoVendedores || "").split(",").filter(Boolean);
  const maxLen = Math.max(rgList.length, cpfList.length, dobList.length);
  if (maxLen > 0) {
    sellers = Array.from({ length: maxLen }, (_, i) => ({
      rg: rgList[i] || "",
      cpf: cpfList[i] || "",
      dataNascimento: dobList[i] || "",
    }));
  }

  const renderStepContent = (stepIndex: number) => {
    switch (stepIndex) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Dados do Cliente</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="clientName">Nome Completo</Label>
                  <Input id="clientName" value={property?.clientName || ""} onChange={(e) => handlePropertyFieldChange("clientName", e.target.value)} />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Matrícula do Imóvel</h4>
              <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="numeroMatricula">Nº Matrícula</Label>
                  <Input id="numeroMatricula" value={property?.numeroMatricula || ""} onChange={(e) => handlePropertyFieldChange("numeroMatricula", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cadastroContribuinte">Cadastro Contribuinte</Label>
                  <Input id="cadastroContribuinte" value={property?.cadastroContribuinte || ""} onChange={(e) => handlePropertyFieldChange("cadastroContribuinte", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enderecoImovel">Endereço do Imóvel</Label>
                  <Input id="enderecoImovel" value={property?.enderecoImovel || ""} onChange={(e) => handlePropertyFieldChange("enderecoImovel", e.target.value)} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="matricula-doc-upload">Documento da Matrícula</Label>
                  <Input
                    id="matricula-doc-upload"
                    type="file"
                    multiple
                    onChange={(e) => handleFileUpload(e, "numeroMatriculaDoc")}
                    disabled={uploading}
                    className="mt-2"
                  />
                  {renderDocLinks("numeroMatriculaDoc")}
                </div>
                <div>
                  <Label htmlFor="cadastro-contribuinte-doc-upload">Comprovante Cadastro Contribuinte</Label>
                  <Input
                    id="cadastro-contribuinte-doc-upload"
                    type="file"
                    multiple
                    onChange={(e) => handleFileUpload(e, "cadastroContribuinteDoc")}
                    disabled={uploading}
                    className="mt-2"
                  />
                  {renderDocLinks("cadastroContribuinteDoc")}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Informações dos Vendedores</h4>
              <div className="space-y-3">
                {editableSellers.map((seller, index) => (
                  <div key={index} className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-semibold mb-3">Vendedor {index + 1}</p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`seller-rg-${index}`}>RG / CNH</Label>
                        <Input id={`seller-rg-${index}`} value={seller.rg || ""} onChange={(e) => {
                          const v = e.target.value;
                          setEditableSellers(prev => prev.map((s, i) => i === index ? { ...s, rg: v } : s));
                        }} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`seller-cpf-${index}`}>CPF</Label>
                        <Input id={`seller-cpf-${index}`} value={seller.cpf || ""} onChange={(e) => {
                          const v = e.target.value;
                          setEditableSellers(prev => prev.map((s, i) => i === index ? { ...s, cpf: v } : s));
                        }} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`seller-dob-${index}`}>Data de Nascimento</Label>
                        <Input id={`seller-dob-${index}`} type="date" value={seller.dataNascimento || ""} onChange={(e) => {
                          const v = e.target.value;
                          setEditableSellers(prev => prev.map((s, i) => i === index ? { ...s, dataNascimento: v } : s));
                        }} />
                      </div>
                    </div>
                    {editableSellers.length > 1 && (
                      <div className="flex justify-end mt-3">
                        <Button variant="outline" size="sm" onClick={() => setEditableSellers(prev => prev.filter((_, i) => i !== index))}>Remover</Button>
                      </div>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setEditableSellers(prev => [...prev, { rg: "", cpf: "", dataNascimento: "" }])}>Adicionar Vendedor</Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rg-vendedores-doc-upload">Documento RG / CNH dos Vendedores</Label>
                  <Input
                    id="rg-vendedores-doc-upload"
                    type="file"
                    multiple
                    onChange={(e) => handleFileUpload(e, "rgVendedoresDoc")}
                    disabled={uploading}
                    className="mt-2"
                  />
                  {renderDocLinks("rgVendedoresDoc")}
                </div>
                <div>
                  <Label htmlFor="cpf-vendedores-doc-upload">Documento CPF dos Vendedores</Label>
                  <Input
                    id="cpf-vendedores-doc-upload"
                    type="file"
                    multiple
                    onChange={(e) => handleFileUpload(e, "cpfVendedoresDoc")}
                    disabled={uploading}
                    className="mt-2"
                  />
                  {renderDocLinks("cpfVendedoresDoc")}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Informações do Comprador</h4>
              <div className="space-y-3">
                {editableCompradores.map((comp, index) => (
                  <div key={index} className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-semibold mb-3">Comprador {index + 1}</p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`comprador-rnm-${index}`}>RNM</Label>
                        <Input id={`comprador-rnm-${index}`} value={comp.rnm || ""} onChange={(e) => {
                          const v = e.target.value;
                          setEditableCompradores(prev => prev.map((c, i) => i === index ? { ...c, rnm: v } : c));
                        }} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`comprador-cpf-${index}`}>CPF</Label>
                        <Input id={`comprador-cpf-${index}`} value={comp.cpf || ""} onChange={(e) => {
                          const v = e.target.value;
                          setEditableCompradores(prev => prev.map((c, i) => i === index ? { ...c, cpf: v } : c));
                        }} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`comprador-end-${index}`}>Endereço</Label>
                        <Input id={`comprador-end-${index}`} value={comp.endereco || ""} onChange={(e) => {
                          const v = e.target.value;
                          setEditableCompradores(prev => prev.map((c, i) => i === index ? { ...c, endereco: v } : c));
                        }} />
                      </div>
                    </div>
                    {editableCompradores.length > 1 && (
                      <div className="flex justify-end mt-3">
                        <Button variant="outline" size="sm" onClick={() => setEditableCompradores(prev => prev.filter((_, i) => i !== index))}>Remover</Button>
                      </div>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setEditableCompradores(prev => [...prev, { rnm: "", cpf: "", endereco: "" }])}>Adicionar Comprador</Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rnm-comprador-doc-upload">Documento RNM do Comprador</Label>
                  <Input
                    id="rnm-comprador-doc-upload"
                    type="file"
                    multiple
                    onChange={(e) => handleFileUpload(e, "rnmCompradorDoc")}
                    disabled={uploading}
                    className="mt-2"
                  />
                  {renderDocLinks("rnmCompradorDoc")}
                </div>
                <div>
                  <Label htmlFor="cpf-comprador-doc-upload">Documento CPF do Comprador</Label>
                  <Input
                    id="cpf-comprador-doc-upload"
                    type="file"
                    multiple
                    onChange={(e) => handleFileUpload(e, "cpfCompradorDoc")}
                    disabled={uploading}
                    className="mt-2"
                  />
                  {renderDocLinks("cpfCompradorDoc")}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractNotes">Observações</Label>
              <Textarea id="contractNotes" rows={4} value={property?.contractNotes || ""} onChange={(e) => handlePropertyFieldChange("contractNotes", e.target.value)} />
            </div>
            <Button onClick={saveStep1Fields} className="w-full" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Dados"}
            </Button>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="certidoes-upload">Upload de Certidões</Label>
              <Input
                id="certidoes-upload"
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e, "certidoesDoc")}
                disabled={uploading}
                className="mt-2"
              />
              {renderDocLinks("certidoesDoc")}
            </div>
            <Collapsible open={prazosOpen} onOpenChange={setPrazosOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">Prazos</Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="prazo-sinal">Prazo para Sinal</Label>
                    <Input id="prazo-sinal" type="date" value={pendingPrazoSinal || ""} onChange={(e) => setPendingPrazoSinal(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="prazo-escritura">Prazo para Escritura</Label>
                    <Input id="prazo-escritura" type="date" value={pendingPrazoEscritura || ""} onChange={(e) => setPendingPrazoEscritura(e.target.value)} />
                  </div>
                </div>
                <div className="mt-3">
                  <Button variant="default" size="sm" onClick={savePrazos} disabled={!pendingPrazoSinal && !pendingPrazoEscritura}>Salvar Prazos</Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
            <div className="space-y-2 mt-4">
              <Label>Observação da etapa</Label>
              <Textarea rows={3} value={stepNotes[2] || ""} onChange={(e) => setStepNoteLocal(2, e.target.value)} />
              <Button variant="default" size="sm" onClick={async () => { await handleNotesChange(2, stepNotes[2] || ""); toast.success("Notas salvas com sucesso"); }}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Observação
              </Button>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="contrato-upload">Upload do Contrato</Label>
              <Input
                id="contrato-upload"
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e, "contratoDoc")}
                disabled={uploading}
                className="mt-2"
              />
              {renderDocLinks("contratoDoc")}
            </div>
            <div className="space-y-2 mt-4">
              <Label>Observação da etapa</Label>
              <Textarea rows={3} value={stepNotes[3] || ""} onChange={(e) => setStepNoteLocal(3, e.target.value)} />
              <Button variant="default" size="sm" onClick={async () => { await handleNotesChange(3, stepNotes[3] || ""); toast.success("Notas salvas com sucesso"); }}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Observação
              </Button>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="contrato-assinado-upload">
                Upload do Contrato Assinado
              </Label>
              <Input
                id="contrato-assinado-upload"
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e, "assinaturaContratoDoc")}
                disabled={uploading}
                className="mt-2"
              />
              {renderDocLinks("assinaturaContratoDoc")}
            </div>
            <div className="space-y-2 mt-4">
              <Label>Observação da etapa</Label>
              <Textarea rows={3} value={stepNotes[4] || ""} onChange={(e) => setStepNoteLocal(4, e.target.value)} />
              <Button variant="default" size="sm" onClick={async () => { await handleNotesChange(4, stepNotes[4] || ""); toast.success("Notas salvas com sucesso"); }}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Observação
              </Button>
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Prazo para Sinal</p>
                <p className="text-sm font-medium">
                  {property.prazoSinal
                    ? new Date(property.prazoSinal).toLocaleDateString("pt-BR")
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Prazo para Escritura</p>
                <p className="text-sm font-medium">
                  {property.prazoEscritura
                    ? new Date(property.prazoEscritura).toLocaleDateString("pt-BR")
                    : "-"}
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="escritura-upload">Upload da Escritura</Label>
              <Input
                id="escritura-upload"
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e, "escrituraDoc")}
                disabled={uploading}
                className="mt-2"
              />
              {renderDocLinks("escrituraDoc")}
            </div>
            <div className="space-y-2 mt-4">
              <Label>Observação da etapa</Label>
              <Textarea rows={3} value={stepNotes[5] || ""} onChange={(e) => setStepNoteLocal(5, e.target.value)} />
              <Button variant="default" size="sm" onClick={async () => { await handleNotesChange(5, stepNotes[5] || ""); toast.success("Notas salvas com sucesso"); }}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Observação
              </Button>
            </div>
          </div>
        );
      
      case 6:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="matricula-cartorio-upload">
                Upload da Matrícula do Cartório
              </Label>
              <Input
                id="matricula-cartorio-upload"
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e, "matriculaCartorioDoc")}
                disabled={uploading}
                className="mt-2"
              />
              {renderDocLinks("matriculaCartorioDoc")}
            </div>
            <div className="space-y-2 mt-4">
              <Label>Observação da etapa</Label>
              <Textarea rows={3} value={stepNotes[6] || ""} onChange={(e) => setStepNoteLocal(6, e.target.value)} />
              <Button variant="default" size="sm" onClick={async () => { await handleNotesChange(6, stepNotes[6] || ""); toast.success("Notas salvas com sucesso"); }}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Observação
              </Button>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Processo finalizado</p>
            </div>
            <div className="space-y-2 mt-2">
              <Label>Observação da etapa</Label>
              <Textarea rows={3} value={stepNotes[7] || ""} onChange={(e) => setStepNoteLocal(7, e.target.value)} />
              <Button variant="default" size="sm" onClick={async () => { await handleNotesChange(7, stepNotes[7] || ""); toast.success("Notas salvas com sucesso"); }}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Observação
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const currentStepTitle = WORKFLOW_STEPS.find((s) => s.id === currentStep)?.title || "";

  return (
    <div className="space-y-6 w-full">
      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar mudança de status</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja alterar o status para "{pendingStatus}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPendingStatus(""); setStatusDialogOpen(false); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DetailLayout
        backHref="/dashboard/compra-venda"
        title={property?.clientName || "Cliente não informado"}
        subtitle={property?.enderecoImovel || "Transação Imobiliária"}
        onDelete={handleDelete}
        left={
          <div className="space-y-6">
            {/* Workflow Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Fluxo do Processo</CardTitle>
                <div className="text-xs text-muted-foreground">Etapa {currentStep}: {currentStepTitle}</div>
              </CardHeader>
              <CardContent className="space-y-4">
                {WORKFLOW_STEPS.map((step) => (
                  <StepItem
                    key={step.id}
                    index={step.id}
                    title={step.title}
                    isCurrent={currentStep === step.id}
                    isCompleted={completedSteps.includes(step.id)}
                    isPending={currentStep < step.id}
                    expanded={expandedStepId === step.id}
                    onToggle={() => setExpandedStepId((prev) => (prev === step.id ? undefined : step.id))}
                    onMarkComplete={() => toggleStepCompletion(step.id)}
                    onMarkIncomplete={() => toggleStepCompletion(step.id)}
                    assignment={assignments[step.id]}
                    onSaveAssignment={async (a) => handleSaveAssignment(step.id, a.responsibleName, a.dueDate)}
                    canAssign={!step.title.toLowerCase().includes("cadastro")}
                    extraBadges={step.id === 2 ? [
                      ...(property?.prazoSinal ? [{ label: `Sinal: ${new Date(property.prazoSinal).toLocaleDateString('pt-BR')}` }] : []),
                      ...(property?.prazoEscritura ? [{ label: `Escritura: ${new Date(property.prazoEscritura).toLocaleDateString('pt-BR')}` }] : []),
                    ] : []}
                  >
                    {renderStepContent(step.id)}
                  </StepItem>
                ))}
              </CardContent>
            </Card>

          </div>
        }
        right={
          <div className="space-y-6">
            <StatusPanel
              status={pendingStatus || status}
              onStatusChange={handleStatusChange}
              currentStep={currentStep}
              totalSteps={WORKFLOW_STEPS.length}
              currentStepTitle={currentStepTitle}
              createdAt={property?.createdAt}
              updatedAt={property?.updatedAt}
            />

            <DocumentPanel
              onDropFiles={handleDrop}
              uploading={uploadingFile}
              documents={documents}
              loadingDocuments={loadingDocuments}
              isDragOver={isDragOver}
              onDocumentDownload={handleDocumentDownload}
              onDocumentDelete={(doc) => { setDocumentToDelete(doc); setDeleteDialogOpen(true); }}
              editingDocumentId={editingDocumentId}
              editingDocumentName={editingDocumentName}
              onDocumentNameChange={handleDocumentNameChange}
              onDocumentNameSave={(docId) => handleDocumentNameSave(docId)}
              onDocumentNameKeyPress={handleDocumentNameKeyPress}
              onDocumentDoubleClick={handleDocumentDoubleClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            />

            {/* Deadlines Card */}
            {(property?.prazoSinal || property?.prazoEscritura) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Prazos Importantes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {property.prazoSinal && (
                    <div className="flex items-start gap-3">
                      {daysUntilSinal !== null && daysUntilSinal <= 7 && (
                        <AlertTriangle className="h-5 w-5 text-orange-600 mt-1" />
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Prazo para Sinal</p>
                        <p
                          className={`text-lg font-semibold ${getDeadlineColor(
                            daysUntilSinal
                          )}`}
                        >
                          {new Date(property.prazoSinal).toLocaleDateString("pt-BR")}
                          {daysUntilSinal !== null && (
                            <span className="text-sm ml-2">
                              ({daysUntilSinal > 0 ? `${daysUntilSinal} dias` : "Vencido"})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  {property.prazoEscritura && (
                    <div className="flex items-start gap-3">
                      {daysUntilEscritura !== null && daysUntilEscritura <= 7 && (
                        <AlertTriangle className="h-5 w-5 text-orange-600 mt-1" />
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Prazo para Escritura</p>
                        <p
                          className={`text-lg font-semibold ${getDeadlineColor(
                            daysUntilEscritura
                          )}`}
                        >
                          {new Date(property.prazoEscritura).toLocaleDateString("pt-BR")}
                          {daysUntilEscritura !== null && (
                            <span className="text-sm ml-2">
                              ({daysUntilEscritura > 0 ? `${daysUntilEscritura} dias` : "Vencido"})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            
            {/* Notes Panel */}
            <NotesPanel
              notes={stepNotes[currentStep] || ""}
              onChange={(notes) => handleNotesChange(currentStep, notes)}
              onSave={() => toast.success("Notas salvas com sucesso")}
            />
          </div>
        }
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o documento "{documentToDelete?.document_name || documentToDelete?.file_name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => documentToDelete && handleDocumentDelete(documentToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
