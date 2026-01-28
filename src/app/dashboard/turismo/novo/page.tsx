"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Save,
  ChevronDown,
  Upload,
  Check,
  Calendar as CalendarIcon,
  Info,
  Moon,
  Sun,
  FileText,
  X
} from "lucide-react";
import Link from "next/link";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentChip } from "@/components/ui/document-chip";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DocumentRowProps {
  label: string;
  field?: string;
  docField: string;
  placeholder?: string;
  readOnly?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  mainFile?: string;
  extraFiles?: string[];
  isUploading?: boolean;
  onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile?: (fileUrl: string) => void;
}

const DocumentRow = ({
  label,
  value,
  onChange,
  docField,
  mainFile,
  extraFiles = [],
  onUpload,
  isUploading,
  onRemoveFile,
  placeholder = "Status ou informações do documento",
  readOnly = false,
  required = false
}: DocumentRowProps & { required?: boolean }) => {
  const attachedFiles: string[] = [];
  if (mainFile) attachedFiles.push(mainFile);
  if (extraFiles.length > 0) {
    attachedFiles.push(...extraFiles);
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
            value={value || ""}
            onChange={(e) => onChange && onChange(e.target.value)}
            className="flex-1 rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5"
            placeholder={placeholder}
          />
        )}
        <div className="relative">
          <input
            type="file"
            id={`upload-${docField}`}
            className="hidden"
            onChange={onUpload}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.txt,.rtf"
          />
          <Button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-medium text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shadow-sm"
            onClick={() => document.getElementById(`upload-${docField}`)?.click()}
            disabled={isUploading}
          >
            <Upload className="h-5 w-5 text-slate-500" />
            {isUploading ? "Enviando..." : "Upload"}
          </Button>
        </div>
      </div>

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
                onDelete={!readOnly && onRemoveFile ? () => onRemoveFile(url) : undefined}
                className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:border-sky-200 dark:hover:border-sky-800 transition-all"
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function NovoTurismoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    clientName: "",
    // Type hardcoded to Turismo
    type: "Turismo",
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
    // Campos específicos de Turismo
    certidaoNascimentoFilhos: "",
    certidaoNascimentoFilhosDoc: "",
    cartaoCnpj: "",
    cartaoCnpjDoc: "",
    contratoEmpresa: "",
    contratoEmpresaDoc: "",
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
    procurador: "",
    procuradorDoc: "",
    documentosAdicionais: "",
    documentosAdicionaisDoc: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {


      // Use dedicated Turismo API
      const response = await fetch("/api/turismo", {
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
        }
        router.push("/dashboard/turismo");
      } else {
        alert("Erro ao criar visto de turismo");
      }
    } catch (error) {
      console.error("Error creating turismo:", error);
      alert("Erro ao criar visto de turismo");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
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
      for (const file of files) {

        // 4MB limit for direct server proxy
        const isLargeFile = file.size > 4 * 1024 * 1024;

        if (isLargeFile) {
          try {
            console.log("Arquivo grande detectado, iniciando upload via URL assinada:", file.name);

            // 1. Get Signed URL
            const signRes = await fetch("/api/documents/upload/sign", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fileName: file.name,
                fileType: file.type,
                moduleType: "vistos",
                fieldName: field
              })
            });

            if (!signRes.ok) {
              const err = await signRes.json();
              throw new Error(err.error || "Erro ao gerar assinatura de upload");
            }

            const signData = await signRes.json();

            // 2. Upload directly to Supabase Storage
            const uploadRes = await fetch(signData.signedUrl, {
              method: "PUT",
              body: file,
              headers: {
                "Content-Type": file.type || "application/octet-stream"
              }
            });

            if (!uploadRes.ok) {
              throw new Error("Erro ao enviar arquivo para o armazenamento");
            }

            uploadedUrls.push(signData.publicUrl);

          } catch (err) {
            console.error("Large file upload error:", err);
            alert("Erro ao enviar arquivo grande: " + (err as Error).message);
          }
        } else {
          // Standard Upload
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
            alert(errorData.error || "Erro ao enviar documento");
          }
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
    }
  };

  const handleRemoveFile = (docField: string, fileUrl: string) => {
    if ((formData as any)[docField] === fileUrl) {
      handleChange(docField, "");
    }
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
      "escrituraImoveisDoc",
      "extratosBancariosDoc",
      "impostoRendaDoc",
      "reservasPassagensDoc",
      "reservasHotelDoc",
      "seguroViagemDoc",
      "roteiroViagemDoc",
      "taxaDoc",
      "formularioConsuladoDoc",
      "procuradorDoc",
      "documentosAdicionaisDoc"
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
        // Reuse the document conversion API, keeping moduleType as vistos since we reuse the table
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

  return (
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 min-h-screen flex flex-col font-sans">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/turismo">
              <button className="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Novo Visto</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie processos de vistos de turismo</p>
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
                <Label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">País do Visto *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 py-2.5 h-auto font-normal">
                      {formData.country || "Selecione o país"}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[300px]">
                    <Command>
                      <CommandInput placeholder="Pesquisar país..." />
                      <CommandList>
                        <CommandEmpty>Nenhum país encontrado.</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-auto">
                          {countryOptions.map((c) => (
                            <CommandItem
                              key={c.code}
                              value={c.name}
                              onSelect={() => handleChange("country", c.name)}
                            >
                              <span>{c.name}</span>
                              {formData.country === c.name ? (
                                <Check className="ml-auto h-4 w-4" />
                              ) : null}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="md:col-span-4">
                <Label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Tipo de Visto *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange("type", value)}
                  disabled
                >
                  <SelectTrigger className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 py-2.5 h-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel className="font-bold text-slate-900 dark:text-slate-100">Visto de Turismo</SelectLabel>
                      <SelectItem value="Turismo">Turismo</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

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
            </div>
          </div>

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
                <DocumentRow
                  label="CPF"
                  value={formData.cpf}
                  onChange={(v) => handleChange("cpf", v)}
                  docField="cpfDoc"
                  mainFile={formData.cpfDoc}
                  extraFiles={extraUploads.cpfDoc}
                  onUpload={(e) => handleDocumentUpload(e, "cpfDoc")}
                  isUploading={uploadingDocs.cpfDoc}
                  onRemoveFile={(url) => handleRemoveFile("cpfDoc", url)}
                />
                <DocumentRow
                  label="RNM"
                  value={formData.rnm}
                  onChange={(v) => handleChange("rnm", v)}
                  docField="rnmDoc"
                  mainFile={formData.rnmDoc}
                  extraFiles={extraUploads.rnmDoc}
                  onUpload={(e) => handleDocumentUpload(e, "rnmDoc")}
                  isUploading={uploadingDocs.rnmDoc}
                  onRemoveFile={(url) => handleRemoveFile("rnmDoc", url)}
                />
                <DocumentRow
                  label="Passaporte"
                  value={formData.passaporte}
                  onChange={(v) => handleChange("passaporte", v)}
                  docField="passaporteDoc"
                  mainFile={formData.passaporteDoc}
                  extraFiles={extraUploads.passaporteDoc}
                  onUpload={(e) => handleDocumentUpload(e, "passaporteDoc")}
                  isUploading={uploadingDocs.passaporteDoc}
                  onRemoveFile={(url) => handleRemoveFile("passaporteDoc", url)}
                />

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

                <DocumentRow
                  label="Declaração de Residência"
                  docField="declaracaoResidenciaDoc"
                  mainFile={formData.declaracaoResidenciaDoc}
                  extraFiles={extraUploads.declaracaoResidenciaDoc}
                  onUpload={(e) => handleDocumentUpload(e, "declaracaoResidenciaDoc")}
                  isUploading={uploadingDocs.declaracaoResidenciaDoc}
                  onRemoveFile={(url) => handleRemoveFile("declaracaoResidenciaDoc", url)}
                  readOnly
                />
                <DocumentRow
                  label="Foto/Selfie"
                  docField="foto3x4Doc"
                  mainFile={formData.foto3x4Doc}
                  extraFiles={extraUploads.foto3x4Doc}
                  onUpload={(e) => handleDocumentUpload(e, "foto3x4Doc")}
                  isUploading={uploadingDocs.foto3x4Doc}
                  onRemoveFile={(url) => handleRemoveFile("foto3x4Doc", url)}
                  readOnly
                />
                <DocumentRow
                  label="Documento Chinês (quando aplicável)"
                  value={formData.documentoChines}
                  onChange={(v) => handleChange("documentoChines", v)}
                  docField="documentoChinesDoc"
                  mainFile={formData.documentoChinesDoc}
                  extraFiles={extraUploads.documentoChinesDoc}
                  onUpload={(e) => handleDocumentUpload(e, "documentoChinesDoc")}
                  isUploading={uploadingDocs.documentoChinesDoc}
                  onRemoveFile={(url) => handleRemoveFile("documentoChinesDoc", url)}
                />
                <DocumentRow
                  label="Antecedentes Criminais"
                  value={formData.antecedentesCriminais}
                  onChange={(v) => handleChange("antecedentesCriminais", v)}
                  docField="antecedentesCriminaisDoc"
                  mainFile={formData.antecedentesCriminaisDoc}
                  extraFiles={extraUploads.antecedentesCriminaisDoc}
                  onUpload={(e) => handleDocumentUpload(e, "antecedentesCriminaisDoc")}
                  isUploading={uploadingDocs.antecedentesCriminaisDoc}
                  onRemoveFile={(url) => handleRemoveFile("antecedentesCriminaisDoc", url)}
                />
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
                <DocumentRow
                  label="Filhos (Certidão de Nascimento)"
                  value={formData.certidaoNascimentoFilhos}
                  onChange={(v) => handleChange("certidaoNascimentoFilhos", v)}
                  docField="certidaoNascimentoFilhosDoc"
                  mainFile={formData.certidaoNascimentoFilhosDoc}
                  extraFiles={extraUploads.certidaoNascimentoFilhosDoc}
                  onUpload={(e) => handleDocumentUpload(e, "certidaoNascimentoFilhosDoc")}
                  isUploading={uploadingDocs.certidaoNascimentoFilhosDoc}
                  onRemoveFile={(url) => handleRemoveFile("certidaoNascimentoFilhosDoc", url)}
                />
                <DocumentRow
                  label="Empresa: Cartão CNPJ"
                  value={formData.cartaoCnpj}
                  onChange={(v) => handleChange("cartaoCnpj", v)}
                  docField="cartaoCnpjDoc"
                  mainFile={formData.cartaoCnpjDoc}
                  extraFiles={extraUploads.cartaoCnpjDoc}
                  onUpload={(e) => handleDocumentUpload(e, "cartaoCnpjDoc")}
                  isUploading={uploadingDocs.cartaoCnpjDoc}
                  onRemoveFile={(url) => handleRemoveFile("cartaoCnpjDoc", url)}
                />
                <DocumentRow
                  label="Contrato Social"
                  value={formData.contratoEmpresa}
                  onChange={(v) => handleChange("contratoEmpresa", v)}
                  docField="contratoEmpresaDoc"
                  mainFile={formData.contratoEmpresaDoc}
                  extraFiles={extraUploads.contratoEmpresaDoc}
                  onUpload={(e) => handleDocumentUpload(e, "contratoEmpresaDoc")}
                  isUploading={uploadingDocs.contratoEmpresaDoc}
                  onRemoveFile={(url) => handleRemoveFile("contratoEmpresaDoc", url)}
                />
                <DocumentRow
                  label="Imóveis (Escritura/Matrícula)"
                  value={formData.escrituraImoveis}
                  onChange={(v) => handleChange("escrituraImoveis", v)}
                  docField="escrituraImoveisDoc"
                  mainFile={formData.escrituraImoveisDoc}
                  extraFiles={extraUploads.escrituraImoveisDoc}
                  onUpload={(e) => handleDocumentUpload(e, "escrituraImoveisDoc")}
                  isUploading={uploadingDocs.escrituraImoveisDoc}
                  onRemoveFile={(url) => handleRemoveFile("escrituraImoveisDoc", url)}
                />
                <DocumentRow
                  label="Últimos 3 extratos bancários"
                  value={formData.extratosBancarios}
                  onChange={(v) => handleChange("extratosBancarios", v)}
                  docField="extratosBancariosDoc"
                  mainFile={formData.extratosBancariosDoc}
                  extraFiles={extraUploads.extratosBancariosDoc}
                  onUpload={(e) => handleDocumentUpload(e, "extratosBancariosDoc")}
                  isUploading={uploadingDocs.extratosBancariosDoc}
                  onRemoveFile={(url) => handleRemoveFile("extratosBancariosDoc", url)}
                />
                <DocumentRow
                  label="Imposto de Renda"
                  value={formData.impostoRenda}
                  onChange={(v) => handleChange("impostoRenda", v)}
                  docField="impostoRendaDoc"
                  mainFile={formData.impostoRendaDoc}
                  extraFiles={extraUploads.impostoRendaDoc}
                  onUpload={(e) => handleDocumentUpload(e, "impostoRendaDoc")}
                  isUploading={uploadingDocs.impostoRendaDoc}
                  onRemoveFile={(url) => handleRemoveFile("impostoRendaDoc", url)}
                />
                <DocumentRow
                  label="Procurador"
                  value={formData.procurador}
                  onChange={(v) => handleChange("procurador", v)}
                  docField="procuradorDoc"
                  mainFile={formData.procuradorDoc}
                  extraFiles={extraUploads.procuradorDoc}
                  onUpload={(e) => handleDocumentUpload(e, "procuradorDoc")}
                  isUploading={uploadingDocs.procuradorDoc}
                  onRemoveFile={(url) => handleRemoveFile("procuradorDoc", url)}
                  placeholder="Nome do Procurador"
                />
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
                <DocumentRow
                  label="Reservas de Passagens"
                  value={formData.reservasPassagens}
                  onChange={(v) => handleChange("reservasPassagens", v)}
                  docField="reservasPassagensDoc"
                  mainFile={formData.reservasPassagensDoc}
                  extraFiles={extraUploads.reservasPassagensDoc}
                  onUpload={(e) => handleDocumentUpload(e, "reservasPassagensDoc")}
                  isUploading={uploadingDocs.reservasPassagensDoc}
                  onRemoveFile={(url) => handleRemoveFile("reservasPassagensDoc", url)}
                />
                <DocumentRow
                  label="Reservas de Hotel"
                  value={formData.reservasHotel}
                  onChange={(v) => handleChange("reservasHotel", v)}
                  docField="reservasHotelDoc"
                  mainFile={formData.reservasHotelDoc}
                  extraFiles={extraUploads.reservasHotelDoc}
                  onUpload={(e) => handleDocumentUpload(e, "reservasHotelDoc")}
                  isUploading={uploadingDocs.reservasHotelDoc}
                  onRemoveFile={(url) => handleRemoveFile("reservasHotelDoc", url)}
                />
                <DocumentRow
                  label="Seguro Viagem"
                  value={formData.seguroViagem}
                  onChange={(v) => handleChange("seguroViagem", v)}
                  docField="seguroViagemDoc"
                  mainFile={formData.seguroViagemDoc}
                  extraFiles={extraUploads.seguroViagemDoc}
                  onUpload={(e) => handleDocumentUpload(e, "seguroViagemDoc")}
                  isUploading={uploadingDocs.seguroViagemDoc}
                  onRemoveFile={(url) => handleRemoveFile("seguroViagemDoc", url)}
                />
                <DocumentRow
                  label="Roteiro de Viagem Detalhado"
                  value={formData.roteiroViagem}
                  onChange={(v) => handleChange("roteiroViagem", v)}
                  docField="roteiroViagemDoc"
                  mainFile={formData.roteiroViagemDoc}
                  extraFiles={extraUploads.roteiroViagemDoc}
                  onUpload={(e) => handleDocumentUpload(e, "roteiroViagemDoc")}
                  isUploading={uploadingDocs.roteiroViagemDoc}
                  onRemoveFile={(url) => handleRemoveFile("roteiroViagemDoc", url)}
                />
                <DocumentRow
                  label="Taxa Consular"
                  value={formData.taxa}
                  onChange={(v) => handleChange("taxa", v)}
                  docField="taxaDoc"
                  mainFile={formData.taxaDoc}
                  extraFiles={extraUploads.taxaDoc}
                  onUpload={(e) => handleDocumentUpload(e, "taxaDoc")}
                  isUploading={uploadingDocs.taxaDoc}
                  onRemoveFile={(url) => handleRemoveFile("taxaDoc", url)}
                />
                <DocumentRow
                  label="Formulário do Consulado preenchido"
                  value={formData.formularioConsulado}
                  onChange={(v) => handleChange("formularioConsulado", v)}
                  docField="formularioConsuladoDoc"
                  mainFile={formData.formularioConsuladoDoc}
                  extraFiles={extraUploads.formularioConsuladoDoc}
                  onUpload={(e) => handleDocumentUpload(e, "formularioConsuladoDoc")}
                  isUploading={uploadingDocs.formularioConsuladoDoc}
                  onRemoveFile={(url) => handleRemoveFile("formularioConsuladoDoc", url)}
                />
                <DocumentRow
                  label="Documentos Adicionais"
                  value={formData.documentosAdicionais}
                  onChange={(v) => handleChange("documentosAdicionais", v)}
                  docField="documentosAdicionaisDoc"
                  mainFile={formData.documentosAdicionaisDoc}
                  extraFiles={extraUploads.documentosAdicionaisDoc}
                  onUpload={(e) => handleDocumentUpload(e, "documentosAdicionaisDoc")}
                  isUploading={uploadingDocs.documentosAdicionaisDoc}
                  onRemoveFile={(url) => handleRemoveFile("documentosAdicionaisDoc", url)}
                  placeholder="Selecione documentos adicionais"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 mt-8">
            <Button
              type="button"
              variant="outline"
              className="px-6 py-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors h-auto"
              onClick={() => router.push("/dashboard/turismo")}
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
  );
}
