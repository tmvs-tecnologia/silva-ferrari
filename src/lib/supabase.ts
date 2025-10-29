import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  guiaPagaFile: 'Guia Paga',
  
  // Exame DNA
  resultadoExameDnaFile: 'Resultado do Exame de DNA',
  
  // Procuração
  procuracaoAnexadaFile: 'Procuração Anexada',
  
  // Petição
  peticaoAnexadaFile: 'Petição Anexada',
  
  // Processo
  processoAnexadoFile: 'Processo Anexado',
  
  // Exigências
  documentosFinaisAnexadosFile: 'Documentos Finais',
  
  // Finalização
  documentosProcessoFinalizadoFile: 'Documentos do Processo Finalizado',
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
