export type PendingDocField = { key: string; label: string };

export type PendingDocGroup = {
  title?: string;
  step: string;
  fields: PendingDocField[];
};

export function isBrasilVisto(type?: string, country?: string): boolean {
  const t = String(type || "").toLowerCase();
  const c = String(country || "").toLowerCase();
  return (t.includes("trabalho") && (t.includes("brasil") || c.includes("brasil"))) ||
    String(type || "") === "Visto de Trabalho - Brasil";
}

export function extractDocumentsFromRecord(record: any): Set<string> {
  const keys = new Set<string>();
  if (!record) return keys;

  const docExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx', '.txt'];

  Object.entries(record).forEach(([key, value]) => {
    const isDocKey = key.toLowerCase().includes('doc') || key.toLowerCase().includes('file');
    const isDocValue = typeof value === 'string' && (
      value.includes('supabase') ||
      docExtensions.some(ext => value.toLowerCase().endsWith(ext)) ||
      (value.startsWith('http') && docExtensions.some(ext => value.toLowerCase().includes(ext)))
    );

    if ((isDocKey || isDocValue) && value) {
      const normalizedKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      keys.add(normalizedKey);
      keys.add(key);
      // Support common variations: passaporte_doc -> passaporte
      keys.add(key.replace(/_doc$/i, ''));
      keys.add(normalizedKey.replace(/Doc$/i, ''));
    }
  });

  return keys;
}

export function getVistosDocRequirements(input: { type?: string; country?: string }): PendingDocGroup[] {
  const t = String(input.type || "").toLowerCase();

  // Detect specific types
  const isIndeterminado = t.includes("indeterminado");
  const isMudancaEmpregador = t.includes("mudan") && t.includes("empregador");

  // Force showBrasil to true for Indeterminado and Mudanca de Empregador
  const showBrasil = isBrasilVisto(input.type, input.country) || isIndeterminado || isMudancaEmpregador;

  const showResidenciaPrevia = t.includes("trabalho") && (t.includes("resid") || t.includes("prévia") || t.includes("previ"));
  const showInvestidor = t.includes("invest");
  const showTrabalhistas = t.includes("trabalhistas");
  const showRenovacao = t.includes("renov") || t.includes("1 ano");

  // Note: These flags are now redundant if showBrasil is true, but kept for other potential logic
  const showIndeterminado = isIndeterminado;
  const showMudancaEmpregador = isMudancaEmpregador;

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

  const showRenovacao1Ano = (t.includes("renov") && t.includes("1 ano")) || t === "visto de trabalho - renovação 1 ano";

  if (showRenovacao1Ano) {
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
          { key: "contratoEmpresaDoc", label: "Contrato Social" },
          { key: "ctpsDoc", label: "CTPS" },
          { key: "rnmDoc", label: "RNM" },
          { key: "contratoTrabalhoAnteriorDoc", label: "Contrato de trabalho anterior" },
          { key: "antecedentesCriminaisDoc", label: "Declaração de Antecedentes" },
          { key: "formularioProrrogacaoDoc", label: "Formulário prorrogação" },
          { key: "contratoTrabalhoDoc", label: "Contrato de trabalho atual" },
          { key: "procuracaoEmpresaDoc", label: "Procuração empresa" },
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

  if (showRenovacao && !showRenovacao1Ano) {
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
      title: "Cadastro de Documentos",
      step: "Cadastro de Documentos",
      fields: [
        { key: "cpfDoc", label: "CPF" },
        { key: "passaporteDoc", label: "Passaporte" },
        { key: "declaracaoResidenciaDoc", label: "Declaração de Residência" },
        { key: "documentoChinesDoc", label: "Documento Chinês" },
        { key: "certidaoNascimentoFilhosDoc", label: "Certidão Nascimento Filhos" },
        { key: "escrituraImoveisDoc", label: "Escritura/Matrícula" },
        { key: "impostoRendaDoc", label: "Imposto de Renda" },
        { key: "reservasHotelDoc", label: "Reservas de Hotel" },
        { key: "roteiroViagemDoc", label: "Roteiro de Viagem" },
        { key: "formularioConsuladoDoc", label: "Formulário do Consulado" },
        { key: "rnmDoc", label: "RNM" },
        { key: "comprovanteEnderecoDoc", label: "Comprovante de Endereço" },
        { key: "foto3x4Doc", label: "Foto/Selfie" },
        { key: "antecedentesCriminaisDoc", label: "Antecedentes Criminais" },
        { key: "cartaoCnpjDoc", label: "CNPJ" },
        { key: "extratosBancariosDoc", label: "Extratos Bancários" },
        { key: "reservasPassagensDoc", label: "Reservas de Passagens" },
        { key: "seguroViagemDoc", label: "Seguro Viagem" },
        { key: "taxaDoc", label: "Taxa Consular" },
        { key: "documentosAdicionaisDoc", label: "Documentos Adicionais" },
      ],
    },
    {
      title: "Agendar no Consulado",
      step: "Agendar no Consulado",
      fields: [{ key: "comprovante-agendamento", label: "Comprovante de Agendamento" }],
    },
    {
      title: "Preencher Formulário",
      step: "Preencher Formulário",
      fields: [{ key: "formulario-visto", label: "Formulário de Visto" }],
    },
    {
      title: "Preparar Documentação",
      step: "Preparar Documentação",
      fields: [
        { key: "formulario-visto-preenchido", label: "Formulário de Visto Preenchido" },
        { key: "documentos-traduzidos", label: "Documentos Traduzidos" },
        { key: "documentos-autenticados", label: "Documentos Autenticados" },
      ],
    },
    {
      title: "Aguardar Aprovação",
      step: "Aguardar Aprovação",
      fields: [{ key: "comprovante-aprovacao", label: "Comprovante de Aprovação" }],
    },
    {
      title: "Processo Finalizado",
      step: "Processo Finalizado",
      fields: [
        { key: "processo-finalizado", label: "Processo Finalizado" },
        { key: "relatorio-final", label: "Relatório Final" },
      ],
    },
  ];
}

