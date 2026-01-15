I will align the new `Turismo` form with the original `Vistos` form to ensure exact correspondence in layout, fields, and behavior as requested.

### Discrepancies Identified:
1.  **Section 1 ("Informações do Visto")**:
    *   **Title**: Changed from "Informações do Visto" to "Informações Principais".
    *   **Layout**: Currently has 2 columns (`col-span-6`) for Client and Country. Original had 3 columns (`col-span-4`) including "Tipo de Visto".
    *   **Missing Field**: "Tipo de Visto" select box is missing in the new form.
2.  **Section 2 ("Documentos Pessoais")**:
    *   **Missing Component**: The Checkbox "Comprovante não está no nome do solicitante" is missing.
3.  **Section 3 ("Documentos Específicos do Visto")**:
    *   **Title**: Changed from "Documentos Específicos do Visto" to "Documentos Financeiros e Patrimoniais".
4.  **Section 4 ("Outros Documentos")**:
    *   **Title**: Changed from "Outros Documentos" to "Planejamento da Viagem".
5.  **Footer**:
    *   **Button Text**: Changed from "Salvar Visto" to "Salvar Processo".

### Plan:
1.  **Update Imports**: Add `Checkbox` and `Select` (and related sub-components) to `src/app/dashboard/turismo/novo/page.tsx`.
2.  **Restore Section 1 Layout & Fields**:
    *   Rename title to "Informações do Visto".
    *   Change grid columns for Client and Country to `md:col-span-4`.
    *   Re-introduce the "Tipo de Visto" Select component (as `md:col-span-4`) with "Turismo" pre-selected (and potentially locked/read-only to strictly enforce the module context while maintaining visual parity).
3.  **Restore Checkbox in Section 2**:
    *   Insert the `Checkbox` for `comprovanteNaoNoNome` under the "Comprovante de Endereço" field.
4.  **Revert Section Titles**:
    *   Rename "Documentos Financeiros e Patrimoniais" back to "Documentos Específicos do Visto".
    *   Rename "Planejamento da Viagem" back to "Outros Documentos".
5.  **Revert Button Text**:
    *   Change "Salvar Processo" back to "Salvar Visto".

This will ensure the form is visually and structurally identical to the original "Turismo" view.