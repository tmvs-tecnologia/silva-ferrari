Para garantir que o upload de documentos funcione corretamente em todo o sistema, suportando arquivos de até 50MB e evitando erros, realizarei as seguintes modificações:

### 1. Backend (API de Upload)
*   **Arquivo:** `src/app/api/documents/upload/route.ts`
*   **Ação:** Embora a lógica já verifique o tamanho (50MB), é necessário garantir que o servidor Next.js aceite requisições desse tamanho.
*   **Mudança:** Adicionarei a exportação de configuração de rota `export const config = { api: { bodyParser: { sizeLimit: '50mb' } } }` (ou equivalente para App Router se necessário, mas garantindo que não haja bloqueio de infraestrutura).

### 2. Frontend (Padronização da Validação)
Identifiquei que os módulos abaixo **não possuem** validação de tamanho ou tipo antes do envio, o que pode causar falhas silenciosas ou erros genéricos. Implementarei a função `validateFile` padronizada (a mesma usada em Vistos/Turismo) em todos eles.

A validação incluirá:
*   **Tamanho Máximo:** 50MB (antes era indefinido ou padrão).
*   **Arquivos Vazios:** Bloqueio de arquivos com 0 bytes.
*   **Tipos Permitidos:** PDF, Imagens (JPG, PNG), Office (Word, Excel) e Texto.

**Módulos afetados:**
1.  **Ações Cíveis:** `src/app/dashboard/acoes-civeis/novo/page.tsx`
2.  **Ações Trabalhistas:** `src/app/dashboard/acoes-trabalhistas/novo/page.tsx`
3.  **Ações Criminais:** `src/app/dashboard/acoes-criminais/nova/page.tsx`
4.  **Compra e Venda:** `src/app/dashboard/compra-venda/novo/page.tsx`
5.  **Perda de Nacionalidade:** `src/app/dashboard/perda-nacionalidade/novo/page.tsx`

### 3. Tratamento de Erros
*   Melhorarei o feedback visual em caso de falha no upload (usando `toast` ou `alert` com mensagens claras) em todos os formulários acima, garantindo que o usuário saiba exatamente por que um arquivo foi rejeitado (ex: "Arquivo muito grande", "Formato inválido").

Esta revisão cobrirá "todos os campos de upload" conforme solicitado, unificando o comportamento do sistema.