export function getAcoesTrabalhistasDocRequirements(): PendingDocGroup[] {
  return [
    {
      title: "Documentação Inicial",
      step: "Cadastro de Documentos",
      fields: [
        { key: "documentosIniciaisFile", label: "Documentos Iniciais" },
        { key: "calculoFile", label: "Cálculo Inicial" },
      ],
    },
    {
      title: "Audiência",
      step: "Audiência",
      fields: [{ key: "ataAudienciaFile", label: "Ata de Audiência" }],
    },
    {
      title: "Sentença",
      step: "Sentença",
      fields: [{ key: "sentenciaFile", label: "Sentença" }],
    },
    {
      title: "Recurso",
      step: "Recurso",
      fields: [{ key: "recursoFile", label: "Recurso" }],
    },
    {
      title: "Acórdão",
      step: "Acórdão",
      fields: [{ key: "acordaoFile", label: "Acórdão" }],
    },
    {
      title: "Trânsito em Julgado",
      step: "Trânsito em Julgado",
      fields: [
        { key: "transitoJulgadoFile", label: "Certidão de Trânsito em Julgado" },
        { key: "documentosExecucaoFile", label: "Documentos para Execução" },
      ],
    },
  ];
}

export function getAcoesCiveisDocRequirements(): PendingDocGroup[] {
  return [
    {
      title: "Cadastro de Documentos",
      step: "Cadastro de Documentos",
      fields: [
        { key: "rnmMaeDoc", label: "RNM Mãe" },
        { key: "rnmPaiDoc", label: "RNM Pai" },
        { key: "rnmSupostoPaiDoc", label: "RNM Suposto Pai" },
        { key: "certidaoNascimentoDoc", label: "Certidão de Nascimento" },
        { key: "comprovanteEnderecoDoc", label: "Comprovante de Endereço" },
        { key: "passaporteDoc", label: "Passaporte" },
      ],
    },
    {
      title: "Agendar Exame DNA",
      step: "Agendar Exame DNA",
      fields: [{ key: "resultadoExameDnaDoc", label: "Resultado DNA" }],
    },
    {
      title: "Procuração",
      step: "Procuração",
      fields: [{ key: "procuracaoDoc", label: "Procuração" }],
    },
    {
      title: "Petição",
      step: "Petição",
      fields: [{ key: "peticaoDoc", label: "Petição Inicial" }],
    },
    {
      title: "Protocolo do Processo",
      step: "Protocolo do Processo",
      fields: [{ key: "processoDoc", label: "Protocolo" }],
    },
    {
      title: "Exigências do Juiz",
      step: "Exigências do Juiz",
      fields: [{ key: "documentosFinaisDoc", label: "Documentos Finais" }],
    },
    {
      title: "Processo Finalizado",
      step: "Processo Finalizado",
      fields: [{ key: "documentosFinalizadoDoc", label: "Sentença/Final" }],
    },
  ];
}

