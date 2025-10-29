# Deploy no Vercel - Sistema Jurídico Integrado

## Configurações Necessárias

### 1. Variáveis de Ambiente no Vercel

Configure as seguintes variáveis de ambiente no painel do Vercel:

**Importante:** Adicione essas variáveis diretamente no dashboard do Vercel em Configurações do Projeto > Variáveis de Ambiente. Não use secrets no vercel.json.

```
TURSO_CONNECTION_URL=sua_url_de_conexao_turso
TURSO_AUTH_TOKEN=seu_token_de_auth_turso
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_supabase
```

#### Como Adicionar Variáveis de Ambiente no Vercel:

1. Vá para o dashboard do seu projeto no Vercel
2. Clique na aba "Settings"
3. Clique em "Environment Variables" na barra lateral
4. Adicione cada variável com seu valor correspondente
5. Certifique-se de definir o ambiente (Production, Preview, Development) para cada variável

### 2. Configurações do Projeto

Certifique-se de que as seguintes configurações estão definidas no Vercel:

- **Framework Preset**: Next.js (detectado automaticamente)
- **Build Command**: Automático (Next.js)
- **Output Directory**: Automático (Next.js)
- **Install Command**: `npm install`
- **Node.js Version**: 18.x ou superior

**Importante**: Para projetos Next.js, o Vercel detecta automaticamente as configurações de build. Não é necessário especificar `buildCommand` ou `outputDirectory` no `vercel.json`.

### 3. Configurações Específicas

O arquivo `vercel.json` já está configurado com:
- Timeout de 30 segundos para funções API
- Região otimizada (iad1)
- Configurações de framework Next.js

### 4. Pré-requisitos

Certifique-se de que:
- O banco Turso está configurado e acessível
- O projeto Supabase está configurado
- Todas as migrações do banco foram executadas

### 5. Deploy

1. Conecte o repositório GitHub ao Vercel
2. Configure as variáveis de ambiente
3. O deploy será automático a cada push na branch main

### 6. Verificação Pós-Deploy

Após o deploy, verifique:
- [ ] Dashboard principal carrega corretamente
- [ ] APIs respondem adequadamente
- [ ] Autenticação funciona
- [ ] Conexão com banco de dados está ativa
- [ ] Todas as páginas do dashboard funcionam

### 7. Troubleshooting

Se houver problemas:
1. Verifique os logs do Vercel
2. Confirme se todas as variáveis de ambiente estão configuradas
3. Teste as conexões com Turso e Supabase
4. Verifique se não há erros de build no console