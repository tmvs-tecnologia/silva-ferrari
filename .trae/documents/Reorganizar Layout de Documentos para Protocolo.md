# Reorganizar Fluxo "Documentos para Protocolo"

## 1. Unificar Estrutura (Step 1 - Visto de Trabalho Brasil)
- Localizar o `case 1` dentro de `renderVistoTrabalhoStepContent` no arquivo `src/app/dashboard/vistos/[id]/page.tsx`.
- Substituir a atual estrutura de múltiplas seções (Documentação Geral, Contratuais, etc.) por um **único container** principal.
- Utilizar as classes de estilo padrão para manter a consistência visual: `bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden`.

## 2. Ajustar Layout e Espaçamento
- Alterar o layout interno dos campos:
    - De: `grid grid-cols-1 md:grid-cols-2 gap-6` (Grid de 2 colunas com espaçamento largo).
    - Para: `flex flex-col gap-3` (Coluna única vertical com espaçamento compacto de ~12px).
- Remover os componentes `<Header ... />` intermediários para eliminar quebras visuais e otimizar o espaço.

## 3. Reordenar Campos
- Renderizar todos os campos sequencialmente dentro do novo container único:
    1.  Formulário RN 01/2017
    2.  Declaração de Compreensão
    3.  Declaração de Não Antecedentes
    4.  Declarações da Empresa
    5.  Convenção Coletiva da Categoria
    6.  Contrato de Trabalho
    7.  GRU
    8.  Comprovante de Pagamento GRU
    9.  I1 Criminal (com tooltip)
    10. I2 Trabalho (com tooltip)
    11. I3 Diploma (com tooltip)
    12. I6 Nascimento (com tooltip)

## 4. Validação
- Garantir que todos os 12 campos estejam presentes e funcionais.
- Verificar a responsividade (o layout de coluna única se adapta naturalmente a qualquer tela).
