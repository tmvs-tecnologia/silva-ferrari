const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = "https://phfzqvmofnqwxszdgjch.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZnpxdm1vZm5xd3hzemRnamNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MTUzMiwiZXhwIjoyMDc3MjU3NTMyfQ.CPi3Ighr9H8M-3ImsgEUtP44HawTJ_PtfNKEhROStZk";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrate() {
  console.log("=== Starting Force Migration ===");
  const log = [];

  try {
    // 1. Fetch records from 'vistos'
    console.log("Fetching records from 'vistos'...");
    const { data: records, error: fetchError } = await supabase
      .from('vistos')
      .select('*')
      .ilike('type', '%urismo%');

    if (fetchError) throw fetchError;
    
    if (!records || records.length === 0) {
      console.log("No records found to migrate.");
      return;
    }

    console.log(`Found ${records.length} records to migrate.`);
    log.push(`Found ${records.length} records.`);

    let successCount = 0;
    let failCount = 0;

    for (const record of records) {
      console.log(`Processing ID ${record.id} (${record.client_name})...`);
      
      const insertData = {
        client_name: record.client_name,
        tipo_de_visto: 'Turismo',
        data_emissao: record.travel_start_date,
        data_validade: record.travel_end_date,
        status: record.status || 'Em Andamento',
        observacoes: record.notes,
        
        // Legacy fields mapping
        country: record.country,
        travel_start_date: record.travel_start_date,
        travel_end_date: record.travel_end_date,
        current_step: record.current_step,
        completed_steps: record.completed_steps,
        cpf: record.cpf,
        cpf_doc: record.cpf_doc,
        rnm: record.rnm,
        rnm_doc: record.rnm_doc,
        passaporte: record.passaporte,
        passaporte_doc: record.passaporte_doc,
        comprovante_endereco: record.comprovante_endereco,
        comprovante_endereco_doc: record.comprovante_endereco_doc,
        declaracao_residencia_doc: record.declaracao_residencia_doc,
        foto_3x4_doc: record.foto_3x4_doc,
        documento_chines: record.documento_chines,
        documento_chines_doc: record.documento_chines_doc,
        antecedentes_criminais: record.antecedentes_criminais,
        antecedentes_criminais_doc: record.antecedentes_criminais_doc,
        certidao_nascimento_filhos: record.certidao_nascimento_filhos,
        certidao_nascimento_filhos_doc: record.certidao_nascimento_filhos_doc,
        cartao_cnpj: record.cartao_cnpj,
        cartao_cnpj_doc: record.cartao_cnpj_doc,
        contrato_empresa: record.contrato_empresa,
        contrato_empresa_doc: record.contrato_empresa_doc,
        escritura_imoveis: record.escritura_imoveis,
        escritura_imoveis_doc: record.escritura_imoveis_doc,
        extratos_bancarios: record.extratos_bancarios,
        extratos_bancarios_doc: record.extratos_bancarios_doc,
        imposto_renda: record.imposto_renda,
        imposto_renda_doc: record.imposto_renda_doc,
        reservas_passagens: record.reservas_passagens,
        reservas_passagens_doc: record.reservas_passagens_doc,
        reservas_hotel: record.reservas_hotel,
        reservas_hotel_doc: record.reservas_hotel_doc,
        seguro_viagem: record.seguro_viagem,
        seguro_viagem_doc: record.seguro_viagem_doc,
        roteiro_viagem: record.roteiro_viagem,
        roteiro_viagem_doc: record.roteiro_viagem_doc,
        taxa: record.taxa,
        taxa_doc: record.taxa_doc,
        formulario_consulado: record.formulario_consulado,
        formulario_consulado_doc: record.formulario_consulado_doc,
        
        created_at: record.created_at,
        updated_at: record.updated_at
      };

      // Insert into 'turismo'
      const { error: insertError } = await supabase
        .from('turismo')
        .insert(insertData);
      
      if (insertError) {
        console.error(`Failed to insert ID ${record.id}:`, insertError.message);
        log.push(`Failed ID ${record.id}: ${insertError.message}`);
        failCount++;
        continue;
      }

      // If successful, delete from 'vistos'
      // Only delete if insert was successful
      const { error: deleteError } = await supabase
        .from('vistos')
        .delete()
        .eq('id', record.id);
        
      if (deleteError) {
        console.warn(`Inserted but failed to delete from 'vistos' ID ${record.id}:`, deleteError.message);
        log.push(`Warning ID ${record.id}: Inserted but delete failed`);
      } else {
        console.log(`Successfully migrated ID ${record.id}`);
        successCount++;
      }
    }

    console.log("=== Migration Finished ===");
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);

  } catch (err) {
    console.error("Fatal Error:", err);
  }
}

migrate();
