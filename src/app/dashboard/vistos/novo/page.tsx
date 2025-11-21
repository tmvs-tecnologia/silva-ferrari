"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

export default function NovoVistoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    documentosPessoais: true,
    comprovacaoFinanceira: true,
    outrosDocumentos: true,
  });
  const [formData, setFormData] = useState({
    clientName: "",
    type: "Turismo",
    cpf: "",
    rnm: "",
    passaporte: "",
    comprovanteEndereco: "",
    certidaoNascimentoFilhos: "",
    cartaoCnpj: "",
    contratoEmpresa: "",
    escrituraImoveis: "",
    reservasPassagens: "",
    reservasHotel: "",
    seguroViagem: "",
    roteiroViagem: "",
    taxa: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/vistos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: "Em Andamento",
        }),
      });

      if (response.ok) {
        router.push("/dashboard/vistos");
      } else {
        alert("Erro ao criar visto");
      }
    } catch (error) {
      console.error("Error creating visto:", error);
      alert("Erro ao criar visto");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="space-y-8 w-full px-4 py-8">
      {/* Header Elegante */}
      <div className="flex items-center gap-6 pb-6 border-b-2 border-primary/20">
        <Link href="/dashboard/vistos">
          <Button 
            variant="ghost" 
            size="icon"
            className="hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-semibold text-foreground tracking-tight">Novo Visto</h1>
          <p className="text-muted-foreground mt-1 text-base">
            Cadastre um novo processo de visto com elegância e organização
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 dark:from-slate-900 dark:to-slate-800 border-b">
            <CardTitle className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              Informações do Visto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 p-8">
            {/* Informações Básicas */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="clientName" className="text-base font-medium text-foreground">
                  Nome do Cliente <span className="text-primary">*</span>
                </Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => handleChange("clientName", e.target.value)}
                  required
                  className="h-12 border-2 focus:border-primary transition-colors"
                  placeholder="Digite o nome completo do cliente"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="type" className="text-base font-medium text-foreground">
                  Tipo de Visto <span className="text-primary">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange("type", value)}
                >
                <SelectTrigger className="h-12 border-2 focus:border-cyan-500">
                  <SelectValue />
                </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Turismo">Turismo</SelectItem>
                    <SelectItem value="Trabalho">Trabalho</SelectItem>
                    <SelectItem value="Investidor">Investidor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.type === "Turismo" && (
              <div className="space-y-6 mt-8">
                {/* 1 - Documentos Pessoais */}
                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("documentosPessoais")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                          1
                        </span>
                        <CardTitle className="text-lg font-semibold">Documentos Pessoais</CardTitle>
                      </div>
                      {expandedSections.documentosPessoais ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.documentosPessoais && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="cpf" className="text-sm font-medium">CPF</Label>
                          <Input
                            id="cpf"
                            value={formData.cpf}
                            onChange={(e) => handleChange("cpf", e.target.value)}
                            placeholder="Status ou informações do documento"
                          className="h-11 border-2 focus:border-cyan-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rnm" className="text-sm font-medium">RNM</Label>
                          <Input
                            id="rnm"
                            value={formData.rnm}
                            onChange={(e) => handleChange("rnm", e.target.value)}
                            placeholder="Status ou informações do documento"
                          className="h-11 border-2 focus:border-cyan-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="passaporte" className="text-sm font-medium">Passaporte</Label>
                          <Input
                            id="passaporte"
                            value={formData.passaporte}
                            onChange={(e) => handleChange("passaporte", e.target.value)}
                            placeholder="Status ou informações do documento"
                          className="h-11 border-2 focus:border-cyan-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="comprovanteEndereco" className="text-sm font-medium">
                            Comprovante de Endereço / Declaração
                          </Label>
                          <Input
                            id="comprovanteEndereco"
                            value={formData.comprovanteEndereco}
                            onChange={(e) =>
                              handleChange("comprovanteEndereco", e.target.value)
                            }
                            placeholder="Status ou informações do documento"
                          className="h-11 border-2 focus:border-cyan-500"
                          />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* 2 - Comprovação Financeira PF */}
                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("comprovacaoFinanceira")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                          2
                        </span>
                        <CardTitle className="text-lg font-semibold">Comprovação Financeira PF</CardTitle>
                      </div>
                      {expandedSections.comprovacaoFinanceira ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.comprovacaoFinanceira && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="certidaoNascimentoFilhos" className="text-sm font-medium">
                            Filhos (Certidão de Nascimento)
                          </Label>
                          <Input
                            id="certidaoNascimentoFilhos"
                            value={formData.certidaoNascimentoFilhos}
                            onChange={(e) =>
                              handleChange("certidaoNascimentoFilhos", e.target.value)
                            }
                            placeholder="Status ou informações do documento"
                            className="h-11 border-2 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cartaoCnpj" className="text-sm font-medium">
                            Empresa (Cartão CNPJ / Contrato)
                          </Label>
                          <Input
                            id="cartaoCnpj"
                            value={formData.cartaoCnpj}
                            onChange={(e) =>
                              handleChange("cartaoCnpj", e.target.value)
                            }
                            placeholder="Status ou informações do documento"
                            className="h-11 border-2 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="escrituraImoveis" className="text-sm font-medium">
                            Imóveis (Escritura/Matrícula)
                          </Label>
                          <Input
                            id="escrituraImoveis"
                            value={formData.escrituraImoveis}
                            onChange={(e) =>
                              handleChange("escrituraImoveis", e.target.value)
                            }
                            placeholder="Status ou informações do documento"
                            className="h-11 border-2 focus:border-primary"
                          />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* 3 - Outros Documentos */}
                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("outrosDocumentos")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                          3
                        </span>
                        <CardTitle className="text-lg font-semibold">Outros Documentos</CardTitle>
                      </div>
                      {expandedSections.outrosDocumentos ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.outrosDocumentos && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="reservasPassagens" className="text-sm font-medium">
                            Reservas de Passagens
                          </Label>
                          <Input
                            id="reservasPassagens"
                            value={formData.reservasPassagens}
                            onChange={(e) =>
                              handleChange("reservasPassagens", e.target.value)
                            }
                            placeholder="Status ou informações do documento"
                            className="h-11 border-2 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reservasHotel" className="text-sm font-medium">
                            Reservas de Hotel
                          </Label>
                          <Input
                            id="reservasHotel"
                            value={formData.reservasHotel}
                            onChange={(e) =>
                              handleChange("reservasHotel", e.target.value)
                            }
                            placeholder="Status ou informações do documento"
                            className="h-11 border-2 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="seguroViagem" className="text-sm font-medium">
                            Seguro Viagem
                          </Label>
                          <Input
                            id="seguroViagem"
                            value={formData.seguroViagem}
                            onChange={(e) =>
                              handleChange("seguroViagem", e.target.value)
                            }
                            placeholder="Status ou informações do documento"
                            className="h-11 border-2 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="roteiroViagem" className="text-sm font-medium">
                            Roteiro de Viagem Detalhado
                          </Label>
                          <Input
                            id="roteiroViagem"
                            value={formData.roteiroViagem}
                            onChange={(e) =>
                              handleChange("roteiroViagem", e.target.value)
                            }
                            placeholder="Status ou informações do documento"
                            className="h-11 border-2 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="taxa" className="text-sm font-medium">Taxa</Label>
                          <Input
                            id="taxa"
                            value={formData.taxa}
                            onChange={(e) => handleChange("taxa", e.target.value)}
                            placeholder="Status ou informações do documento"
                            className="h-11 border-2 focus:border-primary"
                          />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            )}

            {(formData.type === "Trabalho" || formData.type === "Investidor") && (
              <div className="space-y-6 mt-8">
                <div className="flex items-center gap-3 pb-4 border-b-2 border-primary/20">
                  <span className="w-1 h-6 bg-primary rounded-full"></span>
                  <h3 className="text-xl font-semibold">Documentos Empresariais</h3>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cartaoCnpj" className="text-sm font-medium">Cartão CNPJ</Label>
                    <Input
                      id="cartaoCnpj"
                      value={formData.cartaoCnpj}
                      onChange={(e) =>
                        handleChange("cartaoCnpj", e.target.value)
                      }
                      placeholder="Status ou informações do documento"
                      className="h-11 border-2 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contratoEmpresa" className="text-sm font-medium">
                      Contrato da Empresa
                    </Label>
                    <Input
                      id="contratoEmpresa"
                      value={formData.contratoEmpresa}
                      onChange={(e) =>
                        handleChange("contratoEmpresa", e.target.value)
                      }
                      placeholder="Status ou informações do documento"
                      className="h-11 border-2 focus:border-primary"
                    />
                  </div>
                  {formData.type === "Investidor" && (
                    <div className="space-y-2">
                      <Label htmlFor="escrituraImoveis" className="text-sm font-medium">
                        Escritura de Imóveis
                      </Label>
                      <Input
                        id="escrituraImoveis"
                        value={formData.escrituraImoveis}
                        onChange={(e) =>
                          handleChange("escrituraImoveis", e.target.value)
                        }
                        placeholder="Status ou informações do documento"
                        className="h-11 border-2 focus:border-primary"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-4 justify-end pt-6 border-t-2 border-border">
              <Link href="/dashboard/vistos">
                <Button 
                  type="button" 
                  variant="outline" 
                  disabled={loading}
                className="h-12 px-4 border-2 hover:bg-muted transition-colors"
                >
                  Cancelar
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={loading}
                className="h-12 px-4 bg-primary hover:bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Salvando..." : "Salvar Visto"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}