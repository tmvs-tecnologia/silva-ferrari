# Implementar Fluxo "Documentos para Protocolo" (Visto de Trabalho - Brasil)

## 1. Preparação e Componentes
- Importar os componentes de `Tooltip` (`Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger`) do `@/components/ui/tooltip` no arquivo `src/app/dashboard/vistos/[id]/page.tsx`.
- Importar o ícone `Info` de `lucide-react`.

## 2. Atualizar Componentes Auxiliares
- **Atualizar `DocumentRow`**: 
    - Adicionar a prop opcional `tooltip?: string`.
    - Adicionar a prop opcional `required?: boolean`.
    - Renderizar o ícone de `Info` com o `Tooltip` ao lado do label se a prop `tooltip` for fornecida.
    - Adicionar indicação visual (ex: `*` vermelho) se `required` for true.
- **Atualizar `renderRow`**:
    - Atualizar a assinatura da função para aceitar `tooltip` e `required`.
    - Repassar essas props para o `DocumentRow`.

## 3. Implementar Lógica da Etapa 1 (Documentos para Protocolo)
- Localizar a função `renderVistoTrabalhoStepContent`.
- Dentro do `switch (stepId)`, no `case 1`, adicionar uma verificação:
    - `if ((caseData?.type as string) === "Visto de Trabalho - Brasil") { ... }`
- **Renderizar o Layout**:
    - Utilizar a mesma estrutura de *cards* (bg-white, rounded, shadow) usada no Passo 0.
    - Dividir em seções lógicas (ex: "Documentação Geral", "Documentos Específicos").
- **Adicionar os Campos**:
    - **Seção 1: Documentação Geral**
        - Formulário RN 01/2017 (`formularioRn01`)
        - Declaração de Compreensão (`declaracaoCompreensao`)
        - Declaração de Não Antecedentes (`declaracaoNaoAntecedentes`)
        - Declarações da Empresa (`declaracoesEmpresa`)
    - **Seção 2: Documentos Contratuais**
        - Convenção Coletiva da Categoria (`convencaoColetiva`)
        - Contrato de Trabalho (`contratoTrabalho`)
    - **Seção 3: Taxas e Comprovantes**
        - GRU (`gru`)
        - Comprovante de Pagamento GRU (`comprovantePagamentoGru`)
    - **Seção 4: Documentos I (Com Tooltips)**
        - I1 Criminal (`i1Criminal`) - Tooltip: "Documento comprovando antecedentes criminais"
        - I2 Trabalho (`i2Trabalho`) - Tooltip: "Comprovante de experiência profissional anterior"
        - I3 Diploma (`i3Diploma`) - Tooltip: "Diploma ou certificado de conclusão de curso"
        - I6 Nascimento (`i6Nascimento`) - Tooltip: "Certidão de nascimento ou casamento"

## 4. Padronização e Validação
- Garantir que todos os labels estejam em "Title Case" (Primeira letra maiúscula).
- Assegurar que o feedback visual de upload (ícone de check ou lista de arquivos) funcione através do componente `DocumentLinks` e `UploadDocBlock` já integrados no `DocumentRow`.
- Verificar se o estado de upload (`isUploading`) está sendo passado corretamente.

## 5. Testes
- Verificar se a etapa aparece corretamente para vistos do tipo "Visto de Trabalho - Brasil".
- Confirmar se os tooltips aparecem ao passar o mouse.
- Confirmar se o upload funciona para os novos campos.
