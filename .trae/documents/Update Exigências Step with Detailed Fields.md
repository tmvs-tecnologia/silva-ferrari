I will update the "Exigências" step (Step 3) in `src/app/dashboard/vistos/[id]/page.tsx` to meet the detailed requirements.

### Plan:

1.  **Enhance `DocumentRow` Component**:
    *   Modify the file input to accept the `multiple` attribute.
    *   Update the `onChange` handler to iterate over selected files and call `onUpload` for each one, enabling batch uploads.

2.  **Implement "Exigências" Step Layout (Case 3)**:
    *   Replace the current implementation with a 5-field grid layout.
    *   **Field 1: Carta de Exigência (Upload)**
        *   Use `renderRow` with `docKey="cartaExigencia"`.
        *   Supports multiple files via the enhanced `DocumentRow`.
    *   **Field 2: Documentos Exigidos (Upload)**
        *   Use `renderRow` with `docKey="documentosExigidos"`.
        *   Supports multiple files.
    *   **Field 3: Prazo de Cumprimento (Date)**
        *   Implement a labeled `Input type="date"`.
        *   Bind value to `stepData[stepId]?.prazoCumprimento`.
        *   Add validation: `min={new Date().toISOString().split('T')[0]}` to prevent retroactive dates.
        *   Style consistently with other inputs.
    *   **Field 4: Carta Resposta (Upload)**
        *   Use `renderRow` with `docKey="cartaResposta"`.
        *   (Note: Will support multiple technically, but labeled as "Carta Resposta").
    *   **Field 5: Data Protocolo (Date)**
        *   Implement a labeled `Input type="date"`.
        *   Bind value to `stepData[stepId]?.dataProtocolo`.
        *   Add a "Hoje" button that sets the value to the current date.

3.  **Data Persistence**:
    *   Uploads will continue to use the `documents` table/API.
    *   Date fields will be saved via `saveStepData`, which persists them in the `notes` JSON structure (consistent with other non-column fields).

This approach ensures all functional requirements (validation, multiple uploads, specific fields) are met while maintaining the existing design system.