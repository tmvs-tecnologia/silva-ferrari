"use client";

import { useState, useEffect, useMemo, createContext, useContext } from "react";
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
import { ArrowLeft, Save, ChevronDown, Upload, Check, Calendar as CalendarIcon, Info, Moon, Sun, Camera, FileText, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { DocumentChip } from "@/components/ui/document-chip";

interface VistoFormContextType {
  formData: any;
  handleChange: (field: string, value: any) => void;
  uploadingDocs: Record<string, boolean>;
  handleDocumentUpload: (e: React.ChangeEvent<HTMLInputElement>, field: string) => Promise<void>;
  extraUploads: Record<string, string[]>;
  handleRemoveFile: (docField: string, fileUrl: string) => void;
}

const VistoFormContext = createContext<VistoFormContextType | null>(null);

const DocumentRow = ({ label, field, docField, placeholder = "Status ou informações do documento", readOnly = false, required = false }: { label: string; field?: string; docField: string; placeholder?: string; readOnly?: boolean; required?: boolean }) => {
  const context = useContext(VistoFormContext);
  if (!context) return null;
  const { formData, handleChange, uploadingDocs, extraUploads, handleDocumentUpload, handleRemoveFile } = context;

  // Coletar todos os arquivos anexados (principal + extras)
  const attachedFiles: string[] = [];
  const mainFile = (formData as any)[docField] as string | undefined;
  if (mainFile) attachedFiles.push(mainFile);
  if (extraUploads[docField] && extraUploads[docField].length > 0) {
    attachedFiles.push(...extraUploads[docField]);
  }

  const isMissing = required && attachedFiles.length === 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        {isMissing && (
          <span className="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded">
            Pendente
          </span>
        )}
      </div>
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

      {/* Lista de arquivos anexados */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {attachedFiles.map((url, idx) => {
            const fileName = url.split('/').pop() || `Documento ${idx + 1}`;
            const decodedName = decodeURIComponent(fileName);
            return (
              <DocumentChip
                key={idx}
                name={decodedName}
                href={url}
                onDelete={!readOnly ? () => handleRemoveFile(docField, url) : undefined}
                className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:border-sky-200 dark:hover:border-sky-800 transition-all"
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function NovoVistoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Keep existing state structure to ensure compatibility
  const [formData, setFormData] = useState({
    clientName: "",
    type: "Trabalho:Brasil",
    country: "",
    travelStartDate: "",
    travelEndDate: "",
    cpf: "",
    cpfDoc: "",
    rnm: "",
    rnmDoc: "",
    passaporte: "",
    passaporteDoc: "",
    comprovanteEndereco: "",
    comprovanteEnderecoDoc: "",
    comprovanteNaoNoNome: false,
    declaracaoResidenciaDoc: "",
    foto3x4Doc: "",
    documentoChines: "",
    documentoChinesDoc: "",
    antecedentesCriminais: "",
    antecedentesCriminaisDoc: "",
    // Campos específicos de Visto de Trabalho - Brasil
    certidaoNascimento: "",
    certidaoNascimentoDoc: "",
    // declaracaoCompreensao removed
    certidaoNascimentoFilhos: "",
    certidaoNascimentoFilhosDoc: "",
    cartaoCnpj: "",
    cartaoCnpjDoc: "",
    contratoEmpresa: "",
    contratoEmpresaDoc: "",
    gfip: "",
    gfipDoc: "",
    certificadoTrabalho: "",
    certificadoTrabalhoDoc: "",
    traducaoAntecedentesCriminais: "",
    traducaoAntecedentesCriminaisDoc: "",
    traducaoCertificadoTrabalho: "",
    traducaoCertificadoTrabalhoDoc: "",
    traducaoDiploma: "",
    traducaoDiplomaDoc: "",
    traducaoCertidaoNascimento: "",
    traducaoCertidaoNascimentoDoc: "",
    declaracoesEmpresa: "",
    declaracoesEmpresaDoc: "",
    procuracaoEmpresa: "",
    procuracaoEmpresaDoc: "",
    procuracaoEmpresaAssinada: "",
    procuracaoEmpresaAssinadaDoc: "",
    procuracaoImigrante: "",
    procuracaoImigranteDoc: "",
    procuracaoImigranteAssinada: "",
    procuracaoImigranteAssinadaDoc: "",
    formularioRn01: "",
    formularioRn01Doc: "",
    guiaPaga: "",
    guiaPagaDoc: "",
    publicacaoDou: "",
    publicacaoDouDoc: "",
    contratoTrabalho: "",
    contratoTrabalhoDoc: "",
    folhaPagamento: "",
    folhaPagamentoDoc: "",
    comprovanteVinculoAnterior: "",
    comprovanteVinculoAnteriorDoc: "",
    declaracaoAntecedentesCriminais: "",
    declaracaoAntecedentesCriminaisDoc: "",
    diploma: "",
    diplomaDoc: "",
    // Renovação 1 ano
    ctps: "",
    ctpsDoc: "",
    contratoTrabalhoAnterior: "",
    contratoTrabalhoAnteriorDoc: "",
    contratoTrabalhoAtual: "",
    contratoTrabalhoAtualDoc: "",
    formularioProrrogacao: "",
    formularioProrrogacaoDoc: "",
    contratoTrabalhoIndeterminado: "",
    contratoTrabalhoIndeterminadoDoc: "",
    justificativaMudancaEmpregador: "",
    justificativaMudancaEmpregadorDoc: "",
    escrituraImoveis: "",
    escrituraImoveisDoc: "",
    extratosBancarios: "",
    extratosBancariosDoc: "",
    impostoRenda: "",
    impostoRendaDoc: "",
    reservasPassagens: "",
    reservasPassagensDoc: "",
    reservasHotel: "",
    reservasHotelDoc: "",
    seguroViagem: "",
    seguroViagemDoc: "",
    roteiroViagem: "",
    roteiroViagemDoc: "",
    taxa: "",
    taxaDoc: "",
    formularioConsulado: "",
    formularioConsuladoDoc: "",
    comprovanteInvestimento: "",
    comprovanteInvestimentoDoc: "",
    planoInvestimentos: "",
    planoInvestimentosDoc: "",
    formularioRequerimento: "",
    formularioRequerimentoDoc: "",
    protocolado: "",
    protocoladoDoc: "",
    procurador: "",
    numeroProcesso: "",
  });

  const [travelRangeOpen, setTravelRangeOpen] = useState(false);
  const [tempTravelRange, setTempTravelRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined);
  const [activeTripField, setActiveTripField] = useState<'from' | 'to'>('from');
  const [uploadingDocs, setUploadingDocs] = useState<Record<string, boolean>>({});
  const [extraUploads, setExtraUploads] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach((el) => {
      try {
        el.setAttribute('multiple', '');
      } catch { }
    });
  }, []);

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
    // Tamanho aumentado para 50MB para suportar arquivos maiores se necessário (backend limita em 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB

    // Verificação de arquivo vazio
    if (file.size === 0) {
      alert(`Arquivo vazio: ${file.name}.`);
      return false;
    }

    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|doc|docx|xls|xlsx|txt|rtf)$/i)) {
      // Fallback para verificar extensão se o tipo MIME falhar ou for genérico
      alert(`Formato inválido: ${file.name}. Formatos aceitos: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, TXT.`);
      return false;
    }

    if (file.size > maxSize) {
      alert(`Arquivo muito grande: ${file.name}. Máximo 50MB.`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Identificação de documentos faltantes para Alertas (sem bloquear)
    let missingDocs: { field: string; label: string }[] = [];



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
        const newRecord = await response.json();
        if (newRecord?.id) {
          await convertTemporaryUploads(newRecord.id);

          // Criar alertas para documentos faltantes
          if (missingDocs.length > 0) {
            try {
              // Criar alertas sequencialmente ou em paralelo
              await Promise.all(missingDocs.map(doc =>
                fetch("/api/alerts", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    moduleType: "vistos",
                    recordId: newRecord.id,
                    alertFor: "Documento Pendente",
                    message: `O documento obrigatório '${doc.label}' está pendente.`,
                    status: "pending",
                    data: JSON.stringify({ field: doc.field })
                  })
                })
              ));
            } catch (alertError) {
              console.error("Erro ao criar alertas:", alertError);
            }
          }
        }
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

  const handleChange = (field: string, value: any) => {
    if (field === "procurador") {
      // Validation: alphabetic and spaces only, max 100 chars
      const sanitized = value.replace(/[^a-zA-Z\u00C0-\u00FF\s]/g, "").slice(0, 100);
      setFormData((prev) => ({ ...prev, [field]: sanitized }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const countryOptions = useMemo(() => {
    const codes = [
      "AF", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BQ", "BA", "BW", "BV", "BR", "IO", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", "KY", "CF", "TD", "CL", "CN", "CX", "CC", "CO", "KM", "CD", "CG", "CK", "CR", "CI", "HR", "CU", "CW", "CY", "CZ", "DK", "DJ", "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF", "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY", "HT", "HM", "VA", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM", "JP", "JE", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MO", "MK", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX", "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NC", "NZ", "NI", "NE", "NG", "NU", "NF", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PN", "PL", "PT", "PR", "QA", "RE", "RO", "RU", "RW", "BL", "SH", "KN", "LC", "MF", "PM", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SX", "SK", "SI", "SB", "SO", "ZA", "GS", "SS", "ES", "LK", "SD", "SR", "SJ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK", "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "US", "UM", "UY", "UZ", "VU", "VE", "VN", "VG", "VI", "WF", "EH", "YE", "ZM", "ZW"
    ];
    const dn = new Intl.DisplayNames(["pt-BR"], { type: "region" });
    const flag = (code: string) => code.replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
    const list = codes.map(code => ({ code, name: dn.of(code) || code, flag: flag(code) }));
    return list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
  }, []);

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setUploadingDocs((prev) => ({ ...prev, [field]: true }));

    try {
      const uploadedUrls: string[] = [];
      const MAX_DIRECT_SIZE = 4 * 1024 * 1024; // 4MB threshold

      for (const file of files) {
        if (!validateFile(file)) continue;

        let fileUrl = "";

        if (file.size > MAX_DIRECT_SIZE) {
          // Signed Upload (Temporary Flow for Novo Page)
          try {
            // 1. Get Signed URL (No recordId/fieldName = Temporary)
            const signRes = await fetch("/api/documents/upload/sign", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fileName: file.name,
                fileType: file.type,
                clientName: formData.clientName || "Novo Cliente",
                moduleType: "vistos"
                // fieldName omitted to trigger temporary upload flow (no recordId needed)
              })
            });

            if (!signRes.ok) {
              const errorData = await signRes.json();
              throw new Error(errorData.error || "Falha ao iniciar upload");
            }

            const { signedUrl, publicUrl } = await signRes.json();

            // 2. Upload to Supabase Storage
            const uploadRes = await fetch(signedUrl, {
              method: "PUT",
              body: file,
              headers: { "Content-Type": file.type }
            });

            if (!uploadRes.ok) throw new Error("Falha no envio do arquivo");

            fileUrl = publicUrl;

            // 3. Register Metadata (Register Only)
            await fetch("/api/documents/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                isRegisterOnly: true,
                fileUrl,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                // fieldName omitted for temporary upload flow
                moduleType: "vistos",
                clientName: formData.clientName
              })
            });

          } catch (err: any) {
            console.error("Upload assinado falhou:", err);
            alert(`Erro ao enviar ${file.name}: ${err.message}`);
            continue;
          }
        } else {
          // Standard Direct Upload (< 4MB)
          const formDataUpload = new FormData();
          formDataUpload.append("file", file);
          // Append context data if needed by backend regular upload
          formDataUpload.append("moduleType", "vistos");
          if (formData.clientName) formDataUpload.append("clientName", formData.clientName);

          const response = await fetch("/api/documents/upload", {
            method: "POST",
            body: formDataUpload,
          });

          if (response.ok) {
            const data = await response.json();
            fileUrl = data.fileUrl;
          } else {
            const errorData = await response.json();
            console.error("Upload error:", errorData);
            alert(errorData.error || "Erro ao enviar documento");
            continue;
          }
        }

        if (fileUrl) {
          uploadedUrls.push(fileUrl);
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
      alert("Erro ao enviar documento");
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [field]: false }));
      // Clear input value to allow re-uploading same file
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
      "cpfDoc",
      "rnmDoc",
      "passaporteDoc",
      "comprovanteEnderecoDoc",
      "declaracaoResidenciaDoc",
      "foto3x4Doc",
      "documentoChinesDoc",
      "antecedentesCriminaisDoc",
      "certidaoNascimentoFilhosDoc",
      "cartaoCnpjDoc",
      "contratoEmpresaDoc",
      "gfipDoc",
      "certificadoTrabalhoDoc",
      "traducaoAntecedentesCriminaisDoc",
      "traducaoCertificadoTrabalhoDoc",
      "traducaoDiplomaDoc",
      "traducaoCertidaoNascimentoDoc",
      "escrituraImoveisDoc",
      "extratosBancariosDoc",
      "impostoRendaDoc",
      "reservasPassagensDoc",
      "reservasHotelDoc",
      "seguroViagemDoc",
      "roteiroViagemDoc",
      "taxaDoc",
      "formularioConsuladoDoc",
      "declaracaoCompreensaoDoc",
      "declaracoesEmpresaDoc",
      "procuracaoEmpresaDoc",
      "procuracaoEmpresaAssinadaDoc",
      "procuracaoImigranteDoc",
      "procuracaoImigranteAssinadaDoc",
      "formularioRn01Doc",
      "guiaPagaDoc",
      "protocoladoDoc",
      "publicacaoDouDoc",
      "contratoTrabalhoDoc",
      "folhaPagamentoDoc",
      "comprovanteVinculoAnteriorDoc",
      "declaracaoAntecedentesCriminaisDoc",
      "ctpsDoc",
      "contratoTrabalhoAnteriorDoc",
      "contratoTrabalhoAtualDoc",
      "formularioProrrogacaoDoc",
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
            moduleType: "vistos",
            clientName: formData.clientName,
            documents: documentsToConvert,
          }),
        });
      } catch (error) {
        console.error("Erro ao converter uploads temporários:", error);
      }
    }
  };



  const contextValue: VistoFormContextType = {
    formData,
    handleChange,
    uploadingDocs,
    handleDocumentUpload,
    extraUploads,
    handleRemoveFile
  };

  return (
    <VistoFormContext.Provider value={contextValue}>
      <div className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 min-h-screen flex flex-col font-sans">
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/vistos">
                <button className="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Novo Visto</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie processos de vistos internacionais</p>
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

            {/* Informações do Visto */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <Info className="h-5 w-5 text-sky-500" />
                  Informações do Visto
                </h2>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-4">
                  <Label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Nome do Cliente *</Label>
                  <Input
                    value={formData.clientName}
                    onChange={(e) => handleChange("clientName", e.target.value)}
                    className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 focus:ring-sky-500 focus:border-sky-500 text-sm py-2.5"
                    placeholder="Digite o nome completo do cliente"
                    required
                  />
                </div>
                <div className="md:col-span-4">
                  <Label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Procurador</Label>
                  <Input
                    value={formData.procurador}
                    onChange={(e) => handleChange("procurador", e.target.value)}
                    className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 focus:ring-sky-500 focus:border-sky-500 text-sm py-2.5"
                    placeholder="Nome do procurador (opcional)"
                  />
                </div>
                <div className="md:col-span-4">
                  <Label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Tipo de Visto *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleChange("type", value)}
                  >
                    <SelectTrigger className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 py-2.5 h-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel className="font-bold text-slate-900 dark:text-slate-100">Visto de Trabalho</SelectLabel>
                        <SelectItem value="Trabalho:Brasil">Trabalho - Brasil</SelectItem>
                        <SelectItem value="Trabalho:Residência Prévia">Trabalho - Residência Prévia</SelectItem>
                        <SelectItem value="Trabalho:Renovação 1 ano">Trabalho - Renovação 1 ano</SelectItem>
                        <SelectItem value="Trabalho:Indeterminado">Trabalho - Indeterminado</SelectItem>
                        <SelectItem value="Trabalho:Mudança de Empregador">Trabalho - Mudança de Empregador</SelectItem>
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel className="font-bold text-slate-900 dark:text-slate-100">Visto de Investidor</SelectLabel>
                        <SelectItem value="Investidor">Investidor</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                {formData.type === "Turismo" && (
                  <div className="md:col-span-12">
                    <Label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Período da Viagem</Label>
                    <div className="relative">
                      <Popover open={travelRangeOpen} onOpenChange={(o) => {
                        setTravelRangeOpen(o);
                        if (o) {
                          const parseIso = (val?: string) => {
                            if (!val) return undefined;
                            const m = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                            return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(val);
                          };
                          setTempTravelRange({ from: parseIso(formData.travelStartDate), to: parseIso(formData.travelEndDate) });
                        }
                      }}>
                        <PopoverTrigger asChild>
                          <div className="relative cursor-pointer">
                            <Input
                              readOnly
                              className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 focus:ring-sky-500 focus:border-sky-500 text-sm py-2.5 pl-4 pr-10 cursor-pointer"
                              placeholder="Selecionar período"
                              value={(() => {
                                const fmt = (s?: string) => {
                                  if (!s) return "";
                                  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                                  return m ? `${m[3]}/${m[2]}/${m[1]}` : format(new Date(s), "dd/MM/yyyy", { locale: ptBR });
                                };
                                const start = fmt(formData.travelStartDate);
                                const end = fmt(formData.travelEndDate);
                                if (start && end) return `${start} — ${end}`;
                                if (start) return start;
                                return "";
                              })()}
                            />
                            <CalendarIcon className="absolute right-3 top-2.5 text-slate-400 pointer-events-none h-5 w-5" />
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="p-2 w-auto" align="start">
                          <div className="flex items-center gap-2 mb-2">
                            <Button
                              variant={activeTripField === 'from' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setActiveTripField('from')}
                            >
                              Ida
                            </Button>
                            <Button
                              variant={activeTripField === 'to' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setActiveTripField('to')}
                            >
                              Volta
                            </Button>
                          </div>
                          <Calendar
                            mode="single"
                            selected={(tempTravelRange ?? (() => {
                              const parseIso = (val?: string) => {
                                if (!val) return undefined;
                                const m = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                                return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(val);
                              };
                              return { from: parseIso(formData.travelStartDate), to: parseIso(formData.travelEndDate) } as any;
                            })())[activeTripField]}
                            onSelect={(d) => {
                              const fmt = (dt?: Date) => dt ? `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}` : "";
                              const next = { ...(tempTravelRange ?? {}), [activeTripField]: d || undefined } as { from?: Date; to?: Date };
                              setTempTravelRange(next);
                              if (activeTripField === 'from' && d) setActiveTripField('to');
                              const f = next.from;
                              const t = next.to;
                              if (f && t) {
                                handleChange("travelStartDate", fmt(f));
                                handleChange("travelEndDate", fmt(t));
                                setTravelRangeOpen(false);
                                setTempTravelRange(undefined);
                                setActiveTripField('from');
                              }
                            }}
                            weekStartsOn={1}
                            captionLayout="dropdown"
                            locale={ptBR}
                            fromMonth={new Date(2000, 0, 1)}
                            toMonth={new Date(2100, 11, 31)}
                            numberOfMonths={1}
                            className="w-full"
                            style={{ "--cell-size": "2.4rem" } as React.CSSProperties}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Form Section - Conditional Rendering */}
            {formData.type === "Trabalho:Brasil" || formData.type === "Trabalho:Residência Prévia" ? (
              /* Layout específico para Trabalho - Brasil e Residência Prévia */
              <div className="space-y-8">
                {/* 1. Identificação */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">1</span>
                      Identificação
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    <DocumentRow label="Passaporte" field="passaporte" docField="passaporteDoc" />
                    <DocumentRow label="CPF" field="cpf" docField="cpfDoc" />
                    <DocumentRow label="RNM" field="rnm" docField="rnmDoc" />
                  </div>
                </div>

                {/* 2. Documentos da Empresa */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">2</span>
                      Documentos da Empresa
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    <DocumentRow label="Contrato Social" field="contratoEmpresa" docField="contratoEmpresaDoc" />
                    <DocumentRow label="CNPJ" field="cartaoCnpj" docField="cartaoCnpjDoc" />
                    <DocumentRow label="GFIP" field="gfip" docField="gfipDoc" />
                  </div>
                </div>

                {/* 3. Certidões do País de Origem (Trabalho - Brasil) ou Documentos Trabalhistas (Outros) */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">3</span>
                      {formData.type === "Trabalho:Brasil" || formData.type === "Trabalho:Residência Prévia" ? "Certidões do País de Origem" : "Documentos Trabalhistas"}
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    {formData.type === "Trabalho:Brasil" || formData.type === "Trabalho:Residência Prévia" ? (
                      <>
                        <DocumentRow label="Certidão Criminal" field="antecedentesCriminais" docField="antecedentesCriminaisDoc" />
                        <DocumentRow label="Certificado de Trabalho" field="certificadoTrabalho" docField="certificadoTrabalhoDoc" />
                        <DocumentRow label="Diploma" field="diploma" docField="diplomaDoc" />
                        <DocumentRow label="Certidão de Nascimento" field="certidaoNascimento" docField="certidaoNascimentoDoc" />
                      </>
                    ) : (
                      <>
                        <DocumentRow label="Contrato de trabalho" field="contratoTrabalho" docField="contratoTrabalhoDoc" />
                        <DocumentRow label="Folha de pagamento (últimas)" field="folhaPagamento" docField="folhaPagamentoDoc" />
                        <div className="col-span-2">
                          <DocumentRow label="Comprovante de vínculo anterior (se houver)" field="comprovanteVinculoAnterior" docField="comprovanteVinculoAnteriorDoc" />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 4. Histórico e Segurança (Outros) ou Traduções Juramentadas (Trabalho - Brasil) */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">4</span>
                      {formData.type === "Trabalho:Brasil" || formData.type === "Trabalho:Residência Prévia" ? "Traduções Juramentadas" : "Histórico e Segurança"}
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    {formData.type === "Trabalho:Brasil" || formData.type === "Trabalho:Residência Prévia" ? (
                      <>
                        <DocumentRow label="Certidão Criminal" field="traducaoAntecedentesCriminais" docField="traducaoAntecedentesCriminaisDoc" />
                        <DocumentRow label="Certificado de Trabalho" field="traducaoCertificadoTrabalho" docField="traducaoCertificadoTrabalhoDoc" />
                        <DocumentRow label="Diploma" field="traducaoDiploma" docField="traducaoDiplomaDoc" />
                        <DocumentRow label="Certidão de Nascimento" field="traducaoCertidaoNascimento" docField="traducaoCertidaoNascimentoDoc" />
                      </>
                    ) : (
                      <>
                        <DocumentRow label="Antecedentes Criminais" field="antecedentesCriminais" docField="antecedentesCriminaisDoc" />
                        <DocumentRow label="Declaração de Antecedentes Criminais" field="declaracaoAntecedentesCriminais" docField="declaracaoAntecedentesCriminaisDoc" />
                      </>
                    )}
                  </div>
                </div>

                {/* 5. Formação Acadêmica (Outros) ou Procurações (Trabalho - Brasil) */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">5</span>
                      {formData.type === "Trabalho:Brasil" || formData.type === "Trabalho:Residência Prévia" ? "Procurações" : "Formação Acadêmica"}
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    {formData.type === "Trabalho:Brasil" || formData.type === "Trabalho:Residência Prévia" ? (
                      <>
                        <DocumentRow label="Procuração Empresa" field="procuracaoEmpresa" docField="procuracaoEmpresaDoc" />
                        <DocumentRow label="Procuração Empresa Assinada" field="procuracaoEmpresaAssinada" docField="procuracaoEmpresaAssinadaDoc" />
                        <DocumentRow label="Procuração Imigrante" field="procuracaoImigrante" docField="procuracaoImigranteDoc" />
                        <DocumentRow label="Procuração Imigrante Assinada" field="procuracaoImigranteAssinada" docField="procuracaoImigranteAssinadaDoc" />
                      </>
                    ) : (
                      <DocumentRow label="Diploma" field="diploma" docField="diplomaDoc" />
                    )}
                  </div>
                </div>


              </div>

            ) : formData.type === "Trabalho:Renovação 1 ano" ? (
              /* Layout específico para Trabalho - Renovação 1 ano */
              <div className="space-y-8">
                {/* 1. Identificação */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">1</span>
                      Identificação
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 gap-6">
                    <DocumentRow label="RNM" field="rnm" docField="rnmDoc" />
                  </div>
                </div>

                {/* 2. Documentos da Empresa */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">2</span>
                      Documentos da Empresa
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    <DocumentRow label="Contrato Social" field="contratoEmpresa" docField="contratoEmpresaDoc" />
                    <DocumentRow label="Procuração da empresa" field="procuracaoEmpresa" docField="procuracaoEmpresaDoc" />
                    <DocumentRow label="Protocolado" field="protocolado" docField="protocoladoDoc" placeholder="Recibo/Protocolo do pedido" />
                    <div className="col-span-2">
                      <DocumentRow label="Publicação no DOU" field="publicacaoDou" docField="publicacaoDouDoc" />
                    </div>
                  </div>
                </div>

                {/* 3. Vínculo de Trabalho */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">3</span>
                      Vínculo de Trabalho
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    <DocumentRow label="CTPS (páginas do contrato e anotações)" field="ctps" docField="ctpsDoc" />
                    <DocumentRow label="Contrato de trabalho anterior" field="contratoTrabalhoAnterior" docField="contratoTrabalhoAnteriorDoc" />
                    <DocumentRow label="Contrato de trabalho atual" field="contratoTrabalhoAtual" docField="contratoTrabalhoAtualDoc" />
                    <DocumentRow label="Formulário de prorrogação" field="formularioProrrogacao" docField="formularioProrrogacaoDoc" />
                  </div>
                </div>

                {/* 4. Segurança */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">4</span>
                      Segurança
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 gap-6">
                    <DocumentRow label="Declaração de Antecedentes Criminais" field="declaracaoAntecedentesCriminais" docField="declaracaoAntecedentesCriminaisDoc" />
                  </div>
                </div>

                {/* 5. Outras Informações */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">5</span>
                      Outras Informações
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Procurador</Label>
                      <Input
                        value={formData.procurador}
                        onChange={(e) => handleChange("procurador", e.target.value)}
                        className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5"
                        placeholder="Nome do procurador responsável"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Número do Processo</Label>
                      <Input
                        value={formData.numeroProcesso}
                        onChange={(e) => handleChange("numeroProcesso", e.target.value)}
                        className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5"
                        placeholder="0000000-00.0000.0.00.0000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : formData.type === "Trabalho:Indeterminado" ? (
              /* Layout específico para Trabalho - Indeterminado */
              <div className="space-y-8">
                {/* 1. Identificação */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">1</span>
                      Identificação
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 gap-6">
                    <DocumentRow label="RNM" field="rnm" docField="rnmDoc" />
                  </div>
                </div>

                {/* 2. Documentos da Empresa */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">2</span>
                      Documentos da Empresa
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    <DocumentRow label="Contrato Social" field="contratoEmpresa" docField="contratoEmpresaDoc" />
                    <DocumentRow label="Procuração" field="procuracaoEmpresa" docField="procuracaoEmpresaDoc" />
                    <DocumentRow label="Publicação no DOU" field="publicacaoDou" docField="publicacaoDouDoc" />
                    <DocumentRow label="Guia paga" field="guiaPaga" docField="guiaPagaDoc" />
                    <DocumentRow label="Protocolado" field="protocolado" docField="protocoladoDoc" placeholder="Recibo/Protocolo do pedido" />
                  </div>
                </div>

                {/* 3. Vínculo de Trabalho */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">3</span>
                      Vínculo de Trabalho
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    <DocumentRow label="CTPS (páginas relevantes)" field="ctps" docField="ctpsDoc" />
                    <DocumentRow label="Contrato de trabalho anterior" field="contratoTrabalhoAnterior" docField="contratoTrabalhoAnteriorDoc" />
                    <DocumentRow label="Contrato de trabalho por prazo indeterminado" field="contratoTrabalhoIndeterminado" docField="contratoTrabalhoIndeterminadoDoc" />
                    <DocumentRow label="Formulário de prorrogação" field="formularioProrrogacao" docField="formularioProrrogacaoDoc" />
                  </div>
                </div>

                {/* 4. Segurança */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">4</span>
                      Segurança
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 gap-6">
                    <DocumentRow label="Declaração de Antecedentes Criminais" field="declaracaoAntecedentesCriminais" docField="declaracaoAntecedentesCriminaisDoc" />
                  </div>
                </div>

                {/* 5. Outras Informações */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">5</span>
                      Outras Informações
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Procurador</Label>
                      <Input
                        value={formData.procurador}
                        onChange={(e) => handleChange("procurador", e.target.value)}
                        className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5"
                        placeholder="Nome do procurador responsável"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Número do Processo</Label>
                      <Input
                        value={formData.numeroProcesso}
                        onChange={(e) => handleChange("numeroProcesso", e.target.value)}
                        className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5"
                        placeholder="0000000-00.0000.0.00.0000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : formData.type === "Trabalho:Mudança de Empregador" ? (
              /* Layout específico para Trabalho - Mudança de Empregador */
              <div className="space-y-8">
                {/* 1. Identificação */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">1</span>
                      Identificação
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    <DocumentRow label="Passaporte" field="passaporte" docField="passaporteDoc" />
                    <DocumentRow label="RNM" field="rnm" docField="rnmDoc" />
                  </div>
                </div>

                {/* 2. Documentos da Empresa */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">2</span>
                      Documentos da Empresa
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    <DocumentRow label="Contrato Social" field="contratoEmpresa" docField="contratoEmpresaDoc" />
                    <DocumentRow label="CNPJ" field="cartaoCnpj" docField="cartaoCnpjDoc" />
                    <DocumentRow label="Procuração da empresa" field="procuracaoEmpresa" docField="procuracaoEmpresaDoc" />
                    <DocumentRow label="Formulário RN 01" field="formularioRn01" docField="formularioRn01Doc" />
                    <DocumentRow label="Guia paga" field="guiaPaga" docField="guiaPagaDoc" />
                    <DocumentRow label="Protocolado" field="protocolado" docField="protocoladoDoc" placeholder="Recibo/Protocolo do pedido" />
                    <div className="col-span-2">
                      <DocumentRow label="Publicação no DOU" field="publicacaoDou" docField="publicacaoDouDoc" />
                    </div>
                  </div>
                </div>

                {/* 3. Vínculo de Trabalho */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">3</span>
                      Vínculo de Trabalho
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    <DocumentRow label="Contrato de trabalho" field="contratoTrabalho" docField="contratoTrabalhoDoc" />
                    <DocumentRow label="CTPS (páginas com vínculo anterior e atual)" field="ctps" docField="ctpsDoc" />
                    <div className="col-span-2">
                      <DocumentRow label="Folha de pagamento (se houver)" field="folhaPagamento" docField="folhaPagamentoDoc" />
                    </div>
                  </div>
                </div>

                {/* 4. Justificativa */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">4</span>
                      Justificativa
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 gap-6">
                    <DocumentRow label="Justificativa da mudança de empregador" field="justificativaMudancaEmpregador" docField="justificativaMudancaEmpregadorDoc" placeholder="Descreva a justificativa ou anexe o documento" />
                  </div>
                </div>

                {/* 5. Formação */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">5</span>
                      Formação
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 gap-6">
                    <DocumentRow label="Diploma" field="diploma" docField="diplomaDoc" />
                  </div>
                </div>

                {/* 6. Outras Informações */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">6</span>
                      Outras Informações
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Procurador</Label>
                      <Input
                        value={formData.procurador}
                        onChange={(e) => handleChange("procurador", e.target.value)}
                        className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5"
                        placeholder="Nome do procurador responsável"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Número do Processo</Label>
                      <Input
                        value={formData.numeroProcesso}
                        onChange={(e) => handleChange("numeroProcesso", e.target.value)}
                        className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5"
                        placeholder="0000000-00.0000.0.00.0000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : formData.type === "Investidor" ? (
              /* Layout específico para Investidor */
              <div className="space-y-8">
                {/* 1. Identificação */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">1</span>
                      Identificação
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 gap-6">
                    <DocumentRow label="Passaporte" field="passaporte" docField="passaporteDoc" />
                  </div>
                </div>

                {/* 2. Documentos da Empresa / Investimento */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">2</span>
                      Documentos da Empresa / Investimento
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    <DocumentRow label="Contrato Social" field="contratoEmpresa" docField="contratoEmpresaDoc" />
                    <DocumentRow label="CNPJ" field="cartaoCnpj" docField="cartaoCnpjDoc" />
                    <DocumentRow label="Comprovante do investimento" field="comprovanteInvestimento" docField="comprovanteInvestimentoDoc" placeholder="Extrato, contrato, transferência etc." />
                    <DocumentRow label="Plano de Investimentos" field="planoInvestimentos" docField="planoInvestimentosDoc" />
                    <DocumentRow label="Formulário de Requerimento" field="formularioRequerimento" docField="formularioRequerimentoDoc" />
                    <DocumentRow label="Procuração" field="procuracaoEmpresa" docField="procuracaoEmpresaDoc" />
                    <DocumentRow label="Guia paga" field="guiaPaga" docField="guiaPagaDoc" />
                    <DocumentRow label="Protocolado" field="protocolado" docField="protocoladoDoc" placeholder="Recibo/Protocolo do pedido" />
                    <div className="col-span-2">
                      <DocumentRow label="Publicação no DOU" field="publicacaoDou" docField="publicacaoDouDoc" />
                    </div>
                  </div>
                </div>

                {/* 3. Outras Informações */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">3</span>
                      Outras Informações
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Procurador</Label>
                      <Input
                        value={formData.procurador}
                        onChange={(e) => handleChange("procurador", e.target.value)}
                        className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5"
                        placeholder="Nome do procurador responsável"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Número do Processo</Label>
                      <Input
                        value={formData.numeroProcesso}
                        onChange={(e) => handleChange("numeroProcesso", e.target.value)}
                        className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5"
                        placeholder="0000000-00.0000.0.00.0000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Layout padrão para outros vistos */
              <div className="space-y-8">
                {/* 1. Documentos Pessoais */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">1</span>
                      Documentos Pessoais
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    <DocumentRow label="CPF" field="cpf" docField="cpfDoc" />
                    <DocumentRow label="RNM" field="rnm" docField="rnmDoc" />
                    <DocumentRow label="Passaporte" field="passaporte" docField="passaporteDoc" />

                    <div className="space-y-2">
                      <Label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Comprovante de Endereço / Declaração</Label>
                      <div className="flex gap-3">
                        <Input
                          value={formData.comprovanteEndereco}
                          onChange={(e) => handleChange("comprovanteEndereco", e.target.value)}
                          className="flex-1 rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5"
                          placeholder="Status ou informações do documento"
                        />
                        <div className="relative">
                          <input
                            type="file"
                            id="upload-comprovanteEnderecoDoc"
                            className="hidden"
                            onChange={(e) => handleDocumentUpload(e, "comprovanteEnderecoDoc")}
                          />
                          <Button
                            type="button"
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-medium text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shadow-sm"
                            onClick={() => document.getElementById("upload-comprovanteEnderecoDoc")?.click()}
                            disabled={uploadingDocs["comprovanteEnderecoDoc"]}
                          >
                            <Upload className="h-5 w-5 text-slate-500" />
                            {uploadingDocs["comprovanteEnderecoDoc"] ? "Enviando..." : "Upload"}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center mt-2">
                        <Checkbox
                          id="not-owner"
                          checked={formData.comprovanteNaoNoNome}
                          onCheckedChange={(c) => handleChange("comprovanteNaoNoNome", c === true)}
                          className="rounded border-gray-300 text-sky-500 focus:ring-sky-500 h-4 w-4"
                        />
                        <Label htmlFor="not-owner" className="ml-2 text-xs text-slate-500 dark:text-slate-400">Comprovante não está no nome do solicitante</Label>
                      </div>
                    </div>

                    <DocumentRow label="Declaração de Residência" docField="declaracaoResidenciaDoc" readOnly />
                    <DocumentRow label="Foto/Selfie" docField="foto3x4Doc" readOnly />
                    <DocumentRow label="Documento Chinês (quando aplicável)" field="documentoChines" docField="documentoChinesDoc" />
                    <DocumentRow label="Antecedentes Criminais" field="antecedentesCriminais" docField="antecedentesCriminaisDoc" />
                  </div>
                </div>

                {/* 2. Documentos Específicos */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">2</span>
                      Documentos Específicos do Visto
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    {formData.type === "Turismo" && (
                      <>
                        <DocumentRow label="Filhos (Certidão de Nascimento)" field="certidaoNascimentoFilhos" docField="certidaoNascimentoFilhosDoc" />
                        <DocumentRow label="Empresa: Cartão CNPJ" field="cartaoCnpj" docField="cartaoCnpjDoc" />
                        <DocumentRow label="Contrato Social" field="contratoEmpresa" docField="contratoEmpresaDoc" />
                        <DocumentRow label="Imóveis (Escritura/Matrícula)" field="escrituraImoveis" docField="escrituraImoveisDoc" />
                        <DocumentRow label="Últimos 3 extratos bancários" field="extratosBancarios" docField="extratosBancariosDoc" />
                        <DocumentRow label="Imposto de Renda" field="impostoRenda" docField="impostoRendaDoc" />
                      </>
                    )}



                    {formData.type === "Trabalho:Renovação 1 ano" && (
                      <>
                        <DocumentRow label="CTPS" field="ctps" docField="ctpsDoc" />
                        <DocumentRow label="Contrato de Trabalho Anterior" field="contratoTrabalhoAnterior" docField="contratoTrabalhoAnteriorDoc" />
                        <DocumentRow label="Contrato de Trabalho Atual" field="contratoTrabalhoAtual" docField="contratoTrabalhoAtualDoc" />
                        <DocumentRow label="Formulário de Prorrogação" field="formularioProrrogacao" docField="formularioProrrogacaoDoc" />
                      </>
                    )}

                    {formData.type === "Trabalho:Indeterminado" && (
                      <>
                        <DocumentRow label="Contrato de Trabalho por Prazo Indeterminado" field="contratoTrabalhoIndeterminado" docField="contratoTrabalhoIndeterminadoDoc" />
                      </>
                    )}



                  </div>
                </div>

                {/* 3. Outros Documentos */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">3</span>
                      Outros Documentos
                    </h2>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    <div className="col-span-2 text-center text-slate-500 italic">
                      Não há documentos adicionais configurados para este tipo de visto no momento.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 mt-8">
              <Button
                type="button"
                variant="outline"
                className="px-6 py-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors h-auto"
                onClick={() => router.push("/dashboard/vistos")}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="px-8 py-3 rounded-md bg-slate-800 text-white font-semibold hover:bg-slate-900 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 h-auto"
                disabled={loading}
              >
                <Save className="h-4 w-4" />
                {loading ? "Salvando..." : "Salvar Visto"}
              </Button>
            </div>

          </form>
        </main>
      </div>
    </VistoFormContext.Provider>
  );
}
