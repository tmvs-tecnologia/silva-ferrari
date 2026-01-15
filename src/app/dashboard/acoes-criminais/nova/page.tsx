"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Upload, FileText, X, Info, Moon, Sun } from "lucide-react";
import { toast } from "sonner";

export default function NovaAcaoCriminalPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    clientName: "",
    reuName: "",
    numeroProcesso: "",
    resumo: "",
    acompanhamento: "",
    responsavelName: "",
    responsavelDate: "",
    contratado: "Não",
    finalizado: false,
    fotoNotificacaoDoc: "",
  });
  const [uploadingDocs, setUploadingDocs] = useState<Record<string, boolean>>({});
  const [extraUploads, setExtraUploads] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  const handleChange = (key: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach((el) => { try { el.setAttribute('multiple', ''); } catch {} });
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
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    setUploadingDocs((prev) => ({ ...prev, [field]: true }));
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        if (!validateFile(file)) continue;

        const fd = new FormData();
        fd.append("file", file);
        const resp = await fetch("/api/documents/upload", { method: "POST", body: fd });
        if (resp.ok) {
          const data = await resp.json();
          uploadedUrls.push(data.fileUrl);
        } else {
          const err = await resp.json();
          toast.error(err.error || "Erro ao enviar documento");
        }
      }
      if (uploadedUrls.length) {
        const currentPrimary = (formData as any)[field] as string | undefined;
        if (!currentPrimary) {
          handleChange(field as any, uploadedUrls[0]);
          const rest = uploadedUrls.slice(1);
          if (rest.length) setExtraUploads((prev) => ({ ...prev, [field]: [...(prev[field] || []), ...rest] }));
        } else {
          setExtraUploads((prev) => ({ ...prev, [field]: [...(prev[field] || []), ...uploadedUrls] }));
        }
      }
    } catch {
      toast.error("Erro ao enviar documento");
    }
    finally { 
      setUploadingDocs((prev) => ({ ...prev, [field]: false }));
      // Limpar o input
      e.target.value = "";
    }
  };

  const handleRemoveFile = (docField: string, fileUrl: string) => {
    if ((formData as any)[docField] === fileUrl) handleChange(docField as any, "");
    if (extraUploads[docField]) setExtraUploads(prev => ({ ...prev, [docField]: prev[docField].filter(url => url !== fileUrl) }));
  };

  const convertTemporaryUploads = async (caseId: number) => {
    const documentFields = ["fotoNotificacaoDoc"];
    const documentsToConvert: { fieldName: string; fileUrl: string }[] = [];
    for (const field of documentFields) {
      const urls = new Set<string>();
      const single = (formData as any)[field] as string | undefined;
      if (single) urls.add(single);
      const extras = extraUploads[field] || [];
      for (const u of extras) urls.add(u);
      for (const u of urls) documentsToConvert.push({ fieldName: field, fileUrl: u });
    }
    if (documentsToConvert.length > 0) {
      try {
        await fetch("/api/documents/convert-temporary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caseId, moduleType: "acoes_criminais", clientName: formData.clientName, documents: documentsToConvert }),
        });
      } catch {}
    }
  };

  const handleSubmit = async () => {
    if (!formData.clientName.trim()) {
      toast.error("O nome do cliente é obrigatório");
      return;
    }
    
    setSaving(true);
    const notesBlock = `\n[Dados Iniciais]\n- Réu: ${formData.reuName}\n- Número do processo: ${formData.numeroProcesso}\n- Responsável: ${formData.responsavelName}\n- Data: ${formData.responsavelDate}\n- Contratado: ${formData.contratado}\n- Resumo: ${formData.resumo}\n- Acompanhamento: ${formData.acompanhamento}\n`;
    const status = formData.finalizado ? "Finalizado" : "Em andamento";

    try {
      const res = await fetch("/api/acoes-criminais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: formData.clientName,
          status,
          notes: notesBlock,
          reuName: formData.reuName,
          autorName: formData.clientName,
          numeroProcesso: formData.numeroProcesso,
          responsavelName: formData.responsavelName,
          responsavelDate: formData.responsavelDate,
          resumo: formData.resumo,
          acompanhamento: formData.acompanhamento,
          contratado: formData.contratado,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        await convertTemporaryUploads(created.id);
        toast.success("Ação criminal criada com sucesso!");
        setTimeout(() => {
          router.push("/dashboard/acoes-criminais");
        }, 1500);
        return;
      } else {
        const errorData = await res.json();
        console.error("Erro na criação:", errorData);
        toast.error(errorData.error || "Erro ao criar ação criminal");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      if (error instanceof Error && error.name === 'AbortError') {
         toast.error("A conexão foi interrompida. Verifique sua internet.");
      } else {
         toast.error("Erro ao conectar com o servidor");
      }
    } finally {
      setSaving(false);
    }
  };

  const DocumentRow = ({ label, field, docField, placeholder = "Status ou informações do documento", readOnly = false }: { label: string; field?: string; docField: string; placeholder?: string; readOnly?: boolean }) => {
    const attachedFiles: string[] = [];
    const mainFile = (formData as any)[docField] as string | undefined;
    if (mainFile) attachedFiles.push(mainFile);
    if (extraUploads[docField] && extraUploads[docField].length > 0) attachedFiles.push(...extraUploads[docField]);
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
            <Input value={field ? (formData[field as keyof typeof formData] as string) : ""} onChange={(e) => field && handleChange(field as any, e.target.value)} className="flex-1 rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5" placeholder={placeholder} />
          )}
          <div className="relative">
            <input type="file" id={`upload-${docField}`} className="hidden" onChange={(e) => handleDocumentUpload(e, docField)} />
            <Button type="button" className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-medium text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shadow-sm" onClick={() => document.getElementById(`upload-${docField}`)?.click()} disabled={uploadingDocs[docField]}>
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
                  <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center p-2 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:border-sky-200 dark:hover:border-sky-800 transition-all" title={decodedName}>
                    <FileText className="h-5 w-5 text-slate-500 group-hover:text-sky-600 dark:text-slate-400 dark:group-hover:text-sky-400" />
                  </a>
                  {!readOnly && (
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveFile(docField, url); }} className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600" title="Remover arquivo">
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
            <Link href="/dashboard/acoes-criminais">
              <button className="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Nova Ação Criminal</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Cadastre e gerencie ações criminais</p>
            </div>
          </div>
          <button className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" onClick={() => document.documentElement.classList.toggle('dark')}>
            <Moon className="h-5 w-5 hidden dark:block" />
            <Sun className="h-5 w-5 dark:hidden" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 flex-grow w-full">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Info className="h-5 w-5 text-sky-500" />
                Informações da Ação
              </h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-4">
                <Label className="block text-sm font-medium mb-2">Nome do Autor da Ação</Label>
                <Input value={formData.clientName} onChange={(e) => handleChange("clientName", e.target.value)} className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5" placeholder="Digite o nome completo" />
              </div>
              <div className="md:col-span-4">
                <Label className="block text-sm font-medium mb-2">Nome do Réu</Label>
                <Input value={formData.reuName} onChange={(e) => handleChange("reuName", e.target.value)} className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5" />
              </div>
              <div className="md:col-span-4">
                <Label className="block text-sm font-medium mb-2">Número do Processo</Label>
                <Input value={formData.numeroProcesso} onChange={(e) => handleChange("numeroProcesso", e.target.value)} className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5" placeholder="0000000-00.0000.0.00.0000" />
              </div>
              <div className="md:col-span-6">
                <Label className="block text-sm font-medium mb-2">Responsável</Label>
                <Input value={formData.responsavelName} onChange={(e) => handleChange("responsavelName", e.target.value)} className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5" />
              </div>
              <div className="md:col-span-6">
                <Label className="block text-sm font-medium mb-2">Data</Label>
                <Input type="date" value={formData.responsavelDate} onChange={(e) => handleChange("responsavelDate", e.target.value)} className="w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm py-2.5" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Documentos da Ação</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <DocumentRow label="Documento (Foto da notificação)" docField="fotoNotificacaoDoc" readOnly />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Conteúdo</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="block text-sm font-medium">Resumo</Label>
                <Textarea value={formData.resumo} onChange={(e) => handleChange("resumo", e.target.value)} className="min-h-[120px] rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200" />
              </div>
              <div className="space-y-2">
                <Label className="block text-sm font-medium">Acompanhamento (cobrar o retorno)</Label>
                <Textarea value={formData.acompanhamento} onChange={(e) => handleChange("acompanhamento", e.target.value)} className="min-h-[120px] rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Status</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="block text-sm font-medium">Contratado</Label>
                <Select value={formData.contratado} onValueChange={(v) => handleChange("contratado", v)}>
                  <SelectTrigger className="w-fit rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 py-2.5 h-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="block text-sm font-medium">Processo finalizado</Label>
                <div className="flex items-center gap-3">
                  <Button type="button" variant={formData.finalizado ? "default" : "outline"} onClick={() => handleChange("finalizado", true)}>Sim</Button>
                  <Button type="button" variant={!formData.finalizado ? "default" : "outline"} onClick={() => handleChange("finalizado", false)}>Não</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 mt-8">
            <Button type="button" variant="outline" className="px-6 py-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors h-auto" onClick={() => router.push("/dashboard/acoes-criminais")}>Cancelar</Button>
            <Button type="submit" className="px-8 py-3 rounded-md bg-slate-800 text-white font-semibold hover:bg-slate-900 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 h-auto" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Criar Ação"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
