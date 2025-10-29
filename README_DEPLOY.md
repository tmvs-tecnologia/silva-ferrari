# Guia de Deploy no Vercel

Este guia fornece instruções detalhadas para fazer o deploy do projeto no Vercel.

## Configurações Necessárias

### Variáveis de Ambiente

Configure as seguintes variáveis de ambiente diretamente no dashboard do Vercel:

- `TURSO_CONNECTION_URL`: URL de conexão com o banco Turso
- `TURSO_AUTH_TOKEN`: Token de autenticação do Turso
- `NEXT_PUBLIC_SUPABASE_URL`: URL pública do Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima pública do Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de service role do Supabase

### Configurações do Projeto

O projeto está configurado para usar as configurações automáticas do Vercel para Next.js:

- **Framework**: Next.js (detectado automaticamente)
- **Build Command**: Detectado automaticamente (`npm run build`)
- **Output Directory**: Detectado automaticamente (`.next`)
- **Install Command**: Detectado automaticamente (`npm install`)

### Configurações Simplificadas

O projeto foi otimizado para usar as configurações padrão do Vercel para Next.js, removendo configurações customizadas que podem causar conflitos. O Vercel detectará automaticamente:

- Comandos de build
- Diretório de output
- Configurações de função
- Otimizações de performance

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