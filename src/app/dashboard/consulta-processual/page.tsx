"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { 
  Search, 
  Loader2, 
  Scale, 
  Clock, 
  FileText, 
  AlertCircle,
  Building2,
  Calendar,
  Briefcase,
  ChevronLeft,
  Gavel,
  BookOpen,
  Newspaper,
  CreditCard,
  Building,
  ExternalLink,
  ChevronRight,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function ConsultaProcessualPage() {
  const [npu, setNpu] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"processos" | "jurisprudencia" | "diarios" | "legislacao" | "empresas">("processos");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultsList, setResultsList] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const initialNpu = params.get("npu");
      if (initialNpu) {
        const cleanNpu = initialNpu.replace(/\D/g, "");
        
        // Format as NNNNNNN-DD.AAAA.J.TR.OOOO
        let formatted = cleanNpu;
        if (cleanNpu.length > 7) formatted = cleanNpu.substring(0, 7) + "-" + cleanNpu.substring(7);
        if (cleanNpu.length > 9) formatted = formatted.substring(0, 10) + "." + formatted.substring(10);
        if (cleanNpu.length > 13) formatted = formatted.substring(0, 15) + "." + formatted.substring(15);
        if (cleanNpu.length > 14) formatted = formatted.substring(0, 17) + "." + formatted.substring(17);
        if (cleanNpu.length > 16) formatted = formatted.substring(0, 20) + "." + formatted.substring(20);
        setNpu(formatted);

        if (cleanNpu.length === 20) {
          const runSearch = async () => {
            setLoading(true);
            setError(null);
            setResult(null);

            try {
              const response = await fetch("/api/datajud", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ numeroProcesso: cleanNpu }),
              });

              const data = await response.json();

              if (response.ok && data.success) {
                setResult(data.processo);
              } else {
                setError(data.message || data.error || "Processo não encontrado. Pode estar em segredo de justiça.");
              }
            } catch (err) {
              setError("Erro de conexão ao consultar a API do Datajud.");
            } finally {
              setLoading(false);
            }
          };
          runSearch();
        }
      }
    }
  }, []);

  // Format NPU while typing
  const handleNpuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 20) value = value.substring(0, 20);
    
    // Format as NNNNNNN-DD.AAAA.J.TR.OOOO
    let formatted = value;
    if (value.length > 7) formatted = value.substring(0, 7) + "-" + value.substring(7);
    if (value.length > 9) formatted = formatted.substring(0, 10) + "." + formatted.substring(10);
    if (value.length > 13) formatted = formatted.substring(0, 15) + "." + formatted.substring(15);
    if (value.length > 14) formatted = formatted.substring(0, 17) + "." + formatted.substring(17);
    if (value.length > 16) formatted = formatted.substring(0, 20) + "." + formatted.substring(20);

    setNpu(formatted);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setLoading(true);
    setError(null);
    setResult(null);
    setResultsList([]);

    try {
      if (searchMode === "processos") {
        const cleanNpu = npu.replace(/\D/g, "");
        if (cleanNpu.length !== 20) {
          toast.error("O número do processo deve conter 20 dígitos.");
          setLoading(false);
          return;
        }

        const response = await fetch("/api/datajud", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ numeroProcesso: cleanNpu }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setResult(data.processo);
        } else {
          setError(data.message || data.error || "Processo não encontrado.");
        }
      } else if (searchMode === "empresas") {
        const cleanCnpj = searchQuery.replace(/\D/g, "");
        if (cleanCnpj.length !== 14) {
          toast.error("O CNPJ deve conter 14 dígitos.");
          setLoading(false);
          return;
        }
        const response = await fetch(`/api/search/receita?cnpj=${cleanCnpj}`);
        const data = await response.json();
        if (data.success) {
          setResult(data.data);
        } else {
          setError(data.error || "Empresa não encontrada.");
        }
      } else {
        // LexML, Jurisprudencia, Diarios
        const endpoint = searchMode === "jurisprudencia" ? "/api/search/jurisprudencia" : "/api/search/lexml";
        const response = await fetch(`${endpoint}?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        if (data.success) {
          setResultsList(data.results);
          if (data.results.length === 0) setError("Nenhum resultado encontrado para este termo.");
        } else {
          setError(data.error || "Erro ao realizar busca.");
        }
      }
    } catch (err) {
      setError("Erro de conexão com os servidores de busca.");
    } finally {
      setLoading(false);
    }
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 14) value = value.substring(0, 14);
    
    let formatted = value;
    if (value.length > 2) formatted = value.substring(0, 2) + "." + value.substring(2);
    if (value.length > 5) formatted = formatted.substring(0, 6) + "." + formatted.substring(6);
    if (value.length > 8) formatted = formatted.substring(0, 10) + "/" + formatted.substring(10);
    if (value.length > 12) formatted = formatted.substring(0, 15) + "-" + formatted.substring(15);
    
    setSearchQuery(formatted);
  };

  const searchTabs = [
    { id: "processos", label: "Processos", icon: Scale, placeholder: "0000000-00.0000.0.00.0000", description: "Busca CNJ/Datajud" },
    { id: "jurisprudencia", label: "Jurisprudência", icon: Gavel, placeholder: "Ex: Dano moral atraso voo", description: "STF, STJ e TST" },
    { id: "diarios", label: "Diários Oficiais", icon: Newspaper, placeholder: "Ex: Nome ou termo jurídico", description: "LexML / DOU" },
    { id: "legislacao", label: "Legislação", icon: BookOpen, placeholder: "Ex: Lei 14.133", description: "Leis e Decretos" },
    { id: "empresas", label: "Empresas", icon: Building, placeholder: "00.000.000/0000-00", description: "ReceitaWS / CNPJ" },
  ];

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Data não informada";
    try {
      return format(parseISO(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-sky-200">
      
      {/* Navbar / Header */}
      <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-[#FDFDFD]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-2 text-sm font-medium">
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Link>
          <div className="w-px h-4 bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-sky-700" />
            <h1 className="text-lg font-semibold tracking-tight text-slate-800">Consulta Pública Integrada</h1>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center min-h-[calc(100vh-80px)]">
        
        {/* Universal Search Header */}
        <div className={`w-full max-w-5xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${result || resultsList.length > 0 || loading || error ? 'mb-12' : 'mt-[5vh]'}`}>
          
          <div className="text-center mb-10">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4"
            >
              Busca Jurídica <span className="text-sky-600 underline decoration-sky-200 underline-offset-8">Universal</span>
            </motion.h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
              Acesse múltiplas fontes do judiciário, diários oficiais e dados empresariais em uma única interface inteligente.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-8 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50 w-fit mx-auto backdrop-blur-sm">
            {searchTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSearchMode(tab.id as any);
                  setResult(null);
                  setResultsList([]);
                  setError(null);
                  if (tab.id !== "processos") setSearchQuery("");
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  searchMode === tab.id 
                    ? "bg-white text-sky-700 shadow-md shadow-sky-900/5 ring-1 ring-slate-200" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                }`}
              >
                <tab.icon className={`w-4 h-4 ${searchMode === tab.id ? "text-sky-600" : "text-slate-400"}`} />
                {tab.label}
              </button>
            ))}
          </div>

          <form 
            onSubmit={handleSearch} 
            className="flex items-center w-full shadow-2xl shadow-sky-900/5 rounded-3xl bg-white border border-slate-200/60 focus-within:ring-8 focus-within:ring-sky-500/5 focus-within:border-sky-400 transition-all duration-500 p-2.5"
          >
            <div className="pl-5 text-slate-400 shrink-0">
              <Search className="w-6 h-6" />
            </div>
            <input
              type="text"
              placeholder={searchTabs.find(t => t.id === searchMode)?.placeholder}
              value={searchMode === "processos" ? npu : searchQuery}
              onChange={searchMode === "processos" ? handleNpuChange : (searchMode === "empresas" ? handleCnpjChange : (e) => setSearchQuery(e.target.value))}
              disabled={loading}
              className="flex-1 bg-transparent text-xl sm:text-2xl tracking-tight py-4 px-5 outline-none text-slate-800 placeholder:text-slate-300 font-bold min-w-0"
            />
            <Button 
              type="submit" 
              disabled={loading || (
                searchMode === "processos" 
                  ? npu.replace(/\D/g, "").length !== 20 
                  : searchMode === "empresas" 
                    ? searchQuery.replace(/\D/g, "").length !== 14 
                    : searchQuery.trim().length < 3
              )}
              className="bg-slate-900 hover:bg-sky-700 disabled:bg-slate-100 disabled:text-slate-400 text-white h-full px-10 py-7 rounded-2xl font-black tracking-wide transition-all duration-300 flex items-center justify-center shrink-0 shadow-xl shadow-slate-900/10"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Buscar"}
            </Button>
          </form>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-6 bg-red-50/50 border border-red-100 rounded-3xl flex items-start gap-4"
            >
              <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-red-900 font-bold text-lg leading-none mb-1">Busca Indisponível</h3>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="w-full max-w-5xl flex gap-8 animate-pulse mt-8">
            <div className="w-1/3 space-y-4">
              <div className="h-40 bg-slate-100 rounded-2xl"></div>
              <div className="h-60 bg-slate-100 rounded-2xl"></div>
            </div>
            <div className="w-2/3 space-y-6">
              <div className="h-10 bg-slate-100 rounded-lg w-1/2"></div>
              <div className="h-24 bg-slate-100 rounded-2xl"></div>
              <div className="h-24 bg-slate-100 rounded-2xl"></div>
              <div className="h-24 bg-slate-100 rounded-2xl"></div>
            </div>
          </div>
        )}

        {/* Results View - Adaptation based on searchMode */}
        <AnimatePresence mode="wait">
          {result && searchMode === "processos" && (
            <motion.div 
              key="processo-view"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16"
            >
              {/* Sidebar Summary */}
              <div className="md:col-span-4 space-y-8">
                <div className="pb-8 border-b border-slate-100">
                  <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">Processo Nº</p>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
                    {npu}
                  </h2>
                  <div className="mt-4 flex items-center gap-2">
                    <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-100 font-bold">
                      {result.formato?.nome || "Eletrônico"}
                    </Badge>
                    <Badge variant="secondary" className="font-bold">
                      {result.sistema?.nome || "PJe"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-6">
                  {[
                    { icon: Briefcase, label: "Classe", value: result.classe?.nome },
                    { icon: Building2, label: "Órgão Julgador", value: result.orgaoJulgador?.nome },
                    { icon: Calendar, label: "Autuação", value: formatDate(result.dataAjuizamento) },
                    { icon: Scale, label: "Tribunal", value: result.tribunal },
                    { icon: FileText, label: "Grau", value: result.grau === "G1" ? "1ª Instância" : "2ª Instância" },
                    { icon: Clock, label: "Atualização", value: formatDate(result.dataHoraUltimaAtualizacao) },
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <item.icon className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                        <p className="text-sm font-bold text-slate-800 mt-0.5 leading-snug">{item.value || "Não informado"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Timeline */}
              <div className="md:col-span-8">
                 <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3">
                    <div className="p-2 bg-sky-100 rounded-lg"><Clock className="w-5 h-5 text-sky-600" /></div>
                    Linha do Tempo
                 </h3>

                 {(!result.movimentos || result.movimentos.length === 0) ? (
                    <div className="p-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <p className="text-slate-500 font-medium italic">O processo não possui movimentações registradas publicamente.</p>
                    </div>
                 ) : (
                    <div className="relative border-l-2 border-slate-100 ml-4 pb-12">
                      {result.movimentos
                        .sort((a: any, b: any) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
                        .map((mov: any, idx: number) => (
                          <div key={idx} className="mb-10 relative pl-8 group">
                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm ${idx === 0 ? 'bg-sky-500 scale-125' : 'bg-slate-300 group-hover:bg-slate-400 transition-colors'}`}></div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-[10px] font-black tracking-widest uppercase ${idx === 0 ? 'text-sky-600' : 'text-slate-400'}`}>
                                {formatDate(mov.dataHora)}
                              </span>
                              {idx === 0 && <Badge className="bg-sky-500 text-white border-0 text-[9px] font-black tracking-tighter">RECENTE</Badge>}
                            </div>
                            <div className={`p-5 rounded-3xl border transition-all duration-300 ${idx === 0 ? 'border-sky-200 bg-white shadow-xl shadow-sky-900/5' : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'}`}>
                              <p className={`font-bold ${idx === 0 ? 'text-lg text-slate-900' : 'text-base text-slate-800'}`}>
                                {mov.nome}
                              </p>
                              {mov.complementosTabelados && mov.complementosTabelados.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
                                  {mov.complementosTabelados.map((comp: any, cidx: number) => (
                                    <div key={cidx} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[100px]">{comp.nome}:</span> 
                                      <span className="text-sm font-semibold text-slate-700">{comp.valor}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                      ))}
                    </div>
                 )}
              </div>
            </motion.div>
          )}

          {result && searchMode === "empresas" && (
            <motion.div 
              key="empresa-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-5xl"
            >
              <Card className="rounded-[40px] border-slate-200/60 shadow-2xl overflow-hidden bg-white">
                <CardContent className="p-0">
                  <div className="bg-slate-900 p-10 md:p-16 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                      <Building className="w-64 h-64" />
                    </div>
                    <Badge className="bg-sky-500 text-white mb-6 border-0 font-bold tracking-widest px-4 py-1">CONSULTA RECEITAWS</Badge>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none mb-4">{result.nome}</h2>
                    <div className="flex flex-wrap gap-4 text-slate-300 font-bold text-lg">
                      <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                        <CreditCard className="w-5 h-5" /> {result.cnpj}
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                        <Calendar className="w-5 h-5" /> Abertura: {result.abertura}
                      </div>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md ${result.situacao === "ATIVA" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                        <Info className="w-5 h-5" /> {result.situacao}
                      </div>
                    </div>
                  </div>

                  <div className="p-10 md:p-16 grid grid-cols-1 md:grid-cols-2 gap-16">
                    <div className="space-y-10">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Informações Gerais</h4>
                        <div className="space-y-6">
                           <div className="flex gap-4">
                             <div className="p-3 bg-slate-50 rounded-2xl"><Briefcase className="w-6 h-6 text-slate-400" /></div>
                             <div>
                               <p className="text-sm font-black text-slate-900 tracking-tight leading-tight mb-1">Atividade Principal</p>
                               <p className="text-sm text-slate-600 font-medium leading-relaxed">{result.atividade_principal}</p>
                             </div>
                           </div>
                           <div className="flex gap-4">
                             <div className="p-3 bg-slate-50 rounded-2xl"><Building2 className="w-6 h-6 text-slate-400" /></div>
                             <div>
                               <p className="text-sm font-black text-slate-900 tracking-tight leading-tight mb-1">Natureza Jurídica</p>
                               <p className="text-sm text-slate-600 font-medium leading-relaxed">{result.natureza_juridica}</p>
                             </div>
                           </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Quadro Societário (QSA)</h4>
                        <div className="grid grid-cols-1 gap-3">
                           {result.qsa?.map((socio: any, i: number) => (
                             <div key={i} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                                <span className="font-bold text-slate-800">{socio.nome}</span>
                                <Badge variant="outline" className="bg-white text-[10px] font-bold">{socio.qual}</Badge>
                             </div>
                           ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-10">
                       <div>
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Localização & Contato</h4>
                         <div className="p-8 bg-sky-50 rounded-[32px] border border-sky-100/50">
                            <div className="flex gap-4 mb-6">
                               <div className="p-3 bg-white rounded-2xl shadow-sm"><Building className="w-6 h-6 text-sky-600" /></div>
                               <div>
                                 <p className="text-sm font-black text-slate-900 tracking-tight mb-1">Endereço</p>
                                 <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                   {result.logradouro}, {result.numero} {result.complemento && `(${result.complemento})`}<br />
                                   {result.bairro} — {result.municipio}/{result.uf}<br />
                                   CEP: {result.cep}
                                 </p>
                               </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-sky-200/30">
                               <div>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-sky-800/40 mb-1">Email</p>
                                 <p className="text-sm font-bold text-sky-900 truncate">{result.email || "Não informado"}</p>
                               </div>
                               <div>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-sky-800/40 mb-1">Telefone</p>
                                 <p className="text-sm font-bold text-sky-900">{result.telefone || "Não informado"}</p>
                               </div>
                            </div>
                         </div>
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {resultsList.length > 0 && (
            <motion.div 
              key="list-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-5xl space-y-8"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-sky-100 rounded-lg">
                    {searchMode === "jurisprudencia" ? <Gavel className="w-5 h-5 text-sky-600" /> : <Newspaper className="w-5 h-5 text-sky-600" />}
                  </div>
                  Resultados Encontrados
                </h3>
                <Badge variant="secondary" className="px-4 py-1.5 font-bold">{resultsList.length} documentos</Badge>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {resultsList.map((doc: any, i: number) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group bg-white border border-slate-200/60 p-6 rounded-3xl hover:border-sky-300 hover:shadow-xl hover:shadow-sky-900/5 transition-all duration-300"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                           <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-0 font-bold uppercase tracking-widest text-[9px]">{doc.source || doc.tribunal || "LexML"}</Badge>
                           <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest">{doc.type || doc.classificacao || "Documento"}</Badge>
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-auto md:ml-2">
                             {doc.date ? doc.date.split('-').reverse().join('/') : "Data não disponível"}
                           </span>
                        </div>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-sky-700 transition-colors">
                          {doc.title}
                        </h4>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-3">
                          {doc.description || doc.ementa || "Sem descrição disponível para este documento."}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                         <Button 
                          asChild 
                          variant="outline" 
                          className="rounded-xl border-slate-200 font-bold hover:bg-slate-50 gap-2 h-12 px-6"
                         >
                           <a href={doc.url} target="_blank" rel="noopener noreferrer">
                             <ExternalLink className="w-4 h-4" /> Ver Íntegra
                           </a>
                         </Button>
                         <Button className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-sky-100 p-0 shadow-none border-0 text-slate-400 hover:text-sky-600 transition-all">
                            <ChevronRight className="w-5 h-5" />
                         </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="pt-10 flex justify-center">
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                   <Info className="w-4 h-4" /> Busca finalizada via portal LexML
                 </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
