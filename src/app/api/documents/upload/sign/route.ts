import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import { createClient } from '@supabase/supabase-js';
import { BUCKET_NAME } from '@/lib/supabase';

// Create Supabase client with service role key for storage operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Map field names to organized folder structure (copied from upload/route.ts)
const FIELD_TO_STEP_MAP: Record<string, string> = {
  rnmMaeFile: 'documentos-iniciais',
  rnmPaiFile: 'documentos-iniciais',
  rnmSupostoPaiFile: 'documentos-iniciais',
  certidaoNascimentoFile: 'documentos-iniciais',
  comprovanteEnderecoFile: 'documentos-iniciais',
  passaporteFile: 'documentos-iniciais',
  guiaPagaFile: 'guia-judicial',
  resultadoExameDnaFile: 'exame-dna',
  procuracaoAnexadaFile: 'procuracao',
  procuracaoClienteFile: 'procuracao',
  peticaoAnexadaFile: 'peticao',
  peticaoClienteFile: 'peticao',
  processoAnexadoFile: 'processo',
  documentosFinaisAnexadosFile: 'exigencias',
  documentosProcessoFinalizadoFile: 'finalizacao',
  ownerRnmFile: 'usucapiao-dono',
  ownerCpfFile: 'usucapiao-dono',
  declaracaoVizinhosFile: 'usucapiao-vizinhos',
  matriculaImovelFile: 'usucapiao-matricula',
  contaAguaFile: 'usucapiao-agua',
  contaLuzFile: 'usucapiao-luz',
  iptuFile: 'usucapiao-iptu',
  contratoEngenheiroFile: 'usucapiao-engenheiro',
  protocoloDoc: 'protocolo',
  extratoSeiDoc: 'protocolo',
  douDoc: 'deferimento',
  douRatificacaoDoc: 'ratificacao',
  protocoloManifestoDoc: 'protocolo',
  documentoFinalizacaoDoc: 'finalizacao',
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
    const body = await request.json();
    const { fileName, fileType, caseId, moduleType, fieldName, clientName, entityId } = body;

    // Use either caseId or entityId
    const recordId = caseId || entityId;

    if (!fileName || !recordId || !fieldName) {
      return NextResponse.json(
        { error: 'Dados incompletos (fileName, recordId, fieldName são obrigatórios)' },
        { status: 400 }
      );
    }

    // Determine Client Name
    let finalClientName = clientName;
    if (!finalClientName && moduleType === 'acoes_civeis') {
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
    if (moduleType === 'compra_venda_imoveis') {
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

    // Also get the public URL for future reference (although it won't be accessible until upload is done if bucket is public, or we need another signed URL for download)
    // Assuming the bucket is public-read or we store the path to generate signed download URLs later.
    // The previous implementation stored publicUrl.
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
