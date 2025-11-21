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
  const [formData, setFormData] = useState({
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
          vendedores: vendedores,
          currentStep: 0,
          status: "Em Andamento",
        }),
      });

      if (response.ok) {
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
          <h1 className="text-3xl font-bold">Nova Compra e Venda</h1>
          <p className="text-muted-foreground">
            Cadastre uma nova transação imobiliária
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-slate-900 dark:to-slate-800 border-b">
            <CardTitle className="text-2xl font-semibold">Informações do Imóvel</CardTitle>
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
                  {vendedores.length > 1 && (
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
                      <Label htmlFor={`rgVendedor${index}`}>RG</Label>
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
            </div>

            {/* Deadlines */}
            <div className="space-y-4">
              <h3 className="font-semibold">Prazos</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="prazoSinal">Prazo para Sinal</Label>
                  <Input
                    id="prazoSinal"
                    type="date"
                    value={formData.prazoSinal}
                    onChange={(e) => handleChange("prazoSinal", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prazoEscritura">Prazo para Escritura</Label>
                  <Input
                    id="prazoEscritura"
                    type="date"
                    value={formData.prazoEscritura}
                    onChange={(e) =>
                      handleChange("prazoEscritura", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="contractNotes">Observações do Contrato</Label>
              <Textarea
                id="contractNotes"
                value={formData.contractNotes}
                onChange={(e) => handleChange("contractNotes", e.target.value)}
                rows={4}
                placeholder="Adicione informações importantes sobre o contrato..."
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