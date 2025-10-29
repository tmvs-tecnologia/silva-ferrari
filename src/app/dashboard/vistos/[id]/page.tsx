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
  ArrowLeft,
  Save,
  Trash2,
  FileText,
  Upload,
  Download,
  Globe,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";
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

interface Visto {
  id: number;
  clientName: string;
  type: string;
  cpf: string | null;
  rnm: string | null;
  passaporte: string | null;
  comprovanteEndereco: string | null;
  certidaoNascimentoFilhos: string | null;
  cartaoCnpj: string | null;
  contratoEmpresa: string | null;
  escrituraImoveis: string | null;
  reservasPassagens: string | null;
  reservasHotel: string | null;
  seguroViagem: string | null;
  roteiroViagem: string | null;
  taxa: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function VistoDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [visto, setVisto] = useState<Visto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [openSections, setOpenSections] = useState({
    basic: true,
    personal: true,
    financial: true,
    travel: true,
    additional: true,
  });

  useEffect(() => {
    if (id) {
      fetchVisto();
    }
  }, [id]);

  const fetchVisto = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vistos?id=${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch visto");
      }
      const data = await response.json();
      setVisto(data);
    } catch (error) {
      console.error("Error fetching visto:", error);
      toast.error("Erro ao carregar dados do visto");
      router.push("/dashboard/vistos");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!visto) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/vistos?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(visto),
      });

      if (!response.ok) {
        throw new Error("Failed to update visto");
      }

      toast.success("Visto atualizado com sucesso!");
      fetchVisto();
    } catch (error) {
      console.error("Error updating visto:", error);
      toast.error("Erro ao atualizar visto");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/vistos?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete visto");
      }

      toast.success("Visto excluído com sucesso!");
      router.push("/dashboard/vistos");
    } catch (error) {
      console.error("Error deleting visto:", error);
      toast.error("Erro ao excluir visto");
    } finally {
      setDeleting(false);
    }
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Em Andamento":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
      case "Finalizado":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
      case "Aguardando":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Turismo":
        return "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300";
      case "Trabalho":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300";
      case "Investidor":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!visto) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/vistos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{visto.clientName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getTypeColor(visto.type)}>{visto.type}</Badge>
              <Badge className={getStatusColor(visto.status)}>
                {visto.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? "Excluindo..." : "Excluir"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este visto? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleSection("basic")}
          >
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Informações Básicas
              </span>
              {openSections.basic ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </CardTitle>
          </CardHeader>
          {openSections.basic && (
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="clientName">Nome do Cliente</Label>
                <Input
                  id="clientName"
                  value={visto.clientName}
                  onChange={(e) =>
                    setVisto({ ...visto, clientName: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="type">Tipo de Visto</Label>
                <Select
                  value={visto.type}
                  onValueChange={(value) => setVisto({ ...visto, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Turismo">Turismo</SelectItem>
                    <SelectItem value="Trabalho">Trabalho</SelectItem>
                    <SelectItem value="Investidor">Investidor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={visto.status}
                  onValueChange={(value) =>
                    setVisto({ ...visto, status: value })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Aguardando">Aguardando</SelectItem>
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="createdAt">Data de Criação</Label>
                <Input
                  id="createdAt"
                  value={new Date(visto.createdAt).toLocaleDateString("pt-BR")}
                  disabled
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Documentos Pessoais */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleSection("personal")}
          >
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos Pessoais
              </span>
              {openSections.personal ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </CardTitle>
          </CardHeader>
          {openSections.personal && (
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={visto.cpf || ""}
                  onChange={(e) => setVisto({ ...visto, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <Label htmlFor="rnm">RNM</Label>
                <Input
                  id="rnm"
                  value={visto.rnm || ""}
                  onChange={(e) => setVisto({ ...visto, rnm: e.target.value })}
                  placeholder="RNM do cliente"
                />
              </div>

              <div>
                <Label htmlFor="passaporte">Passaporte</Label>
                <Input
                  id="passaporte"
                  value={visto.passaporte || ""}
                  onChange={(e) =>
                    setVisto({ ...visto, passaporte: e.target.value })
                  }
                  placeholder="Número do passaporte"
                />
              </div>

              <div>
                <Label htmlFor="comprovanteEndereco">
                  Comprovante de Endereço
                </Label>
                <Input
                  id="comprovanteEndereco"
                  value={visto.comprovanteEndereco || ""}
                  onChange={(e) =>
                    setVisto({ ...visto, comprovanteEndereco: e.target.value })
                  }
                  placeholder="Documento de comprovante"
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Comprovação Financeira */}
        {visto.type === "Turismo" && (
          <Card>
            <CardHeader
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleSection("financial")}
            >
              <CardTitle className="flex items-center justify-between">
                <span>Comprovação Financeira (PF)</span>
                {openSections.financial ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </CardTitle>
            </CardHeader>
            {openSections.financial && (
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="certidaoNascimentoFilhos">
                    Certidão de Nascimento dos Filhos
                  </Label>
                  <Input
                    id="certidaoNascimentoFilhos"
                    value={visto.certidaoNascimentoFilhos || ""}
                    onChange={(e) =>
                      setVisto({
                        ...visto,
                        certidaoNascimentoFilhos: e.target.value,
                      })
                    }
                    placeholder="Certidões (se aplicável)"
                  />
                </div>

                <div>
                  <Label htmlFor="cartaoCnpj">Cartão CNPJ</Label>
                  <Input
                    id="cartaoCnpj"
                    value={visto.cartaoCnpj || ""}
                    onChange={(e) =>
                      setVisto({ ...visto, cartaoCnpj: e.target.value })
                    }
                    placeholder="CNPJ da empresa"
                  />
                </div>

                <div>
                  <Label htmlFor="contratoEmpresa">Contrato da Empresa</Label>
                  <Input
                    id="contratoEmpresa"
                    value={visto.contratoEmpresa || ""}
                    onChange={(e) =>
                      setVisto({ ...visto, contratoEmpresa: e.target.value })
                    }
                    placeholder="Documento do contrato"
                  />
                </div>

                <div>
                  <Label htmlFor="escrituraImoveis">
                    Escritura/Matrícula de Imóveis
                  </Label>
                  <Input
                    id="escrituraImoveis"
                    value={visto.escrituraImoveis || ""}
                    onChange={(e) =>
                      setVisto({ ...visto, escrituraImoveis: e.target.value })
                    }
                    placeholder="Documentos de imóveis"
                  />
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Documentos de Viagem */}
        {visto.type === "Turismo" && (
          <Card>
            <CardHeader
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleSection("travel")}
            >
              <CardTitle className="flex items-center justify-between">
                <span>Documentos de Viagem</span>
                {openSections.travel ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </CardTitle>
            </CardHeader>
            {openSections.travel && (
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="reservasPassagens">Reservas de Passagens</Label>
                  <Input
                    id="reservasPassagens"
                    value={visto.reservasPassagens || ""}
                    onChange={(e) =>
                      setVisto({ ...visto, reservasPassagens: e.target.value })
                    }
                    placeholder="Confirmação de passagens"
                  />
                </div>

                <div>
                  <Label htmlFor="reservasHotel">Reservas de Hotel</Label>
                  <Input
                    id="reservasHotel"
                    value={visto.reservasHotel || ""}
                    onChange={(e) =>
                      setVisto({ ...visto, reservasHotel: e.target.value })
                    }
                    placeholder="Confirmação de hospedagem"
                  />
                </div>

                <div>
                  <Label htmlFor="seguroViagem">Seguro Viagem</Label>
                  <Input
                    id="seguroViagem"
                    value={visto.seguroViagem || ""}
                    onChange={(e) =>
                      setVisto({ ...visto, seguroViagem: e.target.value })
                    }
                    placeholder="Apólice de seguro"
                  />
                </div>

                <div>
                  <Label htmlFor="taxa">Taxa</Label>
                  <Input
                    id="taxa"
                    value={visto.taxa || ""}
                    onChange={(e) => setVisto({ ...visto, taxa: e.target.value })}
                    placeholder="Comprovante de pagamento"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="roteiroViagem">Roteiro de Viagem Detalhado</Label>
                  <Textarea
                    id="roteiroViagem"
                    value={visto.roteiroViagem || ""}
                    onChange={(e) =>
                      setVisto({ ...visto, roteiroViagem: e.target.value })
                    }
                    placeholder="Descreva o roteiro completo da viagem..."
                    rows={4}
                  />
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Documentos Trabalho/Investidor */}
        {(visto.type === "Trabalho" || visto.type === "Investidor") && (
          <Card>
            <CardHeader
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleSection("additional")}
            >
              <CardTitle className="flex items-center justify-between">
                <span>Documentação Adicional</span>
                {openSections.additional ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </CardTitle>
            </CardHeader>
            {openSections.additional && (
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Campos específicos para {visto.type} serão implementados em breve.
                </p>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}