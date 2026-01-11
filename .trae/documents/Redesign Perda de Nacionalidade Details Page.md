I will redesign the "Perda de Nacionalidade" Details page to match the visual style and structure of the Visa Details page, while preserving its specific workflow steps and data fields.

**Implementation Plan:**

1. **Adopt Visa Details Page Structure:**
   * I will replicate the layout and components used in `src/app/dashboard/vistos/[id]/page.tsx` for `src/app/dashboard/perda-nacionalidade/[id]/page.tsx`.
   * This includes replacing `DetailLayout`, `StepItem`, `StatusPanel`, `DocumentPanel`, and `NotesPanel` with the direct inline components and logic used in the Visa page (e.g., the specific `Card` based layout, the `StatusPanel` implementation within the page, and the `renderStepContent` logic).

2. **Preserve Perda de Nacionalidade Workflow:**
   * I will keep the `WORKFLOW_STEPS` constant specific to "Perda de Nacionalidade" (steps 1 to 11) but adapt the data structure to match the `WORKFLOWS` object pattern in the Visa page for consistency.
   * I will ensure the `renderStepContent` function correctly renders the specific fields for each step of the "Perda de Nacionalidade" process (e.g., "Cadastro de Documento", "Fazer a Procuração...", "Protocolar no SEI", etc.), using the new visual components (inputs, selects, file uploads) from the Visa page design.

3. **Migrate Logic & State:**
   * I will update the state management to match the Visa page: `caseData`, `stepData`, `documents`, `notes`, `assignments`, etc.
   * I will implement the `handleFileUpload`, `handleSpecificFileUpload`, `saveStepData`, `saveStepNotes`, and `handleStepCompletion` functions following the robust logic found in the Visa page (including real-time updates and better error handling).
   * I will ensure the `fetchCaseData` function correctly maps the "Perda de Nacionalidade" data to the expected `CaseData` interface used by the new layout.

4. **Visual & Component Adaptation:**
   * **Header:** Match the header style with the back button, title, subtitle, and delete action.
   * **Workflow Timeline:** Implement the vertical timeline visualization used in the Visa page to display the "Perda de Nacionalidade" steps.
   * **Step Content:** Redesign the content of each step (inputs, uploads) to use the `Label`, `Input`, `Select`, `Textarea`, and `UploadDocBlock` components as they appear in the Visa page.
   * **Right Sidebar:** Implement the Status Panel, Notes (with modal), Responsibles, and General Documents sections exactly as they are in the Visa page.

5. **Specific Field Mapping:**
   * **Step 0 (Cadastro):** Map fields like `nomeMae`, `nomePai`, `rnmMae`, etc., to the "Dados do Cliente" and "Documentos" sections using the `renderField` helper pattern.
   * **Other Steps:** Ensure specific fields like `dataColetaAssinaturas`, `numeroProtocolo`, `dataDeferimento`, `numeroPortaria`, etc., are correctly rendered and saved within their respective steps using the new design.

**Key Outcome:**
The "Perda de Nacionalidade" details page will look identical to the Visa details page (layout, colors, interactions) but will function with the specific steps and data required for "Perda de Nacionalidade" processes.