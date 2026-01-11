I will rewrite `src/app/dashboard/acoes-civeis/[id]/page.tsx` to fully match the UI and functional patterns of the "Vistos" module (`src/app/dashboard/vistos/[id]/page.tsx`), while strictly preserving the "Ações Cíveis" workflows and logic.

**Key Changes:**

1.  **UI Structure (Vistos Standard)**:
    *   Adopt the **3-column grid layout** (Left: Workflow; Right: Status, Notes, Documents, Responsibles).
    *   Replace the current `ProcessFlow` component with the **Direct Card Workflow** rendering used in Vistos (expandable steps with distinct "Current", "Completed", and "Pending" visual states).
    *   Implement the **Vistos-style Right Sidebar**:
        *   `StatusPanel`: Standardized status management.
        *   `Notes Card`: Quick access to general case notes.
        *   `Documents Card`: Drag-and-drop area and list of all client documents.
        *   `Responsibles Card`: List of team members assigned to steps.

2.  **Logic Preservation (Ações Cíveis Specifics)**:
    *   **Workflows**: Retain the exact `WORKFLOWS` constant (Exame DNA, Divórcio, Usucapião, etc.).
    *   **Step Content**: Port the specific field rendering logic (e.g., DNA scheduling inputs, names of parents, specific file uploads) into the new expandable step containers.
    *   **Data Handling**: Maintain all specific state variables (`dnaExamDate`, `nomeMae`, etc.) and their specific save handlers (`handleSaveDnaSchedule`, `patchCaseField`).

3.  **Component & Style Unification**:
    *   Use the same Tailwind classes for spacing, typography, and colors (e.g., `bg-gray-50`, `rounded-xl`, `shadow-sm`).
    *   Standardize helper components like `UploadDocBlock` and `renderDocLinks` to ensure consistent file interaction.

**File to be modified:**
*   `src/app/dashboard/acoes-civeis/[id]/page.tsx`

This approach ensures the "Ações Cíveis" module looks and feels exactly like "Vistos" but continues to function correctly for its specific legal processes.