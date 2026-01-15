I will implement the real-time document validation system in `src/app/dashboard/vistos/[id]/page.tsx` by upgrading the "Documentos do Cliente" card.

**Implementation Plan:**

1.  **Define Validation Schema**:
    -   Create a `DOC_REQUIREMENTS` constant specifically for the "Visto de Trabalho - Brasil" workflow.
    -   Map all document keys extracted (Step 0, 1, 2, 3, 4) into logical groups (e.g., "Identificação", "Documentos da Empresa", "Protocolo").

2.  **Create Validation Logic**:
    -   Implement a `useMemo` hook to compare the current `documents` list against `DOC_REQUIREMENTS`.
    -   Generate a `pendingDocs` list containing only missing items.
    -   Calculate a completion percentage.

3.  **Upgrade "Documentos do Cliente" Card**:
    -   **New "Pendências" Section**:
        -   Display a categorized list of missing documents.
        -   Use **red text** and alert icons for missing items to highlight them as requested.
        -   Group items by their respective sections (e.g., "Etapa 1: Cadastro", "Etapa 2: Protocolo").
    -   **Dynamic Behavior**:
        -   Items will automatically disappear from the "Pendências" list the moment a file with the matching `fieldName` is uploaded (leveraging the existing real-time subscription).
    -   **Progress Feedback**:
        -   Add a progress bar showing the overall documentation status.
        -   Display a "Documentação Completa" success message when `pendingDocs` is empty.

4.  **Maintain Existing Features**:
    -   Keep the drag-and-drop zone and the grid of uploaded files (perhaps moved below the validation panel) to ensure no functionality is lost.

This approach satisfies all requirements: real-time validation, visual organization within the selected `div`, dynamic updates, and error handling/highlighting.