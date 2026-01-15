I will fix the input focus loss issue by refactoring the `VistoDetailsPage` component to move nested component definitions (`DocumentRow`, `renderField`, `SectionHeader`, etc.) outside of the main component. I will also address the workflow name display issue.

### Plan:

1.  **Extract Nested Components:**
    *   Move `DocumentRow` outside of `VistoDetailsPage` (rename to `VistoDocumentRow` to avoid conflicts during refactor, or just `DocumentRow`).
    *   Move `SectionHeader`, `UploadDocBlock`, and `renderDocLinks` logic (as a component `DocLinks`) outside.
    *   Pass necessary props (`documents`, `visto`, `handlers`) to these extracted components.

2.  **Refactor `renderField` Helper:**
    *   The `renderField` function inside `renderVistoTrabalhoStepContent` is causing focus loss because it renders inputs and is recreated on every render.
    *   I will replace `renderField` usages with the extracted `VistoDocumentRow` component directly, or create a `VistoField` component outside if a wrapper is needed.

3.  **Update Component Usage:**
    *   Update `VistoDetailsPage` to use the new external components.
    *   Ensure all state and handlers are correctly passed down.

4.  **Fix Workflow Name Display:**
    *   Review and robustify the workflow name display logic in the header (around line 2090).
    *   Ensure `caseData.type` or `visto.type` is correctly retrieved and formatted.

5.  **Verify:**
    *   Ensure the code compiles.
    *   (Self-Correction) Since I cannot run the app to test visually, I will rely on code correctness (no nested definitions).

### Changes in `src/app/dashboard/vistos/[id]/page.tsx`:
*   **Add:** `DocLinks`, `UploadDocBlock`, `SectionHeader`, `DocumentRow` components at the top (or before `VistoDetailsPage`).
*   **Remove:** Inner definitions of these components.
*   **Modify:** `renderVistoTrabalhoStepContent` to use `<DocumentRow ... />` instead of `renderField`.
*   **Modify:** Header display logic for workflow name.