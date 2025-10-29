import { pgTable, serial, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Ações Civeis table
export const acoesCiveis = pgTable('acoes_civeis', {
  id: serial('id').primaryKey(),
  clientName: text('client_name').notNull(),
  type: text('type').notNull(),
  currentStep: integer('current_step').default(0),
  status: text('status').notNull().default('Em Andamento'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  rnmMae: text('rnm_mae'),
  rnmPai: text('rnm_pai'),
  rnmSupostoPai: text('rnm_suposto_pai'),
  cpfMae: text('cpf_mae'),
  cpfPai: text('cpf_pai'),
  certidaoNascimento: text('certidao_nascimento'),
  comprovanteEndereco: text('comprovante_endereco'),
  passaporte: text('passaporte'),
  guiaPaga: text('guia_paga'),
  notes: text('notes'),
  // Step 2 fields
  dataExameDna: text('data_exame_dna'),
  // Step 3 fields
  procuracaoAnexada: text('procuracao_anexada'),
  // Step 4 fields
  peticaoAnexada: text('peticao_anexada'),
  // Step 5 fields
  processoAnexado: text('processo_anexado'),
  numeroProtocolo: text('numero_protocolo'),
  // Step 6 fields
  documentosFinaisAnexados: text('documentos_finais_anexados'),
  // Document URL fields for file uploads
  rnmMaeFile: text('rnm_mae_file'),
  rnmPaiFile: text('rnm_pai_file'),
  rnmSupostoPaiFile: text('rnm_suposto_pai_file'),
  cpfMaeFile: text('cpf_mae_file'),
  cpfPaiFile: text('cpf_pai_file'),
  certidaoNascimentoFile: text('certidao_nascimento_file'),
  comprovanteEnderecoFile: text('comprovante_endereco_file'),
  passaporteFile: text('passaporte_file'),
  guiaPagaFile: text('guia_paga_file'),
  resultadoExameDnaFile: text('resultado_exame_dna_file'),
  procuracaoAnexadaFile: text('procuracao_anexada_file'),
  peticaoAnexadaFile: text('peticao_anexada_file'),
  processoAnexadoFile: text('processo_anexado_file'),
  documentosFinaisAnexadosFile: text('documentos_finais_anexados_file'),
  documentosProcessoFinalizadoFile: text('documentos_processo_finalizado_file'),
});

// Compra Venda Imoveis table
export const compraVendaImoveis = pgTable('compra_venda_imoveis', {
  id: serial('id').primaryKey(),
  numeroMatricula: text('numero_matricula'),
  cadastroContribuinte: text('cadastro_contribuinte'),
  enderecoImovel: text('endereco_imovel'),
  rgVendedores: text('rg_vendedores'),
  cpfVendedores: text('cpf_vendedores'),
  dataNascimentoVendedores: text('data_nascimento_vendedores'),
  rnmComprador: text('rnm_comprador'),
  cpfComprador: text('cpf_comprador'),
  enderecoComprador: text('endereco_comprador'),
  currentStep: integer('current_step').default(0),
  status: text('status').notNull().default('Em Andamento'),
  prazoSinal: text('prazo_sinal'),
  prazoEscritura: text('prazo_escritura'),
  contractNotes: text('contract_notes'),
  stepNotes: text('step_notes'),
  completedSteps: text('completed_steps', { mode: 'json' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Perda Nacionalidade table
export const perdaNacionalidade = pgTable('perda_nacionalidade', {
  id: serial('id').primaryKey(),
  clientName: text('client_name').notNull(),
  rnmMae: text('rnm_mae'),
  rnmPai: text('rnm_pai'),
  cpfMae: text('cpf_mae'),
  cpfPai: text('cpf_pai'),
  certidaoNascimento: text('certidao_nascimento'),
  comprovanteEndereco: text('comprovante_endereco'),
  passaportes: text('passaportes'),
  documentoChines: text('documento_chines'),
  traducaoJuramentada: text('traducao_juramentada'),
  currentStep: integer('current_step').default(0),
  status: text('status').notNull().default('Em Andamento'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Vistos table
export const vistos = pgTable('vistos', {
  id: serial('id').primaryKey(),
  clientName: text('client_name').notNull(),
  type: text('type').notNull(),
  cpf: text('cpf'),
  rnm: text('rnm'),
  passaporte: text('passaporte'),
  comprovanteEndereco: text('comprovante_endereco'),
  certidaoNascimentoFilhos: text('certidao_nascimento_filhos'),
  cartaoCnpj: text('cartao_cnpj'),
  contratoEmpresa: text('contrato_empresa'),
  escrituraImoveis: text('escritura_imoveis'),
  reservasPassagens: text('reservas_passagens'),
  reservasHotel: text('reservas_hotel'),
  seguroViagem: text('seguro_viagem'),
  roteiroViagem: text('roteiro_viagem'),
  taxa: text('taxa'),
  status: text('status').notNull().default('Em Andamento'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Documents table
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  moduleType: text('module_type').notNull(),
  recordId: integer('record_id').notNull(),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  fileType: text('file_type').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// Alerts table
export const alerts = pgTable('alerts', {
  id: serial('id').primaryKey(),
  moduleType: text('module_type').notNull(),
  recordId: integer('record_id').notNull(),
  alertFor: text('alert_for').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Ações Trabalhistas table
export const acoesTrabalhistas = pgTable('acoes_trabalhistas', {
  id: serial('id').primaryKey(),
  clientName: text('client_name').notNull(),
  status: text('status').notNull().default('Em Andamento'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Ações Criminais table
export const acoesCriminais = pgTable('acoes_criminais', {
  id: serial('id').primaryKey(),
  clientName: text('client_name').notNull(),
  status: text('status').notNull().default('Em Andamento'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});