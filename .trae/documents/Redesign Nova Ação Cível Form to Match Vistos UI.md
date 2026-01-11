I will redesign the "Nova Ação Cível" form (`src/app/dashboard/acoes-civeis/novo/page.tsx`) to match the visual style of the "Vistos" form, while preserving all original fields and logic.

**Key Implementation Details:**

1. **Structure & Layout:**

   * Adopt the "Vistos" page layout: a light-themed container with a sticky header.

   * **Header:** Title "Nova Ação Cível" with a back button. **Note:** I will exclude the Dark Mode toggle button as per your previous strict instruction ("interface deve ser somente clara").

   * **Form Container:** Use the same centered max-width layout with `space-y-8`.

2. **Visual Components (Cards & Sections):**

   * Replace simple `Card` containers with the distinct "Vistos-style" cards: white background, rounded corners, shadow, and a header section with an icon and title (e.g., "1. Identificação").

   * Use the `grid` system (cols-12 or cols-2) for field alignment to match the reference.

3. **Component Adaptation:**

   * **`DocumentRow`** **Component:** I will create a helper component inside the file that mimics the Vistos `DocumentRow` visual style (Label + Input + Upload Button) but connects strictly to the existing Ações Cíveis logic (single file per field, `handleChange`, `handleDocumentUpload`).

   * **Inputs & Selects:** Apply the specific Tailwind classes from Vistos (heights, borders, focus states) to ensuring visual identity.

4. **Logic Preservation:**

   * Retain all `useState`, `useEffect`, and `handleSubmit` logic.

   * Keep the complex `showFieldForType` conditional rendering logic, but wrap the rendered fields in the new UI containers.

   * Maintain the `CASE_TYPES` list and all specific field names (`clientName`, `rnmMae`, etc.) to ensure the backend connection remains intact.

5. **File Edit:**

   * I will overwrite `src/app/dashboard/acoes-civeis/novo/page.tsx` with the new code that combines the Vistos *Design* with the Ações Cíveis *Data*.

**Verification:**

* After the edit, I will verify that the page loads (via `npm run dev` output checking if possible, or purely code verification) and that the structure matches the plan.

