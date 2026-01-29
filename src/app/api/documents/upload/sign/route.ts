import { NextRequest, NextResponse } from 'next/server';
import { BUCKET_NAME } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

// Map field names to organized folder structure (copied from upload/route.ts)
const FIELD_TO_STEP_MAP: Record<string, string> = {
  // Documentos Iniciais
  rnmMaeFile: 'documentos-iniciais',
  rnmPaiFile: 'documentos-iniciais',
  rnmSupostoPaiFile: 'documentos-iniciais',
  certidaoNascimentoFile: 'documentos-iniciais',
  comprovanteEnderecoFile: 'documentos-iniciais',
  passaporteFile: 'documentos-iniciais',
  guiaPagaFile: 'guia-judicial',

  // Exame DNA
  resultadoExameDnaFile: 'exame-dna',

  // Procuração
  procuracaoAnexadaFile: 'procuracao',
  procuracaoClienteFile: 'procuracao',

  // Petição
  peticaoAnexadaFile: 'peticao',
  peticaoClienteFile: 'peticao',

  // Processo
  processoAnexadoFile: 'processo',

  // Exigências
  documentosFinaisAnexadosFile: 'exigencias',

  // Finalização
  documentosProcessoFinalizadoFile: 'finalizacao',

  // Usucapião & Ações Cíveis
  ownerRnmFile: 'usucapiao-dono',
  ownerCpfFile: 'usucapiao-dono',
  declaracaoVizinhosFile: 'usucapiao-vizinhos',
  matriculaImovelFile: 'usucapiao-matricula',
  contaAguaFile: 'usucapiao-agua',
  contaLuzFile: 'usucapiao-luz',
  iptuFile: 'usucapiao-iptu',
  contratoEngenheiroFile: 'usucapiao-engenheiro',
  peticaoInicialFile: 'peticao-inicial',
  custasFile: 'custas',
  termoPartilhasFile: 'divorcio',
  guardaFile: 'divorcio',
  peticaoConjuntaFile: 'divorcio',
  passaporteMaeFile: 'passaportes',
  passaportePaiRegistralFile: 'passaportes',
  passaporteSupostoPaiFile: 'passaportes',
  passaportePaiFile: 'passaportes',
  passaporteCriancaFile: 'passaportes',
  aguaLuzIptuFile: 'imovel',
  camposExigenciasFile: 'exigencias',

  // Perda de Nacionalidade
  protocoloDoc: 'protocolo',
  extratoSeiDoc: 'protocolo',
  douDoc: 'deferimento',
  douRatificacaoDoc: 'ratificacao',
  protocoloManifestoDoc: 'protocolo',
  documentoFinalizacaoDoc: 'finalizacao',
  rnmMaeDoc: 'documentos-pais',
  cpfMaeDoc: 'documentos-pais',
  rnmPaiDoc: 'documentos-pais',
  cpfPaiDoc: 'documentos-pais',
  passaporteMaeDoc: 'passaportes',
  passaportePaiDoc: 'passaportes',
  passaporteCriancaDoc: 'passaportes',
  rgCriancaDoc: 'documentos-crianca',
  certidaoNascimentoDoc: 'documentos-crianca',
  documentoChinesDoc: 'documentos-adicionais',
  traducaoJuramentadaDoc: 'documentos-adicionais',

  // Vistos (Generic & Specific)
  passaporteDoc: 'documentos-pessoais',
  diplomaDoc: 'documentos-educacionais',
  certidaoCasamentoDoc: 'documentos-pessoais',
  certidaoNascimentoFilhosDoc: 'documentos-pessoais',
  extratosBancariosDoc: 'financeiro',
  impostoRendaDoc: 'financeiro',
  holeritesDoc: 'financeiro',
  cartaEmpregadorDoc: 'profissional',
  contratoSocialDoc: 'profissional',
  prolaboreDoc: 'profissional',
  formularioVistoDoc: 'formularios',
  ds160Doc: 'formularios',
  fotoVistoDoc: 'documentos-pessoais',

  // Turismo
  cpfDoc: 'documentos-pessoais',
  rnmDoc: 'documentos-pessoais',
  comprovanteEnderecoDoc: 'documentos-pessoais',
  declaracaoResidenciaDoc: 'documentos-pessoais',
  foto3x4Doc: 'documentos-pessoais',
  antecedentesCriminaisDoc: 'documentos-pessoais',
  cartaoCnpjDoc: 'documentos-especificos',
  contratoEmpresaDoc: 'documentos-especificos',
  escrituraImoveisDoc: 'documentos-especificos',
  procuradorDoc: 'documentos-especificos',
  reservasPassagensDoc: 'viagem',
  reservasHotelDoc: 'viagem',
  seguroViagemDoc: 'viagem',
  roteiroViagemDoc: 'viagem',
  taxaDoc: 'viagem',
  formularioConsuladoDoc: 'viagem',
  documentosAdicionaisDoc: 'outros',

  // Compra e Venda
  comprovanteEnderecoImovelDoc: 'imovel',
  numeroMatriculaDoc: 'imovel',
  cadastroContribuinteDoc: 'imovel',

  // Ações Trabalhistas e Criminais
  fotoNotificacaoDoc: 'documentos-acao',

  // Additional Vistos/Turismo Mappings
  traducaoAntecedentesCriminaisDoc: 'traducao',
  traducaoCertificadoTrabalhoDoc: 'traducao',
  traducaoDiplomaDoc: 'traducao',
  traducaoCertidaoNascimentoDoc: 'traducao',
  procuracaoEmpresaDoc: 'procuracao',
  procuracaoEmpresaAssinadaDoc: 'procuracao',
  procuracaoImigranteDoc: 'procuracao',
  procuracaoImigranteAssinadaDoc: 'procuracao',
  formularioRn01Doc: 'formularios',
  guiaPagaDoc: 'guia-judicial',
  publicacaoDouDoc: 'deferimento',
  comprovanteInvestimentoDoc: 'financeiro',
  planoInvestimentosDoc: 'financeiro',
  formularioRequerimentoDoc: 'formularios',
  protocoladoDoc: 'protocolo',
  contratoTrabalhoDoc: 'profissional',
  folhaPagamentoDoc: 'financeiro',
  comprovanteVinculoAnteriorDoc: 'profissional',
  declaracaoAntecedentesCriminaisDoc: 'documentos-pessoais',
  ctpsDoc: 'profissional',
  contratoTrabalhoAnteriorDoc: 'profissional',
  contratoTrabalhoAtualDoc: 'profissional',
  formularioProrrogacaoDoc: 'formularios',
  contratoTrabalhoIndeterminadoDoc: 'profissional',
  justificativaMudancaEmpregadorDoc: 'profissional',
  gfipDoc: 'financeiro',
  certificadoTrabalhoDoc: 'profissional',
};

