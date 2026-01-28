-- ========================================
-- SISTEMA JURÍDICO - ESCRITÓRIO DE ADVOCACIA
-- SQL COMPLETO PARA SUPABASE (PostgreSQL)
-- ========================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. TABELA DE USUÁRIOS
-- ========================================
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ========================================
-- 2. TABELA DE AÇÕES CÍVEIS (COMPLETA)
-- ========================================
CREATE TABLE acoes_civeis (
  id BIGSERIAL PRIMARY KEY,
  client_name VARCHAR(500) NOT NULL,
  type VARCHAR(100) NOT NULL,
  current_step INTEGER DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'Em Andamento',
  notes TEXT,
  
  -- Passo 0 - Documentos Básicos
  rnm_mae VARCHAR(255),
  rnm_mae_doc VARCHAR(500),
  rnm_pai VARCHAR(255),
  rnm_pai_doc VARCHAR(500),
  rnm_suposto_pai VARCHAR(255),
  rnm_suposto_pai_doc VARCHAR(500),
  cpf_mae VARCHAR(20),
  cpf_pai VARCHAR(20),
  certidao_nascimento TEXT,
  certidao_nascimento_doc VARCHAR(500),
  comprovante_endereco TEXT,
  comprovante_endereco_doc VARCHAR(500),
  passaporte TEXT,
  passaporte_doc VARCHAR(500),
  guia_paga TEXT,
  
  -- Passo 1 - Agendar Exame DNA
  data_exame_dna DATE,
  resultado_exame_dna TEXT,
  resultado_exame_dna_doc VARCHAR(500),
  
  -- Passo 2 - Procuração
  procuracao_anexada TEXT,
  procuracao_anexada_doc VARCHAR(500),
  
  -- Passo 3 - Petição
  peticao_anexada TEXT,
  peticao_anexada_doc VARCHAR(500),
  
  -- Passo 4 - Protocolo do Processo
  processo_anexado TEXT,
  numero_protocolo VARCHAR(100),
  processo_anexado_doc VARCHAR(500),
  
  -- Passo 5 - Exigências do Juiz
  documentos_finais_anexados TEXT,
  documentos_finais_anexados_doc VARCHAR(500),
  
  -- Passo 6 - Processo Finalizado
  documentos_processo_finalizado TEXT,
  documentos_processo_finalizado_doc VARCHAR(500),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_acoes_civeis_client_name ON acoes_civeis(client_name);
CREATE INDEX idx_acoes_civeis_type ON acoes_civeis(type);
CREATE INDEX idx_acoes_civeis_status ON acoes_civeis(status);
CREATE INDEX idx_acoes_civeis_current_step ON acoes_civeis(current_step);
CREATE INDEX idx_acoes_civeis_created_at ON acoes_civeis(created_at DESC);

-- ========================================
-- 3. TABELA DE AÇÕES TRABALHISTAS
-- ========================================
CREATE TABLE acoes_trabalhistas (
  id BIGSERIAL PRIMARY KEY,
  client_name VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Em Andamento',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_acoes_trabalhistas_client_name ON acoes_trabalhistas(client_name);
CREATE INDEX idx_acoes_trabalhistas_status ON acoes_trabalhistas(status);
CREATE INDEX idx_acoes_trabalhistas_created_at ON acoes_trabalhistas(created_at DESC);

-- ========================================
-- 4. TABELA DE AÇÕES CRIMINAIS
-- ========================================
CREATE TABLE acoes_criminais (
  id BIGSERIAL PRIMARY KEY,
  client_name VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Em Andamento',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_acoes_criminais_client_name ON acoes_criminais(client_name);
CREATE INDEX idx_acoes_criminais_status ON acoes_criminais(status);
CREATE INDEX idx_acoes_criminais_created_at ON acoes_criminais(created_at DESC);

-- ========================================
-- 5. TABELA DE COMPRA E VENDA DE IMÓVEIS
-- ========================================
CREATE TABLE compra_venda_imoveis (
  id BIGSERIAL PRIMARY KEY,
  
  -- Dados do Imóvel
  numero_matricula VARCHAR(100),
  numero_matricula_doc VARCHAR(500),
  cadastro_contribuinte VARCHAR(100),
  cadastro_contribuinte_doc VARCHAR(500),
  endereco_imovel TEXT,
  
  -- Dados dos Vendedores
  rg_vendedores TEXT,
  rg_vendedores_doc VARCHAR(500),
  cpf_vendedores TEXT,
  cpf_vendedores_doc VARCHAR(500),
  data_nascimento_vendedores TEXT,
  
  -- Dados do Comprador
  rnm_comprador VARCHAR(255),
  rnm_comprador_doc VARCHAR(500),
  cpf_comprador VARCHAR(20),
  cpf_comprador_doc VARCHAR(500),
  endereco_comprador TEXT,
  
  -- Controle de Workflow
  current_step INTEGER DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'Em Andamento',
  
  -- Prazos e Observações
  prazo_sinal DATE,
  prazo_escritura DATE,
  contract_notes TEXT,
  
  -- Documentos dos Passos
  certidoes_doc VARCHAR(500),
  contrato_doc VARCHAR(500),
  assinatura_contrato_doc VARCHAR(500),
  escritura_doc VARCHAR(500),
  matricula_cartorio_doc VARCHAR(500),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compra_venda_endereco ON compra_venda_imoveis(endereco_imovel);
CREATE INDEX idx_compra_venda_status ON compra_venda_imoveis(status);
CREATE INDEX idx_compra_venda_current_step ON compra_venda_imoveis(current_step);
CREATE INDEX idx_compra_venda_created_at ON compra_venda_imoveis(created_at DESC);

-- ========================================
-- 6. TABELA DE PERDA DE NACIONALIDADE BRASILEIRA
-- ========================================
CREATE TABLE perda_nacionalidade (
  id BIGSERIAL PRIMARY KEY,
  client_name VARCHAR(500) NOT NULL,
  
  -- Documentos dos Pais
  rnm_mae VARCHAR(255),
  rnm_mae_doc VARCHAR(500),
  rnm_pai VARCHAR(255),
  rnm_pai_doc VARCHAR(500),
  cpf_mae VARCHAR(20),
  cpf_pai VARCHAR(20),
  
  -- Documentos do Cliente
  certidao_nascimento TEXT,
  certidao_nascimento_doc VARCHAR(500),
  comprovante_endereco TEXT,
  comprovante_endereco_doc VARCHAR(500),
  passaportes TEXT,
  passaportes_doc VARCHAR(500),
  documento_chines TEXT,
  documento_chines_doc VARCHAR(500),
  traducao_juramentada TEXT,
  traducao_juramentada_doc VARCHAR(500),
  
  -- Documentos dos Passos
  procuracao_doc VARCHAR(500),
  pedido_perda_doc VARCHAR(500),
  protocolo_doc VARCHAR(500),
  dou_doc VARCHAR(500),
  passaporte_chines_doc VARCHAR(500),
  manifesto_doc VARCHAR(500),
  portaria_doc VARCHAR(500),
  
  -- Controle de Workflow
  current_step INTEGER DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'Em Andamento',
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_perda_nacionalidade_client_name ON perda_nacionalidade(client_name);
CREATE INDEX idx_perda_nacionalidade_status ON perda_nacionalidade(status);
CREATE INDEX idx_perda_nacionalidade_current_step ON perda_nacionalidade(current_step);
CREATE INDEX idx_perda_nacionalidade_created_at ON perda_nacionalidade(created_at DESC);

-- ========================================
-- 7. TABELA DE VISTOS
-- ========================================
CREATE TABLE vistos (
  id BIGSERIAL PRIMARY KEY,
  client_name VARCHAR(500) NOT NULL,
  type VARCHAR(100) NOT NULL, -- Turismo, Trabalho, Investidor
  
  -- Documentos Pessoais
  cpf VARCHAR(20),
  cpf_doc VARCHAR(500),
  rnm VARCHAR(255),
  rnm_doc VARCHAR(500),
  passaporte TEXT,
  passaporte_doc VARCHAR(500),
  comprovante_endereco TEXT,
  comprovante_endereco_doc VARCHAR(500),
  
  -- Comprovação Financeira
  certidao_nascimento_filhos TEXT,
  certidao_nascimento_filhos_doc VARCHAR(500),
  cartao_cnpj TEXT,
  cartao_cnpj_doc VARCHAR(500),
  contrato_empresa TEXT,
  contrato_empresa_doc VARCHAR(500),
  escritura_imoveis TEXT,
  escritura_imoveis_doc VARCHAR(500),
  
  -- Documentos de Viagem (para Turismo)
  reservas_passagens TEXT,
  reservas_passagens_doc VARCHAR(500),
  reservas_hotel TEXT,
  reservas_hotel_doc VARCHAR(500),
  seguro_viagem TEXT,
  seguro_viagem_doc VARCHAR(500),
  roteiro_viagem TEXT,
  roteiro_viagem_doc VARCHAR(500),
  taxa TEXT,
  taxa_doc VARCHAR(500),
  
  -- Controle
  status VARCHAR(50) NOT NULL DEFAULT 'Em Andamento',
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vistos_client_name ON vistos(client_name);
CREATE INDEX idx_vistos_type ON vistos(type);
CREATE INDEX idx_vistos_status ON vistos(status);
CREATE INDEX idx_vistos_created_at ON vistos(created_at DESC);

-- ========================================
-- 8. TABELA DE DOCUMENTOS (ARQUIVOS ANEXADOS)
-- ========================================
CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  module_type VARCHAR(100) NOT NULL, -- 'acoes_civeis', 'compra_venda', etc
  record_id BIGINT NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_path VARCHAR(1000) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size BIGINT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_module_type ON documents(module_type);
CREATE INDEX idx_documents_record_id ON documents(record_id);
CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at DESC);

CREATE TABLE pending_documents (
  id BIGSERIAL PRIMARY KEY,
  module_type VARCHAR(100) NOT NULL, -- 'vistos', 'turismo'
  record_id BIGINT NOT NULL,
  client_name VARCHAR(500) NOT NULL,
  pending JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (module_type, record_id)
);

CREATE INDEX idx_pending_documents_module_type ON pending_documents(module_type);
CREATE INDEX idx_pending_documents_record_id ON pending_documents(record_id);
CREATE INDEX idx_pending_documents_client_name ON pending_documents(client_name);
CREATE INDEX idx_pending_documents_updated_at ON pending_documents(updated_at DESC);

-- ========================================
-- 9. TABELA DE ALERTAS E NOTIFICAÇÕES
-- ========================================
CREATE TABLE alerts (
  id BIGSERIAL PRIMARY KEY,
  module_type VARCHAR(100) NOT NULL,
  record_id BIGINT NOT NULL,
  alert_for VARCHAR(255) NOT NULL, -- JESSICA, JAILDA, WENDEL, GUILHERME, FÁBIO, MARRONE, FANG
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_module_type ON alerts(module_type);
CREATE INDEX idx_alerts_record_id ON alerts(record_id);
CREATE INDEX idx_alerts_alert_for ON alerts(alert_for);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);

-- ========================================
-- 10. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ========================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para todas as tabelas com updated_at
CREATE TRIGGER update_acoes_civeis_updated_at BEFORE UPDATE ON acoes_civeis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_acoes_trabalhistas_updated_at BEFORE UPDATE ON acoes_trabalhistas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_acoes_criminais_updated_at BEFORE UPDATE ON acoes_criminais
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compra_venda_imoveis_updated_at BEFORE UPDATE ON compra_venda_imoveis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_perda_nacionalidade_updated_at BEFORE UPDATE ON perda_nacionalidade
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vistos_updated_at BEFORE UPDATE ON vistos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pending_documents_updated_at BEFORE UPDATE ON pending_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 11. DADOS INICIAIS (SEED)
-- ========================================

-- Inserir usuário admin padrão
INSERT INTO users (email, password, name, role, created_at)
VALUES ('admin@admin.com', '1234', 'Administrador', 'admin', NOW())
ON CONFLICT (email) DO NOTHING;

-- ========================================
-- 12. COMENTÁRIOS NAS TABELAS
-- ========================================

COMMENT ON TABLE users IS 'Usuários do sistema - Login e autenticação';
COMMENT ON TABLE acoes_civeis IS 'Ações Cíveis - Exame DNA, Alteração Nome, Guarda, Divórcio, Usucapião';
COMMENT ON TABLE acoes_trabalhistas IS 'Ações Trabalhistas';
COMMENT ON TABLE acoes_criminais IS 'Ações Criminais';
COMMENT ON TABLE compra_venda_imoveis IS 'Compra e Venda de Imóveis';
COMMENT ON TABLE perda_nacionalidade IS 'Pedido de Perda de Nacionalidade Brasileira';
COMMENT ON TABLE vistos IS 'Vistos - Turismo, Trabalho, Investidor';
COMMENT ON TABLE documents IS 'Registro de arquivos anexados a processos';
COMMENT ON TABLE pending_documents IS 'Documentos pendentes por processo, agrupados por fluxo/etapa';
COMMENT ON TABLE alerts IS 'Sistema de alertas e notificações para equipe';
