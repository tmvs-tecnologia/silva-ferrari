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
      setStatus(data.status || "Em andamento");
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

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("entityType", "compra-venda");
    formData.append("moduleType", "compra_venda_imoveis");
    formData.append("entityId", id);
    formData.append("fieldName", fieldName);
    if (property?.clientName) {
      formData.append("clientName", String(property.clientName));
    }

    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("Documento enviado com sucesso");
        fetchProperty();
      } else {
        toast.error("Erro ao enviar documento");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Erro ao enviar documento");
    } finally {
      setUploading(false);
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Matrícula do Imóvel</h4>
              <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Nº Matrícula</p>
                  <p className="text-sm font-medium">{property.numeroMatricula || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cadastro Contribuinte</p>
                  <p className="text-sm font-medium">{property.cadastroContribuinte || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Endereço do Imóvel</p>
                  <p className="text-sm font-medium">{property.enderecoImovel || "-"}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="matricula-doc-upload">Documento da Matrícula</Label>
                  <Input
                    id="matricula-doc-upload"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "numeroMatriculaDoc")}
                    disabled={uploading}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="cadastro-contribuinte-doc-upload">Comprovante Cadastro Contribuinte</Label>
                  <Input
                    id="cadastro-contribuinte-doc-upload"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "cadastroContribuinteDoc")}
                    disabled={uploading}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Informações dos Vendedores</h4>
              {sellers.length > 0 ? (
                <div className="space-y-3">
                  {sellers.map((seller: any, index: number) => (
                    <div key={index} className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-semibold mb-3">Vendedor {index + 1}</p>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">RG / CNH</p>
                          <p className="text-sm font-medium">{seller.rg || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">CPF</p>
                          <p className="text-sm font-medium">{seller.cpf || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Data de Nascimento</p>
                          <p className="text-sm font-medium">
                            {seller.dataNascimento 
                              ? new Date(seller.dataNascimento).toLocaleDateString("pt-BR")
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum vendedor cadastrado</p>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rg-vendedores-doc-upload">Documento RG / CNH dos Vendedores</Label>
                  <Input
                    id="rg-vendedores-doc-upload"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "rgVendedoresDoc")}
                    disabled={uploading}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="cpf-vendedores-doc-upload">Documento CPF dos Vendedores</Label>
                  <Input
                    id="cpf-vendedores-doc-upload"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "cpfVendedoresDoc")}
                    disabled={uploading}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Informações do Comprador</h4>
              <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">RNM Comprador</p>
                  <p className="text-sm font-medium">{property.rnmComprador || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CPF Comprador</p>
                  <p className="text-sm font-medium">{property.cpfComprador || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Endereço Comprador</p>
                  <p className="text-sm font-medium">{property.enderecoComprador || "-"}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rnm-comprador-doc-upload">Documento RNM do Comprador</Label>
                  <Input
                    id="rnm-comprador-doc-upload"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "rnmCompradorDoc")}
                    disabled={uploading}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="cpf-comprador-doc-upload">Documento CPF do Comprador</Label>
                  <Input
                    id="cpf-comprador-doc-upload"
                    type="file"
                    onChange={(e) => handleFileUpload(e, "cpfCompradorDoc")}
                    disabled={uploading}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
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
                onChange={(e) => handleFileUpload(e, "certidoesDoc")}
                disabled={uploading}
                className="mt-2"
              />
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
                onChange={(e) => handleFileUpload(e, "contratoDoc")}
                disabled={uploading}
                className="mt-2"
              />
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
                onChange={(e) => handleFileUpload(e, "assinaturaContratoDoc")}
                disabled={uploading}
                className="mt-2"
              />
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
                onChange={(e) => handleFileUpload(e, "escrituraDoc")}
                disabled={uploading}
                className="mt-2"
              />
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
                onChange={(e) => handleFileUpload(e, "matriculaCartorioDoc")}
                disabled={uploading}
                className="mt-2"
              />
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Processo finalizado</p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

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
        title={property?.enderecoImovel || "Transação Imobiliária"}
        subtitle={property?.clientName || "Cliente não informado"}
        onDelete={handleDelete}
        left={
          <div className="space-y-6">
            {/* Workflow Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Fluxo do Processo</CardTitle>
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
                    expanded={currentStep === step.id}
                    onToggle={() => {}}
                    onMarkComplete={() => toggleStepCompletion(step.id)}
                    onMarkIncomplete={() => toggleStepCompletion(step.id)}
                    assignment={assignments[step.id]}
                    onSaveAssignment={async (a) => handleSaveAssignment(step.id, a.responsibleName, a.dueDate)}
                    canAssign={!step.title.toLowerCase().includes("cadastro")}
                  >
                    {currentStep === step.id && renderStepContent()}
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
              createdAt={property?.createdAt}
              updatedAt={property?.updatedAt}
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
    </div>
  );
}
