I have analyzed the reference "Vistos" module and the current "Compra e Venda" module. I have a complete plan to modernize the "Compra e Venda" interface to match the "Vistos" design system while preserving all specific business logic (Sellers, Buyers, Real Estate fields).

# Plan: Modernize "Compra e Venda" Module UI

## 1. Creation Form (`/novo/page.tsx`)
**Goal:** Replace the current simple form with the sophisticated "Vistos" design system.
*   **Structure:** Implement the standard Header with "Dark Mode" toggle and "Back" button styling.
*   **Components:**
    *   Implement the `DocumentRow` component locally (as in Vistos) to handle field inputs + file uploads + file lists in a single row.
    *   Implement `handleDocumentUpload` to support immediate file uploads (returning URLs) instead of the current local state approach.
*   **Layout & Sections:**
    *   **Card 1: Dados do Cliente & Imóvel:** 
        *   Fields: Client Name, Address, Matrícula Number, Contribuinte Number.
        *   Docs: Matrícula Document, Contribuinte Receipt (using `DocumentRow`).
    *   **Card 2: Vendedores (Dynamic List):**
        *   Create a repeatable section for Sellers.
        *   Fields: RG, CPF, Birth Date.
        *   Docs: RG Document, CPF Document (using `DocumentRow`).
    *   **Card 3: Compradores (Dynamic List):**
        *   Create a repeatable section for Buyers.
        *   Fields: RNM, CPF, Address.
        *   Docs: RNM Doc, CPF Doc (using `DocumentRow`).
    *   **Card 4: Observações:** Contract notes.
*   **Logic:** Adapt `handleSubmit` to use `convertTemporaryUploads` to link the immediately uploaded files to the created case, matching the Vistos pattern.

## 2. Details Page (`/[id]/page.tsx`)
**Goal:** Replicate the 2-column "Vistos" dashboard layout.
*   **Left Column (Workflow):**
    *   Replace the current `StepItem` component usage with the **manual Timeline implementation** found in Vistos to ensure exact visual parity (icons, connecting lines, "Current/Completed" states).
    *   **Workflow Steps:** Map the 7 "Compra e Venda" steps (Cadastro -> Emitir Certidões -> ... -> Finalizado) to this timeline.
    *   **Step Content:** Refactor `renderStepContent` to use the Vistos `UploadDocBlock` component (drag & drop area) instead of raw file inputs.
    *   **Specific Fields:**
        *   *Step 1 (Cadastro):* Display/Edit Client, Property, Seller, and Buyer details.
        *   *Step 4 (Assinatura):* Include the "Prazos" (Deadlines) inputs for Sinal and Escritura using the Vistos date input styling.
*   **Right Column (Widgets):**
    *   **Status Panel:** Reuse `StatusPanel` (already present, verify styling).
    *   **Notes Widget:** Implement the "Quick Notes" card from Vistos.
    *   **Documents Widget:** Implement the "Documentos do Cliente" card (Drag & Drop area) from Vistos.
    *   **Responsibles Widget:** Implement the Team/Responsibles card.
*   **Dialogs:** Add the "Notes Modal", "Delete Confirmation", and "Rename Document" dialogs exactly as they appear in Vistos.

## 3. Technical Details
*   **State Management:** Refactor to use `stepData` and `notes` maps compatible with the Vistos persistence logic.
*   **Realtime:** Ensure `subscribeTable` is set up for live updates (if applicable/available in the codebase).
*   **Responsiveness:** Ensure all grids adapt (1 column on mobile, 2 columns on desktop) following the Vistos tailwind classes.
