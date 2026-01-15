I will refactor the `src/app/dashboard/turismo/[id]/page.tsx` file to match the design system of the Vistos flow.

1. **Add Helper Functions**:

   * Add `renderHeader` to standardize section headers with Edit/Save/Cancel actions.

   * Add `renderRow` to standardize document and field rows.

2. **Refactor** **`renderStepContent`**:

   * **Step 0 (Cadastro de Documentos)**: Rebuild using the card structure (`bg-white rounded-xl...`), `renderHeader`, and `renderRow`. Group fields into "Dados do Cliente", "Documentos Pessoais", "Comprovação Financeira", and "Outros Documentos".

   * **Step 1 (Agendar no Consulado)**: Update to use `SectionHeader` and `DocumentRow` for the appointment proof. Standardize date/time inputs.

   * **Step 2 (Preencher Formulário)**: Implement using the standard design for form upload and notes.

   * **Step 3 (Preparar Documentação)**: Refactor to use `SectionHeader` and `DocumentRow` for translated/authenticated documents.

   * **Step 4 (Aguardar Aprovação)**: Implement using the standard design for approval proof.

   * **Step 5 (Processo Finalizado)**: Update to use `SectionHeader` and `DocumentRow` for final documents and status selection.

3. **Cleanup**:

   * Remove any unused legacy components or styles (e.g., `UploadDocBlock` if no longer needed).

   * Ensure all spacing and typography matches the Vistos flow pixel-perfectly.

