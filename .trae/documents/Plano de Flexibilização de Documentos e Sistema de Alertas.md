O plano a seguir detalha as modificações necessárias para atender aos requisitos de flexibilização do upload de documentos, implementação de sistema de alertas e melhorias na interface e processo.

### 1. Flexibilização da Criação de Ações (Frontend)
**Objetivo:** Permitir a criação de Vistos e Turismo sem bloquear por falta de documentos, transformando erros impeditivos em alertas.

*   **Arquivos Alvo:**
    *   `src/app/dashboard/vistos/novo/page.tsx`
    *   `src/app/dashboard/turismo/novo/page.tsx`
*   **Ações:**
    *   **Remover Validação Bloqueante:** Excluir os blocos de código `if (missing.length > 0) { alert(...) return; }` nas funções `handleSubmit`.
    *   **Identificação de Pendências:** Manter a lógica de verificação de documentos "obrigatórios" apenas para:
        1.  Exibir avisos visuais na interface (badges "Obrigatório").
        2.  Coletar a lista de documentos faltantes no momento do envio.
    *   **Geração de Alertas:** Após a criação bem-sucedida do registro (no `handleSubmit`), iterar sobre a lista de documentos faltantes e chamar a API `/api/alerts` para criar um registro de pendência para cada um.

### 2. Melhorias no Sistema de Upload
**Objetivo:** Expandir compatibilidade e robustez do upload.

*   **Arquivos Alvo:**
    *   `src/app/dashboard/vistos/novo/page.tsx` (e Turismo)
    *   `src/app/api/documents/upload/route.ts`
*   **Ações:**
    *   **Expandir Formatos:** Atualizar a função `validateFile` no frontend para aceitar uma gama maior de formatos (DOCX, XLSX, TXT, etc.) além de PDF e Imagens.
    *   **Validação de Integridade:** Adicionar verificação explícita de arquivos vazios (`size === 0`) tanto no frontend quanto no backend.
    *   **Feedback de Upload:** O código atual já possui logs e alertas de erro, mas reforçaremos o tratamento de erro no `handleDocumentUpload` para garantir que falhas parciais não quebrem o fluxo (ex: falha em 1 de 3 arquivos).

### 3. Interface do Usuário (UI)
**Objetivo:** Indicar claramente status e obrigatoriedade sem impedir o usuário.

*   **Componente:** `DocumentRow` (interno nas páginas)
*   **Ações:**
    *   **Propriedade `required`:** Adicionar uma prop `required?: boolean` ao componente.
    *   **Indicador Visual:** Se `required` for true e não houver arquivo, exibir um indicador visual (ex: texto "Obrigatório" em vermelho ou ícone de alerta) ao lado do label.
    *   **Status de Pendência:** Se o formulário já foi salvo (modo edição) e o campo obrigatório está vazio, exibir badge "Pendente".

### 4. Sistema de Alertas e Rastreabilidade (Backend)
**Objetivo:** Registrar pendências para resolução futura.

*   **Recurso Existente:** Tabela `alerts` e API `/api/alerts`.
*   **Integração:**
    *   Utilizar a infraestrutura existente de alertas. Quando um processo for criado com documentos faltantes, o frontend disparará a criação de alertas do tipo "Documento Pendente" vinculados ao `record_id` do processo.
    *   Isso garante que, mesmo sem o documento, o sistema saiba o que falta e o usuário possa consultar via dashboard de alertas (se houver) ou na própria visualização do processo.

### Resumo do Fluxo Proposto
1.  Usuário preenche formulário de Visto/Turismo.
2.  Deixa campos obrigatórios em branco.
3.  Clica em "Salvar".
4.  Sistema valida, nota a ausência, mas **prossegue**.
5.  Registro é criado no banco (`vistos` ou `turismo`).
6.  Sistema gera registros na tabela `alerts` para cada documento faltante.
7.  Usuário é redirecionado para a lista/detalhes, onde verá o processo criado e os alertas de pendência.
