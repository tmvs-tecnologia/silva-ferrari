export type PendingDocField = { key: string; label: string };

export type PendingDocGroup = {
  title?: string;
  step: string;
  fields: PendingDocField[];
};

export function getVistosDocRequirements(input: { type?: string; country?: string }): PendingDocGroup[] {
  const t = String(input.type || "").toLowerCase();
  const countryStr = String(input.country || "").toLowerCase();

  const showResidenciaPrevia = t.includes("trabalho") && (t.includes("resid") || t.includes("prévia") || t.includes("previ"));
  const showInvestidor = t.includes("invest");
  const showTrabalhistas = t.includes("trabalhistas");
  const showRenovacao = t.includes("renov") || t.includes("1 ano");
  const showIndeterminado = t.includes("indeterminado");
  const showMudancaEmpregador = t.includes("mudan") && t.includes("empregador");
  const showBrasil = (t.includes("trabalho") && (t.includes("brasil") || countryStr.includes("brasil"))) || String(input.type || "") === "Visto de Trabalho - Brasil";

  if (showBrasil) {
    return [
      {
        title: "1. Identificação",
        step: "Cadastro de Documentos",
        fields: [
          { key: "passaporteDoc", label: "Passaporte" },
          { key: "cpfDoc", label: "CPF" },
          { key: "rnmDoc", label: "RNM" },
        ],
      },
      {
        title: "2. Documentos da Empresa",
        step: "Cadastro de Documentos",
        fields: [
          { key: "contratoEmpresaDoc", label: "Contrato Social" },
          { key: "cartaoCnpjDoc", label: "CNPJ" },
          { key: "gfipDoc", label: "GFIP" },
        ],
      },
      {
        title: "3. Certidões",
        step: "Cadastro de Documentos",
        fields: [
          { key: "antecedentesCriminaisDoc", label: "Certidão Criminal" },
          { key: "certificadoTrabalhoDoc", label: "Certificado de Trabalho" },
          { key: "diplomaDoc", label: "Diploma" },
          { key: "certidaoNascimentoDoc", label: "Certidão de Nascimento" },
        ],
      },
      {
        title: "4. Traduções",
        step: "Cadastro de Documentos",
        fields: [
          { key: "traducaoAntecedentesCriminaisDoc", label: "Tradução Certidão Criminal" },
          { key: "traducaoCertificadoTrabalhoDoc", label: "Tradução Certificado de Trabalho" },
          { key: "traducaoDiplomaDoc", label: "Tradução Diploma" },
          { key: "traducaoCertidaoNascimentoDoc", label: "Tradução Certidão de Nascimento" },
        ],
      },
      {
        title: "5. Procurações",
        step: "Cadastro de Documentos",
        fields: [
          { key: "procuracaoEmpresaDoc", label: "Procuração Empresa" },
          { key: "procuracaoEmpresaAssinadaDoc", label: "Procuração Empresa Assinada" },
          { key: "procuracaoImigranteDoc", label: "Procuração Imigrante" },
          { key: "procuracaoImigranteAssinadaDoc", label: "Procuração Imigrante Assinada" },
        ],
      },
      {
        title: "Protocolo",
        step: "Documentos para Protocolo",
        fields: [
          { key: "formularioRn01Doc", label: "Formulário RN 01/2017" },
          { key: "declaracaoCompreensaoDoc", label: "Declaração de Compreensão" },
          { key: "declaracaoNaoAntecedentesDoc", label: "Declaração de Não Antecedentes" },
          { key: "declaracoesEmpresaDoc", label: "Declarações da Empresa" },
          { key: "convencaoColetivaDoc", label: "Convenção Coletiva" },
          { key: "contratoTrabalhoDoc", label: "Contrato de Trabalho" },
          { key: "gruDoc", label: "GRU" },
          { key: "comprovantePagamentoGruDoc", label: "Comprovante de Pagamento GRU" },
          { key: "i1CriminalDoc", label: "I1 Criminal" },
          { key: "i2TrabalhoDoc", label: "I2 Trabalho" },
          { key: "i3DiplomaDoc", label: "I3 Diploma" },
          { key: "i6NascimentoDoc", label: "I6 Nascimento" },
        ],
      },
      {
        title: "Protocolo",
        step: "Protocolo",
        fields: [{ key: "comprovanteProtocolo", label: "Comprovante de Protocolo" }],
      },
      {
        title: "Exigências",
        step: "Exigências",
        fields: [
          { key: "cartaExigencia", label: "Carta de Exigência" },
          { key: "documentosExigidos", label: "Documentos Exigidos" },
          { key: "cartaResposta", label: "Carta Resposta" },
        ],
      },
      {
        title: "Processo Finalizado",
        step: "Processo Finalizado",
        fields: [
          { key: "publicacaoDou", label: "Publicação D.O.U" },
          { key: "agendamentoPfDoc", label: "Comprovante de Agendamento PF" },
        ],
      },
    ];
  }

  if (t.includes("turismo")) {
    return [
      {
        title: "Documentos Pessoais",
        step: "Cadastro de Documentos",
        fields: [
          { key: "passaporteDoc", label: "Passaporte" },
          { key: "cpfDoc", label: "CPF" },
          { key: "rnmDoc", label: "RNM" },
          { key: "comprovanteEnderecoDoc", label: "Comprovante de Endereço" },
          { key: "foto3x4Doc", label: "Foto/Selfie" },
          { key: "antecedentesCriminaisDoc", label: "Antecedentes Criminais" },
        ],
      },
      {
        title: "Comprovação Financeira",
        step: "Cadastro de Documentos",
        fields: [
          { key: "cartaoCnpjDoc", label: "Empresa: Cartão CNPJ" },
          { key: "contratoEmpresaDoc", label: "Contrato Social" },
        ],
      },
      {
        title: "Histórico e Segurança",
        step: "Cadastro de Documentos",
        fields: [{ key: "declaracaoAntecedentesCriminaisDoc", label: "Declaração de Antecedentes Criminais" }],
      },
      {
        title: "Formação Acadêmica",
        step: "Cadastro de Documentos",
        fields: [{ key: "diplomaDoc", label: "Diploma" }],
      },
      {
        title: "Formulários",
        step: "Cadastro de Documentos",
        fields: [{ key: "formulario-visto", label: "Formulário de Visto" }],
      },
    ];
  }

  const docRequirements: PendingDocGroup[] = [
    { title: "Dados do Cliente", step: "Cadastro de Documentos", fields: [] },
    {
      title: "Documentos Pessoais",
      step: "Cadastro de Documentos",
      fields: [
        { key: "country", label: "País do Visto" },
        { key: "cpfDoc", label: "CPF" },
        { key: "rnmDoc", label: "RNM" },
        { key: "passaporteDoc", label: "Passaporte" },
        { key: "comprovanteEnderecoDoc", label: "Comprovante de Endereço" },
        { key: "foto3x4Doc", label: "Foto/Selfie" },
        { key: "documentoChinesDoc", label: "Documento Chinês" },
        { key: "antecedentesCriminaisDoc", label: "Antecedentes Criminais" },
      ],
    },
    {
      title: "Comprovação Financeira PF",
      step: "Cadastro de Documentos",
      fields: [
        { key: "certidaoNascimentoFilhosDoc", label: "Filhos (Certidão de Nascimento)" },
        { key: "cartaoCnpjDoc", label: "Empresa: Cartão CNPJ" },
        { key: "contratoEmpresaDoc", label: "Contrato Social" },
      ],
    },
    {
      title: "Histórico e Segurança",
      step: "Cadastro de Documentos",
      fields: [
        { key: "antecedentesCriminaisDoc", label: "Antecedentes Criminais" },
        { key: "declaracaoAntecedentesCriminaisDoc", label: "Declaração de Antecedentes Criminais" },
      ],
    },
    { title: "Formação Acadêmica", step: "Cadastro de Documentos", fields: [{ key: "diplomaDoc", label: "Diploma" }] },
  ];

  if (showResidenciaPrevia) {
    docRequirements.push({
      title: "Residência Prévia",
      step: "Cadastro de Documentos",
      fields: [
        { key: "formularioRn02Doc", label: "Formulário RN02" },
        { key: "comprovanteResidenciaPreviaDoc", label: "Comprovante Residência Prévia" },
        { key: "comprovanteAtividadeDoc", label: "Comprovante de Atividade" },
        { key: "protocoladoDoc", label: "Protocolado" },
      ],
    });
  }

  if (showInvestidor) {
    docRequirements.push({
      title: "Investidor",
      step: "Cadastro de Documentos",
      fields: [
        { key: "comprovanteInvestimentoDoc", label: "Comprovante de Investimento" },
        { key: "planoInvestimentosDoc", label: "Plano de Investimentos" },
        { key: "formularioRequerimentoDoc", label: "Formulário de Requerimento" },
        { key: "protocoladoDoc", label: "Protocolado" },
      ],
    });
  }

  if (showTrabalhistas || showMudancaEmpregador) {
    docRequirements.push({
      title: "Trabalhistas",
      step: "Cadastro de Documentos",
      fields: [
        { key: "contratoTrabalhoDoc", label: "Contrato de Trabalho" },
        { key: "folhaPagamentoDoc", label: "Folha de Pagamento" },
        { key: "comprovanteVinculoAnteriorDoc", label: "Comprovante de Vínculo Anterior" },
        { key: "justificativaMudancaEmpregadorDoc", label: "Justificativa Mudança de Empregador" },
        { key: "declaracaoAntecedentesCriminaisDoc", label: "Declaração de Antecedentes Criminais" },
        { key: "protocoladoDoc", label: "Protocolado" },
      ],
    });
  }

  if (showRenovacao) {
    docRequirements.push({
      title: "Renovação 1 ano",
      step: "Cadastro de Documentos",
      fields: [
        { key: "ctpsDoc", label: "CTPS" },
        { key: "contratoTrabalhoAnteriorDoc", label: "Contrato de Trabalho Anterior" },
        { key: "contratoTrabalhoAtualDoc", label: "Contrato de Trabalho Atual" },
        { key: "formularioProrrogacaoDoc", label: "Formulário de Prorrogação" },
        { key: "protocoladoDoc", label: "Protocolado" },
      ],
    });
  }

  if (showIndeterminado) {
    docRequirements.push({
      title: "Indeterminado",
      step: "Cadastro de Documentos",
      fields: [
        { key: "contratoTrabalhoIndeterminadoDoc", label: "Contrato de Trabalho Indeterminado" },
        { key: "protocoladoDoc", label: "Protocolado" },
      ],
    });
  }

  docRequirements.push(
    { title: "Agendamento", step: "Agendar no Consulado", fields: [{ key: "comprovante-agendamento", label: "Comprovante de Agendamento" }] },
    { title: "Protocolo", step: "Protocolo", fields: [{ key: "comprovanteProtocolo", label: "Comprovante de Protocolo" }] },
    {
      title: "Processo Finalizado",
      step: "Processo Finalizado",
      fields: [
        { key: "processo-finalizado", label: "Processo Finalizado" },
        { key: "relatorio-final", label: "Relatório Final" },
      ],
    }
  );

  return docRequirements;
}

