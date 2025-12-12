"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Save, ChevronDown, ChevronUp, Upload, ChevronsUpDown, Check, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { DocumentPreview } from "@/components/ui/document-preview";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";

export default function NovoVistoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    documentosPessoais: true,
    comprovacaoFinanceira: true,
    outrosDocumentos: true,
    identificacaoTrabalhoBrasil: true,
    empresaTrabalhoBrasil: true,
    trabalhistasTrabalhoBrasil: true,
    historicoSegurancaTrabalhoBrasil: true,
    formacaoTrabalhoBrasil: true,
    outrasInformacoesTrabalhoBrasil: true,
    identificacaoResidenciaPrevia: true,
    residenciaAnteriorResidenciaPrevia: true,
    empresaResidenciaPrevia: true,
    trabalhistasResidenciaPrevia: true,
    formacaoResidenciaPrevia: true,
    identificacaoRenovacaoAno: true,
    empresaRenovacaoAno: true,
    vinculoRenovacaoAno: true,
    segurancaRenovacaoAno: true,
    identificacaoIndeterminado: true,
    empresaIndeterminado: true,
    vinculoIndeterminado: true,
    segurancaIndeterminado: true,
    identificacaoMudanca: true,
    empresaMudanca: true,
    vinculoMudanca: true,
    justificativaMudanca: true,
    formacaoMudanca: true,
    identificacaoInvestidor: true,
    empresaInvestidor: true,
    outrasInformacoesResidenciaPrevia: true,
    outrasInformacoesRenovacaoAno: true,
    outrasInformacoesIndeterminado: true,
    outrasInformacoesMudanca: true,
    outrasInformacoesInvestidor: true,
  });
  const [formData, setFormData] = useState({
    clientName: "",
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
    // Campos específicos de Visto de Trabalho - Brasil
    certidaoNascimento: "",
    certidaoNascimentoDoc: "",
    declaracaoCompreensao: "",
    declaracaoCompreensaoDoc: "",
    certidaoNascimentoFilhos: "",
    certidaoNascimentoFilhosDoc: "",
    cartaoCnpj: "",
    cartaoCnpjDoc: "",
    contratoEmpresa: "",
    contratoEmpresaDoc: "",
    declaracoesEmpresa: "",
    declaracoesEmpresaDoc: "",
    procuracaoEmpresa: "",
    procuracaoEmpresaDoc: "",
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
      } catch {}
    });
  }, []);

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
        const newRecord = await response.json();
        if (newRecord?.id) {
          await convertTemporaryUploads(newRecord.id);
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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const countryOptions = useMemo(() => {
    const codes = [
      "AF","AL","DZ","AS","AD","AO","AI","AQ","AG","AR","AM","AW","AU","AT","AZ","BS","BH","BD","BB","BY","BE","BZ","BJ","BM","BT","BO","BQ","BA","BW","BV","BR","IO","BN","BG","BF","BI","CV","KH","CM","CA","KY","CF","TD","CL","CN","CX","CC","CO","KM","CD","CG","CK","CR","CI","HR","CU","CW","CY","CZ","DK","DJ","DM","DO","EC","EG","SV","GQ","ER","EE","SZ","ET","FK","FO","FJ","FI","FR","GF","PF","TF","GA","GM","GE","DE","GH","GI","GR","GL","GD","GP","GU","GT","GG","GN","GW","GY","HT","HM","VA","HN","HK","HU","IS","IN","ID","IR","IQ","IE","IM","IL","IT","JM","JP","JE","JO","KZ","KE","KI","KP","KR","KW","KG","LA","LV","LB","LS","LR","LY","LI","LT","LU","MO","MK","MG","MW","MY","MV","ML","MT","MH","MQ","MR","MU","YT","MX","FM","MD","MC","MN","ME","MS","MA","MZ","MM","NA","NR","NP","NL","NC","NZ","NI","NE","NG","NU","NF","MP","NO","OM","PK","PW","PS","PA","PG","PY","PE","PH","PN","PL","PT","PR","QA","RE","RO","RU","RW","BL","SH","KN","LC","MF","PM","VC","WS","SM","ST","SA","SN","RS","SC","SL","SG","SX","SK","SI","SB","SO","ZA","GS","SS","ES","LK","SD","SR","SJ","SE","CH","SY","TW","TJ","TZ","TH","TL","TG","TK","TO","TT","TN","TR","TM","TC","TV","UG","UA","AE","GB","US","UM","UY","UZ","VU","VE","VN","VG","VI","WF","EH","YE","ZM","ZW"
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

  const removeDocument = (field: string) => {
    handleChange(field, "");
  };

  const removeDocumentAt = (field: string, url: string) => {
    if ((formData as any)[field] === url) {
      handleChange(field, "");
    }
    setExtraUploads((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((u) => u !== url),
    }));
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
      // Visto de Trabalho - Brasil
      "certidaoNascimentoDoc",
      "declaracaoCompreensaoDoc",
      "certidaoNascimentoFilhosDoc",
      "cartaoCnpjDoc",
      "contratoEmpresaDoc",
      "declaracoesEmpresaDoc",
      "procuracaoEmpresaDoc",
      "formularioRn01Doc",
      "guiaPagaDoc",
      "publicacaoDouDoc",
      "formularioRn02Doc",
      "comprovanteResidenciaPreviaDoc",
      "comprovanteAtividadeDoc",
      "escrituraImoveisDoc",
      "extratosBancariosDoc",
      "impostoRendaDoc",
      "reservasPassagensDoc",
      "reservasHotelDoc",
      "seguroViagemDoc",
      "roteiroViagemDoc",
      "taxaDoc",
      "formularioConsuladoDoc",
      "contratoTrabalhoDoc",
      "folhaPagamentoDoc",
      "comprovanteVinculoAnteriorDoc",
      "declaracaoAntecedentesCriminaisDoc",
      "diplomaDoc",
      // Renovação 1 ano
      "ctpsDoc",
      "contratoTrabalhoAnteriorDoc",
      "contratoTrabalhoAtualDoc",
      "formularioProrrogacaoDoc",
      "contratoTrabalhoIndeterminadoDoc",
      "justificativaMudancaEmpregadorDoc",
      "comprovanteInvestimentoDoc",
      "planoInvestimentosDoc",
      "formularioRequerimentoDoc",
      "protocoladoDoc",
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
        const response = await fetch("/api/documents/convert-temporary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId,
            moduleType: "vistos",
            clientName: formData.clientName,
            documents: documentsToConvert,
          }),
        });
        if (!response.ok) {
          console.error("Erro ao converter uploads temporários");
        }
      } catch (error) {
        console.error("Erro ao converter uploads temporários:", error);
      }
    }
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
            Gerencie processos de vistos internacionais
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

            <div className="space-y-4">
              <div className="grid gap-6 grid-cols-3">
                <div className="space-y-3">
                  <Label htmlFor="clientName" className="text-base font-medium text-foreground">
                    Nome do Cliente <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => handleChange("clientName", e.target.value)}
                    required
                    className="h-9 border-2 focus:border-primary transition-colors"
                    placeholder="Digite o nome completo do cliente"
                  />
                </div>
              <div className="space-y-3">
                <Label htmlFor="country" className="text-base font-medium text-foreground">
                  País do Visto <span className="text-primary">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-9 w-full border-2 border-input rounded-md px-3 py-1 text-sm bg-background shadow-none hover:bg-background hover:text-foreground hover:shadow-none transition-colors justify-between text-foreground">
                      <span className="text-sm">
                        {formData.country || "Selecione o país"}
                      </span>
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[420px]">
                    <Command>
                      <CommandInput placeholder="Pesquisar país..." />
                      <CommandList>
                        <CommandEmpty>Nenhum país encontrado.</CommandEmpty>
                        <CommandGroup>
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
                          <CommandItem value="Outro" onSelect={() => handleChange("country", "Outro")}>Outro</CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
                <div className="space-y-3">
                  <Label htmlFor="type" className="text-base font-medium text-foreground">
                    Tipo de Visto <span className="text-primary">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleChange("type", value)}
                  >
                  <SelectTrigger className="h-12 w-full border-2 focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel className="font-bold text-slate-900 dark:text-slate-100">Visto de Turismo</SelectLabel>
                        <SelectItem value="Turismo">Turismo</SelectItem>
                      </SelectGroup>
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
              </div>

              {formData.type === "Turismo" && (
                <div className="space-y-3">
                  <Label className="text-base font-medium text-foreground">Período da Viagem</Label>
                  <div className="grid gap-3">
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
                        <Button variant="outline" className="h-9 w-full border-2 border-input rounded-md px-3 py-1 text-sm bg-background shadow-none hover:bg-background hover:text-foreground hover:shadow-none transition-colors justify-between text-foreground">
                          <span className="text-sm">{(() => {
                            const fmt = (s?: string) => {
                              if (!s) return "";
                              const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                              return m ? `${m[3]}/${m[2]}/${m[1]}` : format(new Date(s), "dd/MM/yyyy", { locale: ptBR });
                            };
                            const start = fmt(formData.travelStartDate);
                            const end = fmt(formData.travelEndDate);
                            if (start && end) return `${start} — ${end}`;
                            return "Selecionar período";
                          })()}</span>
                          <CalendarIcon className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-2 w-auto">
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
                            const fmt = (dt?: Date) => dt ? `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}` : "";
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
                          className="h-11 border-2 focus:border-primary"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              id="cpfDocInput"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "cpfDoc")}
                              disabled={uploadingDocs.cpfDoc}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                            <Label
                              htmlFor="cpfDocInput"
                              className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.cpfDoc ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </div>
                          {formData.cpfDoc && (
                            <DocumentPreview
                              fileUrl={formData.cpfDoc}
                              onRemove={() => removeDocument("cpfDoc")}
                            />
                          )}
                          {(extraUploads.cpfDoc || []).map((u, i) => (
                            <DocumentPreview key={`cpfDoc-${i}`} fileUrl={u} onRemove={() => removeDocumentAt("cpfDoc", u)} />
                          ))}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rnm" className="text-sm font-medium">RNM</Label>
                          <Input
                            id="rnm"
                            value={formData.rnm}
                            onChange={(e) => handleChange("rnm", e.target.value)}
                            placeholder="Status ou informações do documento"
                          className="h-11 border-2 focus:border-primary"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              id="rnmDocInput"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "rnmDoc")}
                              disabled={uploadingDocs.rnmDoc}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                            <Label
                              htmlFor="rnmDocInput"
                              className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.rnmDoc ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </div>
                          {formData.rnmDoc && (
                            <DocumentPreview
                              fileUrl={formData.rnmDoc}
                              onRemove={() => removeDocument("rnmDoc")}
                            />
                          )}
                          {(extraUploads.rnmDoc || []).map((u, i) => (
                            <DocumentPreview key={`rnmDoc-${i}`} fileUrl={u} onRemove={() => removeDocumentAt("rnmDoc", u)} />
                          ))}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="passaporte" className="text-sm font-medium">Passaporte</Label>
                          <Input
                            id="passaporte"
                            value={formData.passaporte}
                            onChange={(e) => handleChange("passaporte", e.target.value)}
                            placeholder="Status ou informações do documento"
                          className="h-11 border-2 focus:border-primary"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              id="passaporteDocInput"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "passaporteDoc")}
                              disabled={uploadingDocs.passaporteDoc}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                            <Label
                              htmlFor="passaporteDocInput"
                              className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.passaporteDoc ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </div>
                          {formData.passaporteDoc && (
                            <DocumentPreview
                              fileUrl={formData.passaporteDoc}
                              onRemove={() => removeDocument("passaporteDoc")}
                            />
                          )}
                          {(extraUploads.passaporteDoc || []).map((u, i) => (
                            <DocumentPreview key={`passaporteDoc-${i}`} fileUrl={u} onRemove={() => removeDocumentAt("passaporteDoc", u)} />
                          ))}
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
                          className="h-11 border-2 focus:border-primary"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              id="comprovanteEnderecoDocInput"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "comprovanteEnderecoDoc")}
                              disabled={uploadingDocs.comprovanteEnderecoDoc}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                            <Label
                              htmlFor="comprovanteEnderecoDocInput"
                              className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.comprovanteEnderecoDoc ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </div>
                          {formData.comprovanteEnderecoDoc && (
                            <DocumentPreview
                              fileUrl={formData.comprovanteEnderecoDoc}
                              onRemove={() => removeDocument("comprovanteEnderecoDoc")}
                            />
                          )}
                          {(extraUploads.comprovanteEnderecoDoc || []).map((u, i) => (
                            <DocumentPreview key={`comprovanteEnderecoDoc-${i}`} fileUrl={u} onRemove={() => removeDocumentAt("comprovanteEnderecoDoc", u)} />
                          ))}
                          <div className="flex items-center gap-2 pt-2">
                            <Checkbox
                              id="comprovanteNaoNoNome"
                              checked={!!formData.comprovanteNaoNoNome}
                              onCheckedChange={(checked) =>
                                setFormData((prev) => ({ ...prev, comprovanteNaoNoNome: !!checked }))
                              }
                            />
                            <Label htmlFor="comprovanteNaoNoNome" className="text-sm">
                              Comprovante não está no nome do solicitante
                            </Label>
                          </div>
                        </div>
                        {(formData.comprovanteNaoNoNome || !formData.comprovanteEnderecoDoc) && (
                          <div className="space-y-2">
                            <Label htmlFor="declaracaoResidenciaDocInput" className="text-sm font-medium">
                              Declaração de Residência
                            </Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                id="declaracaoResidenciaDocInput"
                                className="hidden"
                                onChange={(e) => handleDocumentUpload(e, "declaracaoResidenciaDoc")}
                                disabled={uploadingDocs.declaracaoResidenciaDoc}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              />
                              <Label
                                htmlFor="declaracaoResidenciaDocInput"
                                className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100"
                              >
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.declaracaoResidenciaDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </div>
                            {formData.declaracaoResidenciaDoc && (
                              <DocumentPreview
                                fileUrl={formData.declaracaoResidenciaDoc}
                                onRemove={() => removeDocument("declaracaoResidenciaDoc")}
                              />
                            )}
                            {(extraUploads.declaracaoResidenciaDoc || []).map((u, i) => (
                              <DocumentPreview key={`declaracaoResidenciaDoc-${i}`} fileUrl={u} onRemove={() => removeDocumentAt("declaracaoResidenciaDoc", u)} />
                            ))}
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="foto3x4DocInput" className="text-sm font-medium">Foto digital 3x4</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              id="foto3x4DocInput"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "foto3x4Doc")}
                              disabled={uploadingDocs.foto3x4Doc}
                              accept=".pdf,.jpg,.jpeg,.png"
                            />
                            <Label
                              htmlFor="foto3x4DocInput"
                              className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.foto3x4Doc ? "Enviando..." : "Upload Foto"}
                            </Label>
                          </div>
                          {formData.foto3x4Doc && (
                            <DocumentPreview
                              fileUrl={formData.foto3x4Doc}
                              onRemove={() => removeDocument("foto3x4Doc")}
                            />
                          )}
                          {(extraUploads.foto3x4Doc || []).map((u, i) => (
                            <DocumentPreview key={`foto3x4Doc-${i}`} fileUrl={u} onRemove={() => removeDocumentAt("foto3x4Doc", u)} />
                          ))}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="documentoChines" className="text-sm font-medium">Documento Chinês (quando aplicável)</Label>
                          <Input
                            id="documentoChines"
                            value={formData.documentoChines}
                            onChange={(e) => handleChange("documentoChines", e.target.value)}
                            placeholder="Status ou informações do documento"
                            className="h-11 border-2 focus:border-primary"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              id="documentoChinesDocInput"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "documentoChinesDoc")}
                              disabled={uploadingDocs.documentoChinesDoc}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                            <Label
                              htmlFor="documentoChinesDocInput"
                              className="inline-flex items-center justifycenter gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.documentoChinesDoc ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </div>
                          {formData.documentoChinesDoc && (
                            <DocumentPreview
                              fileUrl={formData.documentoChinesDoc}
                              onRemove={() => removeDocument("documentoChinesDoc")}
                            />
                          )}
                          {(extraUploads.documentoChinesDoc || []).map((u, i) => (
                            <DocumentPreview key={`documentoChinesDoc-${i}`} fileUrl={u} onRemove={() => removeDocumentAt("documentoChinesDoc", u)} />
                          ))}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="antecedentesCriminais" className="text-sm font-medium">Antecedentes Criminais</Label>
                          <Input
                            id="antecedentesCriminais"
                            value={formData.antecedentesCriminais}
                            onChange={(e) => handleChange("antecedentesCriminais", e.target.value)}
                            placeholder="Status ou informações do documento"
                            className="h-11 border-2 focus:border-primary"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              id="antecedentesCriminaisDocInput"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, "antecedentesCriminaisDoc")}
                              disabled={uploadingDocs.antecedentesCriminaisDoc}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                            <Label
                              htmlFor="antecedentesCriminaisDocInput"
                              className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100"
                            >
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.antecedentesCriminaisDoc ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </div>
                          {formData.antecedentesCriminaisDoc && (
                            <DocumentPreview
                              fileUrl={formData.antecedentesCriminaisDoc}
                              onRemove={() => removeDocument("antecedentesCriminaisDoc")}
                            />
                          )}
                          {(extraUploads.antecedentesCriminaisDoc || []).map((u, i) => (
                            <DocumentPreview key={`antecedentesCriminaisDoc-${i}`} fileUrl={u} onRemove={() => removeDocumentAt("antecedentesCriminaisDoc", u)} />
                          ))}
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
                          <div className="flex items-center gap-2">
                            {!formData.certidaoNascimentoFilhosDoc ? (
                              <>
                                <input
                                  type="file"
                                  id="certidaoNascimentoFilhosDocInput"
                                  className="hidden"
                                  onChange={(e) => handleDocumentUpload(e, "certidaoNascimentoFilhosDoc")}
                                  disabled={uploadingDocs.certidaoNascimentoFilhosDoc}
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <Label
                                  htmlFor="certidaoNascimentoFilhosDocInput"
                                  className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100"
                                >
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.certidaoNascimentoFilhosDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.certidaoNascimentoFilhosDoc && (
                            <DocumentPreview
                              fileUrl={formData.certidaoNascimentoFilhosDoc}
                              onRemove={() => removeDocument("certidaoNascimentoFilhosDoc")}
                            />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cartaoCnpj" className="text-sm font-medium">
                            Empresa: Cartão CNPJ
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
                          <div className="flex items-center gap-2">
                            {!formData.cartaoCnpjDoc ? (
                              <>
                                <input
                                  type="file"
                                  id="cartaoCnpjDocInput"
                                  className="hidden"
                                  onChange={(e) => handleDocumentUpload(e, "cartaoCnpjDoc")}
                                  disabled={uploadingDocs.cartaoCnpjDoc}
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <Label
                                  htmlFor="cartaoCnpjDocInput"
                                  className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100"
                                >
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.cartaoCnpjDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.cartaoCnpjDoc && (
                            <DocumentPreview
                              fileUrl={formData.cartaoCnpjDoc}
                              onRemove={() => removeDocument("cartaoCnpjDoc")}
                            />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contratoEmpresa" className="text-sm font-medium">
                            Contrato Social
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
                          <div className="flex items-center gap-2">
                            {!formData.contratoEmpresaDoc ? (
                              <>
                                <input
                                  type="file"
                                  id="contratoEmpresaDocInput_pf"
                                  className="hidden"
                                  onChange={(e) => handleDocumentUpload(e, "contratoEmpresaDoc")}
                                  disabled={uploadingDocs.contratoEmpresaDoc}
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <Label
                                  htmlFor="contratoEmpresaDocInput_pf"
                                  className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100"
                                >
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.contratoEmpresaDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.contratoEmpresaDoc && (
                            <DocumentPreview
                              fileUrl={formData.contratoEmpresaDoc}
                              onRemove={() => removeDocument("contratoEmpresaDoc")}
                            />
                          )}
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
                          <div className="flex items-center gap-2">
                            {!formData.escrituraImoveisDoc ? (
                              <>
                                <input
                                  type="file"
                                  id="escrituraImoveisDocInput"
                                  className="hidden"
                                  onChange={(e) => handleDocumentUpload(e, "escrituraImoveisDoc")}
                                  disabled={uploadingDocs.escrituraImoveisDoc}
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <Label
                                  htmlFor="escrituraImoveisDocInput"
                                  className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100"
                                >
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.escrituraImoveisDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.escrituraImoveisDoc && (
                            <DocumentPreview
                              fileUrl={formData.escrituraImoveisDoc}
                              onRemove={() => removeDocument("escrituraImoveisDoc")}
                            />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="extratosBancarios" className="text-sm font-medium">
                            Últimos 3 extratos bancários
                          </Label>
                          <Input
                            id="extratosBancarios"
                            value={formData.extratosBancarios}
                            onChange={(e) =>
                              handleChange("extratosBancarios", e.target.value)
                            }
                            placeholder="Status ou informações do documento"
                            className="h-11 border-2 focus:border-primary"
                          />
                          <div className="flex items-center gap-2">
                            {!formData.extratosBancariosDoc ? (
                              <>
                                <input
                                  type="file"
                                  id="extratosBancariosDocInput"
                                  className="hidden"
                                  onChange={(e) => handleDocumentUpload(e, "extratosBancariosDoc")}
                                  disabled={uploadingDocs.extratosBancariosDoc}
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <Label
                                  htmlFor="extratosBancariosDocInput"
                                  className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100"
                                >
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.extratosBancariosDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.extratosBancariosDoc && (
                            <DocumentPreview
                              fileUrl={formData.extratosBancariosDoc}
                              onRemove={() => removeDocument("extratosBancariosDoc")}
                            />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="impostoRenda" className="text-sm font-medium">
                            Imposto de Renda
                          </Label>
                          <Input
                            id="impostoRenda"
                            value={formData.impostoRenda}
                            onChange={(e) =>
                              handleChange("impostoRenda", e.target.value)
                            }
                            placeholder="Status ou informações do documento"
                            className="h-11 border-2 focus:border-primary"
                          />
                          <div className="flex items-center gap-2">
                            {!formData.impostoRendaDoc ? (
                              <>
                                <input
                                  type="file"
                                  id="impostoRendaDocInput"
                                  className="hidden"
                                  onChange={(e) => handleDocumentUpload(e, "impostoRendaDoc")}
                                  disabled={uploadingDocs.impostoRendaDoc}
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <Label
                                  htmlFor="impostoRendaDocInput"
                                  className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100"
                                >
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.impostoRendaDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.impostoRendaDoc && (
                            <DocumentPreview
                              fileUrl={formData.impostoRendaDoc}
                              onRemove={() => removeDocument("impostoRendaDoc")}
                            />
                          )}
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
                          <div className="flex items-center gap-2">
                          {true ? (
                              <>
                                <input
                                  type="file"
                                  id="reservasPassagensDocInput"
                                  className="hidden"
                                  onChange={(e) => handleDocumentUpload(e, "reservasPassagensDoc")}
                                  disabled={uploadingDocs.reservasPassagensDoc}
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <Label
                                  htmlFor="reservasPassagensDocInput"
                                  className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100"
                                >
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.reservasPassagensDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.reservasPassagensDoc && (
                            <DocumentPreview
                              fileUrl={formData.reservasPassagensDoc}
                              onRemove={() => removeDocument("reservasPassagensDoc")}
                            />
                          )}
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
                          <div className="flex items-center gap-2">
                          {true ? (
                              <>
                                <input
                                  type="file"
                                  id="reservasHotelDocInput"
                                  className="hidden"
                                  onChange={(e) => handleDocumentUpload(e, "reservasHotelDoc")}
                                  disabled={uploadingDocs.reservasHotelDoc}
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <Label
                                  htmlFor="reservasHotelDocInput"
                                  className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100"
                                >
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.reservasHotelDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.reservasHotelDoc && (
                            <DocumentPreview
                              fileUrl={formData.reservasHotelDoc}
                              onRemove={() => removeDocument("reservasHotelDoc")}
                            />
                          )}
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
                          <div className="flex items-center gap-2">
                          {true ? (
                              <>
                                <input
                                  type="file"
                                  id="seguroViagemDocInput"
                                  className="hidden"
                                  onChange={(e) => handleDocumentUpload(e, "seguroViagemDoc")}
                                  disabled={uploadingDocs.seguroViagemDoc}
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <Label
                                  htmlFor="seguroViagemDocInput"
                                  className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100"
                                >
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.seguroViagemDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.seguroViagemDoc && (
                            <DocumentPreview
                              fileUrl={formData.seguroViagemDoc}
                              onRemove={() => removeDocument("seguroViagemDoc")}
                            />
                          )}
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
                          <div className="flex items-center gap-2">
                          {true ? (
                              <>
                                <input
                                  type="file"
                                  id="roteiroViagemDocInput"
                                  className="hidden"
                                  onChange={(e) => handleDocumentUpload(e, "roteiroViagemDoc")}
                                  disabled={uploadingDocs.roteiroViagemDoc}
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <Label
                                  htmlFor="roteiroViagemDocInput"
                                  className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100"
                                >
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.roteiroViagemDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.roteiroViagemDoc && (
                            <DocumentPreview
                              fileUrl={formData.roteiroViagemDoc}
                              onRemove={() => removeDocument("roteiroViagemDoc")}
                            />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="taxa" className="text-sm font-medium">Taxa Consular</Label>
                          <Input
                            id="taxa"
                            value={formData.taxa}
                            onChange={(e) => handleChange("taxa", e.target.value)}
                            placeholder="Status ou informações do documento"
                            className="h-11 border-2 focus:border-primary"
                          />
                          <div className="flex items-center gap-2">
                          {true ? (
                              <>
                                <input
                                  type="file"
                                  id="taxaDocInput"
                                  className="hidden"
                                  onChange={(e) => handleDocumentUpload(e, "taxaDoc")}
                                  disabled={uploadingDocs.taxaDoc}
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <Label
                                  htmlFor="taxaDocInput"
                                  className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100"
                                >
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.taxaDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.taxaDoc && (
                            <DocumentPreview
                              fileUrl={formData.taxaDoc}
                              onRemove={() => removeDocument("taxaDoc")}
                            />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="formularioConsulado" className="text-sm font-medium">
                            Formulário do Consulado preenchido
                          </Label>
                          <Input
                            id="formularioConsulado"
                            value={formData.formularioConsulado}
                            onChange={(e) => handleChange("formularioConsulado", e.target.value)}
                            placeholder="Status ou informações do documento"
                            className="h-11 border-2 focus:border-primary"
                          />
                          <div className="flex items-center gap-2">
                          {true ? (
                              <>
                                <input
                                  type="file"
                                  id="formularioConsuladoDocInput"
                                  className="hidden"
                                  onChange={(e) => handleDocumentUpload(e, "formularioConsuladoDoc")}
                                  disabled={uploadingDocs.formularioConsuladoDoc}
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <Label
                                  htmlFor="formularioConsuladoDocInput"
                                  className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100"
                                >
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.formularioConsuladoDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.formularioConsuladoDoc && (
                            <DocumentPreview
                              fileUrl={formData.formularioConsuladoDoc}
                              onRemove={() => removeDocument("formularioConsuladoDoc")}
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
                
              </div>
            )}

            {formData.type === "Trabalho:Brasil" && (
              <div className="space-y-8 mt-8">
                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("identificacaoTrabalhoBrasil")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">1</span>
                        <CardTitle className="text-lg font-semibold">Identificação</CardTitle>
                      </div>
                      {expandedSections.identificacaoTrabalhoBrasil ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.identificacaoTrabalhoBrasil && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="passaporte" className="text-sm font-medium">Passaporte</Label>
                        <Input
                          id="passaporte"
                          value={formData.passaporte}
                          onChange={(e) => handleChange("passaporte", e.target.value)}
                          placeholder="Status ou informações do documento"
                          className="h-11 border-2 focus:border-primary"
                        />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input
                                type="file"
                                id="passaporteDocInput_trabalho"
                                className="hidden"
                                onChange={(e) => handleDocumentUpload(e, "passaporteDoc")}
                                disabled={uploadingDocs.passaporteDoc}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              />
                              <Label htmlFor="passaporteDocInput_trabalho" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.passaporteDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.passaporteDoc && (
                          <DocumentPreview fileUrl={formData.passaporteDoc} onRemove={() => removeDocument("passaporteDoc")} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="certidaoNascimento" className="text-sm font-medium">Certidão de Nascimento</Label>
                        <Input
                          id="certidaoNascimento"
                          value={formData.certidaoNascimento}
                          onChange={(e) => handleChange("certidaoNascimento", e.target.value)}
                          placeholder="Status ou informações do documento"
                          className="h-11 border-2 focus:border-primary"
                        />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="certidaoNascimentoDocInput" className="hidden" onChange={(e) => handleDocumentUpload(e, "certidaoNascimentoDoc")} disabled={uploadingDocs.certidaoNascimentoDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="certidaoNascimentoDocInput" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.certidaoNascimentoDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.certidaoNascimentoDoc && (
                          <DocumentPreview fileUrl={formData.certidaoNascimentoDoc} onRemove={() => removeDocument("certidaoNascimentoDoc")} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="declaracaoCompreensao" className="text-sm font-medium">Declaração de Compreensão</Label>
                        <Input id="declaracaoCompreensao" value={formData.declaracaoCompreensao} onChange={(e) => handleChange("declaracaoCompreensao", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="declaracaoCompreensaoDocInput" className="hidden" onChange={(e) => handleDocumentUpload(e, "declaracaoCompreensaoDoc")} disabled={uploadingDocs.declaracaoCompreensaoDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="declaracaoCompreensaoDocInput" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.declaracaoCompreensaoDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.declaracaoCompreensaoDoc && (
                          <DocumentPreview fileUrl={formData.declaracaoCompreensaoDoc} onRemove={() => removeDocument("declaracaoCompreensaoDoc")} />
                        )}
                      </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("empresaTrabalhoBrasil")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">2</span>
                        <CardTitle className="text-lg font-semibold">Documentos da Empresa</CardTitle>
                      </div>
                      {expandedSections.empresaTrabalhoBrasil ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.empresaTrabalhoBrasil && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contratoEmpresa" className="text-sm font-medium">Contrato Social</Label>
                        <Input id="contratoEmpresa" value={formData.contratoEmpresa} onChange={(e) => handleChange("contratoEmpresa", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="contratoEmpresaDocInput_trabalho" className="hidden" onChange={(e) => handleDocumentUpload(e, "contratoEmpresaDoc")} disabled={uploadingDocs.contratoEmpresaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="contratoEmpresaDocInput_trabalho" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.contratoEmpresaDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.contratoEmpresaDoc && (
                          <DocumentPreview fileUrl={formData.contratoEmpresaDoc} onRemove={() => removeDocument("contratoEmpresaDoc")} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cartaoCnpj" className="text-sm font-medium">CNPJ</Label>
                        <Input id="cartaoCnpj" value={formData.cartaoCnpj} onChange={(e) => handleChange("cartaoCnpj", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="cartaoCnpjDocInput_trabalho" className="hidden" onChange={(e) => handleDocumentUpload(e, "cartaoCnpjDoc")} disabled={uploadingDocs.cartaoCnpjDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="cartaoCnpjDocInput_trabalho" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.cartaoCnpjDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.cartaoCnpjDoc && (
                          <DocumentPreview fileUrl={formData.cartaoCnpjDoc} onRemove={() => removeDocument("cartaoCnpjDoc")} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="declaracoesEmpresa" className="text-sm font-medium">Declarações da Empresa</Label>
                        <Input id="declaracoesEmpresa" value={formData.declaracoesEmpresa} onChange={(e) => handleChange("declaracoesEmpresa", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="declaracoesEmpresaDocInput" className="hidden" onChange={(e) => handleDocumentUpload(e, "declaracoesEmpresaDoc")} disabled={uploadingDocs.declaracoesEmpresaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="declaracoesEmpresaDocInput" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.declaracoesEmpresaDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.declaracoesEmpresaDoc && (
                          <DocumentPreview fileUrl={formData.declaracoesEmpresaDoc} onRemove={() => removeDocument("declaracoesEmpresaDoc")} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="procuracaoEmpresa" className="text-sm font-medium">Procuração da empresa</Label>
                        <Input id="procuracaoEmpresa" value={formData.procuracaoEmpresa} onChange={(e) => handleChange("procuracaoEmpresa", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="procuracaoEmpresaDocInput" className="hidden" onChange={(e) => handleDocumentUpload(e, "procuracaoEmpresaDoc")} disabled={uploadingDocs.procuracaoEmpresaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="procuracaoEmpresaDocInput" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.procuracaoEmpresaDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.procuracaoEmpresaDoc && (
                          <DocumentPreview fileUrl={formData.procuracaoEmpresaDoc} onRemove={() => removeDocument("procuracaoEmpresaDoc")} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="formularioRn01" className="text-sm font-medium">Formulário RN 01</Label>
                        <Input id="formularioRn01" value={formData.formularioRn01} onChange={(e) => handleChange("formularioRn01", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="formularioRn01DocInput" className="hidden" onChange={(e) => handleDocumentUpload(e, "formularioRn01Doc")} disabled={uploadingDocs.formularioRn01Doc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="formularioRn01DocInput" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.formularioRn01Doc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.formularioRn01Doc && (
                          <DocumentPreview fileUrl={formData.formularioRn01Doc} onRemove={() => removeDocument("formularioRn01Doc")} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guiaPaga" className="text-sm font-medium">Guia paga</Label>
                        <Input id="guiaPaga" value={formData.guiaPaga} onChange={(e) => handleChange("guiaPaga", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="guiaPagaDocInput" className="hidden" onChange={(e) => handleDocumentUpload(e, "guiaPagaDoc")} disabled={uploadingDocs.guiaPagaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="guiaPagaDocInput" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.guiaPagaDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.guiaPagaDoc && (
                          <DocumentPreview fileUrl={formData.guiaPagaDoc} onRemove={() => removeDocument("guiaPagaDoc")} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="publicacaoDou" className="text-sm font-medium">Publicação no DOU</Label>
                        <Input id="publicacaoDou" value={formData.publicacaoDou} onChange={(e) => handleChange("publicacaoDou", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="publicacaoDouDocInput" className="hidden" onChange={(e) => handleDocumentUpload(e, "publicacaoDouDoc")} disabled={uploadingDocs.publicacaoDouDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="publicacaoDouDocInput" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.publicacaoDouDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.publicacaoDouDoc && (
                          <DocumentPreview fileUrl={formData.publicacaoDouDoc} onRemove={() => removeDocument("publicacaoDouDoc")} />
                        )}
                      </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("trabalhistasTrabalhoBrasil")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">3</span>
                        <CardTitle className="text-lg font-semibold">Documentos Trabalhistas</CardTitle>
                      </div>
                      {expandedSections.trabalhistasTrabalhoBrasil ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.trabalhistasTrabalhoBrasil && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contratoTrabalho" className="text-sm font-medium">Contrato de trabalho</Label>
                        <Input id="contratoTrabalho" value={formData.contratoTrabalho} onChange={(e) => handleChange("contratoTrabalho", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="contratoTrabalhoDocInput" className="hidden" onChange={(e) => handleDocumentUpload(e, "contratoTrabalhoDoc")} disabled={uploadingDocs.contratoTrabalhoDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="contratoTrabalhoDocInput" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.contratoTrabalhoDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.contratoTrabalhoDoc && (
                          <DocumentPreview fileUrl={formData.contratoTrabalhoDoc} onRemove={() => removeDocument("contratoTrabalhoDoc")} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="folhaPagamento" className="text-sm font-medium">Folha de pagamento (últimas)</Label>
                        <Input id="folhaPagamento" value={formData.folhaPagamento} onChange={(e) => handleChange("folhaPagamento", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="folhaPagamentoDocInput" className="hidden" onChange={(e) => handleDocumentUpload(e, "folhaPagamentoDoc")} disabled={uploadingDocs.folhaPagamentoDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="folhaPagamentoDocInput" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.folhaPagamentoDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.folhaPagamentoDoc && (
                          <DocumentPreview fileUrl={formData.folhaPagamentoDoc} onRemove={() => removeDocument("folhaPagamentoDoc")} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comprovanteVinculoAnterior" className="text-sm font-medium">Comprovante de vínculo anterior (se houver)</Label>
                        <Input id="comprovanteVinculoAnterior" value={formData.comprovanteVinculoAnterior} onChange={(e) => handleChange("comprovanteVinculoAnterior", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="comprovanteVinculoAnteriorDocInput" className="hidden" onChange={(e) => handleDocumentUpload(e, "comprovanteVinculoAnteriorDoc")} disabled={uploadingDocs.comprovanteVinculoAnteriorDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="comprovanteVinculoAnteriorDocInput" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.comprovanteVinculoAnteriorDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.comprovanteVinculoAnteriorDoc && (
                          <DocumentPreview fileUrl={formData.comprovanteVinculoAnteriorDoc} onRemove={() => removeDocument("comprovanteVinculoAnteriorDoc")} />
                        )}
                      </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("historicoSegurancaTrabalhoBrasil")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">4</span>
                        <CardTitle className="text-lg font-semibold">Histórico e Segurança</CardTitle>
                      </div>
                      {expandedSections.historicoSegurancaTrabalhoBrasil ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.historicoSegurancaTrabalhoBrasil && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="antecedentesCriminais" className="text-sm font-medium">Antecedentes Criminais</Label>
                        <Input id="antecedentesCriminais" value={formData.antecedentesCriminais} onChange={(e) => handleChange("antecedentesCriminais", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="antecedentesCriminaisDocInput_trabalho" className="hidden" onChange={(e) => handleDocumentUpload(e, "antecedentesCriminaisDoc")} disabled={uploadingDocs.antecedentesCriminaisDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="antecedentesCriminaisDocInput_trabalho" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.antecedentesCriminaisDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.antecedentesCriminaisDoc && (
                          <DocumentPreview fileUrl={formData.antecedentesCriminaisDoc} onRemove={() => removeDocument("antecedentesCriminaisDoc")} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="declaracaoAntecedentesCriminais" className="text-sm font-medium">Declaração de Antecedentes Criminais</Label>
                        <Input id="declaracaoAntecedentesCriminais" value={formData.declaracaoAntecedentesCriminais} onChange={(e) => handleChange("declaracaoAntecedentesCriminais", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="declaracaoAntecedentesCriminaisDocInput" className="hidden" onChange={(e) => handleDocumentUpload(e, "declaracaoAntecedentesCriminaisDoc")} disabled={uploadingDocs.declaracaoAntecedentesCriminaisDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="declaracaoAntecedentesCriminaisDocInput" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.declaracaoAntecedentesCriminaisDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.declaracaoAntecedentesCriminaisDoc && (
                          <DocumentPreview fileUrl={formData.declaracaoAntecedentesCriminaisDoc} onRemove={() => removeDocument("declaracaoAntecedentesCriminaisDoc")} />
                        )}
                      </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("formacaoTrabalhoBrasil")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">5</span>
                        <CardTitle className="text-lg font-semibold">Formação Acadêmica</CardTitle>
                      </div>
                      {expandedSections.formacaoTrabalhoBrasil ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.formacaoTrabalhoBrasil && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="diploma" className="text-sm font-medium">Diploma</Label>
                        <Input id="diploma" value={formData.diploma} onChange={(e) => handleChange("diploma", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="diplomaDocInput" className="hidden" onChange={(e) => handleDocumentUpload(e, "diplomaDoc")} disabled={uploadingDocs.diplomaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="diplomaDocInput" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.diplomaDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.diplomaDoc && (
                          <DocumentPreview fileUrl={formData.diplomaDoc} onRemove={() => removeDocument("diplomaDoc")} />
                        )}
                      </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("outrasInformacoesTrabalhoBrasil")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">6</span>
                        <CardTitle className="text-lg font-semibold">Outras Informações</CardTitle>
                      </div>
                      {expandedSections.outrasInformacoesTrabalhoBrasil ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.outrasInformacoesTrabalhoBrasil && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="procurador" className="text-sm font-medium">Procurador</Label>
                          <Input
                            id="procurador"
                            value={formData.procurador}
                            onChange={(e) => handleChange("procurador", e.target.value)}
                            placeholder="Nome do procurador responsável"
                            className="h-11 border-2 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="numeroProcesso" className="text-sm font-medium">Número do Processo</Label>
                          <Input
                            id="numeroProcesso"
                            value={formData.numeroProcesso}
                            onChange={(e) => handleChange("numeroProcesso", e.target.value)}
                            placeholder="0000000-00.0000.0.00.0000"
                            className="h-11 border-2 focus:border-primary"
                          />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            )}
            {formData.type === "Trabalho:Residência Prévia" && (
              <div className="space-y-8 mt-8">
                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("identificacaoResidenciaPrevia")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">1</span>
                        <CardTitle className="text-lg font-semibold">Identificação</CardTitle>
                      </div>
                      {expandedSections.identificacaoResidenciaPrevia ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.identificacaoResidenciaPrevia && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="passaporte" className="text-sm font-medium">Passaporte</Label>
                        <Input id="passaporte" value={formData.passaporte} onChange={(e) => handleChange("passaporte", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="passaporteDocInput_resprevia" className="hidden" onChange={(e) => handleDocumentUpload(e, "passaporteDoc")} disabled={uploadingDocs.passaporteDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="passaporteDocInput_resprevia" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.passaporteDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.passaporteDoc && (
                          <DocumentPreview fileUrl={formData.passaporteDoc} onRemove={() => removeDocument("passaporteDoc")} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="declaracaoCompreensao" className="text-sm font-medium">Declaração de Compreensão</Label>
                        <Input id="declaracaoCompreensao" value={formData.declaracaoCompreensao} onChange={(e) => handleChange("declaracaoCompreensao", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="declaracaoCompreensaoDocInput_resprevia" className="hidden" onChange={(e) => handleDocumentUpload(e, "declaracaoCompreensaoDoc")} disabled={uploadingDocs.declaracaoCompreensaoDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="declaracaoCompreensaoDocInput_resprevia" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.declaracaoCompreensaoDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.declaracaoCompreensaoDoc && (
                          <DocumentPreview fileUrl={formData.declaracaoCompreensaoDoc} onRemove={() => removeDocument("declaracaoCompreensaoDoc")} />
                        )}
                      </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("residenciaAnteriorResidenciaPrevia")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">2</span>
                        <CardTitle className="text-lg font-semibold">Residência Anterior</CardTitle>
                      </div>
                      {expandedSections.residenciaAnteriorResidenciaPrevia ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.residenciaAnteriorResidenciaPrevia && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="comprovanteResidenciaPrevia" className="text-sm font-medium">Comprovante de residência prévia no Brasil</Label>
                        <Input id="comprovanteResidenciaPrevia" value={formData.comprovanteResidenciaPrevia || ""} onChange={(e) => handleChange("comprovanteResidenciaPrevia", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="comprovanteResidenciaPreviaDocInput" className="hidden" onChange={(e) => handleDocumentUpload(e, "comprovanteResidenciaPreviaDoc")} disabled={uploadingDocs.comprovanteResidenciaPreviaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="comprovanteResidenciaPreviaDocInput" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.comprovanteResidenciaPreviaDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.comprovanteResidenciaPreviaDoc && (
                          <DocumentPreview fileUrl={formData.comprovanteResidenciaPreviaDoc} onRemove={() => removeDocument("comprovanteResidenciaPreviaDoc")} />
                        )}
                      </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("empresaResidenciaPrevia")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">3</span>
                        <CardTitle className="text-lg font-semibold">Documentos da Empresa</CardTitle>
                      </div>
                      {expandedSections.empresaResidenciaPrevia ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.empresaResidenciaPrevia && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contratoEmpresa" className="text-sm font-medium">Contrato Social</Label>
                        <Input id="contratoEmpresa" value={formData.contratoEmpresa} onChange={(e) => handleChange("contratoEmpresa", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="contratoEmpresaDocInput_resprevia" className="hidden" onChange={(e) => handleDocumentUpload(e, "contratoEmpresaDoc")} disabled={uploadingDocs.contratoEmpresaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="contratoEmpresaDocInput_resprevia" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.contratoEmpresaDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.contratoEmpresaDoc && (
                          <DocumentPreview fileUrl={formData.contratoEmpresaDoc} onRemove={() => removeDocument("contratoEmpresaDoc")} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cartaoCnpj" className="text-sm font-medium">CNPJ</Label>
                        <Input id="cartaoCnpj" value={formData.cartaoCnpj} onChange={(e) => handleChange("cartaoCnpj", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="cartaoCnpjDocInput_resprevia" className="hidden" onChange={(e) => handleDocumentUpload(e, "cartaoCnpjDoc")} disabled={uploadingDocs.cartaoCnpjDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="cartaoCnpjDocInput_resprevia" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.cartaoCnpjDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.cartaoCnpjDoc && (
                          <DocumentPreview fileUrl={formData.cartaoCnpjDoc} onRemove={() => removeDocument("cartaoCnpjDoc")} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="declaracoesEmpresa" className="text-sm font-medium">Declarações da Empresa</Label>
                        <Input id="declaracoesEmpresa" value={formData.declaracoesEmpresa} onChange={(e) => handleChange("declaracoesEmpresa", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="declaracoesEmpresaDocInput_resprevia" className="hidden" onChange={(e) => handleDocumentUpload(e, "declaracoesEmpresaDoc")} disabled={uploadingDocs.declaracoesEmpresaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="declaracoesEmpresaDocInput_resprevia" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.declaracoesEmpresaDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.declaracoesEmpresaDoc && (
                          <DocumentPreview fileUrl={formData.declaracoesEmpresaDoc} onRemove={() => removeDocument("declaracoesEmpresaDoc")} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="procuracaoEmpresa" className="text-sm font-medium">Procuração da Empresa</Label>
                        <Input id="procuracaoEmpresa" value={formData.procuracaoEmpresa} onChange={(e) => handleChange("procuracaoEmpresa", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="procuracaoEmpresaDocInput_resprevia" className="hidden" onChange={(e) => handleDocumentUpload(e, "procuracaoEmpresaDoc")} disabled={uploadingDocs.procuracaoEmpresaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="procuracaoEmpresaDocInput_resprevia" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.procuracaoEmpresaDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.procuracaoEmpresaDoc && (
                          <DocumentPreview fileUrl={formData.procuracaoEmpresaDoc} onRemove={() => removeDocument("procuracaoEmpresaDoc")} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="formularioRn02" className="text-sm font-medium">Formulário RN 02</Label>
                        <Input id="formularioRn02" value={formData.formularioRn02 || ""} onChange={(e) => handleChange("formularioRn02", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="formularioRn02DocInput" className="hidden" onChange={(e) => handleDocumentUpload(e, "formularioRn02Doc")} disabled={uploadingDocs.formularioRn02Doc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="formularioRn02DocInput" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.formularioRn02Doc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.formularioRn02Doc && (
                          <DocumentPreview fileUrl={formData.formularioRn02Doc} onRemove={() => removeDocument("formularioRn02Doc")} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guiaPaga" className="text-sm font-medium">Guia paga</Label>
                        <Input id="guiaPaga" value={formData.guiaPaga || ""} onChange={(e) => handleChange("guiaPaga", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="guiaPagaDocInput_resprevia" className="hidden" onChange={(e) => handleDocumentUpload(e, "guiaPagaDoc")} disabled={uploadingDocs.guiaPagaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="guiaPagaDocInput_resprevia" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.guiaPagaDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.guiaPagaDoc && (
                          <DocumentPreview fileUrl={formData.guiaPagaDoc} onRemove={() => removeDocument("guiaPagaDoc")} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="publicacaoDou" className="text-sm font-medium">Publicação no DOU</Label>
                        <Input id="publicacaoDou" value={formData.publicacaoDou || ""} onChange={(e) => handleChange("publicacaoDou", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="publicacaoDouDocInput_resprevia" className="hidden" onChange={(e) => handleDocumentUpload(e, "publicacaoDouDoc")} disabled={uploadingDocs.publicacaoDouDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="publicacaoDouDocInput_resprevia" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.publicacaoDouDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.publicacaoDouDoc && (
                          <DocumentPreview fileUrl={formData.publicacaoDouDoc} onRemove={() => removeDocument("publicacaoDouDoc")} />
                        )}
                      </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("trabalhistasResidenciaPrevia")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">4</span>
                        <CardTitle className="text-lg font-semibold">Documentos Trabalhistas</CardTitle>
                      </div>
                      {expandedSections.trabalhistasResidenciaPrevia ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.trabalhistasResidenciaPrevia && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contratoTrabalho" className="text-sm font-medium">Contrato de trabalho</Label>
                        <Input id="contratoTrabalho" value={formData.contratoTrabalho || ""} onChange={(e) => handleChange("contratoTrabalho", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="contratoTrabalhoDocInput_resprevia" className="hidden" onChange={(e) => handleDocumentUpload(e, "contratoTrabalhoDoc")} disabled={uploadingDocs.contratoTrabalhoDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="contratoTrabalhoDocInput_resprevia" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.contratoTrabalhoDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.contratoTrabalhoDoc && (
                          <DocumentPreview fileUrl={formData.contratoTrabalhoDoc} onRemove={() => removeDocument("contratoTrabalhoDoc")} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="folhaPagamento" className="text-sm font-medium">Folha de pagamento</Label>
                        <Input id="folhaPagamento" value={formData.folhaPagamento || ""} onChange={(e) => handleChange("folhaPagamento", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="folhaPagamentoDocInput_resprevia" className="hidden" onChange={(e) => handleDocumentUpload(e, "folhaPagamentoDoc")} disabled={uploadingDocs.folhaPagamentoDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="folhaPagamentoDocInput_resprevia" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.folhaPagamentoDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.folhaPagamentoDoc && (
                          <DocumentPreview fileUrl={formData.folhaPagamentoDoc} onRemove={() => removeDocument("folhaPagamentoDoc")} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comprovanteAtividade" className="text-sm font-medium">Documentos comprobatórios de atividade (quando aplicável)</Label>
                        <Input id="comprovanteAtividade" value={formData.comprovanteAtividade || ""} onChange={(e) => handleChange("comprovanteAtividade", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="comprovanteAtividadeDocInput" className="hidden" onChange={(e) => handleDocumentUpload(e, "comprovanteAtividadeDoc")} disabled={uploadingDocs.comprovanteAtividadeDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="comprovanteAtividadeDocInput" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.comprovanteAtividadeDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.comprovanteAtividadeDoc && (
                          <DocumentPreview fileUrl={formData.comprovanteAtividadeDoc} onRemove={() => removeDocument("comprovanteAtividadeDoc")} />
                        )}
                      </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("formacaoResidenciaPrevia")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">5</span>
                        <CardTitle className="text-lg font-semibold">Formação</CardTitle>
                      </div>
                      {expandedSections.formacaoResidenciaPrevia ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.formacaoResidenciaPrevia && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="diploma" className="text-sm font-medium">Diploma</Label>
                        <Input id="diploma" value={formData.diploma || ""} onChange={(e) => handleChange("diploma", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                        <div className="flex items-center gap-2">
                          {true ? (
                            <>
                              <input type="file" id="diplomaDocInput_resprevia" className="hidden" onChange={(e) => handleDocumentUpload(e, "diplomaDoc")} disabled={uploadingDocs.diplomaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                              <Label htmlFor="diplomaDocInput_resprevia" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                {uploadingDocs.diplomaDoc ? "Enviando..." : "Upload Documento"}
                              </Label>
                            </>
                          ) : null}
                        </div>
                        {formData.diplomaDoc && (
                          <DocumentPreview fileUrl={formData.diplomaDoc} onRemove={() => removeDocument("diplomaDoc")} />
                        )}
                      </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("outrasInformacoesResidenciaPrevia")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">6</span>
                        <CardTitle className="text-lg font-semibold">Outras Informações</CardTitle>
                      </div>
                      {expandedSections.outrasInformacoesResidenciaPrevia ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.outrasInformacoesResidenciaPrevia && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="procurador" className="text-sm font-medium">Procurador</Label>
                          <Input
                            id="procurador"
                            value={formData.procurador}
                            onChange={(e) => handleChange("procurador", e.target.value)}
                            placeholder="Nome do procurador responsável"
                            className="h-11 border-2 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="numeroProcesso" className="text-sm font-medium">Número do Processo</Label>
                          <Input
                            id="numeroProcesso"
                            value={formData.numeroProcesso}
                            onChange={(e) => handleChange("numeroProcesso", e.target.value)}
                            placeholder="0000000-00.0000.0.00.0000"
                            className="h-11 border-2 focus:border-primary"
                          />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            )}
            {formData.type === "Trabalho:Renovação 1 ano" && (
              <div className="space-y-8 mt-8">
                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("identificacaoRenovacaoAno")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">1</span>
                        <CardTitle className="text-lg font-semibold">Identificação</CardTitle>
                      </div>
                      {expandedSections.identificacaoRenovacaoAno ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.identificacaoRenovacaoAno && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="rnm" className="text-sm font-medium">RNM</Label>
                          <Input id="rnm" value={formData.rnm} onChange={(e) => handleChange("rnm", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="rnmDocInput_renovacao" className="hidden" onChange={(e) => handleDocumentUpload(e, "rnmDoc")} disabled={uploadingDocs.rnmDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="rnmDocInput_renovacao" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.rnmDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.rnmDoc && (
                            <DocumentPreview fileUrl={formData.rnmDoc} onRemove={() => removeDocument("rnmDoc")} />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("empresaRenovacaoAno")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">2</span>
                        <CardTitle className="text-lg font-semibold">Documentos da Empresa</CardTitle>
                      </div>
                      {expandedSections.empresaRenovacaoAno ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.empresaRenovacaoAno && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="contratoEmpresa" className="text-sm font-medium">Contrato Social</Label>
                          <Input id="contratoEmpresa" value={formData.contratoEmpresa} onChange={(e) => handleChange("contratoEmpresa", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="contratoEmpresaDocInput_renovacao" className="hidden" onChange={(e) => handleDocumentUpload(e, "contratoEmpresaDoc")} disabled={uploadingDocs.contratoEmpresaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="contratoEmpresaDocInput_renovacao" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.contratoEmpresaDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.contratoEmpresaDoc && (
                            <DocumentPreview fileUrl={formData.contratoEmpresaDoc} onRemove={() => removeDocument("contratoEmpresaDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="procuracaoEmpresa" className="text-sm font-medium">Procuração da empresa</Label>
                          <Input id="procuracaoEmpresa" value={formData.procuracaoEmpresa} onChange={(e) => handleChange("procuracaoEmpresa", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="procuracaoEmpresaDocInput_renovacao" className="hidden" onChange={(e) => handleDocumentUpload(e, "procuracaoEmpresaDoc")} disabled={uploadingDocs.procuracaoEmpresaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="procuracaoEmpresaDocInput_renovacao" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.procuracaoEmpresaDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.procuracaoEmpresaDoc && (
                            <DocumentPreview fileUrl={formData.procuracaoEmpresaDoc} onRemove={() => removeDocument("procuracaoEmpresaDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="publicacaoDou" className="text-sm font-medium">Publicação no DOU</Label>
                          <Input id="publicacaoDou" value={formData.publicacaoDou} onChange={(e) => handleChange("publicacaoDou", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="publicacaoDouDocInput_renovacao" className="hidden" onChange={(e) => handleDocumentUpload(e, "publicacaoDouDoc")} disabled={uploadingDocs.publicacaoDouDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="publicacaoDouDocInput_renovacao" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.publicacaoDouDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.publicacaoDouDoc && (
                            <DocumentPreview fileUrl={formData.publicacaoDouDoc} onRemove={() => removeDocument("publicacaoDouDoc")} />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <div className="flex items-center gap-3 pb-2 border-b-2 border-primary/20">
                    <CardHeader
                      className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                      onClick={() => toggleSection("vinculoRenovacaoAno")}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">3</span>
                          <CardTitle className="text-lg font-semibold">Vínculo de Trabalho</CardTitle>
                        </div>
                        {expandedSections.vinculoRenovacaoAno ? (
                          <ChevronUp className="h-5 w-5 text-primary" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                  </div>
                  {expandedSections.vinculoRenovacaoAno && (
                    <CardContent className="pt-6 pb-6 bg-card">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ctps" className="text-sm font-medium">CTPS (páginas do contrato e anotações)</Label>
                      <Input id="ctps" value={formData.ctps} onChange={(e) => handleChange("ctps", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                      <div className="flex items-center gap-2">
                        {true ? (
                          <>
                            <input type="file" id="ctpsDocInput_renovacao" className="hidden" onChange={(e) => handleDocumentUpload(e, "ctpsDoc")} disabled={uploadingDocs.ctpsDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                            <Label htmlFor="ctpsDocInput_renovacao" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.ctpsDoc ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : null}
                      </div>
                      {formData.ctpsDoc && (
                        <DocumentPreview fileUrl={formData.ctpsDoc} onRemove={() => removeDocument("ctpsDoc")} />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contratoTrabalhoAnterior" className="text-sm font-medium">Contrato de trabalho anterior</Label>
                      <Input id="contratoTrabalhoAnterior" value={formData.contratoTrabalhoAnterior} onChange={(e) => handleChange("contratoTrabalhoAnterior", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                      <div className="flex items-center gap-2">
                        {true ? (
                          <>
                            <input type="file" id="contratoTrabalhoAnteriorDocInput_renovacao" className="hidden" onChange={(e) => handleDocumentUpload(e, "contratoTrabalhoAnteriorDoc")} disabled={uploadingDocs.contratoTrabalhoAnteriorDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                            <Label htmlFor="contratoTrabalhoAnteriorDocInput_renovacao" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.contratoTrabalhoAnteriorDoc ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : null}
                      </div>
                      {formData.contratoTrabalhoAnteriorDoc && (
                        <DocumentPreview fileUrl={formData.contratoTrabalhoAnteriorDoc} onRemove={() => removeDocument("contratoTrabalhoAnteriorDoc")} />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contratoTrabalhoAtual" className="text-sm font-medium">Contrato de trabalho atual</Label>
                      <Input id="contratoTrabalhoAtual" value={formData.contratoTrabalhoAtual} onChange={(e) => handleChange("contratoTrabalhoAtual", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                      <div className="flex items-center gap-2">
                        {true ? (
                          <>
                            <input type="file" id="contratoTrabalhoAtualDocInput_renovacao" className="hidden" onChange={(e) => handleDocumentUpload(e, "contratoTrabalhoAtualDoc")} disabled={uploadingDocs.contratoTrabalhoAtualDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                            <Label htmlFor="contratoTrabalhoAtualDocInput_renovacao" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.contratoTrabalhoAtualDoc ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : null}
                      </div>
                      {formData.contratoTrabalhoAtualDoc && (
                        <DocumentPreview fileUrl={formData.contratoTrabalhoAtualDoc} onRemove={() => removeDocument("contratoTrabalhoAtualDoc")} />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="formularioProrrogacao" className="text-sm font-medium">Formulário de prorrogação</Label>
                      <Input id="formularioProrrogacao" value={formData.formularioProrrogacao} onChange={(e) => handleChange("formularioProrrogacao", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                      <div className="flex items-center gap-2">
                        {true ? (
                          <>
                            <input type="file" id="formularioProrrogacaoDocInput_renovacao" className="hidden" onChange={(e) => handleDocumentUpload(e, "formularioProrrogacaoDoc")} disabled={uploadingDocs.formularioProrrogacaoDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                            <Label htmlFor="formularioProrrogacaoDocInput_renovacao" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.formularioProrrogacaoDoc ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : null}
                      </div>
                      {formData.formularioProrrogacaoDoc && (
                        <DocumentPreview fileUrl={formData.formularioProrrogacaoDoc} onRemove={() => removeDocument("formularioProrrogacaoDoc")} />
                      )}
                    </div>
                  </div>
                    </CardContent>
                  )}
                </Card>

                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("segurancaRenovacaoAno")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">4</span>
                        <CardTitle className="text-lg font-semibold">Segurança</CardTitle>
                      </div>
                      {expandedSections.segurancaRenovacaoAno ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.segurancaRenovacaoAno && (
                    <CardContent className="pt-6 pb-6 bg-card">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="declaracaoAntecedentesCriminais" className="text-sm font-medium">Declaração de Antecedentes Criminais</Label>
                      <Input id="declaracaoAntecedentesCriminais" value={formData.declaracaoAntecedentesCriminais} onChange={(e) => handleChange("declaracaoAntecedentesCriminais", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                      <div className="flex items-center gap-2">
                        {true ? (
                          <>
                            <input type="file" id="declaracaoAntecedentesCriminaisDocInput_renovacao" className="hidden" onChange={(e) => handleDocumentUpload(e, "declaracaoAntecedentesCriminaisDoc")} disabled={uploadingDocs.declaracaoAntecedentesCriminaisDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                            <Label htmlFor="declaracaoAntecedentesCriminaisDocInput_renovacao" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                              <Upload className="h-4 w-4" />
                              {uploadingDocs.declaracaoAntecedentesCriminaisDoc ? "Enviando..." : "Upload Documento"}
                            </Label>
                          </>
                        ) : null}
                      </div>
                      {formData.declaracaoAntecedentesCriminaisDoc && (
                        <DocumentPreview fileUrl={formData.declaracaoAntecedentesCriminaisDoc} onRemove={() => removeDocument("declaracaoAntecedentesCriminaisDoc")} />
                      )}
                    </div>
                  </div>
                    </CardContent>
                  )}
                </Card>
                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("outrasInformacoesRenovacaoAno")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">5</span>
                        <CardTitle className="text-lg font-semibold">Outras Informações</CardTitle>
                      </div>
                      {expandedSections.outrasInformacoesRenovacaoAno ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.outrasInformacoesRenovacaoAno && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="procurador" className="text-sm font-medium">Procurador</Label>
                          <Input
                            id="procurador"
                            value={formData.procurador}
                            onChange={(e) => handleChange("procurador", e.target.value)}
                            placeholder="Nome do procurador responsável"
                            className="h-11 border-2 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="numeroProcesso" className="text-sm font-medium">Número do Processo</Label>
                          <Input
                            id="numeroProcesso"
                            value={formData.numeroProcesso}
                            onChange={(e) => handleChange("numeroProcesso", e.target.value)}
                            placeholder="0000000-00.0000.0.00.0000"
                            className="h-11 border-2 focus:border-primary"
                          />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            )}
            {formData.type === "Trabalho:Indeterminado" && (
              <div className="space-y-8 mt-8">
                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("identificacaoIndeterminado")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">1</span>
                        <CardTitle className="text-lg font-semibold">Identificação</CardTitle>
                      </div>
                      {expandedSections.identificacaoIndeterminado ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.identificacaoIndeterminado && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="rnm" className="text-sm font-medium">RNM</Label>
                          <Input id="rnm" value={formData.rnm} onChange={(e) => handleChange("rnm", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="rnmDocInput_indeterminado" className="hidden" onChange={(e) => handleDocumentUpload(e, "rnmDoc")} disabled={uploadingDocs.rnmDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="rnmDocInput_indeterminado" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.rnmDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.rnmDoc && (
                            <DocumentPreview fileUrl={formData.rnmDoc} onRemove={() => removeDocument("rnmDoc")} />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("empresaIndeterminado")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">2</span>
                        <CardTitle className="text-lg font-semibold">Documentos da Empresa</CardTitle>
                      </div>
                      {expandedSections.empresaIndeterminado ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.empresaIndeterminado && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="contratoEmpresa" className="text-sm font-medium">Contrato Social</Label>
                          <Input id="contratoEmpresa" value={formData.contratoEmpresa} onChange={(e) => handleChange("contratoEmpresa", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="contratoEmpresaDocInput_indeterminado" className="hidden" onChange={(e) => handleDocumentUpload(e, "contratoEmpresaDoc")} disabled={uploadingDocs.contratoEmpresaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="contratoEmpresaDocInput_indeterminado" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.contratoEmpresaDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.contratoEmpresaDoc && (
                            <DocumentPreview fileUrl={formData.contratoEmpresaDoc} onRemove={() => removeDocument("contratoEmpresaDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="procuracaoEmpresa" className="text-sm font-medium">Procuração</Label>
                          <Input id="procuracaoEmpresa" value={formData.procuracaoEmpresa} onChange={(e) => handleChange("procuracaoEmpresa", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="procuracaoEmpresaDocInput_indeterminado" className="hidden" onChange={(e) => handleDocumentUpload(e, "procuracaoEmpresaDoc")} disabled={uploadingDocs.procuracaoEmpresaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="procuracaoEmpresaDocInput_indeterminado" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.procuracaoEmpresaDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.procuracaoEmpresaDoc && (
                            <DocumentPreview fileUrl={formData.procuracaoEmpresaDoc} onRemove={() => removeDocument("procuracaoEmpresaDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="publicacaoDou" className="text-sm font-medium">Publicação no DOU</Label>
                          <Input id="publicacaoDou" value={formData.publicacaoDou} onChange={(e) => handleChange("publicacaoDou", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="publicacaoDouDocInput_indeterminado" className="hidden" onChange={(e) => handleDocumentUpload(e, "publicacaoDouDoc")} disabled={uploadingDocs.publicacaoDouDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="publicacaoDouDocInput_indeterminado" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.publicacaoDouDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.publicacaoDouDoc && (
                            <DocumentPreview fileUrl={formData.publicacaoDouDoc} onRemove={() => removeDocument("publicacaoDouDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="guiaPaga" className="text-sm font-medium">Guia paga</Label>
                          <Input id="guiaPaga" value={formData.guiaPaga} onChange={(e) => handleChange("guiaPaga", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="guiaPagaDocInput_indeterminado" className="hidden" onChange={(e) => handleDocumentUpload(e, "guiaPagaDoc")} disabled={uploadingDocs.guiaPagaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="guiaPagaDocInput_indeterminado" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.guiaPagaDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.guiaPagaDoc && (
                            <DocumentPreview fileUrl={formData.guiaPagaDoc} onRemove={() => removeDocument("guiaPagaDoc")} />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("vinculoIndeterminado")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">3</span>
                        <CardTitle className="text-lg font-semibold">Vínculo de Trabalho</CardTitle>
                      </div>
                      {expandedSections.vinculoIndeterminado ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.vinculoIndeterminado && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="ctps" className="text-sm font-medium">CTPS (páginas relevantes)</Label>
                          <Input id="ctps" value={formData.ctps} onChange={(e) => handleChange("ctps", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="ctpsDocInput_indeterminado" className="hidden" onChange={(e) => handleDocumentUpload(e, "ctpsDoc")} disabled={uploadingDocs.ctpsDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="ctpsDocInput_indeterminado" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.ctpsDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.ctpsDoc && (
                            <DocumentPreview fileUrl={formData.ctpsDoc} onRemove={() => removeDocument("ctpsDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contratoTrabalhoAnterior" className="text-sm font-medium">Contrato de trabalho anterior</Label>
                          <Input id="contratoTrabalhoAnterior" value={formData.contratoTrabalhoAnterior} onChange={(e) => handleChange("contratoTrabalhoAnterior", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="contratoTrabalhoAnteriorDocInput_indeterminado" className="hidden" onChange={(e) => handleDocumentUpload(e, "contratoTrabalhoAnteriorDoc")} disabled={uploadingDocs.contratoTrabalhoAnteriorDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="contratoTrabalhoAnteriorDocInput_indeterminado" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.contratoTrabalhoAnteriorDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.contratoTrabalhoAnteriorDoc && (
                            <DocumentPreview fileUrl={formData.contratoTrabalhoAnteriorDoc} onRemove={() => removeDocument("contratoTrabalhoAnteriorDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contratoTrabalhoIndeterminado" className="text-sm font-medium">Contrato de trabalho por prazo indeterminado</Label>
                          <Input id="contratoTrabalhoIndeterminado" value={formData.contratoTrabalhoIndeterminado} onChange={(e) => handleChange("contratoTrabalhoIndeterminado", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="contratoTrabalhoIndeterminadoDocInput" className="hidden" onChange={(e) => handleDocumentUpload(e, "contratoTrabalhoIndeterminadoDoc")} disabled={uploadingDocs.contratoTrabalhoIndeterminadoDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="contratoTrabalhoIndeterminadoDocInput" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.contratoTrabalhoIndeterminadoDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.contratoTrabalhoIndeterminadoDoc && (
                            <DocumentPreview fileUrl={formData.contratoTrabalhoIndeterminadoDoc} onRemove={() => removeDocument("contratoTrabalhoIndeterminadoDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="formularioProrrogacao" className="text-sm font-medium">Formulário de prorrogação</Label>
                          <Input id="formularioProrrogacao" value={formData.formularioProrrogacao} onChange={(e) => handleChange("formularioProrrogacao", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="formularioProrrogacaoDocInput_indeterminado" className="hidden" onChange={(e) => handleDocumentUpload(e, "formularioProrrogacaoDoc")} disabled={uploadingDocs.formularioProrrogacaoDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="formularioProrrogacaoDocInput_indeterminado" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.formularioProrrogacaoDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.formularioProrrogacaoDoc && (
                            <DocumentPreview fileUrl={formData.formularioProrrogacaoDoc} onRemove={() => removeDocument("formularioProrrogacaoDoc")} />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("segurancaIndeterminado")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">4</span>
                        <CardTitle className="text-lg font-semibold">Segurança</CardTitle>
                      </div>
                      {expandedSections.segurancaIndeterminado ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.segurancaIndeterminado && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="declaracaoAntecedentesCriminais" className="text-sm font-medium">Declaração de Antecedentes Criminais</Label>
                          <Input id="declaracaoAntecedentesCriminais" value={formData.declaracaoAntecedentesCriminais} onChange={(e) => handleChange("declaracaoAntecedentesCriminais", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="declaracaoAntecedentesCriminaisDocInput_indeterminado" className="hidden" onChange={(e) => handleDocumentUpload(e, "declaracaoAntecedentesCriminaisDoc")} disabled={uploadingDocs.declaracaoAntecedentesCriminaisDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="declaracaoAntecedentesCriminaisDocInput_indeterminado" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.declaracaoAntecedentesCriminaisDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.declaracaoAntecedentesCriminaisDoc && (
                            <DocumentPreview fileUrl={formData.declaracaoAntecedentesCriminaisDoc} onRemove={() => removeDocument("declaracaoAntecedentesCriminaisDoc")} />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("outrasInformacoesIndeterminado")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">5</span>
                        <CardTitle className="text-lg font-semibold">Outras Informações</CardTitle>
                      </div>
                      {expandedSections.outrasInformacoesIndeterminado ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.outrasInformacoesIndeterminado && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="procurador" className="text-sm font-medium">Procurador</Label>
                          <Input
                            id="procurador"
                            value={formData.procurador}
                            onChange={(e) => handleChange("procurador", e.target.value)}
                            placeholder="Nome do procurador responsável"
                            className="h-11 border-2 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="numeroProcesso" className="text-sm font-medium">Número do Processo</Label>
                          <Input
                            id="numeroProcesso"
                            value={formData.numeroProcesso}
                            onChange={(e) => handleChange("numeroProcesso", e.target.value)}
                            placeholder="0000000-00.0000.0.00.0000"
                            className="h-11 border-2 focus:border-primary"
                          />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            )}
            {formData.type === "Trabalho:Mudança de Empregador" && (
              <div className="space-y-8 mt-8">
                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("identificacaoMudanca")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">1</span>
                        <CardTitle className="text-lg font-semibold">Identificação</CardTitle>
                      </div>
                      {expandedSections.identificacaoMudanca ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.identificacaoMudanca && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="passaporte" className="text-sm font-medium">Passaporte</Label>
                          <Input id="passaporte" value={formData.passaporte} onChange={(e) => handleChange("passaporte", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="passaporteDocInput_mudanca" className="hidden" onChange={(e) => handleDocumentUpload(e, "passaporteDoc")} disabled={uploadingDocs.passaporteDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="passaporteDocInput_mudanca" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.passaporteDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.passaporteDoc && (
                            <DocumentPreview fileUrl={formData.passaporteDoc} onRemove={() => removeDocument("passaporteDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rnm" className="text-sm font-medium">RNM</Label>
                          <Input id="rnm" value={formData.rnm} onChange={(e) => handleChange("rnm", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="rnmDocInput_mudanca" className="hidden" onChange={(e) => handleDocumentUpload(e, "rnmDoc")} disabled={uploadingDocs.rnmDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="rnmDocInput_mudanca" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.rnmDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.rnmDoc && (
                            <DocumentPreview fileUrl={formData.rnmDoc} onRemove={() => removeDocument("rnmDoc")} />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("empresaMudanca")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">2</span>
                        <CardTitle className="text-lg font-semibold">Documentos da Empresa</CardTitle>
                      </div>
                      {expandedSections.empresaMudanca ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.empresaMudanca && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="contratoEmpresa" className="text-sm font-medium">Contrato Social</Label>
                          <Input id="contratoEmpresa" value={formData.contratoEmpresa} onChange={(e) => handleChange("contratoEmpresa", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="contratoEmpresaDocInput_mudanca" className="hidden" onChange={(e) => handleDocumentUpload(e, "contratoEmpresaDoc")} disabled={uploadingDocs.contratoEmpresaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="contratoEmpresaDocInput_mudanca" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.contratoEmpresaDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.contratoEmpresaDoc && (
                            <DocumentPreview fileUrl={formData.contratoEmpresaDoc} onRemove={() => removeDocument("contratoEmpresaDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cartaoCnpj" className="text-sm font-medium">CNPJ</Label>
                          <Input id="cartaoCnpj" value={formData.cartaoCnpj} onChange={(e) => handleChange("cartaoCnpj", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="cartaoCnpjDocInput_mudanca" className="hidden" onChange={(e) => handleDocumentUpload(e, "cartaoCnpjDoc")} disabled={uploadingDocs.cartaoCnpjDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="cartaoCnpjDocInput_mudanca" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.cartaoCnpjDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.cartaoCnpjDoc && (
                            <DocumentPreview fileUrl={formData.cartaoCnpjDoc} onRemove={() => removeDocument("cartaoCnpjDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="procuracaoEmpresa" className="text-sm font-medium">Procuração da empresa</Label>
                          <Input id="procuracaoEmpresa" value={formData.procuracaoEmpresa} onChange={(e) => handleChange("procuracaoEmpresa", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="procuracaoEmpresaDocInput_mudanca" className="hidden" onChange={(e) => handleDocumentUpload(e, "procuracaoEmpresaDoc")} disabled={uploadingDocs.procuracaoEmpresaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="procuracaoEmpresaDocInput_mudanca" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.procuracaoEmpresaDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.procuracaoEmpresaDoc && (
                            <DocumentPreview fileUrl={formData.procuracaoEmpresaDoc} onRemove={() => removeDocument("procuracaoEmpresaDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="formularioRn01" className="text-sm font-medium">Formulário RN 01</Label>
                          <Input id="formularioRn01" value={formData.formularioRn01 || ""} onChange={(e) => handleChange("formularioRn01", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="formularioRn01DocInput_mudanca" className="hidden" onChange={(e) => handleDocumentUpload(e, "formularioRn01Doc")} disabled={uploadingDocs.formularioRn01Doc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="formularioRn01DocInput_mudanca" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.formularioRn01Doc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.formularioRn01Doc && (
                            <DocumentPreview fileUrl={formData.formularioRn01Doc} onRemove={() => removeDocument("formularioRn01Doc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="guiaPaga" className="text-sm font-medium">Guia paga</Label>
                          <Input id="guiaPaga" value={formData.guiaPaga || ""} onChange={(e) => handleChange("guiaPaga", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="guiaPagaDocInput_mudanca" className="hidden" onChange={(e) => handleDocumentUpload(e, "guiaPagaDoc")} disabled={uploadingDocs.guiaPagaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="guiaPagaDocInput_mudanca" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.guiaPagaDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.guiaPagaDoc && (
                            <DocumentPreview fileUrl={formData.guiaPagaDoc} onRemove={() => removeDocument("guiaPagaDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="publicacaoDou" className="text-sm font-medium">Publicação no DOU</Label>
                          <Input id="publicacaoDou" value={formData.publicacaoDou || ""} onChange={(e) => handleChange("publicacaoDou", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="publicacaoDouDocInput_mudanca" className="hidden" onChange={(e) => handleDocumentUpload(e, "publicacaoDouDoc")} disabled={uploadingDocs.publicacaoDouDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="publicacaoDouDocInput_mudanca" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.publicacaoDouDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.publicacaoDouDoc && (
                            <DocumentPreview fileUrl={formData.publicacaoDouDoc} onRemove={() => removeDocument("publicacaoDouDoc")} />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("vinculoMudanca")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">3</span>
                        <CardTitle className="text-lg font-semibold">Vínculo de Trabalho</CardTitle>
                      </div>
                      {expandedSections.vinculoMudanca ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.vinculoMudanca && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="contratoTrabalho" className="text-sm font-medium">Contrato de trabalho</Label>
                          <Input id="contratoTrabalho" value={formData.contratoTrabalho} onChange={(e) => handleChange("contratoTrabalho", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="contratoTrabalhoDocInput_mudanca" className="hidden" onChange={(e) => handleDocumentUpload(e, "contratoTrabalhoDoc")} disabled={uploadingDocs.contratoTrabalhoDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="contratoTrabalhoDocInput_mudanca" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.contratoTrabalhoDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.contratoTrabalhoDoc && (
                            <DocumentPreview fileUrl={formData.contratoTrabalhoDoc} onRemove={() => removeDocument("contratoTrabalhoDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ctps" className="text-sm font-medium">CTPS (páginas com vínculo anterior e atual)</Label>
                          <Input id="ctps" value={formData.ctps} onChange={(e) => handleChange("ctps", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="ctpsDocInput_mudanca" className="hidden" onChange={(e) => handleDocumentUpload(e, "ctpsDoc")} disabled={uploadingDocs.ctpsDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="ctpsDocInput_mudanca" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.ctpsDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.ctpsDoc && (
                            <DocumentPreview fileUrl={formData.ctpsDoc} onRemove={() => removeDocument("ctpsDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="folhaPagamento" className="text-sm font-medium">Folha de pagamento (se houver)</Label>
                          <Input id="folhaPagamento" value={formData.folhaPagamento} onChange={(e) => handleChange("folhaPagamento", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="folhaPagamentoDocInput_mudanca" className="hidden" onChange={(e) => handleDocumentUpload(e, "folhaPagamentoDoc")} disabled={uploadingDocs.folhaPagamentoDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="folhaPagamentoDocInput_mudanca" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.folhaPagamentoDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.folhaPagamentoDoc && (
                            <DocumentPreview fileUrl={formData.folhaPagamentoDoc} onRemove={() => removeDocument("folhaPagamentoDoc")} />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("justificativaMudanca")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">4</span>
                        <CardTitle className="text-lg font-semibold">Justificativa</CardTitle>
                      </div>
                      {expandedSections.justificativaMudanca ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.justificativaMudanca && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="justificativaMudancaEmpregador" className="text-sm font-medium">Justificativa da mudança de empregador</Label>
                          <Input id="justificativaMudancaEmpregador" value={formData.justificativaMudancaEmpregador} onChange={(e) => handleChange("justificativaMudancaEmpregador", e.target.value)} placeholder="Descreva a justificativa ou anexe o documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="justificativaMudancaEmpregadorDocInput" className="hidden" onChange={(e) => handleDocumentUpload(e, "justificativaMudancaEmpregadorDoc")} disabled={uploadingDocs.justificativaMudancaEmpregadorDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="justificativaMudancaEmpregadorDocInput" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.justificativaMudancaEmpregadorDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.justificativaMudancaEmpregadorDoc && (
                            <DocumentPreview fileUrl={formData.justificativaMudancaEmpregadorDoc} onRemove={() => removeDocument("justificativaMudancaEmpregadorDoc")} />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("formacaoMudanca")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">5</span>
                        <CardTitle className="text-lg font-semibold">Formação</CardTitle>
                      </div>
                      {expandedSections.formacaoMudanca ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.formacaoMudanca && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="diploma" className="text-sm font-medium">Diploma</Label>
                          <Input id="diploma" value={formData.diploma} onChange={(e) => handleChange("diploma", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="diplomaDocInput_mudanca" className="hidden" onChange={(e) => handleDocumentUpload(e, "diplomaDoc")} disabled={uploadingDocs.diplomaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="diplomaDocInput_mudanca" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.diplomaDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.diplomaDoc && (
                            <DocumentPreview fileUrl={formData.diplomaDoc} onRemove={() => removeDocument("diplomaDoc")} />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("outrasInformacoesMudanca")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">6</span>
                        <CardTitle className="text-lg font-semibold">Outras Informações</CardTitle>
                      </div>
                      {expandedSections.outrasInformacoesMudanca ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.outrasInformacoesMudanca && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="procurador" className="text-sm font-medium">Procurador</Label>
                          <Input
                            id="procurador"
                            value={formData.procurador}
                            onChange={(e) => handleChange("procurador", e.target.value)}
                            placeholder="Nome do procurador responsável"
                            className="h-11 border-2 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="numeroProcesso" className="text-sm font-medium">Número do Processo</Label>
                          <Input
                            id="numeroProcesso"
                            value={formData.numeroProcesso}
                            onChange={(e) => handleChange("numeroProcesso", e.target.value)}
                            placeholder="0000000-00.0000.0.00.0000"
                            className="h-11 border-2 focus:border-primary"
                          />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            )}
            {formData.type === "Investidor" && (
              <div className="space-y-8 mt-8">
                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("identificacaoInvestidor")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">1</span>
                        <CardTitle className="text-lg font-semibold">Identificação</CardTitle>
                      </div>
                      {expandedSections.identificacaoInvestidor ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.identificacaoInvestidor && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="passaporte" className="text-sm font-medium">Passaporte</Label>
                          <Input id="passaporte" value={formData.passaporte} onChange={(e) => handleChange("passaporte", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="passaporteDocInput_investidor" className="hidden" onChange={(e) => handleDocumentUpload(e, "passaporteDoc")} disabled={uploadingDocs.passaporteDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="passaporteDocInput_investidor" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.passaporteDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.passaporteDoc && (
                            <DocumentPreview fileUrl={formData.passaporteDoc} onRemove={() => removeDocument("passaporteDoc")} />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("empresaInvestidor")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">2</span>
                        <CardTitle className="text-lg font-semibold">Documentos da Empresa / Investimento</CardTitle>
                      </div>
                      {expandedSections.empresaInvestidor ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.empresaInvestidor && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="contratoEmpresa" className="text-sm font-medium">Contrato Social</Label>
                          <Input id="contratoEmpresa" value={formData.contratoEmpresa} onChange={(e) => handleChange("contratoEmpresa", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="contratoEmpresaDocInput_investidor" className="hidden" onChange={(e) => handleDocumentUpload(e, "contratoEmpresaDoc")} disabled={uploadingDocs.contratoEmpresaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="contratoEmpresaDocInput_investidor" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.contratoEmpresaDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.contratoEmpresaDoc && (
                            <DocumentPreview fileUrl={formData.contratoEmpresaDoc} onRemove={() => removeDocument("contratoEmpresaDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cartaoCnpj" className="text-sm font-medium">CNPJ</Label>
                          <Input id="cartaoCnpj" value={formData.cartaoCnpj} onChange={(e) => handleChange("cartaoCnpj", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="cartaoCnpjDocInput_investidor" className="hidden" onChange={(e) => handleDocumentUpload(e, "cartaoCnpjDoc")} disabled={uploadingDocs.cartaoCnpjDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="cartaoCnpjDocInput_investidor" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.cartaoCnpjDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.cartaoCnpjDoc && (
                            <DocumentPreview fileUrl={formData.cartaoCnpjDoc} onRemove={() => removeDocument("cartaoCnpjDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="comprovanteInvestimento" className="text-sm font-medium">Comprovante do investimento</Label>
                          <Input id="comprovanteInvestimento" value={formData.comprovanteInvestimento} onChange={(e) => handleChange("comprovanteInvestimento", e.target.value)} placeholder="Extrato, contrato, transferência etc." className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="comprovanteInvestimentoDocInput" className="hidden" onChange={(e) => handleDocumentUpload(e, "comprovanteInvestimentoDoc")} disabled={uploadingDocs.comprovanteInvestimentoDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="comprovanteInvestimentoDocInput" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.comprovanteInvestimentoDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.comprovanteInvestimentoDoc && (
                            <DocumentPreview fileUrl={formData.comprovanteInvestimentoDoc} onRemove={() => removeDocument("comprovanteInvestimentoDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="planoInvestimentos" className="text-sm font-medium">Plano de Investimentos</Label>
                          <Input id="planoInvestimentos" value={formData.planoInvestimentos} onChange={(e) => handleChange("planoInvestimentos", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="planoInvestimentosDocInput" className="hidden" onChange={(e) => handleDocumentUpload(e, "planoInvestimentosDoc")} disabled={uploadingDocs.planoInvestimentosDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="planoInvestimentosDocInput" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.planoInvestimentosDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.planoInvestimentosDoc && (
                            <DocumentPreview fileUrl={formData.planoInvestimentosDoc} onRemove={() => removeDocument("planoInvestimentosDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="formularioRequerimento" className="text-sm font-medium">Formulário de Requerimento</Label>
                          <Input id="formularioRequerimento" value={formData.formularioRequerimento} onChange={(e) => handleChange("formularioRequerimento", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="formularioRequerimentoDocInput" className="hidden" onChange={(e) => handleDocumentUpload(e, "formularioRequerimentoDoc")} disabled={uploadingDocs.formularioRequerimentoDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="formularioRequerimentoDocInput" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.formularioRequerimentoDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.formularioRequerimentoDoc && (
                            <DocumentPreview fileUrl={formData.formularioRequerimentoDoc} onRemove={() => removeDocument("formularioRequerimentoDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="procuracaoEmpresa" className="text-sm font-medium">Procuração</Label>
                          <Input id="procuracaoEmpresa" value={formData.procuracaoEmpresa} onChange={(e) => handleChange("procuracaoEmpresa", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="procuracaoEmpresaDocInput_investidor" className="hidden" onChange={(e) => handleDocumentUpload(e, "procuracaoEmpresaDoc")} disabled={uploadingDocs.procuracaoEmpresaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="procuracaoEmpresaDocInput_investidor" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.procuracaoEmpresaDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.procuracaoEmpresaDoc && (
                            <DocumentPreview fileUrl={formData.procuracaoEmpresaDoc} onRemove={() => removeDocument("procuracaoEmpresaDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="guiaPaga" className="text-sm font-medium">Guia paga</Label>
                          <Input id="guiaPaga" value={formData.guiaPaga} onChange={(e) => handleChange("guiaPaga", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="guiaPagaDocInput_investidor" className="hidden" onChange={(e) => handleDocumentUpload(e, "guiaPagaDoc")} disabled={uploadingDocs.guiaPagaDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="guiaPagaDocInput_investidor" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.guiaPagaDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.guiaPagaDoc && (
                            <DocumentPreview fileUrl={formData.guiaPagaDoc} onRemove={() => removeDocument("guiaPagaDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="protocolado" className="text-sm font-medium">Protocolado</Label>
                          <Input id="protocolado" value={formData.protocolado} onChange={(e) => handleChange("protocolado", e.target.value)} placeholder="Recibo/Protocolo do pedido" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="protocoladoDocInput" className="hidden" onChange={(e) => handleDocumentUpload(e, "protocoladoDoc")} disabled={uploadingDocs.protocoladoDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="protocoladoDocInput" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.protocoladoDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.protocoladoDoc && (
                            <DocumentPreview fileUrl={formData.protocoladoDoc} onRemove={() => removeDocument("protocoladoDoc")} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="publicacaoDou" className="text-sm font-medium">Publicação no DOU</Label>
                          <Input id="publicacaoDou" value={formData.publicacaoDou} onChange={(e) => handleChange("publicacaoDou", e.target.value)} placeholder="Status ou informações do documento" className="h-11 border-2 focus:border-primary" />
                          <div className="flex items-center gap-2">
                            {true ? (
                              <>
                                <input type="file" id="publicacaoDouDocInput_investidor" className="hidden" onChange={(e) => handleDocumentUpload(e, "publicacaoDouDoc")} disabled={uploadingDocs.publicacaoDouDoc} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <Label htmlFor="publicacaoDouDocInput_investidor" className="inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium border bg-white shadow-sm hover:bg-slate-100">
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs.publicacaoDouDoc ? "Enviando..." : "Upload Documento"}
                                </Label>
                              </>
                            ) : null}
                          </div>
                          {formData.publicacaoDouDoc && (
                            <DocumentPreview fileUrl={formData.publicacaoDouDoc} onRemove={() => removeDocument("publicacaoDouDoc")} />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
                <Card className="border-2 border-border shadow-md overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gradient-to-r from-muted to-muted hover:from-primary hover:to-primary transition-all duration-300 border-b-2 border-border py-4"
                    onClick={() => toggleSection("outrasInformacoesInvestidor")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">3</span>
                        <CardTitle className="text-lg font-semibold">Outras Informações</CardTitle>
                      </div>
                      {expandedSections.outrasInformacoesInvestidor ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.outrasInformacoesInvestidor && (
                    <CardContent className="pt-6 pb-6 bg-card">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="procurador" className="text-sm font-medium">Procurador</Label>
                          <Input
                            id="procurador"
                            value={formData.procurador}
                            onChange={(e) => handleChange("procurador", e.target.value)}
                            placeholder="Nome do procurador responsável"
                            className="h-11 border-2 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="numeroProcesso" className="text-sm font-medium">Número do Processo</Label>
                          <Input
                            id="numeroProcesso"
                            value={formData.numeroProcesso}
                            onChange={(e) => handleChange("numeroProcesso", e.target.value)}
                            placeholder="0000000-00.0000.0.00.0000"
                            className="h-11 border-2 focus:border-primary"
                          />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Visto"}
              </Button>
              <Link href="/dashboard/vistos" className="flex-1">
                <Button type="button" variant="outline" className="w-full" disabled={loading}>
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
