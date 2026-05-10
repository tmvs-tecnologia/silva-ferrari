import { NextResponse } from 'next/server';
import { LexmlService } from '@/lib/lexml';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const urn = searchParams.get('urn');

    if (!urn) {
      return NextResponse.json({ error: "URN não fornecida." }, { status: 400 });
    }

    const metadata = await LexmlService.getMetadata(urn);

    if (!metadata) {
      return NextResponse.json({ 
        success: false, 
        error: "Não foi possível extrair metadados para esta URN." 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      metadata
    });

  } catch (error: any) {
    console.error("Erro na API de Metadados LexML:", error);
    return NextResponse.json({ error: "Erro interno ao extrair metadados." }, { status: 500 });
  }
}
