# Refatorar `VistoDetailsPage` para Corrigir Violação de Hooks

## 1. Analisar o Problema
O componente `renderVistoTrabalhoStepContent` está sendo usado como uma função auxiliar *dentro* do componente `VistoDetailsPage` e chamada condicionalmente. Embora tenhamos movido `isLoading` e `handleSaveVisto` para o nível superior, a função `renderVistoTrabalhoStepContent` ainda contém definições de componentes internos (`renderRow`, `Header`) e lógica complexa que pode estar causando problemas de re-renderização ou uso incorreto de contexto.

O erro "React has detected a change in the order of Hooks" geralmente acontece quando hooks são chamados dentro de condicionais, loops ou funções aninhadas que não são componentes React puros.

## 2. Refatorar Estrutura
Para garantir a estabilidade e seguir as melhores práticas do React, vamos extrair a lógica de renderização do conteúdo do passo para fora da função principal ou simplificá-la drasticamente.

### Plano de Ação:

1.  **Verificar Hooks Restantes:** Confirmar se há algum outro hook (`useState`, `useEffect`, `useContext`, etc.) sendo chamado *dentro* de `renderVistoTrabalhoStepContent` ou de suas sub-funções (`renderRow`, `Header`).
    *   *Análise:* `renderRow` e `Header` são definidos *dentro* da função a cada renderização. Isso não é ideal, mas se eles não usam hooks internamente, não deveria quebrar a regra dos hooks, apenas performance. Porém, se eles usarem hooks (como `useContext` implícito em componentes de UI), isso causará o erro.
    *   *Solução:* Mover `renderRow` e `Header` para fora de `renderVistoTrabalhoStepContent`, ou melhor, transformá-los em funções auxiliares no escopo do componente principal ou componentes separados.

2.  **Consolidar Definições:**
    *   Mover a definição de `renderRow` para o escopo principal de `VistoDetailsPage` (já que ela depende de `handleVistoFieldChange`, `handleSpecificFileUpload`, etc.).
    *   Mover a definição de `Header` para o escopo principal ou usar diretamente `SectionHeader`.

3.  **Remover Hooks Condicionais:**
    *   Garantir que *nenhum* hook seja chamado dentro dos `switch/case` ou `if` dentro de `renderStepContent`.
    *   O erro anterior foi causado por `useState` dentro do `case`. Já movemos isso.
    *   Vamos verificar se `renderVistoTrabalhoStepContent` está chamando algum componente que usa hooks de forma condicional.

## 3. Implementação
*   **Passo 1:** Mover a função `renderRow` para o nível superior do componente `VistoDetailsPage`, logo após os hooks. Ela precisará receber os mesmos argumentos.
*   **Passo 2:** Mover a função `Header` para o nível superior (ou apenas usar `SectionHeader` diretamente com as props necessárias).
*   **Passo 3:** Verificar se `renderVistoTrabalhoStepContent` não define mais nenhuma variável de estado ou efeito.

**Refatoração Específica:**
Vamos mover `renderRow` para ser uma função constante dentro de `VistoDetailsPage` (mas fora de qualquer condicional) para que ela seja recriada de forma estável ou memorizada com `useCallback`.

```tsx
// Dentro de VistoDetailsPage, logo após os estados:

const renderDocumentRow = (stepId: number, label: string, fieldKey?: string, docKey?: string, tooltip?: string, required?: boolean) => (
  <DocumentRow
    // ... props
  />
);
```

E então usar `renderDocumentRow` dentro dos cases.

**Observação Importante:** O log de erro mostrava uma divergência na contagem de hooks. Ao mover `isLoading` para o topo, resolvemos a questão do `useState` condicional. Se o erro persistir, pode ser que algum *componente filho* renderizado condicionalmente esteja usando hooks de forma que o React se perca na reconciliação. Mas a causa mais provável (o `useState` dentro do `case`) já foi tratada. O erro "Rendered more hooks than during the previous render" confirma que adicionamos hooks incondicionalmente (o que é correto), mas o React reclamou da mudança de ordem comparado ao render anterior (que tinha menos hooks). Um *refresh* da página geralmente resolve isso após a correção do código, mas para garantir, vamos limpar a estrutura interna.

**Ação Imediata:**
Vou verificar se a função `renderRow` ou `Header` está usando algum hook implicitamente e movê-las para o escopo principal para evitar recriação desnecessária e potenciais problemas.

## 4. Validação
Após a refatoração, o fluxo de renderização será:
1.  `VistoDetailsPage` chama todos os hooks no topo.
2.  `renderStepContent` escolhe o que renderizar.
3.  `renderVistoTrabalhoStepContent` apenas retorna JSX, usando as funções auxiliares e estados do escopo pai.

Isso elimina qualquer ambiguidade na ordem dos hooks.
