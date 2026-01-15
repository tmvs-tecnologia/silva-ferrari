I will update the `docRequirements` array in `src/app/dashboard/turismo/[id]/page.tsx` to include documents from all steps of the Turismo flow, ensuring the "Documentos Pendentes" section displays pending documents from the entire process, not just the "Cadastro de Documentos" step.

1.  **Identify All Documents**: I will identify all document fields used in the `renderStepContent` function for each step (Agendamento, Formulário, Preparação, Aprovação, Finalização).
2.  **Update `docRequirements`**: I will expand the `docRequirements` array to include these documents, grouped by their respective steps.
    *   **Step 1 (Agendar no Consulado)**: Add "Comprovante de Agendamento" (`comprovante-agendamento`).
    *   **Step 2 (Preencher Formulário)**: Add "Formulário de Visto" (`formulario-visto`).
    *   **Step 3 (Preparar Documentação)**: Add "Formulário de Visto Preenchido" (`formulario-visto`), "Documentos Traduzidos" (`documentos-traduzidos`), "Documentos Autenticados" (`documentos-autenticados`).
    *   **Step 4 (Aguardar Aprovação)**: Add "Comprovante de Aprovação" (`comprovante-aprovacao`).
    *   **Step 5 (Processo Finalizado)**: Add "Processo Finalizado" (`processo-finalizado`), "Relatório Final" (`relatorio-final`).
3.  **Verify Logic**: The existing `pendingDocs`, `totalDocs`, `completedDocs`, and `progress` logic relies on `docRequirements`, so updating this array will automatically propagate the changes to the UI.

This change will make the "Documentos Pendentes" list comprehensive for the entire flow.