I will redesign the "Perda de Nacionalidade" form to match the visual style and structure of the Visa form, while preserving all existing fields and logic.

**Implementation Plan:**

1. **Analyze Structure:**

   * **Visa Form (Reference):** Uses a clean layout with `Card` components, `DocumentRow` helper for consistent file uploads, and a specific state management pattern for form data and file uploads (`uploadingDocs`, `extraUploads`). It handles file uploads immediately upon selection.

   * **Perda de Nacionalidade Form (Target):** Currently uses a simpler state structure (`files` object) and handles uploads only on submit. It needs to be refactored to match the immediate upload pattern and visual components of the Visa form.

2. **Component Adaptation:**

   * I will recreate the `DocumentRow` component within the Perda de Nacionalidade page (or reuse it if it's exported) to ensure identical visual representation for file inputs.

   * I will restructure the layout to use the same header style, card organization, and grid system as the Visa form.

3. **State Management Refactoring:**

   * I will update the `formData` state to include both text fields and document URL fields (e.g., `rnmMae` and `rnmMaeDoc`), matching the flat structure used in the Visa form.

   * I will implement the `handleDocumentUpload` function to handle file uploads immediately, similar to the Visa form, replacing the current "upload on submit" logic. This improves user experience and matches the requested behavior.

   * I will implement `convertTemporaryUploads` logic to ensure files are properly associated with the case after creation.

4. **Field Mapping & Layout:**

   * **Header:** Standardize title and description.

   * **Section 1: Informações do Cliente:** Client Name, Parents' Names, Child's Name.

   * **Section 2: Documentos dos Pais:** RNM (Mãe/Pai), CPF (Mãe/Pai), Passaportes (Mãe/Pai). Using the `DocumentRow` style for each document.

   * **Section 3: Documentos da Criança:** Passaporte, RG, Certidão de Nascimento.

   * **Section 4: Outros Documentos:** Comprovante de Endereço, Documento Chinês, Tradução Juramentada.

   * **Section 5: Observações:** Textarea for notes.

5. **Code Structure:**

   * I will rewrite `src/app/dashboard/perda-nacionalidade/novo/page.tsx` to adopt the imports, helper functions (like `handleDocumentUpload`), and JSX structure of `src/app/dashboard/vistos/novo/page.tsx`, but with the fields specific to Perda de Nacionalidade.

6. **Verification:**

   * Ensure all fields from the original Perda de Nacionalidade form are present.

   * Ensure the visual design matches the Visa form (colors, spacing, typography).

   * Ensure file upload functionality works as expected (immediate upload + state update).

**Key Changes:**

* Refactoring from `files` state to direct URL storage in `formData` via immediate upload.

* Adopting `DocumentRow` pattern for consistent UI.

* Aligning styling with the Visa form reference.

