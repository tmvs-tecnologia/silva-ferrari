## Objetivo
- Permitir definir, exibir e editar um responsável e uma data limite para cada etapa do fluxo (a partir do `div` do componente de etapa).
- Persistir em Supabase via MCP Advogado, preparando uso futuro em um calendário de tarefas pendentes.

## Modelo de Dados (Supabase)
- Nova tabela: `step_assignments`
- Campos:
  - `id` (PK), `module_type` (e.g., `acoes_civeis`), `record_id` (ID do caso), `step_index` (índice da etapa), `responsible_name` (texto), `due_date` (date), `created_at`, `updated_at`
- Regras:
  - Unique: (`module_type`, `record_id`, `step_index`)
  - Índices em `module_type`, `record_id`, `due_date` (para consultas e calendário)
- Criação com MCP Advogado (SQL):
  - `CREATE TABLE step_assignments (...);`
  - `CREATE UNIQUE INDEX ux_step_assignments ON step_assignments(module_type, record_id, step_index);`

## API (Next.js)
- Novo endpoint: `src/app/api/step-assignments/route.ts`
- Métodos:
  - `GET` por `moduleType` + `recordId` → lista assignments do caso
  - `POST` → cria/atualiza (upsert) assignment de uma etapa
  - `PATCH` → atualiza apenas campos enviados
  - `DELETE` → remove assignment de uma etapa
- Padrão camelCase → snake_case (como em `src/app/api/acoes-civeis/[id]/route.ts:84-138`)

## UI/UX
- Local de integração: `src/components/detail/StepItem.tsx` e uso em `ProcessFlow`
- Exibição no cabeçalho da etapa:
  - Mostrar `responsible_name` e `due_date` ao lado do título
  - Cores: vencido (vermelho), próximo do prazo (âmbar), no prazo (muted)
  - Ícones: `lucide:clock` para prazo, `lucide:user` para responsável
- Edição:
  - Botão "Editar" (ícone lápis) abre um popover com
    - Input `responsável` (texto)
    - Date picker minimalista
- Date picker:
  - Usar `react-day-picker` em um `Popover` Radix para um calendário minimalista
  - Alternativa de fallback: `<input type="date">` estilizado com `Input`
- Ações:
  - Salvar → `POST/PATCH` para `/api/step-assignments` (upsert)
  - Remover → `DELETE`

## Integração no Detalhe da Ação Cível
- Arquivo: `src/app/dashboard/acoes-civeis/[id]/page.tsx`
  - Ao carregar o caso: além de `/api/acoes-civeis/${id}`, fazer `GET /api/step-assignments?moduleType=acoes_civeis&recordId=${id}`
  - Mapear assignments por `step_index` e repassar a `ProcessFlow`/`StepItem`
  - Atualizar renderização das etapas para mostrar a label e prazo
- Referências já existentes:
  - Fluxo renderizado em `ProcessFlow`: `src/components/detail/ProcessFlow.tsx:49-71`
  - Card de etapa e ícone clicável: `src/components/detail/StepItem.tsx:20-75`

## Reuso entre Módulos
- Usar `module_type` genérico (`acoes_civeis`, `acoes_trabalhistas`, etc.) para reaproveitar a mesma tabela e endpoint.
- Extensível para calendário global de tarefas (filtros por data e responsável).

## Validação
- Testar no preview:
  - Criar/editar responsável e prazo em uma etapa de Ação Cível
  - Verificar persistência e exibição no cabeçalho da etapa
  - Verificar estilos de prazo
- Logs e erros tratados no endpoint (padrão dos demais endpoints do projeto)

## Passos de Implementação
1. Criar tabela `step_assignments` em Supabase via MCP Advogado (SQL com índices/unique).
2. Implementar `src/app/api/step-assignments/route.ts` com GET/POST/PATCH/DELETE.
3. Carregar assignments no detalhe (`[id]/page.tsx`) e repassar ao `ProcessFlow`.
4. Atualizar `StepItem` para exibir label/responsável e prazo, com popover de edição + date picker minimalista.
5. Estilos de status de prazo (vencido/alerta/ok) e ícones.
6. Testes manuais no preview e correções.

## Notas Técnicas
- Usar `@supabase/supabase-js` com `SUPABASE_SERVICE_ROLE_KEY` para escrita (como nos endpoints existentes).
- Manter padrão camelCase na API e UI; persistir snake_case no banco.
- Sem impacto na estrutura atual de `acoes_civeis`; dados ficam em tabela separada conforme solicitado.

Confirma que posso executar a criação da tabela com MCP Advogado, implementar o endpoint e integrar a UI nas etapas do fluxo?