export function getTurismoDocRequirements(): PendingDocGroup[] {
  return [
    {
      title: "Documentos Pessoais",
      step: "Cadastro de Documentos",
      fields: [
        { key: "cpfDoc", label: "CPF" },
        { key: "rnmDoc", label: "RNM" },
        { key: "passaporteDoc", label: "Passaporte" },
        { key: "comprovanteEnderecoDoc", label: "Comprovante de Endereço" },
        { key: "declaracaoResidenciaDoc", label: "Declaração de Residência" },
        { key: "foto3x4Doc", label: "Foto/Selfie" },
        { key: "documentoChinesDoc", label: "Documento Chinês" },
        { key: "antecedentesCriminaisDoc", label: "Antecedentes Criminais" },
      ],
    },
    {
      title: "Comprovação Financeira",
      step: "Cadastro de Documentos",
      fields: [
        { key: "certidaoNascimentoFilhosDoc", label: "Certidão Nascimento Filhos" },
        { key: "cartaoCnpjDoc", label: "CNPJ" },
        { key: "contratoEmpresaDoc", label: "Contrato Social" },
        { key: "escrituraImoveisDoc", label: "Escritura/Matrícula" },
        { key: "extratosBancariosDoc", label: "Extratos Bancários" },
        { key: "impostoRendaDoc", label: "Imposto de Renda" },
      ],
    },
    {
      title: "Outros Documentos",
      step: "Cadastro de Documentos",
      fields: [
        { key: "reservasPassagensDoc", label: "Reservas de Passagens" },
        { key: "reservasHotelDoc", label: "Reservas de Hotel" },
        { key: "seguroViagemDoc", label: "Seguro Viagem" },
        { key: "roteiroViagemDoc", label: "Roteiro de Viagem" },
        { key: "taxaDoc", label: "Taxa Consular" },
        { key: "formularioConsuladoDoc", label: "Formulário do Consulado" },
      ],
    },
    { title: "Agendamento", step: "Agendar no Consulado", fields: [{ key: "comprovante-agendamento", label: "Comprovante de Agendamento" }] },
    { title: "Formulário", step: "Preencher Formulário", fields: [{ key: "formulario-visto", label: "Formulário de Visto" }] },
    {
      title: "Documentação Preparada",
      step: "Preparar Documentação",
      fields: [
        { key: "formulario-visto", label: "Formulário de Visto Preenchido" },
        { key: "documentos-traduzidos", label: "Documentos Traduzidos" },
        { key: "documentos-autenticados", label: "Documentos Autenticados" },
      ],
    },
    { title: "Aprovação", step: "Aguardar Aprovação", fields: [{ key: "comprovante-aprovacao", label: "Comprovante de Aprovação" }] },
    {
      title: "Finalização",
      step: "Processo Finalizado",
      fields: [
        { key: "processo-finalizado", label: "Processo Finalizado" },
        { key: "relatorio-final", label: "Relatório Final" },
      ],
    },
  ];
}

export function computePendingByFlow(groups: PendingDocGroup[], uploadedKeys: Set<string>) {
  const merged: Record<string, PendingDocField[]> = {};
  let totalCount = 0;
  let missingCount = 0;

  for (const group of groups) {
    const step = group.step;
    if (!merged[step]) merged[step] = [];
    for (const field of group.fields) {
      totalCount += 1;
      if (!uploadedKeys.has(field.key)) {
        missingCount += 1;
        merged[step].push(field);
      }
    }
  }

  const pending = Object.entries(merged)
    .filter(([_, docs]) => docs.length > 0)
    .map(([flow, docs]) => ({ flow, docs }));

  return { pending, missingCount, totalCount };
}

