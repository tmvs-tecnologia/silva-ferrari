"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Upload, Info, Moon, Sun, FileText, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export default function NovaPerdaNacionalidadePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // State structure matching Vistos form pattern
  const [formData, setFormData] = useState({
    clientName: "",
    nomeMae: "",
    nomePai: "",
    nomeCrianca: "",
    rnmMae: "",
    rnmMaeDoc: "",
    rnmPai: "",
    rnmPaiDoc: "",
    cpfMae: "",
    cpfMaeDoc: "",
    cpfPai: "",
    cpfPaiDoc: "",
    passaporteMae: "",
    passaporteMaeDoc: "",
    passaportePai: "",
    passaportePaiDoc: "",
    passaporteCrianca: "",
    passaporteCriancaDoc: "",
    rgCrianca: "",
    rgCriancaDoc: "",
    certidaoNascimentoDoc: "",
    comprovanteEnderecoDoc: "",
    documentoChinesDoc: "",
    traducaoJuramentadaDoc: "",
    notes: "",
  });

  const [uploadingDocs, setUploadingDocs] = useState<Record<string, boolean>>({});
  const [extraUploads, setExtraUploads] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach((el) => {
      try {
        el.setAttribute('multiple', '');
      } catch {}
    });
  }, []);

  const handleChange = (field: string, value: any) => {
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

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setUploadingDocs((prev) => ({ ...prev, [field]: true }));

    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        if (!validateFile(file)) continue;

        const formDataUpload = new FormData();
        formDataUpload.append("file", file);

        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formDataUpload,
        });

        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(data.fileUrl);
        } else {
          const errorData = await response.json();
          console.error("Upload error:", errorData);
          toast.error(errorData.error || "Erro ao enviar documento");
        }
      }

      if (uploadedUrls.length) {
        const currentPrimary = (formData as any)[field] as string | undefined;
        if (!currentPrimary) {
          handleChange(field, uploadedUrls[0]);
          const rest = uploadedUrls.slice(1);
          if (rest.length) {
            setExtraUploads((prev) => ({
              ...prev,
              [field]: [...(prev[field] || []), ...rest],
            }));
          }
        } else {
          setExtraUploads((prev) => ({
            ...prev,
            [field]: [...(prev[field] || []), ...uploadedUrls],
          }));
        }
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

  const handleRemoveFile = (docField: string, fileUrl: string) => {
    // Check if it's the main file
    if ((formData as any)[docField] === fileUrl) {
      handleChange(docField, "");
    }
    
    // Check extra uploads
    if (extraUploads[docField]) {
      setExtraUploads(prev => ({
        ...prev,
        [docField]: prev[docField].filter(url => url !== fileUrl)
      }));
    }
  };

  const convertTemporaryUploads = async (caseId: number) => {
    const documentFields = [
      "rnmMaeDoc",
      "rnmPaiDoc",
      "cpfMaeDoc",
      "cpfPaiDoc",
      "passaporteMaeDoc",
      "passaportePaiDoc",
      "passaporteCriancaDoc",
      "rgCriancaDoc",
      "certidaoNascimentoDoc",
      "comprovanteEnderecoDoc",
      "documentoChinesDoc",
      "traducaoJuramentadaDoc"
    ];

    const documentsToConvert: { fieldName: string; fileUrl: string }[] = [];
    for (const field of documentFields) {
      const urls = new Set<string>();
      const single = (formData as any)[field] as string | undefined;
      if (single) urls.add(single);
      const extras = extraUploads[field] || [];
      for (const u of extras) urls.add(u);
      for (const u of urls) {
        documentsToConvert.push({ fieldName: field, fileUrl: u });
      }
    }

    if (documentsToConvert.length > 0) {
      try {
        await fetch("/api/documents/convert-temporary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId,
            moduleType: "perda_nacionalidade",
            clientName: formData.clientName,
            documents: documentsToConvert,
          }),
        });
      } catch (error) {
        console.error("Erro ao converter uploads temporários:", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create the case
      const response = await fetch("/api/perda-nacionalidade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          status: "Em Andamento",
          currentStep: 1,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar processo");
      }

      const data = await response.json();
      
      if (data?.id) {
        await convertTemporaryUploads(data.id);
      }
      
      toast.success("Processo criado com sucesso!");
      router.push("/dashboard/perda-nacionalidade");
      router.refresh();
    } catch (error) {
      console.error("Error creating case:", error);
      toast.error("Erro ao criar processo");
    } finally {
      setLoading(false);
    }
  };

  const DocumentRow = ({ label, field, docField, placeholder = "Status ou informações do documento", readOnly = false }: { label: string; field?: string; docField: string; placeholder?: string; readOnly?: boolean }) => {
    // Coletar todos os arquivos anexados (principal + extras)
    const attachedFiles: string[] = [];
    const mainFile = (formData as any)[docField] as string | undefined;
    if (mainFile) attachedFiles.push(mainFile);
    if (extraUploads[docField] && extraUploads[docField].length > 0) {
      attachedFiles.push(...extraUploads[docField]);
    }
    
    return (
      <div className="space-y-2">
        <Label className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</Label>
        <div className="flex gap-3 items-start">
          {readOnly ? (
            <div className="flex-1 flex items-center p-2.5 rounded-md border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm">
              <span className={`text-xs ${attachedFiles.length > 0 ? "text-green-600 font-medium" : "italic"}`}>
                {attachedFiles.length > 0 ? `${attachedFiles.length} documento(s) anexado(s)` : "Nenhum arquivo selecionado"}
              </span>
            </div>
          ) : (
            <Input
              value={field ? (formData[field as keyof typeof formData] as string) : ""}
              onChange={(e) => field && handleChange(field, e.target.value)}
              className="flex-1 rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5"
              placeholder={placeholder}
            />
          )}
          <div className="relative">
             <input
                type="file"
                id={`upload-${docField}`}
                className="hidden"
                onChange={(e) => handleDocumentUpload(e, docField)}
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
        
        {/* Lista de arquivos anexados */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {attachedFiles.map((url, idx) => {
              const fileName = url.split('/').pop() || `Documento ${idx + 1}`;
              const decodedName = decodeURIComponent(fileName);
              return (
                <div key={idx} className="relative group">
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-2 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:border-sky-200 dark:hover:border-sky-800 transition-all"
                    title={decodedName}
                  >
                    <FileText className="h-5 w-5 text-slate-500 group-hover:text-sky-600 dark:text-slate-400 dark:group-hover:text-sky-400" />
                  </a>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveFile(docField, url);
                      }}
                      className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                      title="Remover arquivo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
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
            <Link href="/dashboard/perda-nacionalidade">
                <button className="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                <ArrowLeft className="h-6 w-6" />
                </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Nova Ação - Perda de Nacionalidade</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Preencha os dados para criar um novo processo</p>
            </div>
          </div>
          <button 
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" 
            onClick={() => document.documentElement.classList.toggle('dark')}
          >
            <Moon className="h-5 w-5 hidden dark:block" />
            <Sun className="h-5 w-5 dark:hidden" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 flex-grow w-full">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 1. Informações do Cliente */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Info className="h-5 w-5 text-sky-500" />
                Informações do Cliente
              </h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Nome do Cliente *</Label>
                <Input 
                    value={formData.clientName}
                    onChange={(e) => handleChange("clientName", e.target.value)}
                    className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 focus:ring-sky-500 focus:border-sky-500 text-sm py-2.5"
                    placeholder="Digite o nome completo do cliente"
                    required 
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Nome da Mãe</Label>
                <Input 
                    value={formData.nomeMae}
                    onChange={(e) => handleChange("nomeMae", e.target.value)}
                    className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5"
                    placeholder="Nome da mãe"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Nome do Pai</Label>
                <Input 
                    value={formData.nomePai}
                    onChange={(e) => handleChange("nomePai", e.target.value)}
                    className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5"
                    placeholder="Nome do pai"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Nome da Criança</Label>
                <Input 
                    value={formData.nomeCrianca}
                    onChange={(e) => handleChange("nomeCrianca", e.target.value)}
                    className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5"
                    placeholder="Nome da criança"
                />
              </div>
            </div>
          </div>

          {/* 2. Documentos dos Pais */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">2</span>
                Documentos dos Pais
              </h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
              <DocumentRow label="RNM da Mãe" field="rnmMae" docField="rnmMaeDoc" placeholder="Número do RNM" />
              <DocumentRow label="CPF da Mãe" field="cpfMae" docField="cpfMaeDoc" placeholder="CPF" />
              <DocumentRow label="RNM do Pai" field="rnmPai" docField="rnmPaiDoc" placeholder="Número do RNM" />
              <DocumentRow label="CPF do Pai" field="cpfPai" docField="cpfPaiDoc" placeholder="CPF" />
            </div>
          </div>

          {/* 3. Passaportes */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">3</span>
                Passaportes
              </h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
              <DocumentRow label="Passaporte da Mãe" field="passaporteMae" docField="passaporteMaeDoc" placeholder="Número do passaporte" />
              <DocumentRow label="Passaporte do Pai" field="passaportePai" docField="passaportePaiDoc" placeholder="Número do passaporte" />
              <div className="md:col-span-2">
                <DocumentRow label="Passaporte da Criança" field="passaporteCrianca" docField="passaporteCriancaDoc" placeholder="Número do passaporte" />
              </div>
            </div>
          </div>

          {/* 4. Documentos da Criança */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">4</span>
                Documentos da Criança
              </h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
              <DocumentRow label="RG da Criança" field="rgCrianca" docField="rgCriancaDoc" placeholder="Número do RG" />
              <DocumentRow label="Certidão de Nascimento" docField="certidaoNascimentoDoc" readOnly />
            </div>
          </div>

          {/* 5. Documentos Adicionais */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">5</span>
                Documentos Adicionais
              </h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
              <DocumentRow label="Comprovante de Endereço" docField="comprovanteEnderecoDoc" readOnly />
              <DocumentRow label="Documento Chinês" docField="documentoChinesDoc" readOnly />
              <DocumentRow label="Tradução Juramentada" docField="traducaoJuramentadaDoc" readOnly />
            </div>
          </div>

          {/* 6. Observações */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">6</span>
                Observações
              </h2>
            </div>
            <div className="p-8">
              <Label htmlFor="notes" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Observações Gerais</Label>
              <Textarea
                id="notes"
                rows={4}
                placeholder="Adicione observações sobre o caso..."
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 mt-8">
            <Button
                type="button"
                variant="outline"
                className="px-6 py-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors h-auto"
                onClick={() => router.push("/dashboard/perda-nacionalidade")}
            >
                Cancelar
            </Button>
            <Button
                type="submit"
                className="px-8 py-3 rounded-md bg-slate-800 text-white font-semibold hover:bg-slate-900 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 h-auto"
                disabled={loading}
            >
                <Save className="h-4 w-4" />
                {loading ? "Salvando..." : "Criar Processo"}
            </Button>
          </div>

        </form>
      </main>
    </div>
  );
}
