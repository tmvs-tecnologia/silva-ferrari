"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function NovaProcuracaoPage() {
  const [form, setForm] = useState({
    empresaNome: "",
    empresaCnpj: "",
    empresaEndereco: "",
    empresaBairro: "",
    empresaCidadeEstado: "",
    empresaCep: "",
    representanteNome: "",
    representanteNacionalidade: "",
    representanteEstadoCivil: "",
    representanteCidadeNatal: "",
    representanteDataNascimento: "",
    representanteDocumentoTipo: "",
    representanteDocumentoNumero: "",
    representanteOrgaoEmissor: "",
    representanteProfissao: "",
    representanteCpf: "",
    representanteEnderecoResidencia: "",
    representanteBairroResidencia: "",
    representanteCidadeEstadoResidencia: "",
    representanteCepResidencia: "",
    adv1Nome: "",
    adv1Oab: "",
    adv1Cpf: "",
    adv2Nome: "",
    adv2Oab: "",
    adv2Cpf: "",
    escritorioEndereco: "",
    escritorioCep: "",
    finalidadeParteContraria: "",
    finalidadeNumeroProcesso: "",
    fechamentoCidadeEstado: "",
    fechamentoDia: "",
    fechamentoMes: "",
    fechamentoAno: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const normalizeDateToDDMMYYYY = (s: string) => {
        if (!s) return "";
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
          const [y, m, d] = s.split("-");
          return `${d}/${m}/${y}`;
        }
        return s;
      };
      const dataHojePorExtenso = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
      const payload = {
        ...form,
        representanteDataNascimento: normalizeDateToDDMMYYYY(form.representanteDataNascimento),
        representanteDocumentoTipoNumero: `${form.representanteDocumentoTipo || ''} ${form.representanteDocumentoNumero || ''}`.trim(),
        dataHojePorExtenso,
      };
      const res = await fetch("https://n8n.intelektus.tech/webhook/elaborarProcuracao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("Procuração enviada para elaboração");
      } else {
        const text = await res.text().catch(() => "");
        toast.error(text || "Falha ao enviar a procuração");
      }
    } finally {
      setLoading(false);
    }
  };
  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };
  const onlyDigits = (s: string) => s.replace(/\D/g, "");
  const formatCNPJ = (s: string) => {
    const v = onlyDigits(s).slice(0, 14);
    const p1 = v.slice(0, 2);
    const p2 = v.slice(2, 5);
    const p3 = v.slice(5, 8);
    const p4 = v.slice(8, 12);
    const p5 = v.slice(12, 14);
    return [
      p1 && p1.length === 2 ? `${p1}.` : p1,
      p2 && p2.length === 3 ? `${p2}.` : p2,
      p3 && p3.length === 3 ? `${p3}/` : p3,
      p4 && p4.length === 4 ? `${p4}-` : p4,
      p5,
    ].filter(Boolean).join("");
  };
  const formatCPF = (s: string) => {
    const v = onlyDigits(s).slice(0, 11);
    const p1 = v.slice(0, 3);
    const p2 = v.slice(3, 6);
    const p3 = v.slice(6, 9);
    const p4 = v.slice(9, 11);
    return [
      p1 && p1.length === 3 ? `${p1}.` : p1,
      p2 && p2.length === 3 ? `${p2}.` : p2,
      p3 && p3.length === 3 ? `${p3}-` : p3,
      p4,
    ].filter(Boolean).join("");
  };
  const formatCEP = (s: string) => {
    const v = onlyDigits(s).slice(0, 8);
    const p1 = v.slice(0, 5);
    const p2 = v.slice(5, 8);
    return p2 ? `${p1}-${p2}` : p1;
  };
  const formatDate = (s: string) => {
    const v = onlyDigits(s).slice(0, 8);
    const p1 = v.slice(0, 2);
    const p2 = v.slice(2, 4);
    const p3 = v.slice(4, 8);
    if (v.length <= 2) return p1;
    if (v.length <= 4) return `${p1}/${p2}`;
    return `${p1}/${p2}/${p3}`;
  };
  const formatRG = (s: string) => {
    const v = onlyDigits(s).slice(0, 10);
    const p1 = v.slice(0, 2);
    const p2 = v.slice(2, 5);
    const p3 = v.slice(5, 8);
    const p4 = v.slice(8, 10);
    return [
      p1 && p1.length === 2 ? `${p1}.` : p1,
      p2 && p2.length === 3 ? `${p2}.` : p2,
      p3 && p3.length === 3 ? `${p3}-` : p3,
      p4,
    ].filter(Boolean).join("");
  };
  const formatOAB = (s: string) => {
    const v = onlyDigits(s).slice(0, 6);
    const p1 = v.slice(0, Math.max(0, v.length - 3));
    const p2 = v.slice(Math.max(0, v.length - 3));
    return p1 ? `${p1}.${p2}` : p2;
  };
  const formatCidadeEstado = (s: string) => {
    const trimmed = s.replace(/\s+/g, ' ').trim();
    const m = trimmed.match(/^(.*?)[\s\-/]+([A-Za-z]{2})$/);
    if (m) return `${m[1]} - ${m[2].toUpperCase()}`;
    return trimmed;
  };
  const toUpper = (s: string) => s.toUpperCase();
  const sanitizeAlphaNum = (s: string) => s.toUpperCase().replace(/[^A-Z0-9\/-]/g, "");
  const formatDocumentoNumero = (tipo: string, s: string) => {
    const t = (tipo || "").toUpperCase();
    if (t.includes("RG")) return formatRG(s);
    if (t.includes("CNH")) return onlyDigits(s).slice(0, 11);
    if (t.includes("RNE")) return sanitizeAlphaNum(s).slice(0, 20);
    return sanitizeAlphaNum(s).slice(0, 25);
  };
  const formatCNJ = (s: string) => {
    const v = onlyDigits(s).slice(0, 20);
    const a = v.slice(0, 7);
    const b = v.slice(7, 9);
    const c = v.slice(9, 13);
    const d = v.slice(13, 14);
    const e = v.slice(14, 16);
    const f = v.slice(16, 20);
    let out = a;
    if (b) out += `-${b}`; else return out;
    if (c) out += `.${c}`; else return out;
    if (d) out += `.${d}`; else return out;
    if (e) out += `.${e}`; else return out;
    if (f) out += `.${f}`;
    return out;
  };
  

  return (
    <div className="space-y-8 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Elaborar Procuração</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">I. Outorgante (Empresa)</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="empresaNome">Nome completo da empresa</Label>
                  <Input id="empresaNome" value={form.empresaNome} onChange={(e) => handleChange("empresaNome", e.target.value)} placeholder="Nome da empresa" />
                  <p className="text-xs text-muted-foreground">Nome da empresa que está conferindo os poderes.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="empresaCnpj">Número do CNPJ</Label>
                  <Input id="empresaCnpj" inputMode="numeric" maxLength={18} value={form.empresaCnpj} onChange={(e) => handleChange("empresaCnpj", formatCNPJ(e.target.value))} placeholder="CNPJ" />
                  <p className="text-xs text-muted-foreground">CNPJ da empresa.</p>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="empresaEndereco">Endereço da empresa</Label>
                  <Input id="empresaEndereco" value={form.empresaEndereco} onChange={(e) => handleChange("empresaEndereco", e.target.value)} placeholder="Rua, Nº, etc." />
                  <p className="text-xs text-muted-foreground">Endereço completo da sede.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="empresaBairro">Bairro da empresa</Label>
                  <Input id="empresaBairro" value={form.empresaBairro} onChange={(e) => handleChange("empresaBairro", e.target.value)} placeholder="Bairro" />
                  <p className="text-xs text-muted-foreground">Bairro onde está a sede.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="empresaCidadeEstado">Cidade - Estado da empresa</Label>
                  <Input id="empresaCidadeEstado" value={form.empresaCidadeEstado} onChange={(e) => handleChange("empresaCidadeEstado", formatCidadeEstado(e.target.value))} placeholder="Cidade/UF" />
                  <p className="text-xs text-muted-foreground">Cidade e Estado da sede.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="empresaCep">CEP da empresa</Label>
                  <Input id="empresaCep" inputMode="numeric" maxLength={9} value={form.empresaCep} onChange={(e) => handleChange("empresaCep", formatCEP(e.target.value))} placeholder="CEP" />
                  <p className="text-xs text-muted-foreground">CEP da sede.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold">II. Representante Legal</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="representanteNome">Nome completo do representante</Label>
                  <Input id="representanteNome" value={form.representanteNome} onChange={(e) => handleChange("representanteNome", e.target.value)} placeholder="Nome completo" />
                  <p className="text-xs text-muted-foreground">Pessoa que assina pela empresa (sócio/administrador).</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="representanteNacionalidade">Nacionalidade</Label>
                  <Input id="representanteNacionalidade" value={form.representanteNacionalidade} onChange={(e) => handleChange("representanteNacionalidade", e.target.value)} placeholder="Nacionalidade" />
                  <p className="text-xs text-muted-foreground">Nacionalidade do representante.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="representanteEstadoCivil">Estado civil</Label>
                  <Input id="representanteEstadoCivil" value={form.representanteEstadoCivil} onChange={(e) => handleChange("representanteEstadoCivil", e.target.value)} placeholder="Estado civil" />
                  <p className="text-xs text-muted-foreground">Estado civil do representante.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="representanteCidadeNatal">Cidade natal</Label>
                  <Input id="representanteCidadeNatal" value={form.representanteCidadeNatal} onChange={(e) => handleChange("representanteCidadeNatal", e.target.value)} placeholder="Cidade natal" />
                  <p className="text-xs text-muted-foreground">Naturalidade do representante.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="representanteDataNascimento">Data de nascimento</Label>
                  <Input id="representanteDataNascimento" inputMode="numeric" maxLength={10} value={form.representanteDataNascimento} onChange={(e) => handleChange("representanteDataNascimento", formatDate(e.target.value))} placeholder="DD/MM/AAAA" />
                  <p className="text-xs text-muted-foreground">Formato DD/MM/AAAA.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="representanteDocumentoTipo">Tipo do documento de identidade</Label>
                  <Input id="representanteDocumentoTipo" value={form.representanteDocumentoTipo} onChange={(e) => handleChange("representanteDocumentoTipo", toUpper(e.target.value))} placeholder="Ex.: RG, RNE, CNH" />
                  <p className="text-xs text-muted-foreground">Informe o tipo: RG, RNE, CNH etc.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="representanteDocumentoNumero">Número do documento de identidade</Label>
                  <Input id="representanteDocumentoNumero" value={form.representanteDocumentoNumero} onChange={(e) => handleChange("representanteDocumentoNumero", formatDocumentoNumero(form.representanteDocumentoTipo, e.target.value))} placeholder="Número" />
                  <p className="text-xs text-muted-foreground">Formato conforme o tipo informado.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="representanteOrgaoEmissor">Órgão emissor</Label>
                  <Input id="representanteOrgaoEmissor" value={form.representanteOrgaoEmissor} onChange={(e) => handleChange("representanteOrgaoEmissor", toUpper(e.target.value))} placeholder="Órgão emissor" />
                  <p className="text-xs text-muted-foreground">Órgão expedidor do documento.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="representanteProfissao">Profissão</Label>
                  <Input id="representanteProfissao" value={form.representanteProfissao} onChange={(e) => handleChange("representanteProfissao", e.target.value)} placeholder="Profissão" />
                  <p className="text-xs text-muted-foreground">Profissão do representante.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="representanteCpf">Número do CPF</Label>
                  <Input id="representanteCpf" inputMode="numeric" maxLength={14} value={form.representanteCpf} onChange={(e) => handleChange("representanteCpf", formatCPF(e.target.value))} placeholder="CPF" />
                  <p className="text-xs text-muted-foreground">CPF do representante.</p>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="representanteEnderecoResidencia">Endereço de residência</Label>
                  <Input id="representanteEnderecoResidencia" value={form.representanteEnderecoResidencia} onChange={(e) => handleChange("representanteEnderecoResidencia", e.target.value)} placeholder="Rua, Nº, Apt/Sala" />
                  <p className="text-xs text-muted-foreground">Endereço de residência completo.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="representanteBairroResidencia">Bairro de residência</Label>
                  <Input id="representanteBairroResidencia" value={form.representanteBairroResidencia} onChange={(e) => handleChange("representanteBairroResidencia", e.target.value)} placeholder="Bairro" />
                  <p className="text-xs text-muted-foreground">Bairro de residência.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="representanteCidadeEstadoResidencia">Cidade - Estado de residência</Label>
                  <Input id="representanteCidadeEstadoResidencia" value={form.representanteCidadeEstadoResidencia} onChange={(e) => handleChange("representanteCidadeEstadoResidencia", formatCidadeEstado(e.target.value))} placeholder="Cidade/UF" />
                  <p className="text-xs text-muted-foreground">Cidade e Estado de residência.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="representanteCepResidencia">CEP de residência</Label>
                  <Input id="representanteCepResidencia" inputMode="numeric" maxLength={9} value={form.representanteCepResidencia} onChange={(e) => handleChange("representanteCepResidencia", formatCEP(e.target.value))} placeholder="CEP" />
                  <p className="text-xs text-muted-foreground">CEP de residência.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold">III. Outorgados (Advogados)</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="adv1Nome">Nome completo do Advogado 1</Label>
                  <Input id="adv1Nome" value={form.adv1Nome} onChange={(e) => handleChange("adv1Nome", e.target.value)} placeholder="Nome" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adv1Oab">Número da OAB 1</Label>
                  <Input id="adv1Oab" inputMode="numeric" maxLength={7} value={form.adv1Oab} onChange={(e) => handleChange("adv1Oab", formatOAB(e.target.value))} placeholder="OAB" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adv1Cpf">Número do CPF 1</Label>
                  <Input id="adv1Cpf" inputMode="numeric" maxLength={14} value={form.adv1Cpf} onChange={(e) => handleChange("adv1Cpf", formatCPF(e.target.value))} placeholder="CPF" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adv2Nome">Nome completo do Advogado 2</Label>
                  <Input id="adv2Nome" value={form.adv2Nome} onChange={(e) => handleChange("adv2Nome", e.target.value)} placeholder="Nome" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adv2Oab">Número da OAB 2</Label>
                  <Input id="adv2Oab" inputMode="numeric" maxLength={7} value={form.adv2Oab} onChange={(e) => handleChange("adv2Oab", formatOAB(e.target.value))} placeholder="OAB" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adv2Cpf">Número do CPF 2</Label>
                  <Input id="adv2Cpf" inputMode="numeric" maxLength={14} value={form.adv2Cpf} onChange={(e) => handleChange("adv2Cpf", formatCPF(e.target.value))} placeholder="CPF" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="escritorioEndereco">Endereço do escritório</Label>
                  <Input id="escritorioEndereco" value={form.escritorioEndereco} onChange={(e) => handleChange("escritorioEndereco", e.target.value)} placeholder="Rua, Nº, Conj., etc." />
                  <p className="text-xs text-muted-foreground">Endereço profissional dos advogados.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="escritorioCep">CEP do escritório</Label>
                  <Input id="escritorioCep" inputMode="numeric" maxLength={9} value={form.escritorioCep} onChange={(e) => handleChange("escritorioCep", formatCEP(e.target.value))} placeholder="CEP" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold">IV. Finalidade Específica</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="finalidadeParteContraria">Nome da parte contrária/autora</Label>
                  <Input id="finalidadeParteContraria" value={form.finalidadeParteContraria} onChange={(e) => handleChange("finalidadeParteContraria", e.target.value)} placeholder="Nome completo" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="finalidadeNumeroProcesso">Número do processo</Label>
                  <Input id="finalidadeNumeroProcesso" inputMode="numeric" maxLength={25} value={form.finalidadeNumeroProcesso} onChange={(e) => handleChange("finalidadeNumeroProcesso", formatCNJ(e.target.value))} placeholder="Número" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold">V. Fechamento</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="fechamentoCidadeEstado">Cidade e estado de assinatura</Label>
                  <Input id="fechamentoCidadeEstado" value={form.fechamentoCidadeEstado} onChange={(e) => handleChange("fechamentoCidadeEstado", formatCidadeEstado(e.target.value))} placeholder="Cidade/UF" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fechamentoDia">Dia da assinatura</Label>
                  <Input id="fechamentoDia" inputMode="numeric" maxLength={2} value={form.fechamentoDia} onChange={(e) => handleChange("fechamentoDia", onlyDigits(e.target.value).slice(0,2))} placeholder="Dia" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fechamentoMes">Mês da assinatura</Label>
                  <Input id="fechamentoMes" inputMode="numeric" maxLength={2} value={form.fechamentoMes} onChange={(e) => handleChange("fechamentoMes", onlyDigits(e.target.value).slice(0,2))} placeholder="Mês" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fechamentoAno">Ano da assinatura</Label>
                  <Input id="fechamentoAno" inputMode="numeric" maxLength={4} value={form.fechamentoAno} onChange={(e) => handleChange("fechamentoAno", onlyDigits(e.target.value).slice(0,4))} placeholder="Ano" />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>{loading ? "Elaborando..." : "Elaborar Procuração"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
