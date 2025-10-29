"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Upload, X, CheckCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const CASE_TYPES = [
  "Exame DNA",
  "Alteração de Nome",
  "Guarda",
  "Acordos de Guarda",
  "Divórcio Consensual",
  "Divórcio Litígio",
  "Usucapião"
];

export default function NovaAcaoCivelPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    clientName: "",
    type: "",
    rnmMae: "",
    rnmPai: "",
    rnmSupostoPai: "",
    cpfMae: "",
    cpfPai: "",
    certidaoNascimento: "",
    comprovanteEndereco: "",
    passaporte: "",
    guiaPaga: "",
    peticaoConjunta: "",
    termoPartilhas: "",
    guarda: "",
    procuracao: "",
    peticaoCliente: "",
    procuracaoCliente: "",
    custas: "",
    peticaoInicial: "",
    matriculaImovel: "",
    aguaLuzIptu: "",
    camposExigencias: "",
    notes: "",
    // Document URLs
    rnmMaeFile: "",
    rnmPaiFile: "",
    rnmSupostoPaiFile: "",
    cpfMaeFile: "",
    cpfPaiFile: "",
    certidaoNascimentoFile: "",
    comprovanteEnderecoFile: "",
    passaporteFile: "",
    guiaPagaFile: "",
    peticaoConjuntaFile: "",
    termoPartilhasFile: "",
    guardaFile: "",
    procuracaoFile: "",
    peticaoClienteFile: "",
    procuracaoClienteFile: "",
    custasFile: "",
    peticaoInicialFile: "",
    matriculaImovelFile: "",
    aguaLuzIptuFile: "",
    camposExigenciasFile: "",
  });

  const [uploadingDocs, setUploadingDocs] = useState({
    rnmMae: false,
    rnmPai: false,
    rnmSupostoPai: false,
    cpfMae: false,
    cpfPai: false,
    certidaoNascimento: false,
    comprovanteEndereco: false,
    passaporte: false,
    guiaPaga: false,
    peticaoConjunta: false,
    termoPartilhas: false,
    guarda: false,
    procuracao: false,
    peticaoCliente: false,
    procuracaoCliente: false,
    custas: false,
    peticaoInicial: false,
    matriculaImovel: false,
    aguaLuzIptu: false,
    camposExigencias: false,
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDocs((prev) => ({ ...prev, [field]: true }));

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      // Para uploads temporários (quando ainda não temos o ID do caso), 
      // não enviamos fieldName nem moduleType para que a API trate como upload temporário
      // formDataUpload.append("fieldName", field);
      // formDataUpload.append("moduleType", "acoes_civeis");
      // formDataUpload.append("clientName", formData.clientName || "");

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formDataUpload
      });

      if (response.ok) {
        const data = await response.json();
        handleChange(`${field}File`, data.fileUrl);
        toast.success("Documento enviado com sucesso!");
      } else {
        const errorData = await response.json();
        console.error("Upload error:", errorData);
        toast.error(errorData.error || "Erro ao enviar documento");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Erro ao enviar documento");
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [field]: false }));
    }
  };

  const removeDocument = (field: string) => {
    handleChange(`${field}File`, "");
    toast.success("Documento removido");
  };

  // Função auxiliar para converter uploads temporários em permanentes
  const convertTemporaryUploads = async (caseId: number) => {
    const documentFields = [
      'rnmMaeFile', 'rnmPaiFile', 'rnmSupostoPaiFile', 'certidaoNascimentoFile',
      'comprovanteEnderecoFile', 'passaporteFile', 'guiaPagaFile', 'resultadoExameDnaFile',
      'procuracaoAnexadaFile', 'peticaoAnexadaFile', 'processoAnexadoFile',
      'documentosFinaisAnexadosFile', 'documentosProcessoFinalizadoFile'
    ];

    const documentsToConvert = [];
    
    for (const field of documentFields) {
      const fileUrl = formData[field];
      if (fileUrl) {
        documentsToConvert.push({
          fieldName: field.replace('File', ''),
          fileUrl: fileUrl
        });
      }
    }

    if (documentsToConvert.length > 0) {
      try {
        // Chamar API para converter uploads temporários em permanentes
        const response = await fetch("/api/documents/convert-temporary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId: caseId,
            moduleType: "acoes_civeis",
            clientName: formData.clientName,
            documents: documentsToConvert
          })
        });

        if (!response.ok) {
          console.error("Erro ao converter uploads temporários");
        }
      } catch (error) {
        console.error("Erro ao converter uploads temporários:", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientName || !formData.type) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    console.log("📤 Enviando dados:", formData);

    try {
      const response = await fetch("/api/acoes-civeis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Ação criada:", data);
        
        // Converter uploads temporários em permanentes
        if (data.id) {
          await convertTemporaryUploads(data.id);
        }
        
        toast.success("Ação criada com sucesso!");
        router.push("/dashboard/acoes-civeis");
      } else {
        const errorData = await response.json();
        console.error("❌ Erro na API:", errorData);
        toast.error(errorData.error || "Erro ao criar ação");
      }
    } catch (error) {
      console.error("❌ Error creating case:", error);
      toast.error("Erro ao criar ação");
    }
  };

  // Helper to check if field should be shown
  const showFieldForType = (field: string) => {
    if (formData.type === "Alteração de Nome") {
      return ["rnmMae", "rnmPai", "cpfMae", "cpfPai", "certidaoNascimento", "comprovanteEndereco", "passaporte", "guiaPaga"].includes(field);
    }
    if (formData.type === "Exame DNA") {
      return ["rnmMae", "rnmPai", "rnmSupostoPai", "certidaoNascimento", "comprovanteEndereco", "passaporte"].includes(field);
    }
    if (formData.type === "Guarda") {
      return ["rnmMae", "rnmPai", "cpfMae", "cpfPai", "certidaoNascimento", "comprovanteEndereco", "passaporte", "guiaPaga"].includes(field);
    }
    if (formData.type === "Acordos de Guarda") {
      return ["rnmMae", "rnmPai", "cpfMae", "cpfPai", "certidaoNascimento", "comprovanteEndereco", "passaporte", "guiaPaga"].includes(field);
    }
    if (formData.type === "Divórcio Consensual") {
      return ["rnmMae", "rnmPai", "cpfMae", "cpfPai", "certidaoNascimento", "comprovanteEndereco", "peticaoConjunta", "termoPartilhas", "guarda", "procuracao"].includes(field);
    }
    if (formData.type === "Divórcio Litígio") {
      return ["rnmMae", "rnmPai", "cpfMae", "cpfPai", "certidaoNascimento", "comprovanteEndereco", "peticaoCliente", "procuracaoCliente", "custas"].includes(field);
    }
    if (formData.type === "Usucapião") {
      return ["peticaoInicial", "matriculaImovel", "aguaLuzIptu", "camposExigencias"].includes(field);
    }
    // Default fields for other types
    return ["rnmMae", "rnmPai", "certidaoNascimento", "comprovanteEndereco", "passaporte"].includes(field);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/acoes-civeis">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Nova Ação Cível</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações da Ação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="clientName">
                  Nome do Cliente <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => handleChange("clientName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">
                  Tipo de Ação <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange("type", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {CASE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Parent Information */}
            {formData.type && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Cadastro</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {showFieldForType("rnmMae") && (
                    <div className="space-y-2">
                      <Label htmlFor="rnmMae">
                        {formData.type === "Divórcio Consensual" || formData.type === "Divórcio Litígio" 
                          ? "RNM Mulher" 
                          : "RNM Mãe"}
                      </Label>
                      <Input
                        id="rnmMae"
                        value={formData.rnmMae}
                        onChange={(e) => handleChange("rnmMae", e.target.value)}
                      />
                      <div className="flex items-center gap-2">
                        {!formData.rnmMaeFile ? (
                          <>
                            <input
                              type="file"
                              id="rnmMaeDoc"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "rnmMae")}
                              disabled={uploadingDocs.rnmMae}
                            />
                            <Label
                              htmlFor="rnmMaeDoc"
                              className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.rnmMae ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Documento enviado</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument("rnmMae")}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showFieldForType("rnmPai") && (
                    <div className="space-y-2">
                      <Label htmlFor="rnmPai">
                        {formData.type === "Divórcio Consensual" || formData.type === "Divórcio Litígio" 
                          ? "RNM Homem" 
                          : "RNM Pai"}
                      </Label>
                      <Input
                        id="rnmPai"
                        value={formData.rnmPai}
                        onChange={(e) => handleChange("rnmPai", e.target.value)}
                      />
                      <div className="flex items-center gap-2">
                        {!formData.rnmPaiFile ? (
                          <>
                            <input
                              type="file"
                              id="rnmPaiDoc"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "rnmPai")}
                              disabled={uploadingDocs.rnmPai}
                            />
                            <Label
                              htmlFor="rnmPaiDoc"
                              className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.rnmPai ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Documento enviado</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument("rnmPai")}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showFieldForType("cpfMae") && (
                    <div className="space-y-2">
                      <Label htmlFor="cpfMae">
                        {formData.type === "Divórcio Consensual" || formData.type === "Divórcio Litígio" 
                          ? "CPF Mulher" 
                          : "CPF Mãe"}
                      </Label>
                      <Input
                        id="cpfMae"
                        value={formData.cpfMae}
                        onChange={(e) => handleChange("cpfMae", e.target.value)}
                      />
                      <div className="flex items-center gap-2">
                        {!formData.cpfMaeFile ? (
                          <>
                            <input
                              type="file"
                              id="cpfMaeDoc"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "cpfMae")}
                              disabled={uploadingDocs.cpfMae}
                            />
                            <Label
                              htmlFor="cpfMaeDoc"
                              className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.cpfMae ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Documento enviado</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument("cpfMae")}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showFieldForType("cpfPai") && (
                    <div className="space-y-2">
                      <Label htmlFor="cpfPai">
                        {formData.type === "Divórcio Consensual" || formData.type === "Divórcio Litígio" 
                          ? "CPF Homem" 
                          : "CPF Pai"}
                      </Label>
                      <Input
                        id="cpfPai"
                        value={formData.cpfPai}
                        onChange={(e) => handleChange("cpfPai", e.target.value)}
                      />
                      <div className="flex items-center gap-2">
                        {!formData.cpfPaiFile ? (
                          <>
                            <input
                              type="file"
                              id="cpfPaiDoc"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "cpfPai")}
                              disabled={uploadingDocs.cpfPai}
                            />
                            <Label
                              htmlFor="cpfPaiDoc"
                              className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.cpfPai ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Documento enviado</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument("cpfPai")}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showFieldForType("rnmSupostoPai") && (
                    <div className="space-y-2">
                      <Label htmlFor="rnmSupostoPai">RNM Suposto Pai</Label>
                      <Input
                        id="rnmSupostoPai"
                        value={formData.rnmSupostoPai}
                        onChange={(e) => handleChange("rnmSupostoPai", e.target.value)}
                      />
                      <div className="flex items-center gap-2">
                        {!formData.rnmSupostoPaiFile ? (
                          <>
                            <input
                              type="file"
                              id="rnmSupostoPaiDoc"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "rnmSupostoPai")}
                              disabled={uploadingDocs.rnmSupostoPai}
                            />
                            <Label
                              htmlFor="rnmSupostoPaiDoc"
                              className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.rnmSupostoPai ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Documento enviado</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument("rnmSupostoPai")}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showFieldForType("certidaoNascimento") && (
                    <div className="space-y-2">
                      <Label htmlFor="certidaoNascimento">
                        {formData.type === "Divórcio Consensual" || formData.type === "Divórcio Litígio"
                          ? "Certidão de Nascimento da Criança (caso filhos)" 
                          : "Certidão de Nascimento da Criança"}
                      </Label>
                      <Input
                        id="certidaoNascimento"
                        value={formData.certidaoNascimento}
                        onChange={(e) => handleChange("certidaoNascimento", e.target.value)}
                        placeholder="Número ou referência"
                      />
                      <div className="flex items-center gap-2">
                        {!formData.certidaoNascimentoFile ? (
                          <>
                            <input
                              type="file"
                              id="certidaoNascimentoDoc"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "certidaoNascimento")}
                              disabled={uploadingDocs.certidaoNascimento}
                            />
                            <Label
                              htmlFor="certidaoNascimentoDoc"
                              className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.certidaoNascimento ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Documento enviado</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument("certidaoNascimento")}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showFieldForType("comprovanteEndereco") && (
                    <div className="space-y-2">
                      <Label htmlFor="comprovanteEndereco">Comprovante de Endereço</Label>
                      <Input
                        id="comprovanteEndereco"
                        value={formData.comprovanteEndereco}
                        onChange={(e) => handleChange("comprovanteEndereco", e.target.value)}
                        placeholder="Tipo de comprovante"
                      />
                      <div className="flex items-center gap-2">
                        {!formData.comprovanteEnderecoFile ? (
                          <>
                            <input
                              type="file"
                              id="comprovanteEnderecoDoc"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "comprovanteEndereco")}
                              disabled={uploadingDocs.comprovanteEndereco}
                            />
                            <Label
                              htmlFor="comprovanteEnderecoDoc"
                              className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.comprovanteEndereco ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Documento enviado</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument("comprovanteEndereco")}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showFieldForType("peticaoConjunta") && (
                    <div className="space-y-2">
                      <Label htmlFor="peticaoConjunta">Petição Conjunta</Label>
                      <Input
                        id="peticaoConjunta"
                        value={formData.peticaoConjunta}
                        onChange={(e) => handleChange("peticaoConjunta", e.target.value)}
                        placeholder="Número ou referência"
                      />
                      <div className="flex items-center gap-2">
                        {!formData.peticaoConjuntaFile ? (
                          <>
                            <input
                              type="file"
                              id="peticaoConjuntaDoc"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "peticaoConjunta")}
                              disabled={uploadingDocs.peticaoConjunta}
                            />
                            <Label
                              htmlFor="peticaoConjuntaDoc"
                              className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.peticaoConjunta ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Documento enviado</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument("peticaoConjunta")}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showFieldForType("termoPartilhas") && (
                    <div className="space-y-2">
                      <Label htmlFor="termoPartilhas">Termo de Partilhas (Caso possuir bens)</Label>
                      <Input
                        id="termoPartilhas"
                        value={formData.termoPartilhas}
                        onChange={(e) => handleChange("termoPartilhas", e.target.value)}
                        placeholder="Número ou referência"
                      />
                      <div className="flex items-center gap-2">
                        {!formData.termoPartilhasFile ? (
                          <>
                            <input
                              type="file"
                              id="termoPartilhasDoc"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "termoPartilhas")}
                              disabled={uploadingDocs.termoPartilhas}
                            />
                            <Label
                              htmlFor="termoPartilhasDoc"
                              className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.termoPartilhas ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Documento enviado</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument("termoPartilhas")}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showFieldForType("guarda") && (
                    <div className="space-y-2">
                      <Label htmlFor="guarda">Guarda (caso tiver filhos)</Label>
                      <Input
                        id="guarda"
                        value={formData.guarda}
                        onChange={(e) => handleChange("guarda", e.target.value)}
                        placeholder="Número ou referência"
                      />
                      <div className="flex items-center gap-2">
                        {!formData.guardaFile ? (
                          <>
                            <input
                              type="file"
                              id="guardaDoc"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "guarda")}
                              disabled={uploadingDocs.guarda}
                            />
                            <Label
                              htmlFor="guardaDoc"
                              className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.guarda ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Documento enviado</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument("guarda")}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showFieldForType("procuracao") && (
                    <div className="space-y-2">
                      <Label htmlFor="procuracao">Procuração</Label>
                      <Input
                        id="procuracao"
                        value={formData.procuracao}
                        onChange={(e) => handleChange("procuracao", e.target.value)}
                        placeholder="Número ou referência"
                      />
                      <div className="flex items-center gap-2">
                        {!formData.procuracaoFile ? (
                          <>
                            <input
                              type="file"
                              id="procuracaoDoc"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "procuracao")}
                              disabled={uploadingDocs.procuracao}
                            />
                            <Label
                              htmlFor="procuracaoDoc"
                              className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.procuracao ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Documento enviado</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument("procuracao")}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showFieldForType("passaporte") && (
                    <div className="space-y-2">
                      <Label htmlFor="passaporte">Passaporte</Label>
                      <Input
                        id="passaporte"
                        value={formData.passaporte}
                        onChange={(e) => handleChange("passaporte", e.target.value)}
                        placeholder="Número do passaporte"
                      />
                      <div className="flex items-center gap-2">
                        {!formData.passaporteFile ? (
                          <>
                            <input
                              type="file"
                              id="passaporteDoc"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "passaporte")}
                              disabled={uploadingDocs.passaporte}
                            />
                            <Label
                              htmlFor="passaporteDoc"
                              className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.passaporte ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Documento enviado</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument("passaporte")}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showFieldForType("guiaPaga") && (
                    <div className="space-y-2">
                      <Label htmlFor="guiaPaga">Guia Paga</Label>
                      <Input
                        id="guiaPaga"
                        value={formData.guiaPaga}
                        onChange={(e) => handleChange("guiaPaga", e.target.value)}
                        placeholder="Número ou referência"
                      />
                      <div className="flex items-center gap-2">
                        {!formData.guiaPagaFile ? (
                          <>
                            <input
                              type="file"
                              id="guiaPagaDoc"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "guiaPaga")}
                              disabled={uploadingDocs.guiaPaga}
                            />
                            <Label
                              htmlFor="guiaPagaDoc"
                              className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.guiaPaga ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Documento enviado</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument("guiaPaga")}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showFieldForType("peticaoCliente") && (
                    <div className="space-y-2">
                      <Label htmlFor="peticaoCliente">Petição Cliente</Label>
                      <Input
                        id="peticaoCliente"
                        value={formData.peticaoCliente}
                        onChange={(e) => handleChange("peticaoCliente", e.target.value)}
                        placeholder="Número ou referência"
                      />
                      <div className="flex items-center gap-2">
                        {!formData.peticaoClienteFile ? (
                          <>
                            <input
                              type="file"
                              id="peticaoClienteDoc"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "peticaoCliente")}
                              disabled={uploadingDocs.peticaoCliente}
                            />
                            <Label
                              htmlFor="peticaoClienteDoc"
                              className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.peticaoCliente ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Documento enviado</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument("peticaoCliente")}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showFieldForType("procuracaoCliente") && (
                    <div className="space-y-2">
                      <Label htmlFor="procuracaoCliente">Procuração Cliente</Label>
                      <Input
                        id="procuracaoCliente"
                        value={formData.procuracaoCliente}
                        onChange={(e) => handleChange("procuracaoCliente", e.target.value)}
                        placeholder="Número ou referência"
                      />
                      <div className="flex items-center gap-2">
                        {!formData.procuracaoClienteFile ? (
                          <>
                            <input
                              type="file"
                              id="procuracaoClienteDoc"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "procuracaoCliente")}
                              disabled={uploadingDocs.procuracaoCliente}
                            />
                            <Label
                              htmlFor="procuracaoClienteDoc"
                              className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.procuracaoCliente ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Documento enviado</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument("procuracaoCliente")}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showFieldForType("custas") && (
                    <div className="space-y-2">
                      <Label htmlFor="custas">Custas</Label>
                      <Input
                        id="custas"
                        value={formData.custas}
                        onChange={(e) => handleChange("custas", e.target.value)}
                        placeholder="Número ou referência"
                      />
                      <div className="flex items-center gap-2">
                        {!formData.custasFile ? (
                          <>
                            <input
                              type="file"
                              id="custasDoc"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "custas")}
                              disabled={uploadingDocs.custas}
                            />
                            <Label
                              htmlFor="custasDoc"
                              className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.custas ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Documento enviado</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument("custas")}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showFieldForType("peticaoInicial") && (
                    <div className="space-y-2">
                      <Label htmlFor="peticaoInicial">Petição Inicial</Label>
                      <Input
                        id="peticaoInicial"
                        value={formData.peticaoInicial}
                        onChange={(e) => handleChange("peticaoInicial", e.target.value)}
                        placeholder="Número ou referência"
                      />
                      <div className="flex items-center gap-2">
                        {!formData.peticaoInicialFile ? (
                          <>
                            <input
                              type="file"
                              id="peticaoInicialDoc"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "peticaoInicial")}
                              disabled={uploadingDocs.peticaoInicial}
                            />
                            <Label
                              htmlFor="peticaoInicialDoc"
                              className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.peticaoInicial ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Documento enviado</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument("peticaoInicial")}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showFieldForType("matriculaImovel") && (
                    <div className="space-y-2">
                      <Label htmlFor="matriculaImovel">Matrícula do Imóvel / Transcrição</Label>
                      <Input
                        id="matriculaImovel"
                        value={formData.matriculaImovel}
                        onChange={(e) => handleChange("matriculaImovel", e.target.value)}
                        placeholder="Número da matrícula"
                      />
                      <div className="flex items-center gap-2">
                        {!formData.matriculaImovelFile ? (
                          <>
                            <input
                              type="file"
                              id="matriculaImovelDoc"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "matriculaImovel")}
                              disabled={uploadingDocs.matriculaImovel}
                            />
                            <Label
                              htmlFor="matriculaImovelDoc"
                              className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.matriculaImovel ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Documento enviado</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument("matriculaImovel")}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showFieldForType("aguaLuzIptu") && (
                    <div className="space-y-2">
                      <Label htmlFor="aguaLuzIptu">Água / Luz / IPTU</Label>
                      <Input
                        id="aguaLuzIptu"
                        value={formData.aguaLuzIptu}
                        onChange={(e) => handleChange("aguaLuzIptu", e.target.value)}
                        placeholder="Informações das contas"
                      />
                      <div className="flex items-center gap-2">
                        {!formData.aguaLuzIptuFile ? (
                          <>
                            <input
                              type="file"
                              id="aguaLuzIptuDoc"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "aguaLuzIptu")}
                              disabled={uploadingDocs.aguaLuzIptu}
                            />
                            <Label
                              htmlFor="aguaLuzIptuDoc"
                              className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.aguaLuzIptu ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Documento enviado</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument("aguaLuzIptu")}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showFieldForType("camposExigencias") && (
                    <div className="space-y-2">
                      <Label htmlFor="camposExigencias">Campos para Cumprir Exigências</Label>
                      <Textarea
                        id="camposExigencias"
                        value={formData.camposExigencias}
                        onChange={(e) => handleChange("camposExigencias", e.target.value)}
                        placeholder="Descreva as exigências a serem cumpridas"
                        rows={3}
                      />
                      <div className="flex items-center gap-2">
                        {!formData.camposExigenciasFile ? (
                          <>
                            <input
                              type="file"
                              id="camposExigenciasDoc"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "camposExigencias")}
                              disabled={uploadingDocs.camposExigencias}
                            />
                            <Label
                              htmlFor="camposExigenciasDoc"
                              className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.camposExigencias ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Documento enviado</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument("camposExigencias")}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={4}
                placeholder="Adicione observações sobre o caso..."
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1">
                Criar Ação
              </Button>
              <Link href="/dashboard/acoes-civeis" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}