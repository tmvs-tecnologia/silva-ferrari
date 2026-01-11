"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, ChevronDown, Upload, Check, Calendar as CalendarIcon, Info, Moon, Sun, Camera, FileText, ExternalLink, X, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";

interface Vendedor {
  rg: string;
  cpf: string;
  dataNascimento: string;
}

interface Comprador {
  rnm: string;
  cpf: string;
  endereco: string;
}

export default function NovaCompraVendaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // State for dynamic lists
  const [vendedores, setVendedores] = useState<Vendedor[]>([
    { rg: "", cpf: "", dataNascimento: "" }
  ]);
  const [compradores, setCompradores] = useState<Comprador[]>([
    { rnm: "", cpf: "", endereco: "" }
  ]);

  const [formData, setFormData] = useState({
    clientName: "",
    tipoTransacao: "compra", // Default
    numeroMatricula: "",
    numeroMatriculaDoc: "",
    cadastroContribuinte: "",
    cadastroContribuinteDoc: "",
    enderecoImovel: "",
    comprovanteEnderecoImovelDoc: "",
    prazoSinal: "",
    prazoEscritura: "",
    contractNotes: "",
    // Dynamic docs will be stored in extraUploads mostly, or handled via specific logic
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Collect dynamic documents
      // We need to map the dynamic uploads to something the backend understands or keep them as is if backend logic supports it.
      // The original CompraVenda used "rgVendedorDoc_${index}" which likely went into documents table.
      
      const response = await fetch("/api/compra-venda-imoveis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          rgVendedores: vendedores.map(v => v.rg).filter(Boolean).join(","),
          cpfVendedores: vendedores.map(v => v.cpf).filter(Boolean).join(","),
          dataNascimentoVendedores: vendedores.map(v => v.dataNascimento).filter(Boolean).join(","),
          rnmComprador: compradores.map(c => c.rnm).filter(Boolean).join(","),
          cpfComprador: compradores.map(c => c.cpf).filter(Boolean).join(","),
          enderecoComprador: compradores.map(c => c.endereco).filter(Boolean).join(","),
          currentStep: 1, // Start at step 1
          status: "Em Andamento",
        }),
      });

      if (response.ok) {
        const newRecord = await response.json();
        if (newRecord?.id) {
          await convertTemporaryUploads(newRecord.id);
        }
        router.push("/dashboard/compra-venda");
      } else {
        alert("Erro ao criar transação");
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
      alert("Erro ao criar transação");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleVendedorChange = (index: number, field: keyof Vendedor, value: string) => {
    const updatedVendedores = [...vendedores];
    updatedVendedores[index][field] = value;
    setVendedores(updatedVendedores);
  };

  const handleCompradorChange = (index: number, field: keyof Comprador, value: string) => {
    const updatedCompradores = [...compradores];
    updatedCompradores[index][field] = value;
    setCompradores(updatedCompradores);
  };

  const addVendedor = () => {
    setVendedores([...vendedores, { rg: "", cpf: "", dataNascimento: "" }]);
  };

  const removeVendedor = (index: number) => {
    if (vendedores.length > 1) {
      setVendedores(vendedores.filter((_, i) => i !== index));
    }
  };

  const addComprador = () => {
    setCompradores([...compradores, { rnm: "", cpf: "", endereco: "" }]);
  };

  const removeComprador = (index: number) => {
    if (compradores.length > 1) {
      setCompradores(compradores.filter((_, i) => i !== index));
    }
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
          console.error("Upload error");
        }
      }

      if (uploadedUrls.length) {
        // If it's a main field in formData, update it. If it's a dynamic field (like vendedor_0), we use extraUploads or a specific state?
        // For simplicity and compatibility with convertTemporaryUploads, we'll store everything in extraUploads if it's not in formData,
        // or just rely on extraUploads for the lists.
        
        // Check if field exists in formData
        if (Object.prototype.hasOwnProperty.call(formData, field)) {
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
        } else {
            // For dynamic fields (e.g. rgVendedorDoc_0), we just use extraUploads to track them for now, 
            // but we need a way to link them. 
            // Actually, the easiest way for dynamic fields is to treat them as "extraUploads" with the key.
            setExtraUploads((prev) => ({
                ...prev,
                [field]: [...(prev[field] || []), ...uploadedUrls],
            }));
        }
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Erro ao enviar documento");
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleRemoveFile = (docField: string, fileUrl: string) => {
    if (Object.prototype.hasOwnProperty.call(formData, docField)) {
        if ((formData as any)[docField] === fileUrl) {
            handleChange(docField, "");
        }
    }
    
    if (extraUploads[docField]) {
      setExtraUploads(prev => ({
        ...prev,
        [docField]: prev[docField].filter(url => url !== fileUrl)
      }));
    }
  };

  const convertTemporaryUploads = async (caseId: number) => {
    // Collect all fields that might have uploads
    const documentFields = [
      "numeroMatriculaDoc",
      "cadastroContribuinteDoc",
      "comprovanteEnderecoImovelDoc",
      // Add dynamic fields
      ...vendedores.map((_, i) => `rgVendedorDoc_${i}`),
      ...vendedores.map((_, i) => `cpfVendedorDoc_${i}`),
      ...compradores.map((_, i) => `rnmCompradorDoc_${i}`),
      ...compradores.map((_, i) => `cpfCompradorDoc_${i}`),
    ];

    const documentsToConvert: { fieldName: string; fileUrl: string }[] = [];
    for (const field of documentFields) {
      const urls = new Set<string>();
      if (Object.prototype.hasOwnProperty.call(formData, field)) {
          const single = (formData as any)[field] as string | undefined;
          if (single) urls.add(single);
      }
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
            moduleType: "compra_venda_imoveis",
            clientName: formData.clientName,
            documents: documentsToConvert,
          }),
        });
      } catch (error) {
        console.error("Erro ao converter uploads temporários:", error);
      }
    }
  };

  const DocumentRow = ({ label, field, docField, placeholder = "Informações", readOnly = false }: { label: string; field?: string; docField: string; placeholder?: string; readOnly?: boolean }) => {
    const attachedFiles: string[] = [];
    if (field && Object.prototype.hasOwnProperty.call(formData, docField)) {
        const mainFile = (formData as any)[docField] as string | undefined;
        if (mainFile) attachedFiles.push(mainFile);
    }
    
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

  // Simplified DocumentRow for dynamic lists (no text input, just label + upload)
  const DynamicDocumentRow = ({ label, docField }: { label: string; docField: string }) => {
    const attachedFiles = extraUploads[docField] || [];
    
    return (
        <div className="space-y-2">
            <Label className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</Label>
            <div className="flex gap-3 items-center">
                <div className="flex-1 flex items-center p-2.5 rounded-md border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm">
                    <span className={`text-xs ${attachedFiles.length > 0 ? "text-green-600 font-medium" : "italic"}`}>
                        {attachedFiles.length > 0 ? `${attachedFiles.length} documento(s) anexado(s)` : "Nenhum arquivo selecionado"}
                    </span>
                </div>
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
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    )
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 min-h-screen flex flex-col font-sans">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/compra-venda">
                <button className="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                <ArrowLeft className="h-6 w-6" />
                </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Nova Transação</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Cadastre uma nova compra e venda de imóvel</p>
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
          
          {/* Informações Básicas */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Info className="h-5 w-5 text-sky-500" />
                Dados do Cliente e Imóvel
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
              
              <div className="md:col-span-2">
                <DocumentRow 
                    label="Endereço do Imóvel" 
                    field="enderecoImovel" 
                    docField="comprovanteEnderecoImovelDoc" 
                    placeholder="Endereço completo" 
                />
              </div>

              <DocumentRow 
                label="Nº Matrícula" 
                field="numeroMatricula" 
                docField="numeroMatriculaDoc" 
              />
              
              <DocumentRow 
                label="Cadastro Contribuinte" 
                field="cadastroContribuinte" 
                docField="cadastroContribuinteDoc" 
              />
            </div>
          </div>

          {/* Vendedores */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">2</span>
                Vendedores
              </h2>
              <Button type="button" variant="outline" size="sm" onClick={addVendedor} className="gap-2">
                <Plus className="h-4 w-4" /> Adicionar Vendedor
              </Button>
            </div>
            <div className="p-8 space-y-8">
                {vendedores.map((vendedor, index) => (
                    <div key={index} className="relative p-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
                         {vendedores.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeVendedor(index)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Vendedor {index + 1}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <Label className="block text-sm font-medium mb-2">RG / CNH</Label>
                                <Input 
                                    value={vendedor.rg}
                                    onChange={(e) => handleVendedorChange(index, "rg", e.target.value)}
                                    className="w-full"
                                />
                                <div className="mt-2">
                                    <DynamicDocumentRow label="Documento RG" docField={`rgVendedorDoc_${index}`} />
                                </div>
                            </div>
                            <div>
                                <Label className="block text-sm font-medium mb-2">CPF</Label>
                                <Input 
                                    value={vendedor.cpf}
                                    onChange={(e) => handleVendedorChange(index, "cpf", e.target.value)}
                                    className="w-full"
                                />
                                <div className="mt-2">
                                    <DynamicDocumentRow label="Documento CPF" docField={`cpfVendedorDoc_${index}`} />
                                </div>
                            </div>
                            <div>
                                <Label className="block text-sm font-medium mb-2">Data de Nascimento</Label>
                                <Input 
                                    type="date"
                                    value={vendedor.dataNascimento}
                                    onChange={(e) => handleVendedorChange(index, "dataNascimento", e.target.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>

          {/* Compradores */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">3</span>
                Compradores
              </h2>
               <Button type="button" variant="outline" size="sm" onClick={addComprador} className="gap-2">
                <Plus className="h-4 w-4" /> Adicionar Comprador
              </Button>
            </div>
            <div className="p-8 space-y-8">
                {compradores.map((comprador, index) => (
                    <div key={index} className="relative p-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
                        {compradores.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeComprador(index)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Comprador {index + 1}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <Label className="block text-sm font-medium mb-2">RNM</Label>
                                <Input 
                                    value={comprador.rnm}
                                    onChange={(e) => handleCompradorChange(index, "rnm", e.target.value)}
                                    className="w-full"
                                />
                                <div className="mt-2">
                                    <DynamicDocumentRow label="Documento RNM" docField={`rnmCompradorDoc_${index}`} />
                                </div>
                            </div>
                            <div>
                                <Label className="block text-sm font-medium mb-2">CPF</Label>
                                <Input 
                                    value={comprador.cpf}
                                    onChange={(e) => handleCompradorChange(index, "cpf", e.target.value)}
                                    className="w-full"
                                />
                                <div className="mt-2">
                                    <DynamicDocumentRow label="Documento CPF" docField={`cpfCompradorDoc_${index}`} />
                                </div>
                            </div>
                            <div>
                                <Label className="block text-sm font-medium mb-2">Endereço</Label>
                                <Input 
                                    value={comprador.endereco}
                                    onChange={(e) => handleCompradorChange(index, "endereco", e.target.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>

          {/* Observações */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
             <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">4</span>
                Observações
              </h2>
            </div>
            <div className="p-8">
                <Label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Observações Gerais</Label>
                <Textarea 
                    value={formData.contractNotes}
                    onChange={(e) => handleChange("contractNotes", e.target.value)}
                    className="w-full min-h-[100px]"
                    placeholder="Adicione observações importantes sobre o processo..."
                />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 mt-8">
            <Button
                type="button"
                variant="outline"
                className="px-6 py-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors h-auto"
                onClick={() => router.push("/dashboard/compra-venda")}
            >
                Cancelar
            </Button>
            <Button
                type="submit"
                className="px-8 py-3 rounded-md bg-slate-800 text-white font-semibold hover:bg-slate-900 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 h-auto"
                disabled={loading}
            >
                <Save className="h-4 w-4" />
                {loading ? "Salvando..." : "Criar Transação"}
            </Button>
          </div>

        </form>
      </main>
    </div>
  );
}
