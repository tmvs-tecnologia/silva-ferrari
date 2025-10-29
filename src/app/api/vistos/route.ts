import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to convert snake_case to camelCase for vistos
function mapVistosDbFieldsToFrontend(record: any) {
  if (!record) return record;
  
  return {
    id: record.id,
    clientName: record.client_name,
    type: record.type,
    cpf: record.cpf,
    cpfDoc: record.cpf_doc,
    rnm: record.rnm,
    rnmDoc: record.rnm_doc,
    passaporte: record.passaporte,
    passaporteDoc: record.passaporte_doc,
    comprovanteEndereco: record.comprovante_endereco,
    comprovanteEnderecoDoc: record.comprovante_endereco_doc,
    certidaoNascimentoFilhos: record.certidao_nascimento_filhos,
    certidaoNascimentoFilhosDoc: record.certidao_nascimento_filhos_doc,
    cartaoCnpj: record.cartao_cnpj,
    cartaoCnpjDoc: record.cartao_cnpj_doc,
    contratoEmpresa: record.contrato_empresa,
    contratoEmpresaDoc: record.contrato_empresa_doc,
    escrituraImoveis: record.escritura_imoveis,
    escrituraImoveisDoc: record.escritura_imoveis_doc,
    reservasPassagens: record.reservas_passagens,
    reservasPassagensDoc: record.reservas_passagens_doc,
    reservasHotel: record.reservas_hotel,
    reservasHotelDoc: record.reservas_hotel_doc,
    seguroViagem: record.seguro_viagem,
    seguroViagemDoc: record.seguro_viagem_doc,
    roteiroViagem: record.roteiro_viagem,
    roteiroViagemDoc: record.roteiro_viagem_doc,
    taxa: record.taxa,
    taxaDoc: record.taxa_doc,
    status: record.status,
    notes: record.notes,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const { data: record, error } = await supabase
        .from('vistos')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ 
            error: 'Record not found',
            code: 'NOT_FOUND' 
          }, { status: 404 });
        }
        throw error;
      }

      // Map database fields to frontend format
      const mappedRecord = mapVistosDbFieldsToFrontend(record);
      return NextResponse.json(mappedRecord, { status: 200 });
    }

    // List with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    let query = supabase
      .from('vistos')
      .select('*');

    // Apply filters
    if (search) {
      query = query.ilike('client_name', `%${search}%`);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: results, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Map database fields to frontend format
    const mappedResults = (results || []).map(mapVistosDbFieldsToFrontend);

    return NextResponse.json(mappedResults, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await request.json();

    // Validate required fields
    if (!body.clientName || body.clientName.trim() === '') {
      return NextResponse.json({ 
        error: "clientName is required and cannot be empty",
        code: "MISSING_CLIENT_NAME" 
      }, { status: 400 });
    }

    if (!body.type || body.type.trim() === '') {
      return NextResponse.json({ 
        error: "type is required and cannot be empty",
        code: "MISSING_TYPE" 
      }, { status: 400 });
    }

    // Prepare data for Supabase (map camelCase to snake_case)
    const insertData = {
      client_name: body.clientName.trim(),
      type: body.type.trim(),
      cpf: body.cpf?.trim() || null,
      cpf_doc: body.cpfDoc?.trim() || null,
      rnm: body.rnm?.trim() || null,
      rnm_doc: body.rnmDoc?.trim() || null,
      passaporte: body.passaporte?.trim() || null,
      passaporte_doc: body.passaporteDoc?.trim() || null,
      comprovante_endereco: body.comprovanteEndereco?.trim() || null,
      comprovante_endereco_doc: body.comprovanteEnderecoDoc?.trim() || null,
      certidao_nascimento_filhos: body.certidaoNascimentoFilhos?.trim() || null,
      certidao_nascimento_filhos_doc: body.certidaoNascimentoFilhosDoc?.trim() || null,
      cartao_cnpj: body.cartaoCnpj?.trim() || null,
      cartao_cnpj_doc: body.cartaoCnpjDoc?.trim() || null,
      contrato_empresa: body.contratoEmpresa?.trim() || null,
      contrato_empresa_doc: body.contratoEmpresaDoc?.trim() || null,
      escritura_imoveis: body.escrituraImoveis?.trim() || null,
      escritura_imoveis_doc: body.escrituraImoveisDoc?.trim() || null,
      reservas_passagens: body.reservasPassagens?.trim() || null,
      reservas_passagens_doc: body.reservasPassagensDoc?.trim() || null,
      reservas_hotel: body.reservasHotel?.trim() || null,
      reservas_hotel_doc: body.reservasHotelDoc?.trim() || null,
      seguro_viagem: body.seguroViagem?.trim() || null,
      seguro_viagem_doc: body.seguroViagemDoc?.trim() || null,
      roteiro_viagem: body.roteiroViagem?.trim() || null,
      roteiro_viagem_doc: body.roteiroViagemDoc?.trim() || null,
      taxa: body.taxa?.trim() || null,
      taxa_doc: body.taxaDoc?.trim() || null,
      status: body.status?.trim() || 'Em Andamento',
      notes: body.notes?.trim() || null,
    };

    const { data: newRecord, error } = await supabase
      .from('vistos')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(newRecord, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists
    const { data: existing, error: existError } = await supabase
      .from('vistos')
      .select('id')
      .eq('id', parseInt(id))
      .single();

    if (existError) {
      if (existError.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'Record not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }
      throw existError;
    }

    const body = await request.json();

    // Prepare update data (only include provided fields, map camelCase to snake_case)
    const updateData: Record<string, any> = {};

    if (body.clientName !== undefined) {
      updateData.client_name = body.clientName.trim();
    }

    if (body.type !== undefined) {
      updateData.type = body.type.trim();
    }

    if (body.cpf !== undefined) {
      updateData.cpf = body.cpf?.trim() || null;
    }

    if (body.cpfDoc !== undefined) {
      updateData.cpf_doc = body.cpfDoc?.trim() || null;
    }

    if (body.rnm !== undefined) {
      updateData.rnm = body.rnm?.trim() || null;
    }

    if (body.rnmDoc !== undefined) {
      updateData.rnm_doc = body.rnmDoc?.trim() || null;
    }

    if (body.passaporte !== undefined) {
      updateData.passaporte = body.passaporte?.trim() || null;
    }

    if (body.passaporteDoc !== undefined) {
      updateData.passaporte_doc = body.passaporteDoc?.trim() || null;
    }

    if (body.comprovanteEndereco !== undefined) {
      updateData.comprovante_endereco = body.comprovanteEndereco?.trim() || null;
    }

    if (body.comprovanteEnderecoDoc !== undefined) {
      updateData.comprovante_endereco_doc = body.comprovanteEnderecoDoc?.trim() || null;
    }

    if (body.certidaoNascimentoFilhos !== undefined) {
      updateData.certidao_nascimento_filhos = body.certidaoNascimentoFilhos?.trim() || null;
    }

    if (body.certidaoNascimentoFilhosDoc !== undefined) {
      updateData.certidao_nascimento_filhos_doc = body.certidaoNascimentoFilhosDoc?.trim() || null;
    }

    if (body.cartaoCnpj !== undefined) {
      updateData.cartao_cnpj = body.cartaoCnpj?.trim() || null;
    }

    if (body.cartaoCnpjDoc !== undefined) {
      updateData.cartao_cnpj_doc = body.cartaoCnpjDoc?.trim() || null;
    }

    if (body.contratoEmpresa !== undefined) {
      updateData.contrato_empresa = body.contratoEmpresa?.trim() || null;
    }

    if (body.contratoEmpresaDoc !== undefined) {
      updateData.contrato_empresa_doc = body.contratoEmpresaDoc?.trim() || null;
    }

    if (body.escrituraImoveis !== undefined) {
      updateData.escritura_imoveis = body.escrituraImoveis?.trim() || null;
    }

    if (body.escrituraImoveisDoc !== undefined) {
      updateData.escritura_imoveis_doc = body.escrituraImoveisDoc?.trim() || null;
    }

    if (body.reservasPassagens !== undefined) {
      updateData.reservas_passagens = body.reservasPassagens?.trim() || null;
    }

    if (body.reservasPassagensDoc !== undefined) {
      updateData.reservas_passagens_doc = body.reservasPassagensDoc?.trim() || null;
    }

    if (body.reservasHotel !== undefined) {
      updateData.reservas_hotel = body.reservasHotel?.trim() || null;
    }

    if (body.reservasHotelDoc !== undefined) {
      updateData.reservas_hotel_doc = body.reservasHotelDoc?.trim() || null;
    }

    if (body.seguroViagem !== undefined) {
      updateData.seguro_viagem = body.seguroViagem?.trim() || null;
    }

    if (body.seguroViagemDoc !== undefined) {
      updateData.seguro_viagem_doc = body.seguroViagemDoc?.trim() || null;
    }

    if (body.roteiroViagem !== undefined) {
      updateData.roteiro_viagem = body.roteiroViagem?.trim() || null;
    }

    if (body.roteiroViagemDoc !== undefined) {
      updateData.roteiro_viagem_doc = body.roteiroViagemDoc?.trim() || null;
    }

    if (body.taxa !== undefined) {
      updateData.taxa = body.taxa?.trim() || null;
    }

    if (body.taxaDoc !== undefined) {
      updateData.taxa_doc = body.taxaDoc?.trim() || null;
    }

    if (body.status !== undefined) {
      updateData.status = body.status.trim();
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes?.trim() || null;
    }

    const { data: updated, error } = await supabase
      .from('vistos')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(updated, { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists and get it before deletion
    const { data: existing, error: existError } = await supabase
      .from('vistos')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (existError) {
      if (existError.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'Record not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }
      throw existError;
    }

    const { error } = await supabase
      .from('vistos')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      message: 'Record deleted successfully',
      record: existing
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}