const sanitizeClientName = (name: string): string => {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toLowerCase();
};

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const body = await request.json();
    const { fileName, fileType, caseId, moduleType, fieldName, clientName, entityId } = body;

    // Use either caseId or entityId
    const recordId = caseId || entityId;

    // Check if it is a temporary upload
    const isTemporaryUpload = !recordId && !fieldName;

    if (!isTemporaryUpload && (!fileName || !recordId || !fieldName)) {
      return NextResponse.json(
        { error: 'Dados incompletos (fileName, recordId, fieldName são obrigatórios)' },
        { status: 400 }
      );
    }

    // Determine Client Name
    let finalClientName = clientName;
    if (!finalClientName && moduleType === 'acoes_civeis' && recordId) {
      const { data: caseData } = await supabaseAdmin
        .from("acoes_civeis")
        .select("client_name")
        .eq("id", recordId)
        .single();
      if (caseData) finalClientName = caseData.client_name;
    }

    // Path Construction
    const timestamp = Date.now();
    const uniqueFolderId = `${timestamp}_${Math.random().toString(36).substring(2, 9)}`;
    const originalName = fileName;
    const extension = originalName.split('.').pop();
    const sanitizedOriginalBase = originalName.replace(/\.[^/.]+$/, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .toLowerCase();

    const safeFileName = `${sanitizedOriginalBase}.${extension}`;
    const stepFolder = FIELD_TO_STEP_MAP[fieldName] || 'outros';
    const clientNameForPath = finalClientName || 'cliente_desconhecido';

    let filePath = '';
    if (isTemporaryUpload) {
      filePath = `temp/${uniqueFolderId}/${safeFileName}`;
    } else if (moduleType === 'compra_venda_imoveis') {
      filePath = `compra-venda/${sanitizeClientName(clientNameForPath)}_${recordId}/${uniqueFolderId}/${safeFileName}`;
    } else if (moduleType === 'perda_nacionalidade') {
      filePath = `perda-nacionalidade/${sanitizeClientName(clientNameForPath)}_${recordId}/${stepFolder}/${uniqueFolderId}/${safeFileName}`;
    } else if (moduleType === 'vistos') {
      filePath = `vistos/${sanitizeClientName(clientNameForPath)}_${recordId}/${stepFolder}/${uniqueFolderId}/${safeFileName}`;
    } else if (moduleType === 'acoes_trabalhistas') {
      filePath = `acoes-trabalhistas/${sanitizeClientName(clientNameForPath)}_${recordId}/${uniqueFolderId}/${safeFileName}`;
    } else if (moduleType === 'acoes_criminais') {
      filePath = `acoes-criminais/${sanitizeClientName(clientNameForPath)}_${recordId}/${uniqueFolderId}/${safeFileName}`;
    } else {
      filePath = `acoes-civeis/${sanitizeClientName(clientNameForPath)}_${recordId}/${stepFolder}/${uniqueFolderId}/${safeFileName}`;
    }

    console.log('📝 Gerando URL assinada para:', filePath);

    // Generate Signed Upload URL
    // This allows PUT requests to the specific path
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error('❌ Erro ao gerar URL assinada:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also get the public URL for future reference
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      fullPath: filePath,
      publicUrl: urlData.publicUrl,
      clientName: finalClientName // Return resolved client name
    });

  } catch (error) {
    console.error('❌ Erro inesperado ao assinar upload:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
