import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedBrowserClient: SupabaseClient | null | undefined;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (cachedBrowserClient !== undefined) return cachedBrowserClient;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    cachedBrowserClient = null;
    return null;
  }
  cachedBrowserClient = createClient(supabaseUrl, supabaseAnonKey);
  return cachedBrowserClient;
}

// Helper functions for organized file paths with client identification
export const getFilePath = {
  acoesCiveis: (caseId: number, clientName: string, step: string, fileName: string) => 
    `acoes-civeis/${sanitizeClientName(clientName)}_${caseId}/${step}/${sanitizeFileName(fileName)}`,
  
  compraVenda: (propertyId: number, clientName: string, fileName: string) => 
    `compra-venda/${sanitizeClientName(clientName)}_${propertyId}/${sanitizeFileName(fileName)}`,
  
  perdaNacionalidade: (caseId: number, clientName: string, step: string, fileName: string) => 
    `perda-nacionalidade/${sanitizeClientName(clientName)}_${caseId}/${step}/${sanitizeFileName(fileName)}`,
  
  vistos: (vistoId: number, clientName: string, category: string, fileName: string) => 
    `vistos/${sanitizeClientName(clientName)}_${vistoId}/${category}/${sanitizeFileName(fileName)}`,
  
  acoesTrabalhistas: (caseId: number, clientName: string, fileName: string) => 
    `acoes-trabalhistas/${sanitizeClientName(clientName)}_${caseId}/${sanitizeFileName(fileName)}`,
  
  acoesCriminais: (caseId: number, clientName: string, fileName: string) => 
    `acoes-criminais/${sanitizeClientName(clientName)}_${caseId}/${sanitizeFileName(fileName)}`,
};

// Mapeamento de campos para nomes amigáveis de documentos
export const FIELD_TO_DOCUMENT_NAME: Record<string, string> = {
  // Documentos Iniciais
  rnmMaeFile: 'RNM da Mãe',
  rnmPaiFile: 'RNM do Pai',
  rnmSupostoPaiFile: 'RNM do Suposto Pai',
  certidaoNascimentoFile: 'Certidão de Nascimento',
  comprovanteEnderecoFile: 'Comprovante de Endereço',
  passaporteFile: 'Passaporte',
  guiaPagaFile: 'Guia Judicial',
  
  // Exame DNA
  resultadoExameDnaFile: 'Resultado do Exame de DNA',
  
  // Procuração
  procuracaoAnexadaFile: 'Procuração do Cliente',
  procuracaoClienteFile: 'Procuração do Cliente',
  
  // Petição
  peticaoAnexadaFile: 'Petição do Cliente',
  peticaoClienteFile: 'Petição do Cliente',
  
  // Processo
  processoAnexadoFile: 'Processo Anexado',
  
  // Exigências
  documentosFinaisAnexadosFile: 'Documentos Finais',
  
  // Finalização
  documentosProcessoFinalizadoFile: 'Documentos do Processo Finalizado',
  // Usucapião
  ownerRnmFile: 'RNM do Dono do Imóvel',
  ownerCpfFile: 'CPF do Dono do Imóvel',
  declaracaoVizinhosFile: 'Declaração dos Vizinhos',
  matriculaImovelFile: 'Matrícula do Imóvel',
  contaAguaFile: 'Conta de Água',
  contaLuzFile: 'Conta de Luz',
  iptuFile: 'IPTU',
  contratoEngenheiroFile: 'Contrato/Laudo do Engenheiro',
  // Compra e Venda
  numeroMatriculaDoc: 'Documento da Matrícula',
  cadastroContribuinteDoc: 'Comprovante Cadastro Contribuinte',
  rgVendedoresDoc: 'Documento RG / CNH dos Vendedores',
  cpfVendedoresDoc: 'Documento CPF dos Vendedores',
  rnmCompradorDoc: 'Documento RNM do Comprador',
  cpfCompradorDoc: 'Documento CPF do Comprador',
  certidoesDoc: 'Certidões',
  contratoDoc: 'Contrato Compra e Venda',
  assinaturaContratoDoc: 'Contrato Assinado',
  escrituraDoc: 'Escritura',
  matriculaCartorioDoc: 'Matrícula do Cartório',
  comprovanteEnderecoImovelDoc: 'Comprovante de Endereço do Imóvel',
  // Also support DocumentPanel mapping keys
  numeroMatriculaDocFile: 'Documento da Matrícula',
  cadastroContribuinteDocFile: 'Comprovante Cadastro Contribuinte',
  rgVendedoresDocFile: 'Documento RG / CNH dos Vendedores',
  cpfVendedoresDocFile: 'Documento CPF dos Vendedores',
  rnmCompradorDocFile: 'Documento RNM do Comprador',
  cpfCompradorDocFile: 'Documento CPF do Comprador',
  certidoesDocFile: 'Certidões',
  contratoDocFile: 'Contrato Compra e Venda',
  assinaturaContratoDocFile: 'Contrato Assinado',
  escrituraDocFile: 'Escritura',
  matriculaCartorioDocFile: 'Matrícula do Cartório',
  comprovanteEnderecoImovelDocFile: 'Comprovante de Endereço do Imóvel',
  documentoAnexadoFile: 'Documento Anexado',
  // Perda de Nacionalidade
  protocoloDoc: 'Protocolo no SEI',
  extratoSeiDoc: 'Extrato do SEI',
  douDoc: 'DOU (Diário Oficial da União)',
  douRatificacaoDoc: 'DOU da Ratificação',
  protocoloManifestoDoc: 'Protocolo do Manifesto no SEI',
  documentoFinalizacaoDoc: 'Documento de Finalização',
  // Vistos - nomes amigáveis
  declaracaoResidenciaDocFile: 'Declaração de Residência',
  foto3x4DocFile: 'Foto/Selfie',
  documentoChinesDocFile: 'Documento Chinês',
  antecedentesCriminaisDocFile: 'Antecedentes Criminais',
  extratosBancariosDocFile: 'Extratos Bancários (Últimos 3)',
  impostoRendaDocFile: 'Imposto de Renda',
  formularioConsuladoDocFile: 'Formulário do Consulado',
};

function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();
}

function sanitizeClientName(clientName: string): string {
  return clientName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase();
}

export const BUCKET_NAME = 'juridico-documentos';
