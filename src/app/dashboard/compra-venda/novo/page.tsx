"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import Link from "next/link";
 

interface Vendedor {
  rg: string;
  cpf: string;
  dataNascimento: string;
}

export default function NovaCompraVendaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vendedores, setVendedores] = useState<Vendedor[]>([
    { rg: "", cpf: "", dataNascimento: "" }
  ]);
  const [tempUploads, setTempUploads] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    clientName: "",
    tipoTransacao: "compra",
    numeroMatricula: "",
    cadastroContribuinte: "",
    enderecoImovel: "",
    rnmComprador: "",
    cpfComprador: "",
    enderecoComprador: "",
    prazoSinal: "",
    prazoEscritura: "",
    contractNotes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/compra-venda-imoveis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          rgVendedores: vendedores.map(v => v.rg).filter(Boolean).join(","),
          cpfVendedores: vendedores.map(v => v.cpf).filter(Boolean).join(","),
          dataNascimentoVendedores: vendedores.map(v => v.dataNascimento).filter(Boolean).join(","),
          currentStep: 2,
          status: "Em Andamento",
          completedSteps: JSON.stringify([1]),
        }),
      });

      if (response.ok) {
        const created = await response.json();
        // Converter uploads temporários, se existirem
        if (created?.id && Object.keys(tempUploads).length > 0) {
          const documents = Object.entries(tempUploads).map(([fieldName, fileUrl]) => ({ fieldName, fileUrl }));
          await fetch('/api/documents/convert-temporary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              caseId: String(created.id),
              moduleType: 'compra_venda_imoveis',
              clientName: formData.clientName || 'Cliente',
              documents,
            })
          });
        }
        router.push("/dashboard/compra-venda");
      } else {
        alert("Erro ao criar transação");
      }
    } catch (error) {
      console.error("Error creating property:", error);
      alert("Erro ao criar transação");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTempUpload = async (fieldName: string, file: File | null) => {
    try {
      if (!file) return;
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        if (data?.fileUrl) {
          setTempUploads(prev => ({ ...prev, [fieldName]: data.fileUrl }));
        }
      }
    } catch (err) {
      console.error('Erro em upload temporário:', err);
    }
  };

  const handleVendedorChange = (index: number, field: keyof Vendedor, value: string) => {
    const updatedVendedores = [...vendedores];
    updatedVendedores[index][field] = value;
    setVendedores(updatedVendedores);
  };

  const addVendedor = () => {
    setVendedores([...vendedores, { rg: "", cpf: "", dataNascimento: "" }]);
  };

  const removeVendedor = (index: number) => {
    if (vendedores.length > 1) {
      setVendedores(vendedores.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/compra-venda">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nova ação</h1>
          <p className="text-muted-foreground">
            Cadastre uma nova transação imobiliária
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-slate-900 dark:to-slate-800 border-b">
            <CardTitle className="text-2xl font-semibold">Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="clientName">Nome Completo</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => handleChange("clientName", e.target.value)}
                  placeholder="Digite o nome completo do cliente"
                  className="h-12 border-2 focus:border-emerald-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-slate-900 dark:to-slate-800 border-b">
            <CardTitle className="text-2xl font-semibold">Informações de Compra e Venda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 p-8">
            {/* Property Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="numeroMatricula">Nº Matrícula</Label>
                <Input
                  id="numeroMatricula"
                  value={formData.numeroMatricula}
                  onChange={(e) =>
                    handleChange("numeroMatricula", e.target.value)
                  }
                  className="h-12 border-2 focus:border-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cadastroContribuinte">
                  Cadastro Contribuinte
                </Label>
                <Input
                  id="cadastroContribuinte"
                  value={formData.cadastroContribuinte}
                  onChange={(e) =>
                    handleChange("cadastroContribuinte", e.target.value)
                  }
                  className="h-12 border-2 focus:border-emerald-500"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="enderecoImovel">Endereço do Imóvel</Label>
                <Input
                  id="enderecoImovel"
                  value={formData.enderecoImovel}
                  onChange={(e) =>
                    handleChange("enderecoImovel", e.target.value)
                  }
                  className="h-12 border-2 focus:border-emerald-500"
                />
              </div>
            </div>
            {/* Uploads do Imóvel */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="numeroMatriculaDoc">Documento da Matrícula</Label>
                <Input
                  id="numeroMatriculaDoc"
                  type="file"
                  onChange={(e) => handleTempUpload('numeroMatriculaDoc', e.target.files?.[0] || null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cadastroContribuinteDoc">Comprovante Cadastro Contribuinte</Label>
                <Input
                  id="cadastroContribuinteDoc"
                  type="file"
                  onChange={(e) => handleTempUpload('cadastroContribuinteDoc', e.target.files?.[0] || null)}
                />
              </div>
            </div>

          {/* Seller Info */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Informações dos Vendedores</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addVendedor}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {vendedores.map((vendedor, index) => (
                <div key={index} className="relative border rounded-lg p-4 space-y-4">
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => removeVendedor(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Vendedor {index + 1}
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`rgVendedor${index}`}>RG / CNH</Label>
                      <Input
                        id={`rgVendedor${index}`}
                        value={vendedor.rg}
                        onChange={(e) =>
                          handleVendedorChange(index, "rg", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`cpfVendedor${index}`}>CPF</Label>
                      <Input
                        id={`cpfVendedor${index}`}
                        value={vendedor.cpf}
                        onChange={(e) =>
                          handleVendedorChange(index, "cpf", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`dataNascimentoVendedor${index}`}>
                        Data de Nascimento
                      </Label>
                      <Input
                        id={`dataNascimentoVendedor${index}`}
                        type="date"
                        value={vendedor.dataNascimento}
                        onChange={(e) =>
                          handleVendedorChange(index, "dataNascimento", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
              {/* Uploads dos vendedores (documentos agregados) */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rgVendedoresDoc">Documento RG / CNH dos Vendedores</Label>
                  <Input
                    id="rgVendedoresDoc"
                    type="file"
                    onChange={(e) => handleTempUpload('rgVendedoresDoc', e.target.files?.[0] || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpfVendedoresDoc">Documento CPF dos Vendedores</Label>
                  <Input
                    id="cpfVendedoresDoc"
                    type="file"
                    onChange={(e) => handleTempUpload('cpfVendedoresDoc', e.target.files?.[0] || null)}
                  />
                </div>
              </div>
            </div>

            {/* Buyer Info */}
            <div className="space-y-4">
              <h3 className="font-semibold">Informações do Comprador</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rnmComprador">RNM</Label>
                  <Input
                    id="rnmComprador"
                    value={formData.rnmComprador}
                    onChange={(e) =>
                      handleChange("rnmComprador", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpfComprador">CPF</Label>
                  <Input
                    id="cpfComprador"
                    value={formData.cpfComprador}
                    onChange={(e) =>
                      handleChange("cpfComprador", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="enderecoComprador">Endereço</Label>
                  <Input
                    id="enderecoComprador"
                    value={formData.enderecoComprador}
                    onChange={(e) =>
                      handleChange("enderecoComprador", e.target.value)
                    }
                  />
                </div>
              </div>
              {/* Uploads do comprador */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rnmCompradorDoc">Documento RNM do Comprador</Label>
                  <Input
                    id="rnmCompradorDoc"
                    type="file"
                    onChange={(e) => handleTempUpload('rnmCompradorDoc', e.target.files?.[0] || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpfCompradorDoc">Documento CPF do Comprador</Label>
                  <Input
                    id="cpfCompradorDoc"
                    type="file"
                    onChange={(e) => handleTempUpload('cpfCompradorDoc', e.target.files?.[0] || null)}
                  />
                </div>
              </div>
            </div>


            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="contractNotes">Observações</Label>
              <Textarea
                id="contractNotes"
                value={formData.contractNotes}
                onChange={(e) => handleChange("contractNotes", e.target.value)}
                rows={4}
                placeholder="Adicione observações importantes..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Link href="/dashboard/compra-venda">
                <Button type="button" variant="outline" disabled={loading}>
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Salvando..." : "Salvar Transação"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
