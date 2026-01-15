# Implementar Fluxo de Protocolo (Visto de Trabalho - Brasil)

## 1. Identificar e Configurar Etapa de Protocolo
- Localizar o `case 2` dentro de `renderVistoTrabalhoStepContent` no arquivo `src/app/dashboard/vistos/[id]/page.tsx`.
- Adicionar verificação: `if ((caseData?.type as string) === "Visto de Trabalho - Brasil") { ... }` para implementar a lógica específica desta etapa.

## 2. Implementar Campos da Etapa
- Criar um container principal com estilo `bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden` e `p-4 flex flex-col gap-3`.
- **Campo 1: Número do Processo**
    - Utilizar o componente `Input` padrão.
    - Label: "Número do Processo".
    - Placeholder: "00000.000000/0000-00".
    - Adicionar lógica de onChange para atualizar o estado `caseData` (campo `processNumber` ou similar - verificar disponibilidade ou usar campo genérico no JSON do passo).
    - Adicionar ícone `Hash` ou `FileText` no label.
- **Campo 2: Comprovante de Protocolo (Upload)**
    - Utilizar o componente `DocumentRow` ou a combinação `UploadDocBlock` + `DocLinks` para manter consistência.
    - Label: "Comprovante de Protocolo".
    - Chave do documento: `comprovanteProtocolo`.
    - Aceitar formatos: PDF, JPG, PNG.
    - Tamanho máximo: 5MB (validar no upload se possível, ou confiar na API).

## 3. Integração com Banco de Dados
- Verificar se existe um campo `process_number` na tabela `vistos` via `SearchCodebase`.
- Se não existir, planejar o uso de um campo `metadata` ou criar uma nova migração (conforme instrução "Se necessário utilize a integração com o supabase para criar colunas").
- *Decisão*: Para evitar migrações complexas agora, salvaremos o "Número do Processo" dentro do JSON de dados da etapa (`stepData`) ou em um campo `metadata` se disponível. Se o usuário insistir em coluna dedicada, criaremos a migração.
- *Atualização*: O prompt diz "Se necessário utilize a integração com o supabase para criar colunas". Vou verificar se já existe `protocol_number` ou similar.

## 4. Validação e Feedback
- Adicionar validação visual (borda vermelha ou mensagem) se o campo "Número do Processo" estiver vazio ao tentar avançar/salvar.
- Garantir que o upload mostre status de progresso e sucesso/erro.

## 5. Detalhes de Implementação
- **Componentes**: `Input`, `Label`, `UploadDocBlock` (ou `renderRow`), `Button` (Salvar).
- **Ícones**: Importar `Hash` de `lucide-react`.