export function getAcoesCriminaisDocRequirements(): PendingDocGroup[] {
  return [
    {
      title: "Cadastro de Documentos",
      step: "Cadastro de Documentos",
      fields: [
        { key: "procuracaoDoc", label: "Procuração" },
        { key: "documentosIniciaisDoc", label: "Documentos Iniciais" },
      ],
    },
  ];
}

export function getCompraVendaDocRequirements(): PendingDocGroup[] {
  return [
    {
      title: "Cadastro Documentos",
      step: "Cadastro Documentos",
      fields: [
        { key: "matriculaDoc", label: "Matrícula" },
        { key: "cadastroContribuinteDoc", label: "Cadastro Contribuinte" },
        { key: "rgVendedorDoc", label: "RG Vendedores" },
        { key: "cpfVendedorDoc", label: "CPF Vendedores" },
        { key: "rnmCompradorDoc", label: "RNM Comprador" },
        { key: "cpfCompradorDoc", label: "CPF Comprador" },
      ],
    },
    {
      title: "Certidões",
      step: "Certidões",
      fields: [{ key: "certidoesDoc", label: "Certidões Negativas" }],
    },
    {
      title: "Contrato",
      step: "Contrato",
      fields: [{ key: "contratoDoc", label: "Minuta do Contrato" }],
    },
    {
      title: "Assinatura",
      step: "Assinatura",
      fields: [{ key: "assinaturaContratoDoc", label: "Contrato Assinado" }],
    },
    {
      title: "Escritura",
      step: "Escritura",
      fields: [{ key: "escrituraDoc", label: "Escritura Pública" }],
    },
    {
      title: "Registro",
      step: "Registro",
      fields: [{ key: "matriculaCartorioDoc", label: "Matrícula Atualizada" }],
    },
  ];
}

export function getPerdaNacionalidadeDocRequirements(): PendingDocGroup[] {
  return [
    {
      title: "Cadastro",
      step: "Cadastro",
      fields: [
        { key: "rnmMaeDoc", label: "RNM Mãe" },
        { key: "rnmPaiDoc", label: "RNM Pai" },
        { key: "certidaoNascimentoDoc", label: "Certidão de Nascimento" },
        { key: "comprovanteEnderecoDoc", label: "Comprovante de Endereço" },
        { key: "passaportesDoc", label: "Passaportes" },
        { key: "documentoChinesDoc", label: "Documento Chinês" },
        { key: "traducaoJuramentadaDoc", label: "Tradução Juramentada" },
      ],
    },
    {
      title: "Procuração",
      step: "Procuração",
      fields: [{ key: "procuracaoDoc", label: "Procuração" }],
    },
    {
      title: "Pedido",
      step: "Pedido",
      fields: [{ key: "pedidoPerdaDoc", label: "Pedido de Perda" }],
    },
    {
      title: "Protocolo",
      step: "Protocolo",
      fields: [{ key: "protocoloDoc", label: "Protocolo" }],
    },
    {
      title: "DOU",
      step: "DOU",
      fields: [{ key: "douDoc", label: "Publicação DOU" }],
    },
    {
      title: "Passaporte Chinês",
      step: "Passaporte Chinês",
      fields: [{ key: "passaporteChinesDoc", label: "Passaporte Chinês" }],
    },
    {
      title: "Manifesto",
      step: "Manifesto",
      fields: [{ key: "manifestoDoc", label: "Manifesto" }],
    },
    {
      title: "Portaria",
      step: "Portaria",
      fields: [{ key: "portariaDoc", label: "Portaria" }],
    },
  ];
}

export function computePendingByFlow(groups: PendingDocGroup[], uploadedKeys: Set<string>) {
  const merged: Record<string, PendingDocField[]> = {};
  let totalCount = 0;
  let missingCount = 0;

  // Normalize uploaded keys for fuzzy matching
  const normalizedUploaded = new Set<string>();
  uploadedKeys.forEach(k => {
    const low = k.toLowerCase().replace(/^(vistos|turismo)-/, '');
    normalizedUploaded.add(low);
    normalizedUploaded.add(low.replace(/_/g, '')); // also match without underscores
  });

  for (const group of groups) {
    const step = group.step;
    if (!merged[step]) merged[step] = [];
    for (const field of group.fields) {
      totalCount += 1;

      const fieldLow = field.key.toLowerCase();
      const fieldNoUnderscore = fieldLow.replace(/_/g, '');

      const isUploaded = uploadedKeys.has(field.key) ||
        normalizedUploaded.has(fieldLow) ||
        normalizedUploaded.has(fieldNoUnderscore);

      if (!isUploaded) {
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

