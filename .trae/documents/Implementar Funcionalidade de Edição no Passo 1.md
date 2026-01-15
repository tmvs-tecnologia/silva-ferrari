# Implementar Funcionalidade de Edição e Upload em "Documentos para Protocolo" (Step 1)

## 1. Análise do Estado Atual
- O passo 1 ("Documentos para Protocolo") está atualmente sendo renderizado (ou deveria estar) com lógica condicional.
- O componente `renderRow` já encapsula a lógica de edição (`isEditingDocuments`), upload, visualização de documentos anexados (`DocLinks` implícito ou lógica de exibição) e input de texto.
- O usuário requisita que o passo "Documentos para Protocolo" tenha a mesma funcionalidade de edição, upload e substituição de arquivos que o passo "Cadastro de Documentos" (Step 0).

## 2. Estrutura dos Campos para o Passo 1
- Identificar quais campos pertencem ao passo "Documentos para Protocolo" no fluxo "Visto de Trabalho - Brasil".
- Consultando o `schema` (memória ou leitura anterior), campos como `formulario_rn01`, `guia_paga`, `dou`, `comprovante_investimento`, etc., parecem ser candidatos.
- **Campos Específicos do Passo 1:**
    - Formulário RN01 (`formularioRn01`)
    - Guia Paga (`guiaPaga`)
    - Comprovante de Investimento (`comprovanteInvestimento`) - se aplicável
    - Plano de Investimentos (`planoInvestimentos`) - se aplicável
    - Outros documentos preparatórios.
- *Decisão:* Como não tenho a lista exata de quais campos o usuário quer *neste* passo específico, vou implementar uma estrutura genérica baseada nos campos que fazem sentido para "Documentos para Protocolo" no contexto Brasil, ou seguir o padrão do `case 0` se o usuário não especificou os campos.
- *Refinamento:* O usuário disse "mesmo que a organização não seja por sessões". Vou criar um único bloco com todos os documentos relevantes para esta etapa.

## 3. Implementação Técnica
- Localizar `case 1` dentro de `renderVistoTrabalhoStepContent`.
- Se não existir, criar.
- Usar a mesma estrutura do `case 0` e `case 2`:
    - Container `bg-white rounded-xl...`
    - `Header` com título "Documentos para Protocolo".
    - Grid com chamadas para `renderRow`.
- **Configuração de `renderRow`:**
    - Passar `stepId` (1).
    - Passar `isEditing` (controlado por `isEditingDocuments`).
    - Passar chaves de documentos corretas (`docKey`).

## 4. Campos Sugeridos para "Documentos para Protocolo"
Vou incluir os seguintes campos baseados no contexto de Visto Brasil e schema:
1.  **Formulário de Requerimento:** `formularioRequerimento` / `formularioRequerimentoDoc`
2.  **Taxa GRU:** `taxa` / `taxaDoc` (ou `guiaPaga`)
3.  **Procuração:** `procurador` / `procuracaoDoc` (se não estiver no passo 0)
4.  **Contrato de Trabalho:** `contratoTrabalho` / `contratoTrabalhoDoc`
5.  **Justificativa/Carta da Empresa:** `declaracoesEmpresa` / `declaracoesEmpresaDoc`

*Observação:* Vou implementar com uma seleção razoável desses campos. Se o usuário quiser outros, ele pedirá. O foco é a *funcionalidade* de edição/upload.

## 5. Plano de Execução
1.  **Implementar `case 1`:** Adicionar a lógica para `stepId === 1` em `renderVistoTrabalhoStepContent`.
2.  **Estrutura Visual:** Copiar o padrão de container e Header.
3.  **Adicionar Campos:** Inserir chamadas `renderRow` para os documentos pertinentes.
4.  **Verificar Edição:** Garantir que o botão "Editar" no Header ative o modo de edição para todos os campos do bloco, permitindo upload e alteração de texto.

```tsx
case 1: // Documentos para Protocolo
  if ((caseData?.type as string) === "Visto de Trabalho - Brasil") {
    return (
      <div className="space-y-8 pb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <Header title="Documentos para Protocolo" />
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
             {renderRow(stepId, "Formulário de Requerimento", "formularioRequerimento", "formularioRequerimentoDoc")}
             {renderRow(stepId, "Contrato de Trabalho", "contratoTrabalho", "contratoTrabalhoDoc")}
             {renderRow(stepId, "Guia de Recolhimento (GRU)", "guiaPaga", "guiaPagaDoc")}
             {renderRow(stepId, "Declarações da Empresa", "declaracoesEmpresa", "declaracoesEmpresaDoc")}
          </div>
        </div>
      </div>
    );
  }
  // fallback...
```
