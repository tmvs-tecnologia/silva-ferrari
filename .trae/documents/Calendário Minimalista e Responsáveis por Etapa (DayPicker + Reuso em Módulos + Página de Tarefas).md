## Objetivo
- Substituir o input de data por um calendário minimalista com react-day-picker dentro de Popover nas etapas do fluxo.
- Reutilizar a funcionalidade de responsável/prazo em Ações Trabalhistas e Vistos (e demais módulos), usando `module_type` e a tabela `step_assignments`.
- Criar uma página de “Calendário de Tarefas” com filtros por responsável, módulo e período, consumindo `step_assignments`.

## Dependências e Padrões
- Já existe `react-day-picker` no projeto; usaremos um DayPicker single-date com estilo minimalista (sem range, cores discretas, hoje marcado).
- Manter camelCase na UI e snake_case no banco, via endpoint `step-assignments`.

## Implementação: Calendário (DayPicker) no Popover
- Arquivo alvo: `src/components/detail/StepItem.tsx`
- Trocar `<Input type="date">` pelo `DayPicker` dentro de `PopoverContent`:
  - Configuração: `mode="single"`, `selected`, `onSelect` atualizando o estado local, locale pt-BR.
  - Estilização: classes Tailwind minimalistas (background branco, borda sutil, hoje destacado, seleção com azul discreto).
  - Ação Salvar mantém o fluxo atual (`onSaveAssignment`) usando a data selecionada.

## Reuso em Outros Módulos
- Ações Trabalhistas:
  - Arquivo: `src/app/dashboard/acoes-trabalhistas/[id]/page.tsx`
  - Carregar assignments via `GET /api/step-assignments?moduleType=acoes_trabalhistas&recordId={id}`.
  - Passar `assignments` para `ProcessFlow`/`StepItem` e implementar `onSaveAssignment` com `moduleType=acoes_trabalhistas`.
- Vistos:
  - Arquivo: `src/app/dashboard/vistos/[id]/page.tsx`
  - Carregar assignments via `GET /api/step-assignments?moduleType=vistos&recordId={id}`.
  - Passar `assignments` e salvar com `moduleType=vistos`.
- Nota: Se `ProcessFlow` for compartilhado, manter API de `StepItem` já preparada (recebe `assignments` e `onSaveAssignment`). Apenas o detalhe de cada módulo faz o fetch e o save.

## Página “Calendário de Tarefas”
- Rota: `src/app/dashboard/calendario/page.tsx`.
- UI:
  - Filtros: responsável (texto/select com sugeridos), módulo (`acoes_civeis`, `acoes_trabalhistas`, `vistos`, etc.), intervalo de datas.
  - Lista/grade por dia: cards com tarefas (responsável, cliente, módulo, etapa, data limite); badges de status (vencido/alerta/ok).
  - Link para o detalhe da tarefa (navega para `[id]` do módulo correto, opcionalmente abrindo etapa).
- API:
  - Novo endpoint global: `src/app/api/tasks/route.ts` com `GET` (opcional: por período/responsável/módulo). Retorna dados agregados de `step_assignments` + os nomes dos clientes (join por módulo/record_id) quando possível.
  - Alternativa: estender `step-assignments` para suportar consulta global (sem `moduleType`), mas manteremos endpoint dedicado para clareza sem impactar o contrato atual.

## Estilos e UX
- DayPicker minimalista: foco em legibilidade, sem animações pesadas; hoje marcado, seleção com realce suave.
- Popover compacto, com Label/Inputs alinhados.
- Cores de prazo:
  - Vencido: vermelho
  - <=3 dias: âmbar
  - >3 dias: muted

## Validação
- Testar DayPicker selecionando datas e salvando assignments; recarregar e confirmar persistência.
- Verificar reuso em Ações Trabalhistas e Vistos com criação/edição de responsável/prazo.
- Validar filtros na página de calendário (responsável, módulo, período) e navegação para detalhes.

## Passos
1. Atualizar `StepItem` para usar DayPicker no Popover e converter `selected` para string ISO (yyyy-mm-dd) no `onSaveAssignment`.
2. Integrar `assignments` e `onSaveAssignment` nos detalhes de Ações Trabalhistas e Vistos (fetch + save com `moduleType`).
3. Implementar `src/app/api/tasks/route.ts` (GET com filtros: `responsible`, `moduleType`, `from`, `to`).
4. Criar `src/app/dashboard/calendario/page.tsx` com filtros e listagem por dia, consumindo `/api/tasks`.
5. Testes manuais e ajustes finos de estilo.

Confirma que posso aplicar o DayPicker, integrar nos módulos e criar a página de calendário agora?