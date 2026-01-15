const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase (lidas do ambiente ou hardcoded para este script)
const supabaseUrl = "https://phfzqvmofnqwxszdgjch.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZnpxdm1vZm5xd3hzemRnamNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MTUzMiwiZXhwIjoyMDc3MjU3NTMyfQ.CPi3Ighr9H8M-3ImsgEUtP44HawTJ_PtfNKEhROStZk";

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("=== Iniciando Migração de Vistos de Turismo ===");
  
  try {
    // 1. Verificar se a tabela 'turismo' existe (tentando um select simples)
    const { error: tableCheckError } = await supabase
      .from('turismo')
      .select('id')
      .limit(1);

    if (tableCheckError && tableCheckError.code === '42P01') { // undefined_table
      console.error("ERRO CRÍTICO: A tabela 'turismo' não existe no banco de dados.");
      console.error("Por favor, execute o script SQL 'drizzle/0099_migrate_turismo.sql' no Editor SQL do Supabase Dashboard antes de rodar este script.");
      process.exit(1);
    }

    // 2. Buscar registros pendentes na tabela 'vistos'
    console.log("Buscando registros de Turismo na tabela antiga 'vistos'...");
    const { data: unmigrated, error: fetchError } = await supabase
      .from('vistos')
      .select('*')
      .ilike('type', '%urismo%'); // Busca flexível por "Turismo", "Visto de Turismo", etc.

    if (fetchError) throw fetchError;
    
    if (!unmigrated || unmigrated.length === 0) {
      console.log("Nenhum registro pendente encontrado. Tudo parece estar sincronizado.");
      return;
    }

    console.log(`Encontrados ${unmigrated.length} registros para migrar.`);

    let successCount = 0;
    let errorCount = 0;

    for (const record of unmigrated) {
      console.log(`Migrando ID ${record.id} - ${record.client_name}...`);
      
      const insertData = {
        client_name: record.client_name,
        tipo_de_visto: 'Turismo', // Padronizado
        data_emissao: record.travel_start_date,
        data_validade: record.travel_end_date,
        status: record.status || 'Em Andamento',
        observacoes: record.notes,
        
        // Campos legados e compatibilidade
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

      // Inserir na nova tabela
      const { error: insertError } = await supabase
        .from('turismo')
        .insert(insertData);
      
      if (insertError) {
        console.error(`  [ERRO] Falha ao inserir ID ${record.id}: ${insertError.message}`);
        errorCount++;
        continue;
      }

      // Remover da tabela antiga
      const { error: deleteError } = await supabase
        .from('vistos')
        .delete()
        .eq('id', record.id);
        
      if (deleteError) {
        console.error(`  [AVISO] Inserido na tabela nova, mas falha ao remover da antiga ID ${record.id}: ${deleteError.message}`);
      } else {
        console.log(`  [SUCESSO] Migrado ID ${record.id}`);
        successCount++;
      }
    }
    
    console.log("=== Migração Concluída ===");
    console.log(`Sucessos: ${successCount}`);
    console.log(`Erros: ${errorCount}`);

  } catch (e) {
    console.error(`Erro fatal no script: ${e.message}`);
  }
}

main();
