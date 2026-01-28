"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { ArrowLeft, Upload, X, CheckCircle, Info, Save, ChevronDown, Check, FileText } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { DocumentChip } from "@/components/ui/document-chip";

const CASE_TYPES = [
  "Exame DNA",
  "Alteração de Nome",
  "Guarda",
  "Acordos de Guarda",
  "Divórcio Consensual",
  "Divórcio Litígio",
  "Usucapião"
];

interface FormData {
  clientName: string;
  type: string;
  ownerName: string;
  ownerCpf: string;
  ownerRnm: string;
  endereco: string;
  rnmMae: string;
  rnmPai: string;
  rnmSupostoPai: string;
  nomeMae: string;
  nomePaiRegistral: string;
  nomeSupostoPai: string;
  nomeCrianca: string;
  cpfMae: string;
  cpfPai: string;
  cpfSupostoPai: string;
  certidaoNascimento: string;
  comprovanteEndereco: string;
  passaporte: string;
  guiaPaga: string;
  peticaoConjunta: string;
  termoPartilhas: string;
  guarda: string;
  procuracao: string;
  peticaoCliente: string;
  procuracaoCliente: string;
  custas: string;
  peticaoInicial: string;
  matriculaImovel: string;
  aguaLuzIptu: string;
  camposExigencias: string;
  notes: string;
  ownerRnmFile: string;
  ownerCpfFile: string;
  rnmMaeFile: string;
  rnmPaiFile: string;
  rnmSupostoPaiFile: string;
  cpfMaeFile: string;
  cpfPaiFile: string;
  certidaoNascimentoFile: string;
  comprovanteEnderecoFile: string;
  declaracaoVizinhosFile: string;
  passaporteFile: string;
  passaporteMaeFile: string;
  passaportePaiRegistralFile: string;
  passaporteSupostoPaiFile: string;
  passaportePaiFile: string;
  passaporteCriancaFile: string;
  guiaPagaFile: string;
  peticaoConjuntaFile: string;
  termoPartilhasFile: string;
  guardaFile: string;
  procuracaoFile: string;
  peticaoClienteFile: string;
  procuracaoClienteFile: string;
  custasFile: string;
  peticaoInicialFile: string;
  matriculaImovelFile: string;
  contaAguaFile: string;
  contaLuzFile: string;
  iptuFile: string;
  aguaLuzIptuFile: string;
  camposExigenciasFile: string;
  [key: string]: string;
}

export default function NovaAcaoCivelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const getStepTitle = (type: string, index: number) => {
    const standard = [
      "Cadastro de Informações",
      "Agendar Exame DNA",
      "Elaboração Procuração",
      "Aguardar procuração assinada",
      "À Protocolar",
      "Protocolado",
      "Processo Finalizado",
    ];
    const exameDna = [
      "Cadastro Documentos",
      "Agendar Exame DNA",
      "Elaboração Procuração",
      "Aguardar procuração assinada",
      "À Protocolar",
      "Protocolado",
      "Processo Finalizado",
    ];
    const steps = type === "Exame DNA" ? exameDna : standard;
    return steps[index] ?? `Passo ${index + 1}`;
  };

  const [formData, setFormData] = useState<FormData>({
    clientName: "",
    type: "",
    ownerName: "",
    ownerCpf: "",
    ownerRnm: "",
    endereco: "",
    rnmMae: "",
    rnmPai: "",
    rnmSupostoPai: "",
    nomeMae: "",
    nomePaiRegistral: "",
    nomeSupostoPai: "",
    nomeCrianca: "",
    cpfMae: "",
    cpfPai: "",
    cpfSupostoPai: "",
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
    ownerRnmFile: "",
    ownerCpfFile: "",
    rnmMaeFile: "",
    rnmPaiFile: "",
    rnmSupostoPaiFile: "",
    cpfMaeFile: "",
    cpfPaiFile: "",
    certidaoNascimentoFile: "",
    comprovanteEnderecoFile: "",
    declaracaoVizinhosFile: "",
    passaporteFile: "",
    passaporteMaeFile: "",
    passaportePaiRegistralFile: "",
    passaporteSupostoPaiFile: "",
    passaportePaiFile: "",
    passaporteCriancaFile: "",
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
    contaAguaFile: "",
    contaLuzFile: "",
    iptuFile: "",
    aguaLuzIptuFile: "",
    camposExigenciasFile: "",
  });

  const [uploadingDocs, setUploadingDocs] = useState<Record<string, boolean>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateFile = (file: File) => {
    // Lista expandida de tipos permitidos
    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'text/plain', // .txt
      'application/rtf' // .rtf
    ];
    // Tamanho aumentado para 50MB
    const maxSize = 50 * 1024 * 1024; // 50MB

    // Verificação de arquivo vazio
    if (file.size === 0) {
      toast.error(`Arquivo vazio: ${file.name}.`);
      return false;
    }

    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|doc|docx|xls|xlsx|txt|rtf)$/i)) {
      toast.error(`Formato inválido: ${file.name}. Aceitos: PDF, Imagens, Office e Texto.`);
      return false;
    }

    if (file.size > maxSize) {
      toast.error(`Arquivo muito grande: ${file.name}. Máximo 50MB.`);
      return false;
    }
    return true;
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) {
      e.target.value = "";
      return;
    }

    setUploadingDocs((prev) => ({ ...prev, [field]: true }));

    try {
      const MAX_DIRECT_SIZE = 4 * 1024 * 1024; // 4MB
      let fileUrl = "";

      if (file.size > MAX_DIRECT_SIZE) {
        // Signed Upload (Temporary)
        try {
          const signRes = await fetch("/api/documents/upload/sign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              clientName: formData.clientName || "Novo Cliente",
              moduleType: "acoes_civeis"
            })
          });

          if (!signRes.ok) {
            const err = await signRes.json();
            throw new Error(err.error || "Falha ao gerar URL assinada");
          }

          const { signedUrl, publicUrl } = await signRes.json();

          const uploadRes = await fetch(signedUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type }
          });

          if (!uploadRes.ok) throw new Error("Falha no upload do arquivo");

          fileUrl = publicUrl;

          // Register metadata (Register Only)
          await fetch("/api/documents/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              isRegisterOnly: true,
              fileUrl,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              fieldName: field,
              moduleType: "acoes_civeis",
              clientName: formData.clientName
            })
          });

        } catch (err: any) {
          console.error("Upload assinado falhou:", err);
          toast.error(`Erro ao enviar ${file.name}: ${err.message}`);
          return;
        }
      } else {
        // Direct Upload
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);
        formDataUpload.append("moduleType", "acoes_civeis");
        if (formData.clientName) formDataUpload.append("clientName", formData.clientName);

        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formDataUpload
        });

        if (response.ok) {
          const data = await response.json();
          fileUrl = data.fileUrl;
        } else {
          const errorData = await response.json();
          console.error("Upload error:", errorData);
          toast.error(errorData.error || "Erro ao enviar documento");
          return;
        }
      }

      if (fileUrl) {
        handleChange(`${field}File`, fileUrl);
        toast.success("Documento enviado com sucesso!");
      }

    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Erro ao enviar documento");
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [field]: false }));
      // Limpar o input
      e.target.value = "";
    }
  };

  const removeDocument = (field: string) => {
    handleChange(`${field}File`, "");
    toast.success("Documento removido");
  };

  const convertTemporaryUploads = async (caseId: number) => {
    const documentFields = [
      'rnmMaeFile', 'rnmPaiFile', 'rnmSupostoPaiFile', 'certidaoNascimentoFile',
      'comprovanteEnderecoFile', 'ownerRnmFile', 'ownerCpfFile', 'declaracaoVizinhosFile',
      'matriculaImovelFile', 'contaAguaFile', 'contaLuzFile', 'iptuFile',
      'passaporteFile', 'guiaPagaFile', 'resultadoExameDnaFile',
      'procuracaoAnexadaFile', 'peticaoAnexadaFile', 'processoAnexadoFile',
      'documentosFinaisAnexadosFile', 'documentosProcessoFinalizadoFile',
      'passaporteMaeFile', 'passaportePaiRegistralFile', 'passaporteSupostoPaiFile',
      'passaportePaiFile', 'passaporteCriancaFile'
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
        await fetch("/api/documents/convert-temporary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId: caseId,
            moduleType: "acoes_civeis",
            clientName: formData.clientName,
            documents: documentsToConvert
          })
        });
      } catch (error) {
        console.error("Erro ao converter uploads temporários:", error);
      }
    }
  };

  const doCreate = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/acoes-civeis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.id) {
          await convertTemporaryUploads(data.id);
          try {
            await fetch('/api/alerts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                moduleType: 'Ações Cíveis',
                recordId: data.id,
                alertFor: 'admin',
                message: `${getStepTitle(formData.type, 0)} concluído para: ${formData.clientName} - ${formData.type}`,
                isRead: false
              })
            });
          } catch { }
        }

        toast.success("Ação criada com sucesso!");
        router.push("/dashboard/acoes-civeis");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erro ao criar ação");
      }
    } catch (error) {
      console.error("❌ Error creating case:", error);
      toast.error("Erro ao criar ação");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmOpen(true);
  };

  const showFieldForType = (field: string) => {
    if (formData.type === "Alteração de Nome") {
      return [
        "nomeMae", "nomePaiRegistral", "nomeCrianca",
        "rnmMae", "rnmPai",
        "cpfMae", "cpfPai",
        "certidaoNascimento",
        "comprovanteEndereco",
        "passaporteMae", "passaportePai", "passaporteCrianca"
      ].includes(field);
    }
    if (formData.type === "Exame DNA") {
      return [
        "nomeMae", "nomePaiRegistral", "nomeSupostoPai", "nomeCrianca",
        "rnmMae", "rnmPai", "rnmSupostoPai",
        "cpfMae", "cpfPai", "cpfSupostoPai",
        "certidaoNascimento", "comprovanteEndereco",
        "passaporteMae", "passaportePaiRegistral", "passaporteSupostoPai"
      ].includes(field);
    }
    if (formData.type === "Guarda") {
      return [
        "nomeMae", "nomePaiRegistral", "nomeCrianca",
        "rnmMae", "rnmPai",
        "cpfMae", "cpfPai",
        "certidaoNascimento",
        "comprovanteEndereco",
        "passaporteMae", "passaportePai", "passaporteCrianca"
      ].includes(field);
    }
    if (formData.type === "Acordos de Guarda") {
      return [
        "nomeMae", "nomePaiRegistral", "nomeCrianca",
        "rnmMae", "rnmPai",
        "cpfMae", "cpfPai",
        "certidaoNascimento",
        "comprovanteEndereco",
        "passaporteMae", "passaportePai", "passaporteCrianca"
      ].includes(field);
    }
    if (formData.type === "Divórcio Consensual") {
      return [
        "nomeMae", "nomePaiRegistral",
        "rnmMae", "rnmPai",
        "cpfMae", "cpfPai",
        "certidaoNascimento",
        "comprovanteEndereco",
        "peticaoConjunta", "termoPartilhas", "guarda", "procuracao"
      ].includes(field);
    }
    if (formData.type === "Divórcio Litígio") {
      return [
        "nomeMae", "nomePaiRegistral",
        "rnmMae", "rnmPai",
        "cpfMae", "cpfPai",
        "certidaoNascimento",
        "comprovanteEndereco",
        "termoPartilhas", "guarda"
      ].includes(field);
    }
    if (formData.type === "Usucapião") {
      return [
        "ownerName", "ownerCpf", "ownerRnm",
        "endereco", "comprovanteEndereco",
        "declaracaoVizinhos",
        "matriculaImovel",
        "contaAgua", "contaLuz", "iptu",
        "peticaoInicial",
        "camposExigencias"
      ].includes(field);
    }
    return ["rnmMae", "rnmPai", "certidaoNascimento", "comprovanteEndereco", "passaporte"].includes(field);
  };

  // Helper component matching Vistos design
  const DocumentRow = ({ label, field, docField, placeholder = "Status ou informações do documento" }: { label: string; field?: string; docField: string; placeholder?: string }) => {
    // Check if file is uploaded
    const fileUrl = formData[`${docField}File`];

    return (
      <div className="space-y-2">
        <Label className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</Label>
        <div className="flex gap-3 items-start">
          {field && (
            <Input
              value={formData[field] || ""}
              onChange={(e) => handleChange(field, e.target.value)}
              className="flex-1 rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5"
              placeholder={placeholder}
            />
          )}
          {!field && (
            <div className="flex-1 flex items-center p-2.5 rounded-md border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm">
              <span className={`text-xs ${fileUrl ? "text-green-600 font-medium" : "italic"}`}>
                {fileUrl ? "Documento anexado" : "Nenhum arquivo selecionado"}
              </span>
            </div>
          )}
          <div className="relative">
            <input
              type="file"
              id={`upload-${docField}`}
              className="hidden"
              onChange={(e) => handleDocumentUpload(e, docField)}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.txt,.rtf"
            />
            <Button
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-medium text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shadow-sm"
              onClick={() => document.getElementById(`upload-${docField}`)?.click()}
              disabled={uploadingDocs[docField]}
            >
              <Upload className="h-5 w-5 text-slate-500" />
              {uploadingDocs[docField] ? "Enviando..." : "Upload"}
            </Button>
          </div>
        </div>

        {/* File Preview List - Vistos Style */}
        {fileUrl && (
          <div className="flex flex-wrap gap-2 mt-2">
            <DocumentChip
              name={decodeURIComponent((fileUrl.split("/").pop() || "Documento"))}
              href={fileUrl}
              onDelete={() => removeDocument(docField)}
              className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:border-sky-200 dark:hover:border-sky-800 transition-all"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 min-h-screen flex flex-col font-sans">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/acoes-civeis">
              <button className="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Nova Ação Cível</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie processos e ações cíveis</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 flex-grow w-full">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Informações da Ação */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Info className="h-5 w-5 text-sky-500" />
                Informações da Ação
              </h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-6">
                <Label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Nome do Cliente *</Label>
                <Input
                  value={formData.clientName}
                  onChange={(e) => handleChange("clientName", e.target.value)}
                  className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 focus:ring-sky-500 focus:border-sky-500 text-sm py-2.5"
                  placeholder="Digite o nome completo do cliente"
                  required
                />
              </div>
              <div className="md:col-span-6">
                <Label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Tipo de Ação *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange("type", value)}
                >
                  <SelectTrigger className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 py-2.5 h-auto">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel className="font-bold text-slate-900 dark:text-slate-100">Tipos de Ação</SelectLabel>
                      {CASE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Conditional Content */}
          {formData.type && (
            <div className="space-y-8">

              {/* Cadastro / Dados de Nomes */}
              {(formData.type === "Exame DNA" || formData.type === "Alteração de Nome" || formData.type === "Guarda" || formData.type === "Acordos de Guarda" || formData.type === "Divórcio Consensual" || formData.type === "Divórcio Litígio") && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">1</span>
                      Cadastro de Nomes
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    {showFieldForType("nomeMae") && (
                      <div className="space-y-2">
                        <Label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Nome da Mãe / Parte 1</Label>
                        <Input
                          value={formData.nomeMae}
                          onChange={(e) => handleChange("nomeMae", e.target.value)}
                          className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5"
                          placeholder="Nome completo"
                        />
                      </div>
                    )}
                    {showFieldForType("nomePaiRegistral") && (
                      <div className="space-y-2">
                        <Label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Nome do Pai / Parte 2</Label>
                        <Input
                          value={formData.nomePaiRegistral}
                          onChange={(e) => handleChange("nomePaiRegistral", e.target.value)}
                          className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5"
                          placeholder="Nome completo"
                        />
                      </div>
                    )}
                    {showFieldForType("nomeSupostoPai") && (
                      <div className="space-y-2">
                        <Label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Nome do Suposto Pai</Label>
                        <Input
                          value={formData.nomeSupostoPai}
                          onChange={(e) => handleChange("nomeSupostoPai", e.target.value)}
                          className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5"
                          placeholder="Nome completo"
                        />
                      </div>
                    )}
                    {showFieldForType("nomeCrianca") && (
                      <div className="space-y-2">
                        <Label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Nome da Criança</Label>
                        <Input
                          value={formData.nomeCrianca}
                          onChange={(e) => handleChange("nomeCrianca", e.target.value)}
                          className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5"
                          placeholder="Nome completo"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Usucapião - Dono do Imóvel */}
              {formData.type === "Usucapião" && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">1</span>
                      Dono do Imóvel
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    {showFieldForType("ownerName") && (
                      <div className="space-y-2">
                        <Label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Nome Completo</Label>
                        <Input
                          value={formData.ownerName}
                          onChange={(e) => handleChange("ownerName", e.target.value)}
                          className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5"
                          placeholder="Nome completo"
                        />
                      </div>
                    )}
                    {showFieldForType("ownerCpf") && (
                      <DocumentRow label="CPF do Dono" field="ownerCpf" docField="ownerCpf" placeholder="000.000.000-00" />
                    )}
                    {showFieldForType("ownerRnm") && (
                      <DocumentRow label="RNM do Dono" field="ownerRnm" docField="ownerRnm" placeholder="RNM / RNE / RG" />
                    )}
                  </div>
                </div>
              )}

              {/* Documentos de Identificação */}
              {(showFieldForType("rnmMae") || showFieldForType("rnmPai") || showFieldForType("rnmSupostoPai") || showFieldForType("cpfMae") || showFieldForType("cpfPai") || showFieldForType("cpfSupostoPai")) && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">2</span>
                      Documentos de Identificação
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    {showFieldForType("rnmMae") && (
                      <DocumentRow label="RNM / RG (Mãe/Parte 1)" field="rnmMae" docField="rnmMae" />
                    )}
                    {showFieldForType("rnmPai") && (
                      <DocumentRow label="RNM / RG (Pai/Parte 2)" field="rnmPai" docField="rnmPai" />
                    )}
                    {showFieldForType("rnmSupostoPai") && (
                      <DocumentRow label="RNM / RG (Suposto Pai)" field="rnmSupostoPai" docField="rnmSupostoPai" />
                    )}
                    {showFieldForType("cpfMae") && (
                      <DocumentRow label="CPF (Mãe/Parte 1)" field="cpfMae" docField="cpfMae" />
                    )}
                    {showFieldForType("cpfPai") && (
                      <DocumentRow label="CPF (Pai/Parte 2)" field="cpfPai" docField="cpfPai" />
                    )}
                    {showFieldForType("cpfSupostoPai") && (
                      <div className="space-y-2">
                        <Label className="block text-sm font-medium text-slate-700 dark:text-slate-200">CPF (Suposto Pai)</Label>
                        <Input
                          value={formData.cpfSupostoPai}
                          onChange={(e) => handleChange("cpfSupostoPai", e.target.value)}
                          className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Documentos da Criança */}
              {showFieldForType("certidaoNascimento") && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">3</span>
                      Documentos da Criança
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 gap-6">
                    <DocumentRow
                      label={formData.type.includes("Divórcio") ? "Certidão de Nascimento da Criança (se houver)" : "Certidão de Nascimento da Criança"}
                      field="certidaoNascimento"
                      docField="certidaoNascimento"
                    />
                  </div>
                </div>
              )}

              {/* Endereço */}
              {(showFieldForType("endereco") || showFieldForType("comprovanteEndereco") || showFieldForType("declaracaoVizinhos")) && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">4</span>
                      Endereço e Residência
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    {showFieldForType("endereco") && (
                      <div className="col-span-2 space-y-2">
                        <Label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Endereço Completo</Label>
                        <Input
                          value={formData.endereco}
                          onChange={(e) => handleChange("endereco", e.target.value)}
                          className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5"
                          placeholder="Rua, número, bairro, cidade"
                        />
                      </div>
                    )}
                    {showFieldForType("comprovanteEndereco") && (
                      <DocumentRow label="Comprovante de Endereço" field="comprovanteEndereco" docField="comprovanteEndereco" />
                    )}
                    {showFieldForType("declaracaoVizinhos") && (
                      <DocumentRow label="Declaração dos Vizinhos" docField="declaracaoVizinhos" />
                    )}
                  </div>
                </div>
              )}

              {/* Passaportes */}
              {(showFieldForType("passaporteMae") || showFieldForType("passaportePaiRegistral") || showFieldForType("passaporteSupostoPai") || showFieldForType("passaportePai") || showFieldForType("passaporteCrianca")) && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">5</span>
                      Passaportes
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    {showFieldForType("passaporteMae") && (
                      <DocumentRow label="Passaporte Mãe" docField="passaporteMae" />
                    )}
                    {showFieldForType("passaportePaiRegistral") && (
                      <DocumentRow label="Passaporte Pai Registral" docField="passaportePaiRegistral" />
                    )}
                    {showFieldForType("passaporteSupostoPai") && (
                      <DocumentRow label="Passaporte Suposto Pai" docField="passaporteSupostoPai" />
                    )}
                    {showFieldForType("passaportePai") && (
                      <DocumentRow label="Passaporte Pai" docField="passaportePai" />
                    )}
                    {showFieldForType("passaporteCrianca") && (
                      <DocumentRow label="Passaporte Criança" docField="passaporteCrianca" />
                    )}
                  </div>
                </div>
              )}

              {/* Documentos Jurídicos e Processuais */}
              {(showFieldForType("peticaoConjunta") || showFieldForType("termoPartilhas") || showFieldForType("guarda") || showFieldForType("procuracao") || showFieldForType("peticaoCliente") || showFieldForType("procuracaoCliente") || showFieldForType("custas") || showFieldForType("peticaoInicial") || showFieldForType("matriculaImovel") || showFieldForType("aguaLuzIptu") || showFieldForType("guiaPaga") || showFieldForType("camposExigencias")) && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">6</span>
                      Documentos do Processo
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    {showFieldForType("peticaoConjunta") && (
                      <DocumentRow label="Petição Conjunta" field="peticaoConjunta" docField="peticaoConjunta" />
                    )}
                    {showFieldForType("termoPartilhas") && (
                      <DocumentRow label="Termo de Partilhas" field="termoPartilhas" docField="termoPartilhas" />
                    )}
                    {showFieldForType("guarda") && (
                      <DocumentRow label="Guarda" field="guarda" docField="guarda" />
                    )}
                    {showFieldForType("procuracao") && (
                      <DocumentRow label="Procuração" field="procuracao" docField="procuracao" />
                    )}
                    {showFieldForType("peticaoCliente") && (
                      <DocumentRow label="Petição Cliente" field="peticaoCliente" docField="peticaoCliente" />
                    )}
                    {showFieldForType("procuracaoCliente") && (
                      <DocumentRow label="Procuração Cliente" field="procuracaoCliente" docField="procuracaoCliente" />
                    )}
                    {showFieldForType("custas") && (
                      <DocumentRow label="Custas" field="custas" docField="custas" />
                    )}
                    {showFieldForType("peticaoInicial") && (
                      <DocumentRow label="Petição Inicial" field="peticaoInicial" docField="peticaoInicial" />
                    )}
                    {showFieldForType("matriculaImovel") && (
                      <DocumentRow label="Matrícula do Imóvel" field="matriculaImovel" docField="matriculaImovel" />
                    )}
                    {showFieldForType("aguaLuzIptu") && (
                      <DocumentRow label="Água / Luz / IPTU" field="aguaLuzIptu" docField="aguaLuzIptu" />
                    )}
                    {showFieldForType("iptu") && (
                      <DocumentRow label="IPTU" field="iptu" docField="iptu" />
                    )}
                    {showFieldForType("contaAgua") && (
                      <DocumentRow label="Conta de Água" field="contaAgua" docField="contaAgua" />
                    )}
                    {showFieldForType("contaLuz") && (
                      <DocumentRow label="Conta de Luz" field="contaLuz" docField="contaLuz" />
                    )}
                    {showFieldForType("guiaPaga") && (
                      <DocumentRow label="Guia Paga" field="guiaPaga" docField="guiaPaga" />
                    )}
                    {showFieldForType("camposExigencias") && (
                      <div className="col-span-2 space-y-2">
                        <Label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Exigências</Label>
                        <Textarea
                          value={formData.camposExigencias}
                          onChange={(e) => handleChange("camposExigencias", e.target.value)}
                          placeholder="Descreva as exigências"
                          className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm"
                          rows={3}
                        />
                        <DocumentRow label="Upload Exigências" docField="camposExigencias" />
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Observações */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-sky-500" />
                Outras Informações
              </h2>
            </div>
            <div className="p-8 grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={4}
                  placeholder="Adicione observações sobre o caso..."
                  className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 mt-8">
            <Link href="/dashboard/acoes-civeis">
              <Button
                type="button"
                variant="outline"
                className="px-6 py-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors h-auto"
              >
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              className="px-8 py-3 rounded-md bg-slate-800 text-white font-semibold hover:bg-slate-900 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 h-auto"
              disabled={loading}
            >
              <Save className="h-4 w-4" />
              {loading ? "Salvando..." : "Criar Ação"}
            </Button>
          </div>

          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar criação da ação</AlertDialogTitle>
                <AlertDialogDescription>
                  Criar ação para <span className="font-semibold">{formData.clientName}</span> do tipo <span className="font-semibold">{formData.type || '—'}</span>?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmOpen(false)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => { setConfirmOpen(false); doCreate(); }}>Confirmar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </form>
      </main>
    </div>
  );
}
